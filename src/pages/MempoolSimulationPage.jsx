import React, { useState } from 'react';
import { Box, Typography, Button, TextField, CircularProgress, Divider, Paper } from '@mui/material';
import MempoolTable from '../components/simulation/MempoolTable';
import SimulationResultsTable from '../components/simulation/SimulationResultsTable';
import { _getMempoolTxs, _simulateMempoolTxs } from '../api/services'; 
import { FilterList } from "@mui/icons-material";
import { IconButton, Badge, Tooltip } from "@mui/material";
import MempoolFilterDialog from '../components/simulation/MempoolFilterDialog';

const MempoolSimulationPage = () => {
    const [limit, setLimit] = useState(100);
    const [isFetching, setIsFetching] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);

    const [mempoolTxs, setMempoolTxs] = useState([]);
    const [selectedHashes, setSelectedHashes] = useState([]);
    const [simulationResults, setSimulationResults] = useState([]);

    const [openFilters, setOpenFilters] = useState(false);
    const [currentFilters, setCurrentFilters] = useState({
        active: { gas: false, gasPrice: false, from: false, to: false, functions: false },
        values: { gasLimit: [], gasPrice: [], fromList: [], toList: [], functionList: [] }
    });

    const handleFetchMempool = async () => {
        if (limit > 500) return alert("Il limite massimo è 500 transazioni.");
        
        setIsFetching(true);
        setSelectedHashes([]); 
        setSimulationResults([]); 
        
        const response = await _getMempoolTxs(limit);
        
        if (response.status === 200 && response.data.success) {
            setMempoolTxs(response.data.data);
        } else {
            console.error("Errore fetch:", response);
            alert("Impossibile recuperare la mempool.");
        }
        setIsFetching(false);
    };

    const handleSimulate = async () => {
        if (selectedHashes.length === 0) return;
        
        setIsSimulating(true);
        const txsToSimulate = mempoolTxs.filter(tx => selectedHashes.includes(tx.hash));
        
        const response = await _simulateMempoolTxs(txsToSimulate);
        
        if (response.status === 200 && response.data.success) {
            setSimulationResults(response.data.data);
        } else {
            console.error("Errore simulazione:", response);
            alert("La simulazione è fallita.");
        }
        setIsSimulating(false);
    };


    const filteredMempoolTxs = mempoolTxs.filter(tx => {
        const { active, values } = currentFilters;

        if (active.gas) {
            const gas = Number(tx.gas || 0);
            if (gas < values.gasLimit[0] || gas > values.gasLimit[1]) return false;
        }

        if (active.gasPrice) {
            const price = Number(tx.gasPrice || tx.maxFeePerGas || 0);
            if (price < values.gasPrice[0] || price > values.gasPrice[1]) return false;
        }

        if (active.from) {
            if (!tx.from || !values.fromList.includes(tx.from.toLowerCase())) return false;
        }

        if (active.to) {
            if (!tx.to || !values.toList.includes(tx.to.toLowerCase())) return false;
        }

        if (active.functions) {
            const txData = tx.input || tx.data || "0x";
        
            const matchFound = values.functionList.some(methodId => 
                txData.toLowerCase().startsWith(methodId)
            );

            if (!matchFound) return false;
        }

        return true; 
    });

// Calcolo per il numerino rosso sul bottone filtri
const activeFilterCount = Object.values(currentFilters.active).filter(Boolean).length;

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
            <Typography variant="h4" gutterBottom fontWeight="bold">
                Mempool Simulation and Analysis
            </Typography>

            <Paper elevation={2} sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', mb: 4 }}>
                <TextField 
                    label="Number of transactions" 
                    type="number" 
                    variant="outlined" 
                    size="small"
                    value={limit}
                    onChange={(e) => {
                        const val = e.target.value;
        
                        if (val === '') {
                            setLimit('');
                        } 

                        else if (Number(val) > 500) {
                            setLimit(500);
                        } 
                        else {
                            setLimit(Number(val));
                        }
                    }}
                    inputProps={{ max: 500, min: 1 }}
                    sx={{ minWidth: '220px' }}
                />
                <Button 
                    variant="contained" 
                    onClick={handleFetchMempool} 
                    disabled={isFetching || isSimulating}
                >
                    {isFetching ? <CircularProgress size={24} /> : "Fetch From Mempool"}
                </Button>

                <Divider orientation="vertical" flexItem />

                <Tooltip title="Filter Transactions">
                    <IconButton 
                        onClick={() => setOpenFilters(true)} 
                        disabled={mempoolTxs.length === 0}
                        sx={{ color: activeFilterCount > 0 ? "#ffb703" : "action.active" }}
                    >
                        <Badge badgeContent={activeFilterCount} color="error">
                            <FilterList fontSize="large" />
                        </Badge>
                    </IconButton>
                </Tooltip>

                <Divider orientation="vertical" flexItem />

                <Button 
                    variant="contained" 
                    color="secondary"
                    onClick={handleSimulate} 
                    disabled={selectedHashes.length === 0 || isSimulating || isFetching}
                >
                    {isSimulating ? <CircularProgress size={24} color="inherit" /> : `Simulate Selected (${selectedHashes.length})`}
                </Button>
            </Paper>

            <MempoolFilterDialog 
                open={openFilters} 
                onClose={() => setOpenFilters(false)} 
                onFiltersUpdate={setCurrentFilters} 
            />

            {/* TABELLA MEMPOOL */}
            {mempoolTxs.length > 0 && simulationResults.length === 0 && (
                <MempoolTable 
                    transactions={filteredMempoolTxs} 
                    selectedHashes={selectedHashes}
                    setSelectedHashes={setSelectedHashes}
                />
            )}

            {/* TABELLA RISULTATI SIMULAZIONE */}
            {simulationResults.length > 0 && (
                <SimulationResultsTable results={simulationResults} />
            )}
        </Box>
    );
};

export default MempoolSimulationPage;