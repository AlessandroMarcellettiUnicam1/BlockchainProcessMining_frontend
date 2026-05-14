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
    InputLabel
} from '@mui/material';
import { FileUpload } from "@mui/icons-material";
import { useQuery } from "react-query";
import RuleParser from './CoBlockly/coblockComponents/RuleParser.tsx';
import CoBlocklyEditor from './CoBlockly/coblockComponents/CoBlocklyEditor.tsx';
import { _getCollections, _getTransactionsFromDb, _convertLogsToXes } from '../api/services.js';
import { HiddenInput } from "../components/HiddenInput"; 
import { CollectionDropdown } from "../components/dataVisualization/CollectionDropdown"; 


export default function RealTimeCompliancePage() {

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
        queryFn: _getCollections 
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
                xes_name: "base_log_session" 
            };
            
            const response = await _convertLogsToXes(payload);
            setSessionId(response.sessionId); 
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

    return (
        <Box p={4}>
            <Box mb={4} p={3} border={1} borderRadius={2} borderColor="grey.300">
                <Typography variant="h6" mb={3} fontWeight="bold" color="primary">
                    1. Upload logs or choose from DB
                </Typography>

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
                    2. Define a CoBlock rule
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
                    3. Insert an address to filter the mempool
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

            
        </Box>
    );
}