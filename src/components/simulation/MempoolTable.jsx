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
    // Stato locale per tracciare quale riga è attualmente espansa (solo una alla volta)
    const [expandedRow, setExpandedRow] = useState(null);
    
    // Gestione del tema dark/light per il visualizzatore JSON
    const { mode } = useColorScheme();
    const isDarkMode = mode === 'dark';

    // Aggiunge o rimuove una singola transazione dalla selezione
    const handleSelect = (hash) => {
        setSelectedHashes(prev => 
            prev.includes(hash) ? prev.filter(h => h !== hash) : [...prev, hash]
        );
    };

    // Gestisce il checkbox "Seleziona Tutto" nell'intestazione
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
                Transazioni in Mempool ({transactions.length})
            </Typography>
            
            <TableContainer component={Paper} elevation={2}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox">
                                <Checkbox 
                                    // Mostra un trattino se ci sono selezioni parziali
                                    indeterminate={selectedHashes.length > 0 && selectedHashes.length < transactions.length}
                                    // Spuntato se tutto è selezionato
                                    checked={transactions.length > 0 && selectedHashes.length === transactions.length}
                                    onChange={handleSelectAll}
                                />
                            </TableCell>
                            <TableCell width="50px" /> {/* Colonna freccia espansione */}
                            <TableCell>Hash</TableCell>
                            <TableCell>Da (From)</TableCell>
                            <TableCell>A (To)</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {transactions.map((tx) => {
                            const isSelected = selectedHashes.includes(tx.hash);
                            const isExpanded = expandedRow === tx.hash;

                            return (
                                <React.Fragment key={tx.hash}>
                                    {/* RIGA PRINCIPALE: Dati di base e Checkbox */}
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
                                            {tx.hash.substring(0, 16)}...
                                        </TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace' }}>
                                            {tx.from.substring(0, 12)}...
                                        </TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace' }}>
                                            {tx.to ? tx.to.substring(0, 12) + "..." : "Creazione Contratto"}
                                        </TableCell>
                                    </TableRow>

                                    {/* RIGA ESPANSA: Visualizzatore JSON della transazione grezza */}
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
                                                        Payload Mempool Grezzo
                                                    </Typography>
                                                    <ReactJson 
                                                        value={tx} 
                                                        theme={isDarkMode ? 'dark' : 'light'}
                                                        collapsed={1} 
                                                        displayDataTypes={false} 
                                                        name={false}
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