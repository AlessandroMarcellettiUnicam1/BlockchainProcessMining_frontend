import React, { useEffect, useRef } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export const SimulationConsole = ({ logs }) => {
    const endOfLogsRef = useRef(null);
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

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
                bgcolor: isDark ? '#1e1e1e' : '#f5f5f5',
                p: 2, 
                mt: 2, 
                borderRadius: 2,
                maxHeight: 300, 
                overflowY: 'auto',
                border: 1,
                borderColor: 'divider'
            }}
        >
            <Typography variant="overline" sx={{ color: '#858585', display: 'block', mb: 1, borderBottom: '1px solid #333', pb: 1 }}>
                System Console // Execution logs
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
                                color: isError ? 'error.main' : 'info.main',
                                wordBreak: 'break-word'
                            }}
                        >
                            <span style={{ 
                                color: theme.palette.text.secondary, 
                                marginRight: '8px' 
                            }}>
                                &gt;
                            </span>
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