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
import LogMapper from "./CoBlockly/coblockComponents/LogMapper.tsx";
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

export default function RealTimeCompliancePage() {
  const [isListening, setIsListening] = useState(false);
  const [eventSource, setEventSource] = useState(null);

  // setup stati
  const [ruleText, setRuleText] = useState("");
  const [parsedRule, setParsedRule] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [validAddress, setValidAddress] = useState("");
  const [addressFilters, setAddressFilters] = useState("from"); // from, to o both
  const [logColumns, setLogColumns] = useState([]);
  const [logMapping, setLogMapping] = useState({});
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
        addressFilters,
        validAddress,
        mapping,
        parsedRule,
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
          const delta = incomingData.complianceResult;

          const currentStats = {
            compliant: (delta.compliant || []).length,
            nonCompliant: (delta.noncompliant || []).length,
            ignored: (delta.ignored || []).length,
          };

          const snapshot = {
            sessionId: sessionId,
            step: currentStep,
            sourceType: incomingData.type,
            sourceId: txHash,
            compliantData: delta.compliant || [],
            nonCompliantData: delta.noncompliant || [],
            ignoredData: delta.ignored || [],
            stats: currentStats,
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
            onConversionSuccess={(newSessionId, columns) => {
              setSessionId(newSessionId);
              setLogColumns(columns);
            }}
          />
        </Box>

        {/* 2. XES Mapping */}
        <Box mb={4} p={3} border={1} borderRadius={2} borderColor="divider">
          <Typography variant="h6" mb={3} fontWeight="bold" color="primary">
            2. CoBlock mapping
          </Typography>

          {logColumns.length > 0 ? (
            <LogMapper columns={logColumns} onMappingChange={setLogMapping} />
          ) : (
            <Typography variant="body2" color="textSecondary">
              Upload log first
            </Typography>
          )}
        </Box>

        {/* 3. CoBlock Rule */}
        <Box mb={4} p={3} border={1} borderRadius={2} borderColor="divider">
          <Typography variant="h6" mb={3} fontWeight="bold" color="primary">
            3. Define a CoBlock rule
          </Typography>

          <CoBlocklyEditor onRuleTranslated={setRuleText} />

          <RuleParser
            ruleText={ruleText}
            setRuleText={setRuleText}
            onRuleParsed={setParsedRule}
          />

          {parsedRule && (
            <Typography variant="body2" color="success.main" mt={1}>
              ✓ Rule parsed and saved in page memory.
            </Typography>
          )}
        </Box>

        {/* 4. Mempool Filter */}
        <Box mb={4} p={3} border={1} borderRadius={2} borderColor="divider">
          <Typography variant="h6" mb={3} fontWeight="bold" color="primary">
            4. Insert an address to filter the mempool
          </Typography>

          <MempoolFilter
            validAddress={validAddress}
            setValidAddress={setValidAddress}
            addressFilters={addressFilters}
            setAddressFilters={setAddressFilters}
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
              disabled={isListening || !validAddress || !sessionId}
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
          {!playbackMode && latestLiveData && (
            <TraceViewer
              compliantData={latestLiveData.compliantData}
              nonCompliantData={latestLiveData.nonCompliantData}
              ignoredData={latestLiveData.ignoredData}
              stats={latestLiveData.stats}
              sourceType={latestLiveData.sourceType}
              sourceId={latestLiveData.sourceId}
              step={latestLiveData.step}
              caseColumn={latestLiveData.caseColumn}
            />
          )}

          {/* --- MODALITÀ PLAYBACK (Storico) --- */}
          {playbackMode && viewData && (
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

              <TraceViewer
                compliantData={viewData.compliantData}
                nonCompliantData={viewData.nonCompliantData}
                ignoredData={viewData.ignoredData}
                stats={viewData.stats}
                sourceType={viewData.sourceType}
                sourceId={viewData.sourceId}
                step={viewData.step}
                caseColumn={viewData.caseColumn}
              />
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
                  ? "Waiting for mempool transactions or new blocks..."
                  : "No simulation activated"}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </SnackbarProvider>
  );
}
