import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Typography, 
    FormControl, 
    RadioGroup, 
    FormControlLabel, 
    Radio,
    Button 
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

    const handleConfirmAndConvert = async () => {
        setIsConverting(true);
        try {

            // normalizzazione dell'array json
            let cleanData = transactionsJson;

            if (cleanData && cleanData.data) {
                cleanData = cleanData.data;
            }

            if (!Array.isArray(cleanData)) {
                cleanData = [cleanData];
            }

            // payload con mapping standard 
            const payload = {
                data: cleanData, 
                case_col: "transactionHash", 
                activity_col: "functionName",
                time_col: "timestamp",
                xes_name: "base_log_session" 
            };
            
            const response = await _convertLogsToXes(payload);
            setSessionId(response.sessionId); 
            alert("Conversione XES completata! Session ID: " + response.sessionId);
        } catch (error) {
            console.error("Errore durante la conversione", error);
            alert("Errore durante la conversione");
        } finally {
            setIsConverting(false);
        }
    };

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
                    <Typography variant="body2" color="success.main" mt={2}>
                        ✓ Transactions loaded and ready for conversion.
                    </Typography>
                )}

                <Box mt={3}>
                    <Button
                        variant="contained"
                        color="primary"
                        disabled={isConverting || !transactionsJson || transactionsJson.length === 0}
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

            
        </Box>
    );
}