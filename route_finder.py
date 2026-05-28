import argparse
import osmnx as ox
from pathlib import Path

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


def normalize_gdf(gdf):
    # Normalize the 'score' column to a 0-1 range
    
    pass

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

    normalized_gdf = normalize_gdf(loaded_graph)  

    optimal_route = find_route(loaded_graph, args.start.lower(), args.miles)

    plot_route(optimal_route, normalized_gdf) 

if __name__ == "__main__":
    main()