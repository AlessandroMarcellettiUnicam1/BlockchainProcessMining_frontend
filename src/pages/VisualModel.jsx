import {
  Box,
  Button,
  CircularProgress,
  Typography,
  CardContent,
  styled,
  Stack,
  Select,
  MenuItem,
  TextField,
  IconButton,
  InputLabel,
  Slide,
  Chip,
  Divider,
  Dialog, DialogContent, DialogTitle,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { FilterList } from "@mui/icons-material"
import { PlayArrow, Pause } from "@mui/icons-material";
import { ConstructionOutlined, FileUpload } from "@mui/icons-material";
import { HiddenInput } from "../components/HiddenInput";
import React, { useEffect, useState, useRef } from "react";
import JsonView from "@uiw/react-json-view";
import { _generateGraph } from "../api/services";
import CustomTypography from "../components/CustomTypography";
import KeyType from '../components/keyType/keyType';
import AddBoxIcon from "@mui/icons-material/AddBox";
import { SigmaContainer } from "@react-sigma/core";
import FormControl from '@mui/material/FormControl';
import GraphExtraction from "./Graph";
import { MultiGraph } from "graphology";
import { EdgeArrowProgram } from "sigma/rendering";
import { EdgeCurvedArrowProgram } from "@sigma/edge-curve";
import "@react-sigma/core/lib/style.css";
import useDataContext from "../context/useDataContext";



const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="down" ref={ref} {...props} />;
});
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
  const [colorLegend, setColorLegend] = useState([]);
  const [visibleNodesCount, setVisibleNodeCount] = useState(0);
  const [transactionHash, setTransactionHash] =useState("");
  const [transactionHashChoose, setTransactionHashChoose] = useState([]);
  const [startLayout, setStartLayout] = useState(false);
  const [visibleEdgeCount, setVisibleEdgeCount] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  // NEW: Layout selection state
  const [layoutType, setLayoutType] = useState("forceatlas2");
  const [useAdvancedLayouts, setUseAdvancedLayouts] = useState(true);
  const [graphData, setGraphData] = useState({
    nodes: [],
    edges: [],
  });
  const [objectsTypesItem, setObjectsTypesItem] = useState([]);
  const [loading, setLoading] = useState(false);

  // // Layout options for basic version
  // const basicLayouts = [
  //   { value: "forceatlas2", label: "Force Atlas 2", animated: true },
  //   { value: "circlepack", label: "Circle Pack", animated: false },
  //   { value: "circular", label: "Circular", animated: false },
  //   { value: "community-circular", label: "Community Circles", animated: false },
  //   { value: "random", label: "Random", animated: false },
  // ];

  // Layout options for advanced version
  const advancedLayouts = [
    { value: "forceatlas2", label: "Force Atlas 2", animated: true },
    { value: "circlepack", label: "Circle Pack", animated: false },
    { value: "circular", label: "Circular", animated: false },
    { value: "community-circular", label: "Community Circles", animated: false },
    { value: "random", label: "Random", animated: false },
    { value: "grid", label: "Grid", animated: false },
    { value: "radial", label: "Radial", animated: false },
    { value: "hierarchical", label: "Hierarchical", animated: false },
    { value: "concentric", label: "Concentric", animated: false },
  ];

  const currentLayouts = advancedLayouts;
  const currentLayoutInfo = currentLayouts.find(l => l.value === layoutType);

  const handleChange = (e) => {
    const value = e.target.value;
    setSelectedNode(value === "" ? null : value);
  };
  const handleVisibleNodeCount = (count) => {
    setVisibleNodeCount(count);
  }
  const hadleVisibleEdgeCount = (count) => {
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
  const hadleStartLayout = () => {
    setStartLayout(!startLayout);
  }
  const handleLayoutChange = (event) => {
    setLayoutType(event.target.value);
    // Reset animation when changing layouts
    setStartLayout(false);
  };

  const handleLayoutModeChange = (event) => {
    setUseAdvancedLayouts(event.target.value === 'advanced');
    // Reset to a safe layout when switching modes
    setLayoutType("forceatlas2");
    setStartLayout(false);
  };
  const generateGraph = () => {
    setLoading(true);
    const startTime = performance.now();
    const filters={
      transactionHash:transactionHashChoose
    }
    if (objectsTypesItem.length !== 0) {
      _generateGraph(results, objectsTypesItem,filters).then((response) => {
        setLoading(false);
        const nodes = Array.from(response.data.nodes.values());
        const edges = response.data.edges;
        setColorLegend(response.data.colorLegend);
        setEdgeFilter(response.data.edgeFilter);
        setGraphData({ nodes: nodes, edges: edges });
        const endTime = performance.now();
        console.log(`Graph creation took ${(endTime - startTime).toFixed(2)} ms`);

        setLoading(false);
      }).catch(err => {
        setLoading(false);
        console.error("Error generating graph:", err);
      });
    } else {
      setLoading(false)
      const endTime = performance.now();
      console.log(`Graph creation took ${(endTime - startTime).toFixed(2)} ms`);
    }
  };

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <Box display="flex" gap={2} marginBottom={2} style={{ minHeight: '4em' }} flexWrap="wrap">
      <Box  sx={{ width: "100%" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <IconButton size="large" sx={{ color: "#ffb703" }} onClick={() => setOpenDialog(true)}>
            <FilterList fontSize="large" />
          </IconButton>
          <Dialog
            TransitionComponent={Transition}
            keepMounted
            maxWidth=""
            open={openDialog}
            onClose={() => { setOpenDialog(false) }}
          >
            <DialogTitle>Filters</DialogTitle>
            <DialogContent>
              <Stack spacing={3} sx={{ p: 3 }}>

                {/* Transaction Hash */}
                <Box>
                  <Typography fontWeight={700} fontSize="18px">Transactio Hash</Typography>
                                <Box display="flex" gap={1} alignItems="flex-start">
                                    <TextField
                                        value={transactionHash}
                                        onChange={e=>setTransactionHash(e.target.value)}
                                        placeholder="Add transaction hash (separated by comma, space, or line break)"
                                        size="small"
                                        fullWidth
                                        multiline
                                        rows={3}
                                    />
                                    <IconButton
                                        onClick={()=>{
                                          if(transactionHash){
                                            const newTransactionHash = transactionHash
                                              .split(/[,\s\n]+/)
                                              .map(addr => addr.trim())
                                              .filter(addr => addr.length > 0);
                                            setTransactionHashChoose([...transactionHashChoose,...newTransactionHash]);
                                            setTransactionHash("");
                                          }
                                        }}>
                                        <AddBoxIcon color="primary" fontSize="large"/>
                                    </IconButton>
                                </Box>
                                <Box mt={1}>
                                    {transactionHashChoose.map((addr, idx) => (
                                        <Box key={idx} display="flex" justifyContent="space-between" alignItems="center"
                                             mt={1}>
                                            <Typography>{addr}</Typography>
                                            <IconButton onClick={() => setTransactionHashChoose(transactionHashChoose.filter((a, i) => i !== idx))}>
                                                <DeleteIcon color="error" fontSize="medium"/>
                                            </IconButton>
                                        </Box>
                                    ))}
                                </Box>
                </Box>
                {/* Action Buttons */}
                <Box display="flex" gap={2}>
                  <Button
                    variant="contained"
                    onClick={()=>{
                      setOpenDialog(false)
                    }}
                    sx={{
                      height: "50px",
                      backgroundColor: "#66cdaa",
                      "&:hover": { backgroundColor: "#6fa287" },
                    }}
                  >
                    {"Apply Filters"}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={()=>{
                      setTransactionHashChoose([])
                    }}
                    sx={{ height: "50px" }}
                  >
                    Reset Filters
                  </Button>
                </Box>
              </Stack>
            </DialogContent>
          </Dialog>
        </Box>
      </Box>
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
              <Button variant="contained"
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
          </Box>
        {/* NEW: Layout Controls Section */}
        <Box
          sx={{
            mb: 2,
            p: 2,
            backgroundColor: '#f5f5f5',
            borderRadius: 2,
            border: '1px solid #e0e0e0'
          }}
        >
          <Typography variant="h6" sx={{ mb: 2 }}>
            Graph Layout Settings
          </Typography>

          <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
            {/* Layout Mode Selection */}
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Layout Version</InputLabel>
              <Select
                value={useAdvancedLayouts ? 'advanced' : 'basic'}
                onChange={handleLayoutModeChange}
                label="Layout Version"
              >
                <MenuItem value="advanced">
                  Layout Types
                </MenuItem>
              </Select>
            </FormControl>

            {/* Layout Type Selection */}
            <FormControl sx={{ minWidth: 250 }}>
              <InputLabel>Layout Type</InputLabel>
              <Select
                value={layoutType}
                onChange={handleLayoutChange}
                label="Layout Type"
              >
                {currentLayouts.map((layout) => (
                  <MenuItem key={layout.value} value={layout.value}>
                    {layout.label}
                    {layout.animated && (
                      <Chip
                        label="Animated"
                        size="small"
                        sx={{ ml: 1 }}
                        color="primary"
                      />
                    )}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Animation Control (only for animated layouts) */}
            {currentLayoutInfo?.animated && (
              <Button
                variant={startLayout ? "contained" : "outlined"}
                color={startLayout ? "warning" : "success"}
                onClick={hadleStartLayout}
                startIcon={startLayout ? <Pause /> : <PlayArrow />}
                sx={{ height: "56px" }}
              >
                {startLayout ? "Pause Animation" : "Start Animation"}
              </Button>
            )}


          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />
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
     
      {/* Graph itself */ }
  <SigmaContainer
    settings={{
      edgeProgramClasses: {
        straight: EdgeArrowProgram,  
        curved: EdgeCurvedArrowProgram,  
      },
      defaultEdgeType: "straight",
      renderEdgeLabels: true,
    }}>
    <GraphExtraction selectedNode={selectedNode}
      graphData={graphData}
      nodeFilter={nodeFilter}
      onNodeSelected={handleNodeSelected}
      onVisibleNodeCount={handleVisibleNodeCount}
      onVisibleEdgeCount={hadleVisibleEdgeCount}
      startLayout={startLayout}
      layoutType={layoutType}
    />
  </SigmaContainer>
  {
    selectedNode && (
      <Stack marginY={3} height="calc(100vh - 300px)" overflow="auto">

        <JsonView value={selectedNode} style={{ fontSize: '14px' }} width="100%" />

      </Stack>
    )
  }


    </div >

  );
};


export default NetworkGraph;