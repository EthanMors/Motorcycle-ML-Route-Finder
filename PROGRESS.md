# Learner Progress Tracker

## Baseline Knowledge (Session 1)

| Area | Level | Notes |
|------|-------|-------|
| Python (general) | Solid | Comfortable with functions, loops, dicts, general fluency |
| Linear algebra / math | Good | Built gradient descent and linear algebra functions from scratch with scipy |
| Machine learning concepts | Foundational | Understands the math (gradients, loss, optimization) — never used a deep learning framework |
| PyTorch | None | Starting from zero |
| Virtual environments | Good | Understands why venvs matter (version isolation), created and activated one |
| Graphs (nodes/edges) | Good | Understands nodes/edges, directed vs undirected, MultiDiGraph, non-planar graphs |
| OSMnx | Beginner | Knows what it does and why, installed and imported successfully |
| NetworkX | Beginner | Correct mental model, knows it's the graph algorithm engine |
| GeoPandas / Shapely | Beginner | Correct understanding of geometry columns and spatial math |
| Graph Neural Networks | None | Starting from zero |

---

## Phase 1 — Foundation

### Step 1a: Python environment setup ✓ COMPLETE
- [x] Can explain what a virtual environment is and why it matters
- [x] Has a working venv with all packages installed (osmnx 2.1.0, networkx 3.6.1, geopandas 1.1.3, shapely 2.1.2, folium, matplotlib)
- [x] Can import osmnx, networkx, geopandas, shapely, folium without errors
- [x] Knows the version of each installed library
- [x] Can explain what each library does in one sentence

### Step 1b: Download first road network ✓ COMPLETE
- [x] Can call `ox.graph_from_place()` and understand what it returns
- [x] Can explain what a node is (physically — intersection or dead end)
- [x] Can explain what an edge is (physically — directed road segment between intersections)
- [x] Can explain why a two-way road becomes TWO directed edges, not one
- [x] Can read `G.edges(data=True)` output and identify: maxspeed, highway, length, geometry
- [x] Can plot the graph with `ox.plot_graph(G)` and recognize it as Snohomish city
- [x] Knows maxspeed is a string and why that's a problem for math
- [x] Knows geometry intermediate points trace road shape — raw material for curvature and grade
- [x] Knows node x/y are lat/lon needed for elevation API in Phase 2

### Step 1c: Understand the graph as a data structure
- [ ] Can explain what an adjacency matrix is and draw one for a 4-node graph
- [ ] Can explain why a road graph's adjacency matrix is mostly zeros (sparse)
- [ ] Can convert graph to GeoDataFrame and list all column names with meanings
- [ ] Knows what percentage of edges are missing maxspeed in their downloaded graph
- [ ] Can plot edges colored by highway type and name what each color represents

---

## Phase 2 — Feature Engineering

### Step 2a: Compute curvature
- [ ] Can explain what a LineString is and what its coordinates represent
- [ ] Can explain what atan2 computes and why it's used for bearings
- [ ] Can implement curvature calculation without help
- [ ] Can explain why curvature must be normalized by road length

### Step 2b: Elevation and grade
- [ ] Can explain what road grade means physically (rise/run)
- [ ] Can add elevation to nodes via API
- [ ] Can compute grade per edge

### Step 2c: Impute missing speed limits
- [ ] Has a documented imputation strategy (not just code — written reasoning)
- [ ] Can explain what assumption the imputation makes and whether it's valid

### Step 2d: Feature matrix
- [ ] Can write the shape of the feature matrix before writing any code
- [ ] Can explain why normalization is necessary
- [ ] Feature matrix has zero NaN values

---

## Phase 3 — Rule-Based Scorer

### Step 3a: Scoring formula
- [ ] Can justify every weight in the formula with a real-world motorcycle argument
- [ ] Scoring map passes the "ride it" test — high scores are actually good roads

### Step 3b: Round trip router
- [ ] Can trace through Dijkstra on a 4-node graph on paper
- [ ] Can explain why fun is maximized by minimizing (1 - fun_score)
- [ ] Route renders correctly on a folium map

### Step 3c: CLI / UI
- [ ] Program accepts --start and --miles arguments
- [ ] Outputs a usable HTML map
- [ ] Handles the case where start point is not on a road

---

## Phase 4 — Graph Neural Network

### Step 4a: PyTorch fundamentals
- [ ] Can explain what a tensor is and how it differs from a NumPy array
- [ ] Can explain what autograd does in plain English
- [ ] Can explain what loss.backward() computes, specifically
- [ ] Can explain what optimizer.step() changes, specifically
- [ ] Can write a training loop from memory

### Step 4b: GNN concepts
- [ ] Can explain message passing without using the word "neural"
- [ ] Can write the GCN matrix equation from memory
- [ ] Can explain why road scores depend on neighboring roads (concrete example)
- [ ] Can explain what edge_index is and why it's shape (2, E)

### Step 4c: Convert to PyG format
- [ ] Drew a 4-node graph and wrote its edge_index by hand before touching code
- [ ] Can verify data.edge_attr shape matches expected (E, F)

### Step 4d: Train the GNN
- [ ] Can explain what the GNN is learning from (which labels, why they're imperfect)
- [ ] Train/val loss curves saved and interpreted
- [ ] GNN route compared visually to rule-based route

---

## Phase 5 — Real Ride Data

### Step 5a: GPX collection
- [ ] Has at least 10 GPX files from real motorcycle routes
- [ ] Can parse a GPX file and extract lat/lon sequence

### Step 5b: Map matching
- [ ] Can explain what map matching does and why raw GPS points aren't enough
- [ ] Edge labels derived from real ride frequency

### Step 5c: Retrain
- [ ] GNN retrained on real labels
- [ ] Identified at least one road where rule-score and GNN-score disagree — and investigated why

---

## Phase 6 — Ship It

### Step 6a: Group ride optimization
- [ ] Accepts multiple rider start locations
- [ ] Outputs a single map with per-rider routes

### Step 6b: GPX export
- [ ] Exports a valid GPX file
- [ ] File tested in Google Maps or Kurviger

---

## Session Log

| Date | Phase/Step | What Was Built | Outstanding Questions |
|------|-----------|----------------|----------------------|
| 2026-05-17 | Starting | — | Baseline assessment, reading OSMnx docs |
| 2026-05-17 | Phase 1 / Step 1a | Working venv, all packages installed and imported | None — step complete |
| 2026-05-17 | Phase 1 / Step 1b | Downloaded Snohomish city graph (416 nodes, 1057 edges), plotted, inspected nodes and edges | None — step complete |
