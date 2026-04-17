import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ReactJson from '@uiw/react-json-view';

export const SimulationResult = ({ result }) => {
    if (!result) return null;

    // Funzione per forzare il download del file JSON tramite il browser
    const handleDownload = () => {
        const jsonString = JSON.stringify(result, null, 2);
        
        const blob = new Blob([jsonString], { type: "application/json" });
        
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `simulation_result_${new Date().getTime()}.json`; 
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <Paper elevation={3} sx={{ mt: 4, p: 3, borderRadius: 2 }}>
            {/* Intestazione con Titolo e Bottone allineati */}
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 2,
                borderBottom: '1px solid #e0e0e0',
                pb: 2
            }}>
                <Typography variant="h6" fontWeight="bold">
                    Risultato Simulazione
                </Typography>
                
                <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<DownloadIcon />} 
                    onClick={handleDownload}
                    disableElevation
                >
                    Scarica JSON
                </Button>
            </Box>

            {/* Contenitore scrollabile per il JSON interattivo */}
            <Box sx={{ 
                maxHeight: '600px', 
                overflow: 'auto', 
                backgroundColor: '#f5f5f5', 
                p: 2, 
                borderRadius: 1 
            }}>
                <ReactJson 
                    value={result} 
                    theme="rjv-default" 
                    name={false} 
                    collapsed={2} 
                    displayDataTypes={false} 
                    enableClipboard={true}
                />
            </Box>
        </Paper>
    );
};