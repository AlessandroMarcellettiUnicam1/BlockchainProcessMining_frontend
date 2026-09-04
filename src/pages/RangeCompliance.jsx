import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Tooltip,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import RuleParser from "./CoBlockly/coblockComponents/RuleParser.tsx";
import CoBlocklyEditor from "./CoBlockly/coblockComponents/CoBlocklyEditor.tsx";
import MempoolFilter from "../components/liveCompliance/MempoolFilter.jsx";
import XesConverter from "../components/liveCompliance/XesConverter.jsx";
import TraceViewer from "../components/liveCompliance/TraceViewer.jsx";
import {
  _startHistoricalAnalysis,
  _getTimelineStep
} from "../api/services.js";
import { SnackbarProvider, enqueueSnackbar } from "notistack";

export default function RangeCompliance() {
  // Configurazione
  const [ruleText, setRuleText] = useState("");
  const [rulesList, setRulesList] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [monitoredContracts, setMonitoredContracts] = useState([]);
  
  const [fromBlock, setFromBlock] = useState("");
  const [toBlock, setToBlock] = useState("");

  const [logMapping] = useState({
    function: "functionName",
    contract: "contractAddress",
    block: "blockNumber",
    sender: "sender",
    timestamp: "timestamp",
    gasLimit: "gasLimit",
    gasUsed: "gasUsed",
    value: "value",
    SV: "storageState",
    CALL: "internalTxs",
    I: "inputs",
    E: "events",
    transactionHash: "transactionHash"
  });

  const [mapping, setMapping] = useState({
    case_col: "",
    activity_col: "",
    time_col: "",
  });

  // Visualizzazione e Ispezione
  const [stepInput, setStepInput] = useState(1);
  const [viewData, setViewData] = useState(null);

  const startHistoricalMonitor = async () => {
    if (!sessionId) return alert("Genera prima il base XES!");
    if (!fromBlock || !toBlock) return alert("Inserisci un range di blocchi valido!");
    if (monitoredContracts.length === 0) return alert("Inserisci almeno un contratto!");

    try {
      await _startHistoricalAnalysis({
        sessionId,
        monitoredContracts,
        mapping,
        parsedRules: rulesList,
        logMapping,
        fromBlock: parseInt(fromBlock, 10),
        toBlock: parseInt(toBlock, 10)
      });

      enqueueSnackbar(`Analisi avviata in background. Le metriche vengono salvate nel database.`, { variant: "success" });
    } catch (err) {
      console.error("Errore avvio analisi storica:", err);
      enqueueSnackbar(`Errore durante l'avvio dell'analisi.`, { variant: "error" });
    }
  };

  const fetchSpecificStep = async () => {
    if (!sessionId) return alert("Session ID mancante!");
    const targetIndex = Math.max(0, parseInt(stepInput, 10) - 1);
    
    try {
      const res = await _getTimelineStep(sessionId, targetIndex);
      if (res && res.success && res.data) {
        setViewData(res.data);
        enqueueSnackbar(`Step ${stepInput} caricato.`, { variant: "info" });
      } else {
        enqueueSnackbar(`Step non trovato o non ancora elaborato.`, { variant: "warning" });
        setViewData(null);
      }
    } catch (err) {
      console.error("Errore caricamento step:", err);
      enqueueSnackbar(`Impossibile caricare lo step richiesto.`, { variant: "error" });
    }
  };

  return (
    <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
      <Box p={4}>
        {/* 1. XES Converter */}
        <Box mb={4} p={3} border={1} borderRadius={2} borderColor="divider">
          <Box display="flex" alignItems="center" gap={1} mb={3}>
            <Typography variant="h6" fontWeight="bold" color="primary">
              1. Upload logs or choose from DB
            </Typography>
            <Tooltip
              title={
                <Box sx={{ whiteSpace: "pre-wrap", fontSize: "0.85rem", p: 0.5 }}>
                  {`The uploaded log must contain these keys:

{
    "functionName", "transactionHash", "blockNumber",
    "contractAddress", "sender", "gasUsed", "timestamp",
    "inputs", "value", "storageState", "internalTxs", "events"
}`}
                </Box>
              }
              placement="left"
              arrow
            >
              <IconButton size="small" sx={{ color: "text.secondary" }}>
                <InfoOutlinedIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <XesConverter
            mapping={mapping}
            setMapping={setMapping}
            previousSessionId={sessionId}
            onConversionSuccess={(newSessionId) => setSessionId(newSessionId)}
          />
        </Box>

        {/* 2. CoBlock Rule */}
        <Box mb={4} p={3} border={1} borderRadius={2} borderColor="divider">
          <Typography variant="h6" mb={3} fontWeight="bold" color="primary">
            2. Define CoBlock rules
          </Typography>
          <CoBlocklyEditor onRuleTranslated={setRuleText} />
          <RuleParser
            ruleText={ruleText}
            setRuleText={setRuleText}
            onRuleParsed={(parsedResultString) => {
              if (parsedResultString) {
                const newRule = {
                  id: Date.now().toString(),
                  text: ruleText,
                  parsed: JSON.parse(parsedResultString) 
                };
                setRulesList(prev => [...prev, newRule]);
                setRuleText(""); 
              }
            }}
          />
          {rulesList.length > 0 && (
            <Box mt={3}>
              <Typography variant="subtitle2" color="textSecondary" mb={1}>Defined Rules:</Typography>
              <Paper variant="outlined">
                <List dense>
                  {rulesList.map((rule) => (
                    <ListItem
                      key={rule.id}
                      secondaryAction={
                        <IconButton edge="end" color="error" onClick={() => setRulesList(prev => prev.filter(r => r.id !== rule.id))}>
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemText primary={rule.text} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Box>
          )}
        </Box>

        {/* 3. Mempool Filter */}
        <Box mb={4} p={3} border={1} borderRadius={2} borderColor="divider">
          <Typography variant="h6" mb={3} fontWeight="bold" color="primary">
            3. Insert a Contract to monitor
          </Typography>
          <MempoolFilter
            monitoredContracts={monitoredContracts}
            setMonitoredContracts={setMonitoredContracts}
          />
        </Box>

        {/* 4. Block Range */}
        <Box mb={4} p={3} border={1} borderRadius={2} borderColor="divider">
          <Typography variant="h6" mb={3} fontWeight="bold" color="primary">
            4. Define Block Range
          </Typography>
          <Box display="flex" gap={2}>
            <TextField label="From Block" type="number" value={fromBlock} onChange={(e) => setFromBlock(e.target.value)} fullWidth />
            <TextField label="To Block" type="number" value={toBlock} onChange={(e) => setToBlock(e.target.value)} fullWidth />
          </Box>
        </Box>

        {/* 5. EXECUTION & TRACE INSPECTION */}
        <Box mb={4} p={3} border={1} borderRadius={2} borderColor="divider" bgcolor="background.paper">
          <Typography variant="h6" mb={3} fontWeight="bold" color="primary">
            5. Run & Inspect
          </Typography>
          
          <Box display="flex" alignItems="center" gap={4} mb={4}>
            <Button variant="contained" color="success" onClick={startHistoricalMonitor} size="large">
              START HISTORICAL ANALYSIS
            </Button>

            <Box display="flex" alignItems="center" gap={2} borderLeft={1} borderColor="divider" pl={4}>
              <TextField
                label="Step Index"
                type="number"
                size="small"
                value={stepInput}
                onChange={(e) => setStepInput(e.target.value)}
                inputProps={{ min: 1 }}
                sx={{ width: 120 }}
              />
              <Button variant="outlined" color="info" onClick={fetchSpecificStep}>
                FETCH STEP DATA
              </Button>
            </Box>
          </Box>

          {/* Trace Viewer Render */}
          {viewData && viewData.ruleResults ? (
            <Box display="flex" flexDirection="column" gap={4}>
              <Typography variant="subtitle2" color="text.secondary">
                Showing results for {viewData.sourceId} (Step {stepInput})
              </Typography>
              {viewData.ruleResults.map((result, index) => (
                <Box key={index} border={1} borderColor="divider" borderRadius={2} p={2} bgcolor="background.default">
                  <Typography variant="subtitle1" fontWeight="bold" color="primary" mb={2}>
                    Regola: {result.ruleText}
                  </Typography>
                  <TraceViewer
                    compliantData={result.compliant}
                    noncompliantData={result.noncompliant}
                    tempCompliantData={result.tempCompliant}
                    tempNonCompliantData={result.tempNonCompliant}
                    ignoredData={result.ignored}
                    stats={{
                      compliant: result.compliant?.length || 0,
                      noncompliant: result.noncompliant?.length || 0,
                      tempCompliant: result.tempCompliant?.length || 0,
                      tempNonCompliant: result.tempNonCompliant?.length || 0,
                      ignored: result.ignored?.length || 0
                    }}
                    sourceType={viewData.sourceType}
                    sourceId={viewData.sourceId}
                    step={viewData.step}
                    caseColumn={mapping.case_col} 
                  />
                </Box>
              ))}
            </Box>
          ) : (
            <Box textAlign="center" p={4} bgcolor="background.default" borderRadius={1} border={1} borderColor="divider" borderStyle="dashed">
              <Typography variant="body2" color="text.secondary">
                Inserisci un indice e clicca su "Fetch Step Data" per ispezionare le tracce processate.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </SnackbarProvider>
  );
}