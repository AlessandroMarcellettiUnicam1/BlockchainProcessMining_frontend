import  { useEffect, useRef, useState } from "react";
import { useLoadGraph, useRegisterEvents, useSigma } from "@react-sigma/core";
import FA2Layout from "graphology-layout-forceatlas2/worker";
import circlepack from "graphology-layout/circlepack";

const GraphExtraction = ({ graphData, edgeRange, onNodeSelected, onVisibleNodeCount,onVisibleEdgeCount, startLayout }) => {
  const loadGraph = useLoadGraph();
  const registerEvents = useRegisterEvents();
  const sigma = useSigma();
  const graph = sigma.getGraph();
  const layoutRef = useRef(null); // Persist the layout instance
  const isGraphLoaded = useRef(false); // Track if the graph is already loaded
  const [hoveredNode, setHoveredNode] = useState(null); // Track the hovered node
  const [hoveredNeighbors, setHoveredNeighbors] = useState(new Set()); // Track neighbors of the hovered node


  // Load and initialize the graph (only when graphData changes)
  // Initialize the graph and layout on mount
  useEffect(() => {
    // Initialize the layout if it hasn't been created yet
    if (!layoutRef.current) {
      layoutRef.current = new FA2Layout(graph, {
        settings: {
          gravity: 0.5,
          scalingRatio: 50,
          strongGravityMode: false,
          adjustSizes: true,
        },
      });
    }
    // Register node events
    registerEvents({
      downNode: (event) => handleNodeDragStart(event.node),
      moveBody: (event) => handleNodeDragMove(event),
      upNode: () => handleNodeDragEnd(),
      upStage: () => handleNodeDragEnd(),
      clickNode: (event) => handleNodeClick(event.node),
    });
    // Cleanup on unmount
    return () => {
      if (layoutRef.current) {
        layoutRef.current.stop();
      }
    };
  }, [graph,registerEvents]);
  useEffect(() => {
    if(!graphData)return;
    // Load new graph data
    loadGraph(graphData);

    // Apply circlepack layout for initial positioning
    circlepack.assign(graph, {
      hierarchyAttributes: ["cluster"],
    });

    // Set default node attributes
    graph.forEachNode((node) => {
      graph.mergeNodeAttributes(node, {
        size: 5,
      });
    });
    // Mark the graph as loaded
    isGraphLoaded.current = true;
  }, [graphData]);

  // Initialize the layout instance only once
  useEffect(() => {
    if (!graph) return;
    // Initialize the layout if it hasn't been created yet
    if (!layoutRef.current) {
      layoutRef.current = new FA2Layout(graph, {
        settings: {
          gravity: 0.5,
          scalingRatio: 50,
          strongGravityMode: false,
          adjustSizes: true,
        },
      });
      // Update visible node count
    onVisibleNodeCount(graph.nodes().length);
    onVisibleEdgeCount(graph.edges().length);
    }

    // Cleanup on unmount
    return () => {
      if (layoutRef.current) {
        layoutRef.current.stop();
      }
    };
  }, [graph,onVisibleNodeCount,onVisibleEdgeCount]);

  // Start or stop the layout based on `startLayout`
  useEffect(() => {
    if (!layoutRef.current) return;

    if (startLayout) {
      layoutRef.current.start();
    } else {
      layoutRef.current.stop();
    }
  }, [startLayout]);
  // Handle hover events
  useEffect(() => {
    const handleEnterNode = ({ node }) => {
      setHoveredNode(node);
      setHoveredNeighbors(new Set(graph.neighbors(node)));
    };

    const handleLeaveNode = () => {
      setHoveredNode(null);
      setHoveredNeighbors(new Set());
    };

    sigma.on("enterNode", handleEnterNode);
    sigma.on("leaveNode", handleLeaveNode);

    // Cleanup event listeners on unmount
    return () => {
      sigma.off("enterNode", handleEnterNode);
      sigma.off("leaveNode", handleLeaveNode);
    };
  }, [sigma, graph]);
   // Apply nodeReducer for hover behavior
   useEffect(() => {
    sigma.setSetting("nodeReducer", (node, data) => {
      const res = { ...data };

      if (hoveredNode && node !== hoveredNode && !hoveredNeighbors.has(node)) {
        res.color = "#f6f6f6"; // Grey out non-neighbor nodes
        res.label = ""; // Hide labels for non-neighbor nodes
      }

      return res;
    });
    sigma.setSetting("edgeReducer", (edge, data) => {
      const res = { ...data };
      if(hoveredNode){
        if((graph.source(edge) === hoveredNode || graph.target(edge) === hoveredNode)){
          res.hidden = false; // Show edges connected to the hovered node
        }else{
          res.hidden = true; 
        }
      }
      return res;
    });

    // Refresh the renderer to apply changes
    sigma.refresh();
  }, [hoveredNode, hoveredNeighbors, sigma, graph]);
  // Handle node filtering
    useEffect(() => {
        if (!graph) return;

        const [min, max] = edgeRange || [];
        const visibleNodeCount = new Set();
        let visibleEdgeCount = 0;

        graph.forEachNode((node) => {
            graph.setNodeAttribute(node, "hidden", true);
        });

        graph.forEachEdge((edge, attributes) => {
            const val = attributes.value;

            const passMin = min === null || val >= min;
            const passMax = max === null || val <= max;

            if (passMin && passMax) {
                graph.setNodeAttribute(graph.source(edge), "hidden", false);
                graph.setNodeAttribute(graph.target(edge), "hidden", false);

                visibleNodeCount.add(graph.source(edge));
                visibleNodeCount.add(graph.target(edge));
                visibleEdgeCount++;
            }
        });

        if (min === null && max === null) {
            graph.forEachNode((node) => {
                graph.setNodeAttribute(node, "hidden", false);
                visibleNodeCount.add(node);
            });
            visibleEdgeCount = graph.edges().length;
        }

        onVisibleNodeCount(visibleNodeCount.size);
        onVisibleEdgeCount(visibleEdgeCount);
    }, [edgeRange, graph, onVisibleNodeCount, onVisibleEdgeCount]);

  // Node drag handlers
  let draggedNode = null;
  let isDragging = false;

  const handleNodeDragStart = (node) => {
    isDragging = true;
    draggedNode = node;
    graph.setNodeAttribute(draggedNode, "highlighted", true);
    sigma.getCamera().disable(); // Disable camera movement during drag
  };

  const handleNodeDragMove = ({ event }) => {
    if (!isDragging || !draggedNode) return;

    const pos = sigma.viewportToGraph(event);
    graph.setNodeAttribute(draggedNode, "x", pos.x);
    graph.setNodeAttribute(draggedNode, "y", pos.y);

    event.preventSigmaDefault();
    event.original.preventDefault();
    event.original.stopPropagation();
  };

  const handleNodeDragEnd = () => {
    if (draggedNode) {
      graph.removeNodeAttribute(draggedNode, "highlighted");
    }
    isDragging = false;
    draggedNode = null;
    sigma.getCamera().enable(); 
  };

  // Node click handler
  const handleNodeClick = (node) => {
    onNodeSelected(graph.getNodeAttributes(node).details);
  };

  return null;
};

export default GraphExtraction;