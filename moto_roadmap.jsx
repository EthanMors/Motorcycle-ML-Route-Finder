import { useState } from "react";

const phases = [
  {
    id: 1,
    title: "Foundation",
    subtitle: "Python + graphs, zero ML yet",
    color: "#f97316",
    glow: "rgba(249,115,22,0.3)",
    icon: "⬡",
    steps: [
      {
        id: "1a",
        title: "Python environment setup",
        duration: "Day 1",
        why: "Before touching any data you need a reproducible, clean workspace. Every professional project starts here.",
        what: "Install OSMnx, NetworkX, GeoPandas, Shapely, Matplotlib in a virtual environment. Understand why each one exists.",
        how: [
          "Create a venv or conda environment — never install globally",
          "pip install osmnx networkx geopandas shapely matplotlib folium",
          "Open a Jupyter notebook and import each library one at a time",
          "Print the version of each — understand what version pinning means"
        ],
        think: "What is a graph? What are nodes and edges? Draw one on paper representing your neighborhood before writing code.",
        resources: [
          { label: "OSMnx docs", url: "https://osmnx.readthedocs.io" },
          { label: "NetworkX tutorial", url: "https://networkx.org/documentation/stable/tutorial.html" }
        ]
      },
      {
        id: "1b",
        title: "Download your first road network",
        duration: "Day 1–2",
        why: "You need to see the raw data before you can model it. OSMnx wraps the entire OpenStreetMap API into one function call.",
        what: "Pull the drivable road graph for a small area near you. Inspect every attribute on nodes and edges.",
        how: [
          "ox.graph_from_place('Your City, State', network_type='drive')",
          "Print G.nodes(data=True) — look at every attribute on one node",
          "Print G.edges(data=True) — find maxspeed, highway, length, geometry",
          "Plot the graph with ox.plot_graph(G) and study the shape"
        ],
        think: "What does it mean that a road is a directed edge? Why does a two-way street become two edges in the graph?",
        resources: [
          { label: "OSMnx graph_from_place", url: "https://osmnx.readthedocs.io/en/stable/user-reference.html" },
          { label: "OSM highway tags", url: "https://wiki.openstreetmap.org/wiki/Key:highway" }
        ]
      },
      {
        id: "1c",
        title: "Understand the graph as a data structure",
        duration: "Day 2–3",
        why: "A GNN takes a graph as input. You cannot build one if you do not understand what a graph IS as a mathematical object.",
        what: "Manually inspect adjacency, degree, node features, edge features. Convert to GeoDataFrame and explore.",
        how: [
          "gdf_nodes, gdf_edges = ox.convert.graph_to_gdfs(G)",
          "Print gdf_edges.columns — write down what every column means",
          "Calculate: how many edges have a maxspeed value? How many don't?",
          "Plot edges colored by highway type — learn what tertiary vs primary looks like visually"
        ],
        think: "What is an adjacency matrix? How would you represent this graph as a matrix? Why is that matrix mostly zeros?",
        resources: [
          { label: "Graph theory primer", url: "https://www.geeksforgeeks.org/graph-data-structure-and-algorithms/" },
          { label: "GeoPandas intro", url: "https://geopandas.org/en/stable/getting_started/introduction.html" }
        ]
      }
    ]
  },
  {
    id: 2,
    title: "Feature Engineering",
    subtitle: "Turn raw OSM data into meaningful numbers",
    color: "#eab308",
    glow: "rgba(234,179,8,0.3)",
    icon: "◈",
    steps: [
      {
        id: "2a",
        title: "Compute curvature per road segment",
        duration: "Day 3–5",
        why: "Curvature is the #1 signal for a fun motorcycle road. OSM stores geometry as a LineString — you calculate curvature from it yourself.",
        what: "For each edge, use the geometry coordinates to measure direction changes. More direction change = more curvy = higher score.",
        how: [
          "Access edge geometry: gdf_edges.geometry — each is a LineString",
          "Extract coordinate list from each LineString with list(geom.coords)",
          "Calculate bearing between consecutive points using math.atan2",
          "Sum absolute bearing changes along the edge — this is your curvature score",
          "Normalize by road length so short wiggly roads don't outscore long curvy ones"
        ],
        think: "What's the difference between a road that wiggles randomly vs. a road with deliberate sweeping curves? How would you detect that in the data?",
        resources: [
          { label: "Shapely geometry docs", url: "https://shapely.readthedocs.io/en/stable/geometry.html" },
          { label: "adamfranco/curvature on GitHub", url: "https://github.com/adamfranco/curvature" }
        ]
      },
      {
        id: "2b",
        title: "Add elevation and grade",
        duration: "Day 5–6",
        why: "Mountain switchbacks are what riders dream about. Elevation change and road grade are critical features your model needs.",
        what: "Use the Open-Elevation API to get elevation at every node, then calculate grade (rise/run) for each edge.",
        how: [
          "ox.elevation.add_node_elevations_google(G, api_key=...) OR use open-elevation.com free API",
          "ox.elevation.add_edge_grades(G) — calculates rise/run for each edge",
          "Inspect G.edges(data=True) and find the 'grade_abs' attribute",
          "Plot edges colored by grade — you'll see mountains pop out"
        ],
        think: "A 6% grade means 6 feet of rise per 100 feet of horizontal distance. What grade feels steep on a motorcycle? What's dangerous?",
        resources: [
          { label: "Open-Elevation free API", url: "https://api.open-elevation.com" },
          { label: "OSMnx elevation docs", url: "https://osmnx.readthedocs.io/en/stable/user-reference.html#osmnx.elevation" }
        ]
      },
      {
        id: "2c",
        title: "Impute missing speed limits",
        duration: "Day 6–7",
        why: "OSM speed limits are missing for 30–60% of roads. A model that ignores missing data is a broken model.",
        what: "Build a simple imputation strategy: fill missing maxspeed from road type defaults. Learn why this is a design decision, not a fact.",
        how: [
          "Check: gdf_edges['maxspeed'].isna().sum() — count the holes",
          "Build a highway_type → default_speed dictionary from OSM wiki",
          "Fill NaN values using that lookup: df['maxspeed'].fillna(df['highway'].map(defaults))",
          "Convert string speeds ('35 mph') to float — handle edge cases like '35;45'"
        ],
        think: "Is a road with no posted speed limit the same as a road with a 25 mph limit? What assumption are you making, and is it right?",
        resources: [
          { label: "OSM maxspeed wiki", url: "https://wiki.openstreetmap.org/wiki/Key:maxspeed" }
        ]
      },
      {
        id: "2d",
        title: "Build the feature matrix",
        duration: "Day 7–8",
        why: "A GNN needs a clean tensor of edge features. This is where all your work comes together into a single DataFrame.",
        what: "Combine curvature, grade, speed limit, road length, and road type into one normalized feature matrix per edge.",
        how: [
          "Create a DataFrame with one row per edge",
          "Columns: curvature_score, grade_abs, speed_kph, length_m, highway_encoded",
          "One-hot encode or ordinal encode the highway type",
          "Normalize all numeric columns to [0,1] with MinMaxScaler",
          "Check for remaining NaN values — every NaN is a future bug"
        ],
        think: "Why do you normalize? What happens to your gradient descent if curvature is 0–2 but length is 0–5000?",
        resources: [
          { label: "Scikit-learn preprocessing", url: "https://scikit-learn.org/stable/modules/preprocessing.html" }
        ]
      }
    ]
  },
  {
    id: 3,
    title: "Rule-Based Scorer",
    subtitle: "Build a working app before any ML",
    color: "#22c55e",
    glow: "rgba(34,197,94,0.3)",
    icon: "◉",
    steps: [
      {
        id: "3a",
        title: "Design a weighted scoring formula",
        duration: "Day 8–9",
        why: "Before training a model, you need a baseline that works. A hand-crafted formula teaches you what features actually matter.",
        what: "Assign weights to each feature by hand. Score every edge. This becomes your baseline and your pseudo-label generator.",
        how: [
          "fun_score = (0.4 × curvature) + (0.25 × grade) + (0.2 × speed_score) + (0.15 × road_type_score)",
          "speed_score: penalize highways, reward 35–55 mph roads",
          "road_type_score: tertiary=1.0, secondary=0.7, primary=0.3, motorway=0.0",
          "Apply to every edge: gdf_edges['fun_score'] = ...",
          "Plot the map colored by fun_score and sanity-check it visually"
        ],
        think: "How do you know if your weights are right? What would a 'wrong' scoring map look like? How would a rider react to it?",
        resources: []
      },
      {
        id: "3b",
        title: "Find the highest-scoring round trip",
        duration: "Day 9–11",
        why: "A score on each edge is useless without a router. You need to find the path through the graph that maximizes total fun.",
        what: "Use NetworkX's shortest path algorithm but with fun_score as the weight (maximizing, not minimizing).",
        how: [
          "Invert fun_score: edge_cost = 1 - fun_score (so Dijkstra minimizes cost = maximizes fun)",
          "nx.set_edge_attributes(G, values=cost_dict, name='route_cost')",
          "nx.shortest_path(G, source, target, weight='route_cost')",
          "For a round trip: find midpoint in opposite direction from start, route there and back",
          "Plot the route on a folium map with ox.plot_route_folium(G, route)"
        ],
        think: "Dijkstra finds the shortest path by cost. If cost = 1 - fun, what path does it actually find? Trace through a tiny 4-node example on paper.",
        resources: [
          { label: "NetworkX shortest path", url: "https://networkx.org/documentation/stable/reference/algorithms/shortest_paths.html" },
          { label: "Folium maps", url: "https://python-visualization.github.io/folium/" }
        ]
      },
      {
        id: "3c",
        title: "Build a CLI or simple UI",
        duration: "Day 11–12",
        why: "Software that only runs in a notebook is not software. Making it usable forces you to think about inputs, outputs, and errors.",
        what: "Accept a starting location and desired ride distance. Output an HTML map the rider can open on their phone.",
        how: [
          "Accept args: python route.py --start 'Austin, TX' --miles 80",
          "Geocode the start point with ox.geocode(location_string)",
          "Pull only the graph within that radius — don't download the whole state",
          "Run the scorer and router",
          "Save folium map to route_output.html and open it automatically"
        ],
        think: "What happens if the start location isn't on a road? What if the requested distance has no good curvy roads? How do you tell the user?",
        resources: [
          { label: "Python argparse", url: "https://docs.python.org/3/library/argparse.html" }
        ]
      }
    ]
  },
  {
    id: 4,
    title: "Graph Neural Network",
    subtitle: "Replace the formula with a learned model",
    color: "#3b82f6",
    glow: "rgba(59,130,246,0.3)",
    icon: "⬡",
    steps: [
      {
        id: "4a",
        title: "PyTorch fundamentals",
        duration: "Day 12–15",
        why: "You cannot use PyTorch Geometric without understanding PyTorch. Tensors, autograd, and the training loop are the building blocks.",
        what: "Build a tiny MLP that scores a single road edge from its features. Train it on synthetic data. Learn the training loop cold.",
        how: [
          "Represent one edge as a tensor: torch.tensor([curvature, grade, speed, length, type])",
          "Build nn.Sequential(Linear(5,32), ReLU(), Linear(32,1)) — a score predictor",
          "Generate synthetic labels: edges your formula scored > 0.7 = 1, else = 0",
          "Train with BCELoss and Adam for 50 epochs — print loss every 10",
          "Understand every line: what is a gradient? what does optimizer.step() do?"
        ],
        think: "The model has no idea what a road is. What does it actually learn? What does loss=0.3 vs loss=0.05 mean in English?",
        resources: [
          { label: "PyTorch 60-minute blitz", url: "https://pytorch.org/tutorials/beginner/deep_learning_60min_blitz.html" },
          { label: "Dive into Deep Learning", url: "https://d2l.ai/chapter_multilayer-perceptrons/" }
        ]
      },
      {
        id: "4b",
        title: "Intro to Graph Neural Networks",
        duration: "Day 15–18",
        why: "An MLP scores edges in isolation. A GNN scores edges by also looking at their neighbors — exactly what you need for routing context.",
        what: "Understand message passing: each node collects information from neighbors, aggregates it, updates its own representation.",
        how: [
          "Read the Kipf & Welling GCN paper (2017) — at least the intro and equations",
          "Implement a manual message passing step: for each node, average its neighbors' features",
          "Do this in pure PyTorch first, then see how PyG does it in one line",
          "Understand: what is an adjacency matrix? what is A_hat in GCN?"
        ],
        think: "Why does a road's score depend on what roads it connects to? Give a concrete example from your map where this matters.",
        resources: [
          { label: "Kipf & Welling GCN paper", url: "https://arxiv.org/abs/1609.02907" },
          { label: "distill.pub graph networks", url: "https://distill.pub/2021/gnn-intro/" },
          { label: "PyG intro tutorial", url: "https://pytorch-geometric.readthedocs.io/en/stable/get_started/introduction.html" }
        ]
      },
      {
        id: "4c",
        title: "Convert your road graph to PyG format",
        duration: "Day 18–20",
        why: "PyG needs your graph in its own Data format. This step teaches you exactly how a GNN sees your road network.",
        what: "Use PyG's from_networkx to convert. Verify shapes. Understand edge_index — the core data structure.",
        how: [
          "from torch_geometric.utils import from_networkx",
          "data = from_networkx(G, group_edge_attrs=['curvature','grade','speed','length'])",
          "Print data.edge_index — understand why it's shape (2, num_edges)",
          "Print data.edge_attr — verify your feature matrix survived the conversion",
          "data.validate() — PyG will tell you if something is wrong"
        ],
        think: "edge_index is a (2, E) tensor where each column is one edge [source, target]. Draw a 4-node graph on paper and write its edge_index by hand.",
        resources: [
          { label: "PyG Data object docs", url: "https://pytorch-geometric.readthedocs.io/en/stable/generated/torch_geometric.data.Data.html" }
        ]
      },
      {
        id: "4d",
        title: "Build and train the GNN edge scorer",
        duration: "Day 20–24",
        why: "This is the payoff. A GNN that learns which roads are fun by considering each road in the context of its neighbors.",
        what: "Build a GNN with 2–3 GCN or GAT layers that outputs a fun score per edge. Train on your rule-based labels.",
        how: [
          "Use torch_geometric.nn.GCNConv or GATConv — read both docs, pick one",
          "Architecture: GCNConv(5→32) → ReLU → GCNConv(32→16) → Linear(16→1) → Sigmoid",
          "Labels: use your Phase 3 rule-based scores as soft targets",
          "Loss: MSELoss between GNN output and rule-based score",
          "Train for 100 epochs, plot train/val loss",
          "Compare GNN route vs rule-based route on the same map"
        ],
        think: "Your GNN is learning to replicate your formula at first. How would you get it to eventually surpass the formula? What data would it need?",
        resources: [
          { label: "PyG GCNConv docs", url: "https://pytorch-geometric.readthedocs.io/en/stable/generated/torch_geometric.nn.conv.GCNConv.html" },
          { label: "GAT paper", url: "https://arxiv.org/abs/1710.10903" }
        ]
      }
    ]
  },
  {
    id: 5,
    title: "Real Ride Data",
    subtitle: "Replace synthetic labels with ground truth",
    color: "#a855f7",
    glow: "rgba(168,85,247,0.3)",
    icon: "◈",
    steps: [
      {
        id: "5a",
        title: "Collect GPX files from real rides",
        duration: "Day 24–26",
        why: "Your rule-based labels are your opinion. Real GPS tracks from real riders are ground truth.",
        what: "Download public motorcycle GPX routes from Wikiloc or record your own. Parse them into coordinates.",
        how: [
          "Download 10–20 GPX files from wikiloc.com (motorcycle category, your region)",
          "Parse with gpxpy library: import gpxpy; gpx = gpxpy.parse(open('route.gpx'))",
          "Extract lat/lon sequences from each track",
          "Plot them on your OSMnx map — do they follow roads you'd expect?"
        ],
        think: "A GPX track is just a sequence of coordinates. How do you know which road edges those coordinates correspond to? That's the next step.",
        resources: [
          { label: "Wikiloc motorcycle routes", url: "https://www.wikiloc.com/trails/motorcycle" },
          { label: "gpxpy library", url: "https://github.com/tkrajina/gpxpy" }
        ]
      },
      {
        id: "5b",
        title: "Map-match GPX to road edges",
        duration: "Day 26–29",
        why: "GPS coordinates aren't exactly on roads. Map matching snaps them to the nearest edge — turning a track into a set of chosen edges.",
        what: "Use OSMnx's nearest edge function to map each GPS point to its closest road edge. Chosen edges get label=1.",
        how: [
          "ox.nearest_edges(G, X=longitudes, Y=latitudes, return_dist=True)",
          "Count how many times each edge appears across all GPX files",
          "Normalize: edge_label = count / max_count → float between 0 and 1",
          "Edges never ridden by anyone = label 0 (or unlabeled — your design decision)"
        ],
        think: "Is a road that appears in 10 GPX tracks definitely more fun than one that appears in 2? What confounds that assumption?",
        resources: [
          { label: "OSMnx nearest edges", url: "https://osmnx.readthedocs.io/en/stable/user-reference.html" }
        ]
      },
      {
        id: "5c",
        title: "Retrain GNN on real labels",
        duration: "Day 29–32",
        why: "Now your model learns from actual rider behavior, not your formula. Compare the two outputs — the differences are instructive.",
        what: "Replace rule-based labels with GPX-derived labels. Retrain. Visualize which roads the new model scores differently.",
        how: [
          "Rebuild your PyG Data object with the new edge labels",
          "Retrain with same architecture — watch if loss behaves differently",
          "Find edges where rule-score and GNN-score disagree the most",
          "Ride one of those roads and see who was right"
        ],
        think: "The GNN trained on GPS data might score roads your formula hates. What would it mean if riders consistently choose roads your formula gave a 0.2 to?",
        resources: []
      }
    ]
  },
  {
    id: 6,
    title: "Ship It",
    subtitle: "Make it usable for your crew",
    color: "#ec4899",
    glow: "rgba(236,72,153,0.3)",
    icon: "◉",
    steps: [
      {
        id: "6a",
        title: "Group ride optimization",
        duration: "Day 32–35",
        why: "Riding with buddies means you need to optimize for the group — multiple start points, a shared route, rest stops.",
        what: "Accept multiple starting locations. Find a common meeting point. Route everyone along high-scoring roads to rendezvous.",
        how: [
          "Geocode each rider's start location",
          "Find the geographic centroid as a candidate meeting point",
          "Run the GNN scorer on each rider's subgraph",
          "Find the route to centroid that maximizes each rider's fun score",
          "Output one map with all routes, color-coded per rider"
        ],
        think: "Two riders starting 30 miles apart might have totally different road quality between them and the meetup. How do you make both happy?",
        resources: []
      },
      {
        id: "6b",
        title: "Export to GPX for phone navigation",
        duration: "Day 35–36",
        why: "A route on a laptop is useless at 60 mph. Export to GPX so any motorcycle GPS or phone app can navigate it.",
        what: "Convert the selected route edges back to a GPX track. Test it in Google Maps or Kurviger.",
        how: [
          "Extract ordered lat/lon from the route edges",
          "Write a GPX file using gpxpy: gpxpy.gpx.GPXTrackPoint(lat, lon)",
          "Open in Google Maps — does the route look right?",
          "Import into Kurviger app — compare to what Kurviger would have generated"
        ],
        think: "Your GNN's route and Kurviger's route will differ. Which would you actually trust? What does that tell you about your model?",
        resources: [
          { label: "Kurviger motorcycle planner", url: "https://kurv.gr" }
        ]
      }
    ]
  }
];

export default function MotoRoadmap() {
  const [activePhase, setActivePhase] = useState(1);
  const [activeStep, setActiveStep] = useState("1a");
  const [expandedSection, setExpandedSection] = useState("how");

  const phase = phases.find(p => p.id === activePhase);
  const step = phase?.steps.find(s => s.id === activeStep);

  const totalSteps = phases.reduce((a, p) => a + p.steps.length, 0);
  const completedSteps = phases
    .filter(p => p.id < activePhase).reduce((a, p) => a + p.steps.length, 0) +
    (phase?.steps.findIndex(s => s.id === activeStep) ?? 0);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080c14",
      color: "#e2e8f0",
      fontFamily: "'DM Mono', 'Courier New', monospace",
      display: "flex",
      flexDirection: "column"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0d1321; }
        ::-webkit-scrollbar-thumb { background: #1e2d40; border-radius: 2px; }
        .phase-btn:hover { filter: brightness(1.3); }
        .step-btn:hover { background: rgba(255,255,255,0.05) !important; }
        .resource-link { color: #60a5fa; text-decoration: none; }
        .resource-link:hover { text-decoration: underline; }
        .section-toggle { cursor: pointer; user-select: none; }
        .section-toggle:hover { opacity: 0.8; }
      `}</style>

      {/* Header */}
      <div style={{
        padding: "20px 24px 14px",
        borderBottom: "1px solid #0f1e30",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12
      }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 4, color: "#f97316" }}>
            MOTO ROUTE FINDER
          </div>
          <div style={{ fontSize: 11, color: "#475569", letterSpacing: 2, marginTop: 2 }}>
            PYTORCH + GRAPH NEURAL NETWORKS · PROJECT ROADMAP
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 10, color: "#475569", letterSpacing: 1 }}>PROGRESS</div>
          <div style={{ width: 120, height: 4, background: "#0f1e30", borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              width: `${(completedSteps / totalSteps) * 100}%`,
              height: "100%",
              background: phase?.color ?? "#f97316",
              transition: "width 0.4s ease",
              borderRadius: 2
            }} />
          </div>
          <div style={{ fontSize: 10, color: "#64748b" }}>{completedSteps}/{totalSteps}</div>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden", height: "calc(100vh - 74px)" }}>

        {/* Left sidebar — phases */}
        <div style={{
          width: 180,
          background: "#060a11",
          borderRight: "1px solid #0f1e30",
          overflowY: "auto",
          flexShrink: 0,
          padding: "12px 0"
        }}>
          {phases.map(p => (
            <button
              key={p.id}
              className="phase-btn"
              onClick={() => { setActivePhase(p.id); setActiveStep(p.steps[0].id); }}
              style={{
                width: "100%",
                background: activePhase === p.id ? `${p.color}15` : "transparent",
                border: "none",
                borderLeft: activePhase === p.id ? `3px solid ${p.color}` : "3px solid transparent",
                padding: "12px 14px",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ color: p.color, fontSize: 14 }}>{p.icon}</span>
                <span style={{ fontSize: 10, color: "#475569", letterSpacing: 1 }}>PHASE {p.id}</span>
              </div>
              <div style={{ fontSize: 12, color: activePhase === p.id ? p.color : "#64748b", fontWeight: 500, lineHeight: 1.3 }}>
                {p.title}
              </div>
              <div style={{ fontSize: 10, color: "#334155", marginTop: 3, lineHeight: 1.3 }}>
                {p.steps.length} steps
              </div>
            </button>
          ))}
        </div>

        {/* Middle — steps list */}
        <div style={{
          width: 200,
          background: "#080c14",
          borderRight: "1px solid #0f1e30",
          overflowY: "auto",
          flexShrink: 0,
          padding: "12px 0"
        }}>
          <div style={{ padding: "6px 14px 12px", fontSize: 10, color: "#1e3a5f", letterSpacing: 2 }}>
            {phase?.title.toUpperCase()}
          </div>
          {phase?.steps.map((s, i) => (
            <button
              key={s.id}
              className="step-btn"
              onClick={() => { setActiveStep(s.id); setExpandedSection("how"); }}
              style={{
                width: "100%",
                background: activeStep === s.id ? `${phase.color}10` : "transparent",
                border: "none",
                borderLeft: activeStep === s.id ? `2px solid ${phase.color}` : "2px solid transparent",
                padding: "10px 14px",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.12s"
              }}
            >
              <div style={{ fontSize: 9, color: "#334155", letterSpacing: 1, marginBottom: 4 }}>
                STEP {phase.id}.{i + 1} · {s.duration}
              </div>
              <div style={{
                fontSize: 12,
                color: activeStep === s.id ? phase.color : "#94a3b8",
                lineHeight: 1.4,
                fontWeight: activeStep === s.id ? 500 : 400
              }}>
                {s.title}
              </div>
            </button>
          ))}
        </div>

        {/* Right — step detail */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {step && (
            <div>
              {/* Step header */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 10, color: "#334155", letterSpacing: 2, marginBottom: 8 }}>
                  PHASE {activePhase} · {phase?.subtitle?.toUpperCase()}
                </div>
                <div style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 32,
                  color: phase?.color,
                  letterSpacing: 3,
                  lineHeight: 1,
                  marginBottom: 10
                }}>
                  {step.title}
                </div>
                <div style={{
                  display: "inline-block",
                  background: `${phase?.color}15`,
                  border: `1px solid ${phase?.color}30`,
                  borderRadius: 4,
                  padding: "3px 10px",
                  fontSize: 10,
                  color: phase?.color,
                  letterSpacing: 2
                }}>
                  {step.duration}
                </div>
              </div>

              {/* Why */}
              <div style={{ marginBottom: 20, padding: "14px 18px", background: "#0a1120", borderLeft: `3px solid ${phase?.color}`, borderRadius: "0 6px 6px 0" }}>
                <div style={{ fontSize: 9, color: "#334155", letterSpacing: 2, marginBottom: 8 }}>WHY THIS STEP EXISTS</div>
                <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>{step.why}</div>
              </div>

              {/* What */}
              <div style={{ marginBottom: 20, padding: "14px 18px", background: "#0a1120", borderRadius: 6 }}>
                <div style={{ fontSize: 9, color: "#334155", letterSpacing: 2, marginBottom: 8 }}>WHAT YOU'RE BUILDING</div>
                <div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.7 }}>{step.what}</div>
              </div>

              {/* How — expandable */}
              <div style={{ marginBottom: 20 }}>
                <div
                  className="section-toggle"
                  onClick={() => setExpandedSection(expandedSection === "how" ? null : "how")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 18px",
                    background: "#0a1120",
                    borderRadius: expandedSection === "how" ? "6px 6px 0 0" : 6,
                    borderBottom: expandedSection === "how" ? `1px solid #0f1e30` : "none"
                  }}
                >
                  <span style={{ fontSize: 9, color: phase?.color, letterSpacing: 2 }}>HOW TO APPROACH IT</span>
                  <span style={{ color: "#334155", fontSize: 12 }}>{expandedSection === "how" ? "▲" : "▼"}</span>
                </div>
                {expandedSection === "how" && (
                  <div style={{ background: "#080f1a", borderRadius: "0 0 6px 6px", padding: "14px 18px" }}>
                    {step.how.map((h, i) => (
                      <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: "50%",
                          background: `${phase?.color}20`,
                          border: `1px solid ${phase?.color}40`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                          fontSize: 9, color: phase?.color, fontWeight: 500
                        }}>
                          {i + 1}
                        </div>
                        <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7, fontFamily: "'DM Mono', monospace" }}>
                          {h}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Think */}
              <div style={{ marginBottom: 20 }}>
                <div
                  className="section-toggle"
                  onClick={() => setExpandedSection(expandedSection === "think" ? null : "think")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 18px",
                    background: "#0a1120",
                    borderRadius: expandedSection === "think" ? "6px 6px 0 0" : 6,
                  }}
                >
                  <span style={{ fontSize: 9, color: "#a78bfa", letterSpacing: 2 }}>THINK BEFORE YOU TYPE</span>
                  <span style={{ color: "#334155", fontSize: 12 }}>{expandedSection === "think" ? "▲" : "▼"}</span>
                </div>
                {expandedSection === "think" && (
                  <div style={{ background: "#080f1a", borderRadius: "0 0 6px 6px", padding: "14px 18px" }}>
                    <div style={{ fontSize: 13, color: "#a78bfa", lineHeight: 1.8, fontStyle: "italic" }}>
                      💭 {step.think}
                    </div>
                  </div>
                )}
              </div>

              {/* Resources */}
              {step.resources.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 9, color: "#334155", letterSpacing: 2, marginBottom: 10 }}>READ BEFORE YOU START</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {step.resources.map((r, i) => (
                      <a
                        key={i}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="resource-link"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 12px",
                          background: "#0a1525",
                          border: "1px solid #1e3a5f",
                          borderRadius: 4,
                          fontSize: 11,
                          color: "#60a5fa",
                          textDecoration: "none"
                        }}
                      >
                        ↗ {r.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Nav */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32, paddingTop: 20, borderTop: "1px solid #0f1e30" }}>
                <button
                  onClick={() => {
                    const allSteps = phases.flatMap(p => p.steps.map(s => ({ ...s, phaseId: p.id })));
                    const idx = allSteps.findIndex(s => s.id === activeStep);
                    if (idx > 0) {
                      const prev = allSteps[idx - 1];
                      setActivePhase(prev.phaseId);
                      setActiveStep(prev.id);
                    }
                  }}
                  style={{
                    background: "transparent",
                    border: "1px solid #1e2d40",
                    color: "#475569",
                    padding: "8px 16px",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontSize: 11,
                    letterSpacing: 1
                  }}
                >
                  ← PREV
                </button>
                <button
                  onClick={() => {
                    const allSteps = phases.flatMap(p => p.steps.map(s => ({ ...s, phaseId: p.id })));
                    const idx = allSteps.findIndex(s => s.id === activeStep);
                    if (idx < allSteps.length - 1) {
                      const next = allSteps[idx + 1];
                      setActivePhase(next.phaseId);
                      setActiveStep(next.id);
                    }
                  }}
                  style={{
                    background: phase?.color ?? "#f97316",
                    border: "none",
                    color: "#000",
                    padding: "8px 20px",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 1
                  }}
                >
                  NEXT →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
