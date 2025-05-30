import {
    Box,
    Button,
    CircularProgress,
    Typography,
    Card,
    CardContent,
    styled,
    Stack
} from "@mui/material";
import useDataContext from "../dataContext/useDataContext";
import { ConstructionOutlined, FileUpload } from "@mui/icons-material";
import { HiddenInput } from "../components/HiddenInput";
import React, { useEffect, useState, useRef } from "react";
import JsonView from "@uiw/react-json-view";
import { _generateGraph } from "../api/services";
import CustomTypography from "../components/CustomTypography";
import KeyType from '../components/keyType/keyType';
import { SigmaContainer, useLoadGraph,useRegisterEvents } from "@react-sigma/core";
// import { ForceAtlas2 } from '@react-sigma/layout-forceatlas2';
import GraphExtraction from "./Graph"; 
import { TextField } from "@mui/material";


import "@react-sigma/core/lib/style.css";




const CardContentNoPadding = styled(CardContent)`
    padding-top: 0;
    &:last-child {
        padding-bottom: 0;
    }
`;

const NetworkGraph = () => {
    const [selectedNode, setSelectedNode] = useState(null);
    const { results, setResults } = useDataContext();
    const [running, setRunning] = useState(false);
    const [nodeFilter, setNodeFilter] = useState("");
    const [edgeFilter, setEdgeFilter] = useState("");
    const [colorLegend,setColorLegend]=useState([]);
    const [visibleNodesCount, setVisibleNodeCount]=useState(0);
    const [startLayout,setStartLayout]=useState(false);
    const [visibleEdgeCount, setVisibleEdgeCount]=useState(0);
  const [graphData, setGraphData] = useState({
    nodes: [
    ],
    edges: [
    ],
  });
  const [objectsTypesItem, setObjectsTypesItem] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const value = e.target.value;
    setSelectedNode(value === "" ? null : value);
  };
  const handleVisibleNodeCount=(count)=>{
    setVisibleNodeCount(count);
  }
  const hadleVisibleEdgeCount=(count)=>{
    setVisibleEdgeCount(count);
  }

  const handleLoadGraph = () => {
    const newNodes = [
    ];

    const newEdges = [
    ];

    setGraphData({
      nodes: newNodes,
      edges: newEdges,
    });
    setSelectedNode(null);
  };

  const handleFileChange = (e) => {
    const fileReader = new FileReader();
    fileReader.onload = (event) => {
        const content = event.target.result;
        try {
            setResults(JSON.parse(content));
        } catch (err) {
            // console.error("Invalid JSON file");
        }
    };
    if (e.target.files[0]) {
        fileReader.readAsText(e.target.files[0]);
    }
    e.target.value = null;
};
  const handleAddObjectType = () => {
    const newObjectType = { nameFrom: '', nameTo: '' };
    setObjectsTypesItem([...objectsTypesItem, newObjectType]);
  };
  const handleNodeSelected = (node) => {
    setSelectedNode(node);
  };
  const hadleStartLayout=()=>{
    setStartLayout(!startLayout);
  }
    const generateGraph = () => {
        setLoading(true);
        const startTime = performance.now();
        if(objectsTypesItem.length !== 0){
          _generateGraph(results, objectsTypesItem).then((response) => {
              setLoading(false);
              const nodes = Array.from(response.data.nodes.values());
              const edges = response.data.edges;
              setColorLegend(response.data.colorLegend);
              setEdgeFilter(response.data.edgeFilter);
              setGraphData({nodes:nodes, edges:edges});
              const endTime = performance.now(); 
              console.log(`Graph creation took ${(endTime - startTime).toFixed(2)} ms`);

          setLoading(false);
          }).catch(err => {
              setLoading(false);
              console.error("Error generating graph:", err);
          });
        }else{
          setLoading(false)
          const endTime = performance.now(); 
          console.log(`Graph creation took ${(endTime - startTime).toFixed(2)} ms`);
        }
    };

  return (
    <div style={{ height: '100%', width: '100%'}}>
      {/* Top control box */}
      <Box display="flex" gap={2} marginBottom={2} style={{ height: '4em' }}>
        <Button
          component="label"
          variant="contained"
          startIcon={<FileUpload />}
          sx={{ padding: 1, height: "55px" }}
        >
          Upload File
          <HiddenInput type="file" onChange={handleFileChange} />
        </Button>
        

        <Stack   >
          <CustomTypography>
            <Button onClick={handleAddObjectType}>
              <Button  variant="contained"
              sx={{ padding: 1, height: "55px" }}>Add edge</Button>
            </Button>
            
          </CustomTypography>

          
        </Stack>

        <Button
          variant="contained"
          onClick={generateGraph}
          sx={{ padding: 1, height: "55px" }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "Generate Graph"}
        </Button>
        <TextField
            select
            label="Edge Size"
            SelectProps={{ native: true }}
            defaultValue=""
            sx={{ width: 150 }}
            onChange={(e) => setNodeFilter(e.target.value)}
        >
            <option value=""></option>
            {edgeFilter &&
                Array.from(new Set(edgeFilter))
                    .sort((a, b) => a - b)
                    .map((size, index) => (
                        <option key={index} value={size}>
                            {size}
                        </option>
                    ))}
        </TextField>
       <Typography variant="h6">Visible Nodes: {visibleNodesCount}</Typography>
        <Typography variant="h6">Visible Edges: {visibleEdgeCount}</Typography>
      <Box display="flex" flexDirection="column" gap={2}>
        <Typography variant="h6">Color Legend</Typography>
        {Array.from(colorLegend).map((legendItem, index) => (
          <Box key={index} display="flex" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 20,
                height: 20,
                backgroundColor: legendItem.color,
                borderRadius: "50%",
              }}
            />
            <Typography variant="body1">{legendItem.keyAssigned}</Typography>
          </Box>
        ))}
        
      </Box>
      
      </Box>
      <Box overflow="auto">
      {objectsTypesItem.map((objectType, index) => (
            <KeyType
              key={`object-type-${index}`}
              nameFrom={objectType.nameFrom}
              nameTo={objectType.nameTo}
              objectToSet={objectType}
              index={index}
              setObjectsTypesItem={setObjectsTypesItem}
            />
          ))}
      </Box>
      <Box>

      <Button onClick={hadleStartLayout}>Test</Button>
      </Box>
      {/* Graph itself */}
      <SigmaContainer style={{ height: 'calc(100vh - 200px)', width: '100%' }}>
        <GraphExtraction selectedNode={selectedNode} 
        graphData={graphData}
        nodeFilter={nodeFilter}
        onNodeSelected={handleNodeSelected}
        onVisibleNodeCount={handleVisibleNodeCount}
        onVisibleEdgeCount={hadleVisibleEdgeCount}
        startLayout={startLayout}
        />
        {/* { graphData &&(
          <GraphComponent
          graphData={graphData}
          nodeFilter={nodeFilter}
           onVisibleNodeCount={handleVisibleNodeCount}
           />
        )} */}
      </SigmaContainer>
      {selectedNode && (
      <Stack marginY={3} height="calc(100vh - 300px)" overflow="auto">
      
      <JsonView value={selectedNode} style={{ fontSize: '14px' }} width="100%" />

        </Stack>
      )}

     
    </div>
    
  );
};


export default NetworkGraph;
