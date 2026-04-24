import React, { useState } from 'react';
import { 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    Checkbox, IconButton, Collapse, Box, Paper, Typography 
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ReactJson from '@uiw/react-json-view';
import { useColorScheme } from '@mui/material/styles';

export default function MempoolTable({ transactions, selectedHashes, setSelectedHashes }) {
    const [expandedRow, setExpandedRow] = useState(null);
    
    const { mode } = useColorScheme();
    const isDarkMode = mode === 'dark';

    const handleSelect = (hash) => {
        setSelectedHashes(prev => 
            prev.includes(hash) ? prev.filter(h => h !== hash) : [...prev, hash]
        );
    };

    const handleSelectAll = (event) => {
        if (event.target.checked) {
            setSelectedHashes(transactions.map(tx => tx.hash));
        } else {
            setSelectedHashes([]);
        }
    };

    return (
        <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
                Mempool Transactions ({transactions.length})
            </Typography>
            
            <TableContainer component={Paper} elevation={2}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox">
                                <Checkbox 
                                    indeterminate={selectedHashes.length > 0 && selectedHashes.length < transactions.length}
                                    checked={transactions.length > 0 && selectedHashes.length === transactions.length}
                                    onChange={handleSelectAll}
                                />
                            </TableCell>
                            <TableCell width="50px" />

                            <TableCell>From</TableCell>
                            <TableCell>To</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {transactions.map((tx) => {
                            const isSelected = selectedHashes.includes(tx.hash);
                            const isExpanded = expandedRow === tx.hash;

                            return (
                                <React.Fragment key={tx.hash}>
                                    {/* RIGA PRINCIPALE */}
                                    <TableRow hover selected={isSelected}>
                                        <TableCell padding="checkbox">
                                            <Checkbox 
                                                checked={isSelected} 
                                                onChange={() => handleSelect(tx.hash)} 
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <IconButton 
                                                size="small" 
                                                onClick={() => setExpandedRow(isExpanded ? null : tx.hash)}
                                            >
                                                {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                            </IconButton>
                                        </TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace' }}>
                                            {tx.from}
                                        </TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace' }}>
                                            {tx.to ? tx.to : "Contract Creation"}
                                        </TableCell>
                                    </TableRow>

                                    {/* RIGA ESPANSA */}
                                    <TableRow>
                                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
                                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                                <Box sx={{ 
                                                    margin: 2, 
                                                    backgroundColor: isDarkMode ? '#1e1e1e' : '#f8f9fa', 
                                                    p: 2, 
                                                    borderRadius: 1,
                                                    border: '1px solid',
                                                    borderColor: 'divider'
                                                }}>
                                                    <Typography variant="overline" color="text.secondary" gutterBottom display="block">
                                                        Raw Mempool Payolad
                                                    </Typography>
                                                    <ReactJson 
                                                        value={tx} 
                                                        theme={isDarkMode ? 'dark' : 'light'}
                                                        collapsed={1} 
                                                        displayDataTypes={false} 
                                                        name={false}
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