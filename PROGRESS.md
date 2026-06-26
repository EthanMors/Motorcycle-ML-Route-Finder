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

### Step 1c: Understand the graph as a data structure ✓ COMPLETE
- [x] Can explain what an adjacency matrix is and draw one for a 4-node graph
- [x] Can explain why a road graph's adjacency matrix is mostly zeros (sparse)
- [x] Can convert graph to GeoDataFrame and list all column names with meanings
- [x] Knows what percentage of edges are missing maxspeed (81% — 859/1057)
- [x] Can plot edges colored by highway type and name what each color represents

---

## Phase 2 — Feature Engineering

### Step 2a: Compute curvature ✓ COMPLETE
- [x] Can explain what a LineString is and what its coordinates represent
- [x] Can explain what atan2 computes and why it's used for bearings
- [x] Can implement curvature calculation without help
- [x] Knows curvature limitation: 2-point edges score 0, cul-de-sacs score highest — needs normalization in Phase 3

### Step 2b: Elevation and grade ✓ COMPLETE
- [x] Can explain what road grade means physically (rise/run, expressed as decimal)
- [x] Can explain why grade is signed and direction-dependent (A→B vs B→A are opposite signs)
- [x] Added elevation to all 416 nodes via Open Topo Data API (patched ox.settings.elevation_url_template)
- [x] Computed grade and grade_abs on all 1057 edges via ox.elevation.add_edge_grades(G)
- [x] Knows grade limitation: only uses endpoint elevations — switchback roads appear flat

### Step 2c: Impute missing speed limits ✓ COMPLETE
- [x] 859/1057 edges (81%) had missing maxspeed
- [x] Imputation strategy: fill by highway type (residential=25, secondary=30, tertiary=35, primary_link=40, primary=45, unclassified=25, living_street=10)
- [x] Correctly ordered operations: fill NaNs first, then strip " mph", then convert to int64
- [x] Can explain why defaults were stored as strings (existing values were "25 mph" strings)

### Step 2d: Feature matrix ✓ COMPLETE
- [x] Predicted shape (1057, 11) correctly before writing code
- [x] Selected: length, maxspeed, grade, grade_abs, curvature + 6 highway dummies
- [x] Can explain why one-hot encoding is needed (strings can't go into a neural network)
- [x] Used pd.get_dummies with drop_first=True to avoid multicollinearity
- [x] Feature matrix shape (1057, 11), zero NaN values, all numeric

---

## Phase 3 — Rule-Based Scorer

### Step 3a: Scoring formula ✓ COMPLETE
- [x] Can justify every weight in the formula with a real-world motorcycle argument
- [x] Normalized curvature (log1p + min-max), maxspeed (power transform), grade_abs (clipped + min-max), highway_penalty (manual weights by type)
- [x] Fixed compute_curvature bug: diffBearing clipped to π to prevent negative accumulation and log1p NaNs
- [x] Learned: never use built-in names (min, max) as variable names — silently shadows the built-in

### Step 3b: Round trip router ✓ COMPLETE
- [x] Can explain why fun is maximized by minimizing (1 - fun_score) * length
- [x] Used single_source_dijkstra with weight='length' to find real-distance turnaround candidates
- [x] Used single_source_dijkstra with weight=fun_score to pick best turnaround node
- [x] Combined outbound path + return path (with [1:] to avoid duplicate turnaround node)
- [x] Route renders correctly as HTML map via Folium PolyLine
- [x] Understands why return path must be computed separately (directed graph, one-way streets)

### Step 3c: CLI / UI ✓ COMPLETE
- [x] Program accepts start and miles positional arguments via argparse
- [x] Outputs a usable HTML map (top_3_routes_map.html)
- [x] Handles the case where start point is not on a road via ox.nearest_nodes

---

## Phase 4 — Graph Neural Network

### Step 4a: PyTorch fundamentals ✓ COMPLETE
- [x] Can explain what a tensor is and how it differs from a NumPy array
- [x] Can explain what autograd does in plain English
- [x] Can explain what loss.backward() computes, specifically
- [x] Can explain what optimizer.step() changes, specifically
- [x] Can write a training loop from memory

### Step 4b: GNN concepts ✓ COMPLETE
- [x] Can explain message passing without using the word "neural"
- [x] Can write the GCN matrix equation from memory
- [x] Can explain why road scores depend on neighboring roads (concrete example)
- [x] Can explain what edge_index is and why it's shape (2, E)

### Step 4c: Convert to PyG format ✓ COMPLETE
- [x] Drew a 4-node graph and wrote its edge_index by hand before touching code
- [x] Can verify data.edge_attr shape matches expected (E, F)
- [x] Built valid PyG Data object: num_nodes=30917, edge_index=(2,71455), edge_attr=(71455,17), y=(71455,1)
- [x] Remapped OSM node IDs to 0-based indices using enumerate + apply_()

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
| 2026-05-19 | Phase 2 / Step 2a | Built compute_curvature() from scratch using atan2 bearings; applied to all 1057 edges | Curvature needs length normalization in Phase 3 |
| 2026-05-20 | Phase 2 / Steps 2b–2c | Added elevation/grade via Open Topo Data; imputed maxspeed by highway type | None — steps complete |
| 2026-05-25 | Phase 3 / Steps 3a–3b | Normalized all features; built fun_score(); fixed curvature bug (diffBearing clipped to π); built round trip router with two-pass Dijkstra; rendered route as HTML map in Folium | Snohomish graph is tiny (~5.4km max) — expand to county for better roads; Step 3c CLI still to do |
| 2026-05-20 | Phase 2 / Step 2d | Built clean (1057, 11) feature matrix: 5 numeric + 6 highway dummies, zero nulls | None — Phase 2 complete |
| 2026-06-02 | Phase 3 / Step 3c | CLI complete: argparse with positional start/miles args, top_3_routes_map.html output, nearest node handling | Phase 3 complete — beginning Phase 4 |
| 2026-06-03 | Phase 4 / Step 4a | PyTorch fundamentals: tensors, autograd, optimizer, training loop; ran toy linear regression loop with decreasing loss | Phase 4b next — GNN concepts and message passing |
