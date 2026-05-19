import React, { useState, useEffect } from "react";
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
import {
  _getCollections,
  _getTransactionsFromDb,
  _convertLogsToXes,
  _startComplianceMonitoring,
  _stopComplianceMonitoring,
} from "../api/services.js";
import { HiddenInput } from "../components/HiddenInput";
import { CollectionDropdown } from "../components/dataVisualization/CollectionDropdown";

export default function RealTimeCompliancePage() {
  // stati per ascoltare dinamicamente le transazioni
  const [liveTxs, setLiveTxs] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [eventSource, setEventSource] = useState(null);

  // stati per coblockly e coblock parser
  const [ruleText, setRuleText] = useState("");
  const [parsedRule, setParsedRule] = useState(null);

  const [isConverting, setIsConverting] = useState(false); // stato per la conversione in xes base
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

  const startMonitor = async () => {
    if (!sessionId) return alert("Genera prima il base XES!");

    try {
      // 1. Chiamata API standardizzata tramite servizi
      await _startComplianceMonitoring({
        sessionId,
        addressFilters,
        validAddress,
        mapping,
        parsedRule,
        logMapping,
      });

      setIsListening(true);
      setLiveTxs([]);

      // apertura del canale in tempo reale SSE (questo rimane qui perché è nativo del browser)
      // Se hai una variabile globale per l'host, puoi sostituire "http://localhost:8000"
      const source = new EventSource(
        `http://localhost:8000/api/stream-mempool/${sessionId}`,
      );

      // TODO: metti un limite altimeti si satura la RAM.
      source.onmessage = (event) => {
        const incomingData = JSON.parse(event.data);
        
        // Accetta solo i messaggi elaborati e inviati dal Worker
        if (incomingData.type === 'SIMULATION_RESULT') {
          setLiveTxs((prev) => [incomingData, ...prev].slice(0, 50));
        }
      };

      setEventSource(source);
    } catch (err) {
      console.error("Errore avvio monitor:", err);
    }
  };

  const stopMonitor = async () => {
    // chiude immediatamente il canale Server-Sent Events (SSE) lato frontend
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }

    // Sblocca i pulsanti della UI
    setIsListening(false);

    // invia il comando di spegnimento al backend tramite servizi
    try {
      await _stopComplianceMonitoring({ sessionId });
      console.log("Monitoraggio e WebSocket fermati con successo.");
    } catch (err) {
      console.error("Errore durante la chiusura del monitoraggio:", err);
      alert(
        "Il monitoraggio si è fermato nel browser, ma potrebbe esserci un errore nel server.",
      );
    }
  };

  return (
    <Box p={4}>
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

        {/* VISUALIZZAZIONE GREZZA DELLE TRANSAZIONI */}
        {liveTxs.length > 0 && (
          <Box
            mt={3}
            p={2}
            bgcolor="grey.100"
            borderRadius={2}
            maxHeight="500px" // Aumentato leggermente lo spazio per JSON più lunghi
            overflow="auto"
          >
            <Typography variant="subtitle2" color="textSecondary" mb={2}>
              Transazioni Simulate: {liveTxs.length}
            </Typography>

            {liveTxs.map((tx, idx) => (
              <Box
                key={idx}
                p={2}
                mb={2}
                bgcolor="white"
                border={1}
                borderColor="grey.300"
                borderRadius={1}
              >
                <Typography
                  variant="caption"
                  color="primary"
                  fontWeight="bold"
                  display="block"
                  mb={1}
                >
                  Hash: {tx.hash} | Target: {tx.target}
                </Typography>
                <pre
                  style={{ margin: 0, fontSize: "0.75rem", overflowX: "auto" }}
                >
                  {/* Stampiamo interamente i dati risultanti dalla simulazione */}
                  {JSON.stringify(tx.simulationData, null, 2)}
                </pre>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
