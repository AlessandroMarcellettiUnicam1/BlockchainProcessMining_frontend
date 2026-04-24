import React, { useEffect, useRef } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import { use } from 'react';

export const SimulationConsole = ({ logs }) => {
    const endOfLogsRef = useRef(null);
    const { mode } = useColorScheme();
    const isDarkMode = mode === 'dark';

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
                bgcolor: isDarkMode ? '#1e1e1e' : '#f5f5f5',
                p: 2, 
                mt: 2, 
                borderRadius: 2,
                maxHeight: 300, 
                overflowY: 'auto',
                border: 1,
                borderColor: 'divider'
            }}
        >
            <Typography 
                variant="overline" 
                sx={{ 
                    color: '#858585', 
                    display: 'block', 
                    mb: 1, 
                    borderBottom: 1, 
                    borderColor: 'divider', 
                    pb: 1 
                }}
            >
                System Console // Execution logs
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {logs.map((logMsg, index) => {
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
                                color: isDarkMode ? '#858585' : '#a0a0a0', 
                                marginRight: '8px' 
                            }}>
                                &gt;
                            </span>
                            {logMsg}
                        </Typography>
                    );
                })}
                <div ref={endOfLogsRef} />
            </Box>
        </Paper>
    );
};