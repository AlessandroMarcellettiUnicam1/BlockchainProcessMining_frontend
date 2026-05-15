import React, { useState, useEffect } from 'react';
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
    IconButton
} from '@mui/material';
import { FileUpload } from "@mui/icons-material";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useQuery } from "react-query";
import RuleParser from './CoBlockly/coblockComponents/RuleParser.tsx';
import CoBlocklyEditor from './CoBlockly/coblockComponents/CoBlocklyEditor.tsx';
import LogMapper from './CoBlockly/coblockComponents/LogMapper.tsx';
import { _getCollections, _getTransactionsFromDb, _convertLogsToXes } from '../api/services.js';
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

    // stati per la scelta delle collection dal db o tramite json
    const [dataSource, setDataSource] = useState("database");
    const [selectedCollections, setSelectedCollections] = useState([]);
    const [query, setQuery] = useState({});
    const [transactionsJson, setTransactionsJson] = useState(null);

    const [isConverting, setIsConverting] = useState(false); // stato per la conversione in xes base
    const [sessionId, setSessionId] = useState(null); // stato per il sessionId di Redis

    // stati per il contratto per filtrare la mempool
    const [inputAddress, setInputAddress] = useState("");
    const [validAddress, setValidAddress] = useState("");
    const [addressFilters, setAddressFilters] = useState("from") // from, to o both
    const [addressError, setAddressError] = useState(false);

    // stati per il mapping
    const [logColumns, setLogColumns] = useState([]);
    const [logMapping, setLogMapping] = useState({});

    // costanti per il mapping di conversione
    const jsonKeys = [
        "functionName", "transactionHash", "blockNumber", "contractAddress",
        "sender", "gasUsed", "timestamp", "inputs", "value",
        "storageState", "internalTxs", "events"
    ];

    const [mapping, setMapping] = useState({
        case_col: "",
        activity_col: "",
        time_col: ""
    });

    const { isLoading: isLoadingCollections, data: collections, isError } = useQuery({
        queryKey: ["collections"],
        queryFn: _getCollections,
        refetchOnWindowFocus: false, // Disabilita il refetch al cambio scheda
        staleTime: Infinity          // Considera i dati sempre validi (non fa refetch automatici)
    });

    const { data: dbResults } = useQuery({
        queryKey: ["dbData", query],
        queryFn: () => _getTransactionsFromDb(query), 
        enabled: dataSource === "database" && query.selectedCollection?.length > 0
    });

    useEffect(() => {
        if (dbResults) {
            setTransactionsJson(dbResults);
        }
    }, [dbResults]);

    const handleFileChange = (e) => {
        const fileReader = new FileReader();
        fileReader.onload = (event) => {
            const content = event.target.result;
            try {
                const parsed = JSON.parse(content);
                setTransactionsJson(parsed); 
            } catch (err) {
                console.error("Invalid JSON file");
            }
        };
        if (e.target.files[0]) {
            fileReader.readAsText(e.target.files[0]);
        }
        e.target.value = null;
    };

    const handleMappingChange = (field) => (event) => {
        setMapping({ ...mapping, [field]: event.target.value });
    };

    const handleConfirmAndConvert = async () => {
        setIsConverting(true);
        try {

            // normalizzazione dell'array json
            let cleanData = transactionsJson;
            if (cleanData && cleanData.data) { cleanData = cleanData.data; }
            if (!Array.isArray(cleanData)) { cleanData = [cleanData]; }

            // payload con mapping standard 
            const payload = {
                data: cleanData, 
                case_col: mapping.case_col, 
                activity_col: mapping.activity_col,
                time_col: mapping.time_col,
                xes_name: "base_log_session",
                previousSessionId: sessionId
            };
            
            const response = await _convertLogsToXes(payload);

            setSessionId(response.sessionId); 
            setLogColumns(response.columns);

            alert("Conversione XES completata. Session ID: " + response.sessionId);
        } catch (error) {
            console.error("Errore durante la conversione", error);
            alert("Errore durante la conversione");
        } finally {
            setIsConverting(false);
        }
    };

    // funzione per validare l'indirizzo inserito in input dall'utente per filtrare sulla mempool
    const handleConfirmAddress = async () => {
        if (isAddress(inputAddress)) {
            setValidAddress(inputAddress.toLowerCase());
            setAddressError(false);
        } 
        else {
            setValidAddress("");
            setAddressError(true);
        }
    }

    //OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO

    const startMonitor = async () => {
        if (!sessionId) return alert("Genera prima il base XES!");
        
        try {
            // 1. Chiami il tuo endpoint originale per far partire il Listener Node.js
            await fetch('http://localhost:8000/api/start-compliance-monitoring', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId, addressFilters, validAddress: inputAddress, mapping, parsedRule
                })
            });

            setIsListening(true);
            setLiveTxs([]); // Pulisce le tx precedenti

            // 2. Apri il canale in tempo reale SSE
            const source = new EventSource(`http://localhost:8000/api/stream-mempool/${sessionId}`);
            
            source.onmessage = (event) => {
                const newTx = JSON.parse(event.data);
                // Aggiunge la nuova transazione in cima alla lista
                setLiveTxs((prev) => [newTx, ...prev]); 
            };

            setEventSource(source);

        } catch (err) {
            console.error("Errore avvio monitor:", err);
        }
    };

    const stopMonitor = async () => {
        // 1. Chiude immediatamente il canale Server-Sent Events (SSE) lato frontend
        if (eventSource) {
            eventSource.close(); 
            setEventSource(null);
        }
        
        // Sblocca i pulsanti della UI
        setIsListening(false);
        
        // 2. Invia il comando di spegnimento al backend
        try {
            const response = await fetch('http://localhost:8000/api/stop-compliance-monitoring', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId })
            });

            if (!response.ok) {
                throw new Error("Errore durante lo spegnimento lato server");
            }

            console.log("Monitoraggio e WebSocket fermati con successo.");
        } catch (err) {
            console.error("Errore durante la chiusura del monitoraggio:", err);
            alert("Il monitoraggio si è fermato nel browser, ma potrebbe esserci un errore nel server.");
        }
    };

    return (
        <Box p={4}>
            <Box mb={4} p={3} border={1} borderRadius={2} borderColor="grey.300">
                <Box display="flex" alignItems="center" mb={3}>
                    <Typography variant="h6" fontWeight="bold" color="primary">
                        1. Upload logs or choose from DB
                    </Typography>
                    
                    {/* Tooltip con il formato JSON */}
                    <Tooltip 
                        title={
                            <Box sx={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', p: 0.5 }}>
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
}`
        
        }
                            </Box>
                        } 
                        placement="right" 
                        arrow
                    >
                        <IconButton size="small" sx={{ ml: 1, color: 'text.secondary' }}>
                            <InfoOutlinedIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>

                <FormControl mb={2}>
                    <RadioGroup row value={dataSource} onChange={(e) => setDataSource(e.target.value)}>
                        <FormControlLabel value="file" control={<Radio />} label="JSON File" />
                        <FormControlLabel value="database" control={<Radio />} label="Database" />
                    </RadioGroup>
                </FormControl>

                <Box mt={2}>
                    {dataSource === "file" && (
                        <Button component="label" variant="contained" startIcon={<FileUpload />}>
                            Upload File 
                            <HiddenInput 
                                type="file" 
                                accept=".json, application/json"
                                onChange={handleFileChange} />
                        </Button>
                    )}

                    {dataSource === "database" && (
                        <CollectionDropdown
                            selectedCollections={selectedCollections}
                            setSelectedCollections={setSelectedCollections}
                            collections={collections}
                            query={query}
                            setQueryState={setQuery}
                        />
                    )}
                </Box>

                {transactionsJson && (
                    <Box mt={3}>
                        <Typography variant="body2" color="success.main" mb={2}>
                            ✓ Transactions loaded
                        </Typography>

                        <Box display="flex" gap={2} mb={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Case Id</InputLabel>
                                <Select 
                                    value={mapping.case_col} 
                                    label="Case Id" 
                                    onChange={handleMappingChange('case_col')}
                                >
                                    {jsonKeys.map(key => (
                                        <MenuItem key={key} value={key}>{key}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth size="small">
                                <InputLabel>Activity Key</InputLabel>
                                <Select 
                                    value={mapping.activity_col} 
                                    label="Activity Key" 
                                    onChange={handleMappingChange('activity_col')}
                                >
                                    {jsonKeys.map(key => (
                                        <MenuItem key={key} value={key}>{key}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth size="small">
                                <InputLabel>Timestamp</InputLabel>
                                <Select 
                                    value={mapping.time_col} 
                                    label="Timestamp" 
                                    onChange={handleMappingChange('time_col')}
                                >
                                    {jsonKeys.map(key => (
                                        <MenuItem key={key} value={key}>{key}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>
                )}

                <Box mt={3}>
                    <Button
                        variant="contained"
                        color="primary"
                        disabled={
                            isConverting || 
                            !transactionsJson || 
                            transactionsJson.length === 0 || 
                            !mapping.case_col || 
                            !mapping.activity_col || 
                            !mapping.time_col
                        }
                        onClick={handleConfirmAndConvert}
                    >
                        {isConverting ? "Converting..." : "Generate base XES"}
                    </Button>
                </Box>
            </Box>

            <Box mb={4} p={3} border={1} borderRadius={2} borderColor="grey.300">
                <Typography variant="h6" mb={3} fontWeight="bold" color="primary">
                    2. XES mapping
                </Typography>

                {logColumns.length > 0 ? (
                    <LogMapper 
                        columns={logColumns} 
                        onMappingChange={setLogMapping} 
                    />
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

                <Box display="flex" alignItems="flex-start" gap={2} mb={3}>
                    <TextField 
                        label="Contract Address" 
                        variant="outlined" 
                        fullWidth
                        value={inputAddress}
                        onChange={(e) => setInputAddress(e.target.value)}
                        error={addressError} 
                        helperText={addressError ? "Invalid EVM Address (Must be 0x... and 42 chars)" : "Enter a valid 0x... address"}
                    />
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={handleConfirmAddress}
                        disabled={!inputAddress} 
                        sx={{ height: '56px' }}
                    >
                        Confirm
                    </Button>
                </Box>

                <FormControl>
                    <Typography variant="body2" color="textSecondary" mb={1}>Filter Direction:</Typography>
                    <RadioGroup row value={addressFilters} onChange={(e) => setAddressFilters(e.target.value)}>
                        <FormControlLabel value="from" control={<Radio />} label="From" />
                        <FormControlLabel value="to" control={<Radio />} label="To" />
                        <FormControlLabel value="both" control={<Radio />} label="Both" />
                    </RadioGroup>
                </FormControl>

                {validAddress && (
                    <Typography variant="body2" color="success.main" mt={2}>
                        ✓ Filter locked: Listening for transactions {addressFilters === 'both' ? 'to/from' : addressFilters} {validAddress.substring(0,6)}...{validAddress.substring(38)}
                    </Typography>
                )}
                
            </Box>

                { /* Bottone per avviare il monitor automatico che avvia mempool listenere e worker indipendente */}
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
                    <Box mt={3} p={2} bgcolor="grey.100" borderRadius={2} maxHeight="400px" overflow="auto">
                        <Typography variant="subtitle2" color="textSecondary" mb={2}>
                            Transazioni catturate: {liveTxs.length}
                        </Typography>
                        
                        {liveTxs.map((tx, idx) => (
                            <Box key={idx} p={2} mb={2} bgcolor="white" border={1} borderColor="grey.300" borderRadius={1}>
                                <pre style={{ margin: 0, fontSize: '0.75rem', overflowX: 'auto' }}>
                                    {JSON.stringify({ hash: tx.hash, from: tx.from, to: tx.to, value: tx.value }, null, 2)}
                                </pre>
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>

            
        </Box>
    );
}