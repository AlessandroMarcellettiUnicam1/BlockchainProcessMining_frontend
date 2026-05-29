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
} from "@mui/material";
import { FileUpload } from "@mui/icons-material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useQuery } from "react-query";
import RuleParser from "./CoBlockly/coblockComponents/RuleParser.tsx";
import CoBlocklyEditor from "./CoBlockly/coblockComponents/CoBlocklyEditor.tsx";
import LogMapper from "./CoBlockly/coblockComponents/LogMapper.tsx";
import MempoolFilter from "../components/liveCompliance/MempoolFilter.jsx";
import XesConverter from "../components/liveCompliance/XesConverter.jsx";
import LiveComplianceViewer from "../components/liveCompliance/LiveComplianceViewer.jsx";
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

export default function RealTimeCompliancePage() {
  const [isListening, setIsListening] = useState(false);
  const [eventSource, setEventSource] = useState(null);

  // stati per coblockly e coblock parser
  const [ruleText, setRuleText] = useState("");
  const [parsedRule, setParsedRule] = useState(null);
  const [sessionId, setSessionId] = useState(null); // stato per il sessionId di Redis

  // stati per il contratto per filtrare la mempool
  const [validAddress, setValidAddress] = useState("");
  const [addressFilters, setAddressFilters] = useState("from"); // from, to o both

  // stati per il mapping per la verifica della regola
  const [logColumns, setLogColumns] = useState([]);
  const [logMapping, setLogMapping] = useState({});

  const [mapping, setMapping] = useState({
    case_col: "",
    activity_col: "",
    time_col: "",
  });

  const [simulations, setSimulations] = useState([]);
  const processedHashesRef = useRef(new Set());

  // stato per le transazioni in coda
  const [queueWaiting, setQueueWaiting] = useState(0);

  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [eventSource]);

  const startMonitor = async () => {
    if (!sessionId) return alert("Genera prima il base XES!");

    try {
      if (eventSource) {
        eventSource.close();
        setEventSource(null);
      }
      // reset completo del database e degli stati per la nuova sessione
      await dexieDB.history.clear();
      setSimulations([]);
      processedHashesRef.current.clear();
      setQueueWaiting(0);

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
        const txHash = incomingData.hash;

        if (processedHashesRef.current.has(txHash)) {
          return;
        }

        if (
          incomingData.type === "SIMULATION_RESULT" &&
          incomingData.complianceResult
        ) {
          processedHashesRef.current.add(txHash);

          // Estrazione sicura dei dati
          const c = incomingData.complianceResult.compliant || [];
          const nc = incomingData.complianceResult.noncompliant || [];
          const ign = incomingData.complianceResult.ignored || [];
          const currentStats = {
            compliant: c.length,
            nonCompliant: nc.length,
            ignored: ign.length,
          };

          // Creazione del pacchetto da salvare
          const snapshot = {
            sessionId: incomingData.sessionId,
            hash: incomingData.hash,
            compliantData: c,
            nonCompliantData: nc,
            ignored: ign,
            stats: currentStats,
          };

          await dexieDB.history.add(snapshot);
          setSimulations((prev) => [
            {
              hash: incomingData.hash,
              stats: currentStats,
            },
            ...prev,
          ]); // aggiungo la nuova simulazione in cima alla lista
        } else if (incomingData.type === "QUEUE_STATS") {
          setQueueWaiting(incomingData.waiting);
          return;
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

    try {
      await _stopComplianceMonitoring({ sessionId });
      console.log("Monitoraggio fermato con successo.");
    } catch (err) {
      console.error("Errore durante la chiusura del monitoraggio:", err);
    }
  };

  return (
    <Box p={4}>
      {/* 1. XES Converter */}
      <Box mb={4} p={3} border={1} borderRadius={2} borderColor="grey.300">
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <Typography variant="h6" fontWeight="bold" color="primary">
            1. Upload logs or choose from DB
          </Typography>

          <Tooltip
            title={
              <Box sx={{ whiteSpace: "pre-wrap", fontSize: "0.85rem", p: 0.5 }}>
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
      <Box mb={4} p={3} border={1} borderRadius={2} borderColor="grey.300">
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
      <Box mb={4} p={3} border={1} borderRadius={2} borderColor="grey.300">
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
      <Box mb={4} p={3} border={1} borderRadius={2} borderColor="grey.300">
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

          {isListening && (
            <Box display="flex" alignItems="center" gap={1} ml={2}>
              <CircularProgress size={24} color="primary" />
            </Box>
          )}
        </Box>

        {/* --- STORICO COMPLIANCE --- */}
        <Box mt={4}>
          <Typography variant="h6" mb={2} fontWeight="bold" color="primary">
            Compliance Results
          </Typography>

          {simulations.length === 0 ? (
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
                  ? "Waiting for the first transaction..."
                  : "No transactions checked yet."}
              </Typography>
            </Box>
          ) : (
            simulations.map((sim) => (
              <Accordion
                key={sim.hash}
                sx={{
                  mb: 1,
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                }}
                TransitionProps={{ unmountOnExit: true }}
              >
                {/* Banner della transazione */}
                <AccordionSummary expandMoreIcon={<ExpandMoreIcon />}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    width="100%"
                    pr={2}
                  >
                    <Typography
                      variant="body2"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      Tx: {sim.hash}
                    </Typography>

                    <Box display="flex" gap={2}>
                      <Typography
                        variant="caption"
                        color="success.main"
                        fontWeight="bold"
                      >
                        Compliant: {sim.stats.compliant}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="error.main"
                        fontWeight="bold"
                      >
                        Non-Compliant: {sim.stats.nonCompliant}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Ignored: {sim.stats.ignored}
                      </Typography>
                    </Box>
                  </Box>
                </AccordionSummary>

                {/* Contenuto espanso */}
                <AccordionDetails
                  sx={{
                    bgcolor: "background.paper",
                    borderTop: 1,
                    borderColor: "divider",
                  }}
                >
                  <LazyComplianceViewer hash={sim.hash} />
                </AccordionDetails>
              </Accordion>
            ))
          )}
        </Box>
      </Box>
    </Box>
  );
}

// componente Wrapper per lazy loading dall'indexedDB
function LazyComplianceViewer({ hash }) {
  const [heavyData, setHeavyData] = useState(null);

  useEffect(() => {
    // pessca il json quando apro la tendina
    dexieDB.history
      .where("hash")
      .equals(hash)
      .first()
      .then((snapshot) => {
        if (snapshot) setHeavyData(snapshot);
      });
  }, [hash]);

  // caricamento prima di mostrare il json
  if (!heavyData) {
    return (
      <Box textAlign="center" p={3}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <LiveComplianceViewer
      compliantData={heavyData.compliantData}
      nonCompliantData={heavyData.nonCompliantData}
      stats={heavyData.stats}
    />
  );
}
