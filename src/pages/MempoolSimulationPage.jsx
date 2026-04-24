import React, { useState } from 'react';
import { Box, Typography, Button, TextField, CircularProgress, Divider, Paper } from '@mui/material';
import MempoolTable from '../components/simulation/MempoolTable';
import SimulationResultsTable from '../components/simulation/SimulationResultsTable';
import { _getMempoolTxs, _simulateMempoolTxs } from '../api/services'; 

const MempoolSimulationPage = () => {
    // Stati Generali
    const [limit, setLimit] = useState(100);
    const [isFetching, setIsFetching] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);

    // Stati dei Dati
    const [mempoolTxs, setMempoolTxs] = useState([]);
    const [selectedHashes, setSelectedHashes] = useState([]);
    const [simulationResults, setSimulationResults] = useState([]);

    // 1. Estrazione dalla Mempool
    const handleFetchMempool = async () => {
        if (limit > 500) return alert("Il limite massimo è 500 transazioni.");
        
        setIsFetching(true);
        setSelectedHashes([]); // Resetta le selezioni precedenti
        setSimulationResults([]); // Resetta i risultati precedenti
        
        const response = await _getMempoolTxs(limit);
        
        if (response.status === 200 && response.data.success) {
            setMempoolTxs(response.data.data);
        } else {
            console.error("Errore fetch:", response);
            alert("Impossibile recuperare la mempool.");
        }
        setIsFetching(false);
    };

    // 2. Simulazione del Batch Selezionato
    const handleSimulate = async () => {
        if (selectedHashes.length === 0) return;
        
        setIsSimulating(true);
        // Filtriamo l'array originale per prendere solo gli oggetti interi delle tx selezionate
        const txsToSimulate = mempoolTxs.filter(tx => selectedHashes.includes(tx.hash));
        
        const response = await _simulateMempoolTxs(txsToSimulate);
        
        if (response.status === 200 && response.data.success) {
            setSimulationResults(response.data.data);
        } else {
            console.error("Errore simulazione:", response);
            alert("La simulazione batch è fallita.");
        }
        setIsSimulating(false);
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
            <Typography variant="h4" gutterBottom fontWeight="bold">
                Analisi e Simulazione Mempool
            </Typography>

            {/* ACTION BAR: Controlli per input e avvio */}
            <Paper elevation={2} sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', mb: 4 }}>
                <TextField 
                    label="Numero di Transazioni" 
                    type="number" 
                    variant="outlined" 
                    size="small"
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    inputProps={{ max: 500, min: 1 }}
                />
                <Button 
                    variant="contained" 
                    onClick={handleFetchMempool} 
                    disabled={isFetching || isSimulating}
                >
                    {isFetching ? <CircularProgress size={24} /> : "Estrai dalla Mempool"}
                </Button>

                <Divider orientation="vertical" flexItem />

                <Button 
                    variant="contained" 
                    color="secondary"
                    onClick={handleSimulate} 
                    disabled={selectedHashes.length === 0 || isSimulating || isFetching}
                >
                    {isSimulating ? <CircularProgress size={24} color="inherit" /> : `Simula Selezionate (${selectedHashes.length})`}
                </Button>
            </Paper>

            {/* TABELLA MEMPOOL (Mostrata solo se ci sono transazioni e non ci sono ancora risultati) */}
            {mempoolTxs.length > 0 && simulationResults.length === 0 && (
                <MempoolTable 
                    transactions={mempoolTxs} 
                    selectedHashes={selectedHashes}
                    setSelectedHashes={setSelectedHashes}
                />
            )}

            {/* TABELLA RISULTATI SIMULAZIONE (Sostituisce la mempool una volta finita) */}
            {simulationResults.length > 0 && (
                <SimulationResultsTable results={simulationResults} />
            )}
        </Box>
    );
};

export default MempoolSimulationPage;