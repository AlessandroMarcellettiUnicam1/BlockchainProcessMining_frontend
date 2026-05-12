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
import { _getCollections, _getTransactionsFromDb } from '../api/services.js';
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
                setTransactionsJson(parsed); // Salviamo il file JSON direttamente nello stato
            } catch (err) {
                console.error("Invalid JSON file");
            }
        };
        if (e.target.files[0]) {
            fileReader.readAsText(e.target.files[0]);
        }
        e.target.value = null;
    };

    return (
        <Box p={4}>
    
            {/* Definizione della regola CoBlock */}
            <Box mb={4} p={3} border={1} borderRadius={2} borderColor="grey.300">
                
                <Typography variant="h6" mb={3} fontWeight="bold" color="primary">
                    1. Define a CoBlock rule
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

            <Box>
                <Typography variant="h6" mb={3} fontWeight="bold" color="primary">
                    2. Upload logs or choose from DB
                </Typography>

                <FormControl mb={2}>
                    <RadioGroup
                        row
                        value={dataSource}
                        onChange={(e) => setDataSource(e.target.value)}
                    >
                        <FormControlLabel value="file" control={<Radio />} label="JSON File" />
                        <FormControlLabel value="database" control={<Radio />} label="Database" />
                    </RadioGroup>
                </FormControl>

                <Box mt={2}>
                    {dataSource === "file" && (
                        <Button
                            component="label"
                            variant="contained"
                            startIcon={<FileUpload />}
                            sx={{ padding: 1, height: "55px" }}
                        >
                            Upload File
                            <HiddenInput type="file" onChange={handleFileChange} />
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
                        ✓ {transactionsJson.length} transactions loaded in memory and ready for conversion.
                    </Typography>
                )}
                
            </Box>
            
        </Box>
    );
}