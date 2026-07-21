import React, { useState, useEffect, useRef } from "react";
import { isAddress } from "web3-validator";
import {
  Box,
  Typography,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  Tooltip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Snackbar,
  Alert,
} from "@mui/material";
import { FileUpload } from "@mui/icons-material";
import { Switch } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useQuery } from "react-query";
import RuleParser from "./CoBlockly/coblockComponents/RuleParser.tsx";
import CoBlocklyEditor from "./CoBlockly/coblockComponents/CoBlocklyEditor.tsx";
import MempoolFilter from "../components/liveCompliance/MempoolFilter.jsx";
import XesConverter from "../components/liveCompliance/XesConverter.jsx";
import LiveComplianceViewer from "../components/liveCompliance/LiveComplianceViewer.jsx";
import TraceViewer from "../components/liveCompliance/TraceViewer.jsx";
import { HiddenInput } from "../components/HiddenInput";
import { CollectionDropdown } from "../components/dataVisualization/CollectionDropdown";
import {
  _getCollections,
  _getTransactionsFromDb,
  _convertLogsToXes,
  _startComplianceMonitoring,
  _stopComplianceMonitoring,
} from "../api/services.js";
import { CircularProgress } from "@mui/material";
import { dexieDB } from "../dexie.js";
import { SnackbarProvider, enqueueSnackbar } from "notistack";
import { List, ListItem, ListItemText, Paper } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

export default function RealTimeCompliancePage() {
  const [isListening, setIsListening] = useState(false);
  const [eventSource, setEventSource] = useState(null);

  // setup stati
  const [ruleText, setRuleText] = useState("");
  //const [parsedRule, setParsedRule] = useState(null);
  const [rulesList, setRulesList] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  // const [validAddress, setValidAddress] = useState("");
  // const [implAddress, setImplAddress] = useState("");
  const [monitoredContracts, setMonitoredContracts] = useState([]);
  // const [addressFilters, setAddressFilters] = useState("from"); // from, to o both
  const [logMapping, setLogMapping] = useState({
    function: "functionName",
    contract: "contractAddress",
    block: "blockNumber",
    sender: "sender",
    timestamp: "timestamp",
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

  const stepCounterRef = useRef(0);
  const processedHashesRef = useRef(new Set());

  const [latestLiveData, setLatestLiveData] = useState(null);
  const [playbackMode, setPlaybackMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [maxIndex, setMaxIndex] = useState(0);
  const [viewData, setViewData] = useState(null);

  useEffect(() => {
    return () => {
      if (eventSource) eventSource.close();
    };
  }, [eventSource]);

  useEffect(() => {
    if (playbackMode && currentIndex > 0) {
      dexieDB.history
        .where("step")
        .equals(currentIndex)
        .first()
        .then((snapshot) => {
          if (snapshot) setViewData(snapshot);
        });
    }
  }, [currentIndex, playbackMode]);

  useEffect(() => {
    if (playbackMode && latestLiveData && currentIndex === 0) {
      setCurrentIndex(maxIndex);
      setViewData(latestLiveData);
    }
  }, [playbackMode, latestLiveData, maxIndex, currentIndex]);

  const startMonitor = async () => {
    if (!sessionId) return alert("Genera prima il base XES!");

    try {
      if (eventSource) {
        eventSource.close();
        setEventSource(null);
      }

      // reset
      await dexieDB.history.clear();
      setPlaybackMode(false);
      setCurrentIndex(0);
      setMaxIndex(0);
      setLatestLiveData(null);
      setViewData(null);
      processedHashesRef.current.clear();
      stepCounterRef.current = 0;

      await _startComplianceMonitoring({
        sessionId,
        // addressFilters,
        // validAddress,
        // implAddress,
        monitoredContracts,
        mapping,
        parsedRules: rulesList,
        logMapping,
      });

      setIsListening(true);

      const source = new EventSource(
        `http://localhost:8000/api/stream-mempool/${sessionId}`,
      );

      source.onmessage = async (event) => {
        const incomingData = JSON.parse(event.data);

        const txHash = incomingData.hash || `Block_${incomingData.blockNumber}`;
        if (processedHashesRef.current.has(txHash)) return;
        processedHashesRef.current.add(txHash);

        if (
          incomingData.type === "BASELINE_UPDATE" &&
          incomingData.success === false
        ) {
          enqueueSnackbar(
            `Blocco ${incomingData.blockNumber} vuoto, ignorato`,
            { variant: "info" },
          );
          return;
        }

        if (incomingData.complianceResult) {
          stepCounterRef.current += 1;
          const currentStep = stepCounterRef.current;
          const resultsArray = incomingData.complianceResult;

          const snapshot = {
            sessionId: sessionId,
            step: currentStep,
            sourceType: incomingData.type,
            sourceId: txHash,
            ruleResults: resultsArray,
            caseColumn: mapping.case_col,
          };

          await dexieDB.history.add(snapshot);

          setMaxIndex(currentStep);
          setLatestLiveData(snapshot);
          setCurrentIndex((prev) => (playbackMode ? prev : currentStep));

          if (incomingData.type === "BASELINE_UPDATE") {
            enqueueSnackbar(`Blocco ${incomingData.blockNumber} processato`, {
              variant: "success",
            });
          }
        }
      };

      setEventSource(source);
    } catch (err) {
      console.error("Errore avvio monitor:", err);
    }
  };

  const stopMonitor = async () => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }
    setIsListening(false);
    setPlaybackMode(true);

    try {
      await _stopComplianceMonitoring({ sessionId });
      console.log("Monitoraggio fermato.");
    } catch (err) {
      console.error("Errore stop monitoraggio:", err);
    }
  };

  return (
    <SnackbarProvider
      maxSnack={5}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Box p={4}>
        {/* 1. XES Converter */}
        <Box mb={4} p={3} border={1} borderRadius={2} borderColor="divider">
          <Box display="flex" alignItems="center" gap={1} mb={3}>
            <Typography variant="h6" fontWeight="bold" color="primary">
              1. Upload logs or choose from DB
            </Typography>

            <Tooltip
              title={
                <Box
                  sx={{ whiteSpace: "pre-wrap", fontSize: "0.85rem", p: 0.5 }}
                >
                  {`The uploaded log must contain these keys:

{
    "functionName",
    "transactionHash",
    "blockNumber",
    "contractAddress",
    "sender",
    "gasUsed",
    "timestamp",
    "inputs",
    "value",
    "storageState",
    "internalTxs",
    "events"
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
            onConversionSuccess={(newSessionId) => {
              setSessionId(newSessionId);
            }}
          />
        </Box>

        {/* 3. CoBlock Rule */}
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
              <Typography variant="subtitle2" color="textSecondary" mb={1}>
                Defined Rules:
              </Typography>
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

        {/* 4. Mempool Filter */}
        <Box mb={4} p={3} border={1} borderRadius={2} borderColor="divider">
          <Typography variant="h6" mb={3} fontWeight="bold" color="primary">
            3. Insert a Contract to monitor
          </Typography>

          <MempoolFilter
            monitoredContracts={monitoredContracts}
            setMonitoredContracts={setMonitoredContracts}
          />
        </Box>


        {/* 5. LIVE COMPLIANCE AREA */}
        <Box
          mb={4}
          p={3}
          border={1}
          borderRadius={2}
          borderColor="divider"
          bgcolor="background.paper"
        >
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <Button
              variant="contained"
              color="success"
              onClick={startMonitor}
              disabled={isListening || monitoredContracts.length === 0 || !sessionId}
            >
              START LIVE MONITOR
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={stopMonitor}
              disabled={!isListening}
            >
              STOP MONITOR
            </Button>
          </Box>

          {/* --- MODALITÀ LIVE STREAMING --- */}
          {!playbackMode && latestLiveData && latestLiveData.ruleResults && (
            <Box display="flex" flexDirection="column" gap={4}>
              {latestLiveData.ruleResults.map((result, index) => (
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
                    sourceType={latestLiveData.sourceType}
                    sourceId={latestLiveData.sourceId}
                    step={latestLiveData.step}
                    caseColumn={latestLiveData.caseColumn}
                  />
                </Box>
              ))}
            </Box>
          )}

          {/* --- MODALITÀ PLAYBACK (Storico) --- */}
          {playbackMode && viewData && viewData.ruleResults && (
            <Box
              mt={3}
              p={3}
              bgcolor="background.default"
              borderRadius={2}
              border={1}
              borderColor="divider"
            >
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
                p={2}
                bgcolor="background.paper"
                borderRadius={1}
              >
                <Button
                  variant="contained"
                  onClick={() =>
                    setCurrentIndex((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentIndex <= 1}
                >
                  Previous
                </Button>
                <Box textAlign="center">
                  <Typography variant="body1" fontWeight="bold">
                    Rule Checking History
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    Check {currentIndex} of {maxIndex}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  onClick={() =>
                    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1))
                  }
                  disabled={currentIndex >= maxIndex}
                >
                  Next
                </Button>
              </Box>

              {/* Mappiamo i TraceViewer del Playback */}
              <Box display="flex" flexDirection="column" gap={4}>
                {viewData.ruleResults.map((result, index) => (
                  <Box key={index} border={1} borderColor="divider" borderRadius={2} p={2} bgcolor="background.default">
                    <Typography variant="subtitle1" fontWeight="bold" color="primary" mb={2}>
                      Rule: {result.ruleText}
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
                      caseColumn={viewData.caseColumn}
                    />
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Fallback vuoto */}
          {!latestLiveData && maxIndex === 0 && (
            <Box
              textAlign="center"
              p={4}
              bgcolor="background.paper"
              borderRadius={1}
              border={1}
              borderColor="divider"
              borderStyle="dashed"
            >
              <Typography variant="body2" color="text.secondary">
                {isListening
                  ? "Waiting for traces..."
                  : "Monitoring not activatd"}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </SnackbarProvider>
  );
}
