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
} from "@mui/material";
import { FileUpload } from "@mui/icons-material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
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

  // stati per visualizzatore live
  const [latestLiveData, setLatestLiveData] = useState(null); // Dati per la visualizzazione Live
  const [playbackMode, setPlaybackMode] = useState(false); // Flag Modalità Navigazione
  const [currentIndex, setCurrentIndex] = useState(0); // Cursore temporale
  const [maxIndex, setMaxIndex] = useState(0); // Max step raggiunti
  const [viewData, setViewData] = useState(null); // Dati caricati da IndexedDB per il Playback
  const processedHashesRef = useRef(new Set());
  const stepCounterRef = useRef(0);

  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [eventSource]);

  useEffect(() => {
    if (playbackMode && currentIndex > 0) {
      dexieDB.history.where('step').equals(currentIndex).first().then((snapshot) => {
        if (snapshot) setViewData(snapshot);
      });
    }
  }, [currentIndex, playbackMode]);

  const startMonitor = async () => {
    if (!sessionId) return alert("Genera prima il base XES!");

    try {

      if (eventSource) {
        eventSource.close();
        setEventSource(null);
      }
      // 1. Reset completo del database e degli stati per la nuova sessione
      await dexieDB.history.clear();
      setPlaybackMode(false);
      setCurrentIndex(0);
      setMaxIndex(0);
      setLatestLiveData(null);
      setViewData(null);
      processedHashesRef.current.clear();
      stepCounterRef.current = 0;

      // 2. Chiamata API standardizzata tramite servizi
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
          stepCounterRef.current += 1;
          const currentStep = stepCounterRef.current;

          // Estrazione sicura dei dati
          const c = incomingData.complianceResult.compliant || [];
          const nc = incomingData.complianceResult.noncompliant || [];
          const currentStats = {
            compliant: c.length,
            nonCompliant: nc.length,
            ignored: 0,
          };

          // Creazione del pacchetto da salvare
          const snapshot = {
            sessionId: incomingData.sessionId,
            hash: incomingData.hash,
            step: currentStep,
            compliantData: c,
            nonCompliantData: nc,
            stats: currentStats,
          };

          // Salvataggio asincrono su disco (IndexedDB)
          await dexieDB.history.add(snapshot);

          // Aggiornamento della UI Live (Tailing dell'ultimo evento)
          setMaxIndex(currentStep);
          setLatestLiveData({
            hash: incomingData.hash,
            compliantData: c,
            nonCompliantData: nc,
            stats: currentStats,
          });
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

    // Attivazione automatica del Playback all'ultimo frame disponibile
    setPlaybackMode(true);
    setCurrentIndex(maxIndex);

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
          2. XES mapping
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
      <Box mb={4} p={3} border={1} borderRadius={2} borderColor="grey.300">
        <Box display="flex" gap={2} mb={3}>
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

        {/* --- MODALITÀ LIVE --- */}
        {isListening && latestLiveData && (
          <Box
            mt={3}
            p={2}
            bgcolor="grey.50"
            borderRadius={2}
            border={1}
            borderColor="success.light"
          >
            <Typography
              variant="subtitle1"
              color="success.main"
              fontWeight="bold"
              mb={1}
            >
              🔴 LIVE STREAMING - Ultima Transazione Analizzata
            </Typography>
            <Typography variant="caption" display="block" mb={2}>
              Hash: {latestLiveData.hash}
            </Typography>

            <LiveComplianceViewer
              compliantData={latestLiveData.compliantData}
              nonCompliantData={latestLiveData.nonCompliantData}
              stats={latestLiveData.stats}
            />
          </Box>
        )}

        {/* --- MODALITÀ PLAYBACK --- */}
        {playbackMode && viewData && maxIndex > 0 && (
          <Box
            mt={3}
            p={2}
            bgcolor="info.50"
            borderRadius={2}
            border={1}
            borderColor="info.light"
          >
            <Typography
              variant="subtitle1"
              color="primary.main"
              fontWeight="bold"
              mb={2}
            >
              ⏸ STORICO COMPLIANCE (Playback)
            </Typography>

            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={3}
              p={2}
              bgcolor="white"
              borderRadius={1}
            >
              <Button
                variant="contained"
                onClick={() => setCurrentIndex((prev) => Math.max(1, prev - 1))}
                disabled={currentIndex <= 1}
              >
                ⬅️ Precedente
              </Button>

              <Box textAlign="center">
                <Typography variant="body1" fontWeight="bold">
                  Step {currentIndex} di {maxIndex}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Hash: {viewData.hash}
                </Typography>
              </Box>

              <Button
                variant="contained"
                onClick={() =>
                  setCurrentIndex((prev) => Math.min(maxIndex, prev + 1))
                }
                disabled={currentIndex >= maxIndex}
              >
                Successivo ➡️
              </Button>
            </Box>

            <LiveComplianceViewer
              compliantData={viewData.compliantData}
              nonCompliantData={viewData.nonCompliantData}
              stats={viewData.stats}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
