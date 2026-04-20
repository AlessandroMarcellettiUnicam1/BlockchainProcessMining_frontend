import React, { useEffect, useRef } from 'react';
import { Box, Typography, Paper } from '@mui/material';

export const SimulationConsole = ({ logs }) => {
    const endOfLogsRef = useRef(null);

    useEffect(() => {
        if (endOfLogsRef.current) {
            endOfLogsRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    if (!logs || logs.length === 0) return null;

    return (
        <Paper 
            elevation={3} 
            sx={{ 
                bgcolor: '#1e1e1e',
                p: 2, 
                mt: 2, 
                borderRadius: 2,
                maxHeight: 300, 
                overflowY: 'auto',
                border: '1px solid #333'
            }}
        >
            <Typography variant="overline" sx={{ color: '#858585', display: 'block', mb: 1, borderBottom: '1px solid #333', pb: 1 }}>
                System Console // Log di Esecuzione
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {logs.map((logMsg, index) => {
                    // Colora di rosso i messaggi di errore per un rapido colpo d'occhio
                    const isError = logMsg.includes('[Errore') || logMsg.includes('(REVERT)');
                    
                    return (
                        <Typography 
                            key={index}
                            variant="body2"
                            sx={{ 
                                fontFamily: 'monospace',
                                color: isError ? '#f44336' : '#569cd6', // Rosso per errori, Azzurro per info
                                wordBreak: 'break-word'
                            }}
                        >
                            <span style={{ color: '#858585', marginRight: '8px' }}>&gt;</span>
                            {logMsg}
                        </Typography>
                    );
                })}
                {/* elemento invisibile per gestire l'auto-scroll */}
                <div ref={endOfLogsRef} />
            </Box>
        </Paper>
    );
};