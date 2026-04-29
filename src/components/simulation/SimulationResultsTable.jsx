import React, { useState } from 'react';
import { 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    IconButton, Collapse, Box, Paper, Typography, Chip, Button 
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ReactJson from '@uiw/react-json-view';
import DownloadIcon from '@mui/icons-material/Download';
import { useColorScheme } from '@mui/material/styles';

export default function SimulationResultsTable({ results }) {
    const [expandedRow, setExpandedRow] = useState(null);
    const { mode } = useColorScheme();
    const isDarkMode = mode === 'dark';

    const handleDownloadAll = () => {
        const jsonString = JSON.stringify(results, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.download = `simulazioni_mempool_${timestamp}.json`; 
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ margin: 0 }}>
                    Simulation Results ({results.length})
                </Typography>
    
                <Button 
                    variant="outlined" 
                    color="primary" 
                    size="small"
                    startIcon={<DownloadIcon />} 
                    onClick={handleDownloadAll}
                >
                    Download all (JSON)
                </Button>
            </Box>
            <TableContainer component={Paper}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell width="50px" />
                            <TableCell>Status</TableCell>
                            <TableCell>Transaction Hash</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {results.map((sim, index) => {
                            const isExpanded = expandedRow === sim.hash;
                            const isSuccess = sim.status === "success";

                            return (
                                <React.Fragment key={sim.hash + index}>
                                    {/* Riga Principale */}
                                    <TableRow hover>
                                        <TableCell>
                                            <IconButton size="small" onClick={() => setExpandedRow(isExpanded ? null : sim.hash)}>
                                                {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                            </IconButton>
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={isSuccess ? "Success" : "Failed"} 
                                                color={isSuccess ? "success" : "error"} 
                                                size="small" 
                                            />
                                        </TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace' }}>{sim.hash}</TableCell>
                                    </TableRow>

                                    {/* Riga Espansa (Il JSON finale) */}
                                    <TableRow>
                                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={3}>
                                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                                <Box sx={{ 
                                                    margin: 2, 
                                                    backgroundColor: isDarkMode ? '#1e1e1e' : '#f5f5f5', 
                                                    p: 2, 
                                                    borderRadius: 1 
                                                }}>
                                                    <ReactJson 
                                                        value={sim.result} 
                                                        theme={isDarkMode ? 'dark' : 'light'}
                                                        collapsed={2} 
                                                        displayDataTypes={false} 
                                                        style={{ 
                                                            backgroundColor: 'transparent',
                                                            '--w-rjv-key-string': isDarkMode ? '#9cdcfe' : '#000000', 
                                                            '--w-rjv-line-color': isDarkMode ? '#333333' : '#e0e0e0',
                                                            '--w-rjv-info-color': isDarkMode ? '#8b949e' : '#999999',
                                                        }}
                                                    />
                                                </Box>
                                            </Collapse>
                                        </TableCell>
                                    </TableRow>
                                </React.Fragment>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}