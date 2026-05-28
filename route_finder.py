import argparse
import math
import osmnx as ox
from pathlib import Path
import folium
import pandas as pd
import numpy as np
import networkx as nx
import matplotlib.pyplot as plt


def load_graph():
   
    file_name = Path("Snohomish_County_Graph.graphml")
    


    
    if file_name.exists():
       # Load the graph from the file
       print(f"Loading graph from {file_name}...")
       G = ox.load_graphml(file_name)
    
    else:
       print(f"Graph file {file_name} not found. Downloading graph from OpenStreetMap...")
       
       ox.settings.elevation_url_template = ("https://api.opentopodata.org/v1/aster30m?locations={locations}")
       
       G = ox.graph_from_place("Snohomish, Washington, USA", network_type="drive")
       
       G = ox.elevation.add_node_elevations_google(G, batch_size=100, pause=1)
       G = ox.elevation.add_edge_grades(G)
       ox.save_graphml(G, file_name)

       print(f"Graph downloaded and saved to {file_name}.")
    
    return G


def normalize_gdf(G):
    # Normalize the 'score' column to a 0-1 range
    gdf_nodes, gdf_edges = ox.convert.graph_to_gdfs(G)

    def normalize_maxspeed(maxspeed, highway):
        default_speed = {
            'motorway': '60', 'motorway_link': '45', 'trunk': '55', 'trunk_link': '40',
            'primary': '45', 'primary_link': '40', 'secondary': '35', 'secondary_link': '30',
            'tertiary': '30', 'tertiary_link': '25', 'residential': '25', 'unclassified': '25', 'living_street': '10'
        }
        highway = highway.apply(lambda x: x[0] if isinstance(x, list) else x)
        maxspeed = maxspeed.apply(lambda x: x[0] if isinstance(x, list) else x)

        # 2. Force to string, strip ALL letters (mph, km/h), and convert to float
        maxspeed = maxspeed.astype(str).str.replace(r'\D+', '', regex=True)
        maxspeed = pd.to_numeric(maxspeed, errors='coerce')

        # 3. Map your default dictionary
        maxspeed = maxspeed.fillna(highway.map(default_speed).astype(float))

        # 4. Fill any remaining weird OSM road types
        maxspeed = maxspeed.fillna(25)

        # 5. Safe to convert to integer
        maxspeed = maxspeed.astype(int)

        maxspeed = ((maxspeed - 10) / (85 - 10)) ** 0.625
        
        return maxspeed, highway
    
    def compute_curvature(LineString):

        x, y = LineString.coords.xy
        currX = None
        currY = None
        bearing = 0
        prevbearing = None
        currbearing = None
        for n in range(len(x)):
            if n == 0:
                currX = x[n]
                currY = y[n]
            elif prevbearing is None:
                nextX = x[n]
                nextY = y[n]
                prevbearing = math.atan2(nextY - currY, nextX - currX)
                currX = nextX
                currY = nextY
            else:
                nextX = x[n]
                nextY = y[n]
                currbearing = math.atan2(nextY - currY, nextX - currX)
                diffBearing = abs(currbearing - prevbearing)
                diffBearing = min(diffBearing, math.pi)
                bearing = diffBearing - (math.pi*2) + bearing if diffBearing > math.pi else diffBearing + bearing
                prevbearing = currbearing
                currX = nextX
                currY = nextY

        return bearing
    
    def normalize_curvature(curvature):
        curvature = np.log1p(curvature)
        n_min = curvature.min()
        n_max = curvature.max()
        curvature = (curvature - n_min) / (n_max - n_min)
        return curvature

    def normalize_grade(grade):
        grade_abs = grade.abs()
        lower_bounds = grade_abs.quantile(0.05)
        higher_bounds = grade_abs.quantile(0.95)

        grade_abs = grade_abs.clip(lower=lower_bounds, upper=higher_bounds)
        min_grade = grade_abs.min()
        max_grade = grade_abs.max()
        grade_abs = (grade_abs - min_grade) / (max_grade - min_grade)
        return grade_abs
    
    def normalize_highway_type(highway):
        highway_effectiveness = {
            # INTERSTATES & FREEWAYS: The highest capacity roads. Completely divided, no intersections.
            # Score: -0.6 (Severely penalized. Long, straight, boring, and full of semi-trucks.)
            'motorway': 0.1,       
            
            # ON/OFF RAMPS: The slip roads leading onto or off of a motorway.
            # Score: 0.2 (Sometimes a fun 270-degree sweeper, but too short to be the goal of a ride.)
            'motorway_link': 0.2,
            
            # MAJOR HIGHWAYS: Important divided roads, but slightly a step down from a full Interstate.
            # Score: 0.3 (High speed, but usually straight and heavily policed.)
            'trunk': 0.3,          
            
            # ON/OFF RAMPS for trunk roads.
            'trunk_link': 0.35,
            
            # ARTERIAL ROADS: Major roads linking large towns and cities together.
            # Score: 0.4 (Can be scenic, but usually have high traffic volume and stoplights.)
            'primary': 0.4,        
            
            # CONNECTORS for primary roads.
            'primary_link': 0.45,
            
            # REGIONAL ROADS: Medium-capacity roads linking smaller towns and villages.
            # Score: 0.9 (Great balance. Fast enough to be fun, rural enough to have sweeping curves, lower traffic.)
            'secondary': 0.9,      
            
            # CONNECTORS for secondary roads.
            'secondary_link': 0.85,
            
            # LOCAL CONNECTOR ROADS: Roads connecting smaller settlements or local districts.
            # Score: 0.8 (The "Sweet Spot" for twists. Often follow natural topography like rivers and hills.)
            'tertiary': 0.95,       
            
            # CONNECTORS for tertiary roads.
            'tertiary_link': 0.965,
            
            # NEIGHBORHOOD STREETS: Roads lined with houses and driveways.
            # Score: 0.4 (Lots of turns, but very low speed limits, stop signs, and kids playing.)
            'residential': 0.4,    
            
            # RURAL/MINOR ROADS: The lowest level of connecting road. Despite the name, it just means "local road".
            # Score: 0.55 (A gamble. Can be an amazing hidden canyon twisty, or a bumpy dirt road.)
            'unclassified': 0.2,  
            
            # PEDESTRIAN PRIORITY ZONES: Shared-space streets where pedestrians have the legal right of way.
            # Score: 0.12 (Extremely slow speed limits, actively avoiding these is a priority.)
            'living_street': 0.12  
        }
        effectiveness = highway.map(highway_effectiveness).fillna(0.5)
        return effectiveness

    gdf_edges['maxspeed'], gdf_edges['highway'] = normalize_maxspeed(gdf_edges['maxspeed'], gdf_edges['highway'])
    gdf_edges['curvature'] = gdf_edges['geometry'].apply(compute_curvature)
    gdf_edges['curvature'] = normalize_curvature(gdf_edges['curvature'])
    gdf_edges['grade_abs'] = normalize_grade(gdf_edges['grade'])
    gdf_edges['highway_effectiveness'] = normalize_highway_type(gdf_edges['highway'])

    G = ox.graph_from_gdfs(gdf_nodes, gdf_edges)
    return  G

def find_route(graph, start_node, miles):
    # Implement Dijkstra's algorithm or A* search to find the optimal route
    pass

def plot_route(route, gdf):
    # Use Folium to plot the route on a map
    pass

def main():
    
    parser = argparse.ArgumentParser(description="Find optimal motorcycle route")
    
    parser.add_argument("start", type=str, help="Where do you want to set starting location of your ride in Snohomish County?")
    parser.add_argument("miles", type=float, help="How far do you want to ride?")
    
    args = parser.parse_args()

    loaded_graph = load_graph()

    G = normalize_gdf(loaded_graph)  

    optimal_route = find_route(G, args.start.lower(), args.miles)

    plot_route(optimal_route, G) 

if __name__ == "__main__":
    main()