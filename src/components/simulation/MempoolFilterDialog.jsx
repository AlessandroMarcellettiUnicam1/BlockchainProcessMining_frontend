import React, { useState, useEffect } from 'react';
import {
    Box, Checkbox, Dialog, DialogContent, DialogTitle,
    Input, Slider, TextField, IconButton, Typography, Slide
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddBoxIcon from "@mui/icons-material/AddBox";

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="down" ref={ref} {...props} />;
});

export default function MempoolFilterDialog({ open, onClose, onFiltersUpdate }) {

    const [filterGas, setFilterGas] = useState(false);
    const [filterGasPrice, setFilterGasPrice] = useState(false);
    
    const [gasLimit, setGasLimit] = useState([0, 2000000]);
    const [gasPrice, setGasPrice] = useState([0, 500000000000]); 
    
    const [fromList, setFromList] = useState([]);
    const [fromToAdd, setFromToAdd] = useState("");
    const [toList, setToList] = useState([]);
    const [toToAdd, setToToAdd] = useState("");

    const [functionList, setFunctionList] = useState([]);
    const [functionToAdd, setFunctionToAdd] = useState("");

    useEffect(() => {
        onFiltersUpdate({
            active: {
                gas: filterGas,
                gasPrice: filterGasPrice,
                from: fromList.length > 0,
                to: toList.length > 0,
                functions: functionList.length > 0
            },
            values: {
                gasLimit,
                gasPrice,
                fromList,
                toList,
                functionList
            }
        });
    }, [filterGas, filterGasPrice, gasLimit, gasPrice, fromList, toList, functionList]);

    const handleAddFrom = () => {
        if (fromToAdd && !fromList.includes(fromToAdd.toLowerCase())) {
            setFromList([...fromList, fromToAdd.toLowerCase()]);
            setFromToAdd("");
        }
    };
    const handleDeleteFrom = (address) => setFromList(fromList.filter(a => a !== address));

    const handleAddTo = () => {
        if (toToAdd && !toList.includes(toToAdd.toLowerCase())) {
            setToList([...toList, toToAdd.toLowerCase()]);
            setToToAdd("");
        }
    };
    const handleDeleteTo = (address) => setToList(toList.filter(a => a !== address));

    const handleAddFunction = () => {
        if (functionToAdd) {
            // Normalizzazione
            let normalized = functionToAdd.toLowerCase().trim();
            if (!normalized.startsWith("0x")) normalized = "0x" + normalized;
            
            if (!functionList.includes(normalized)) {
                setFunctionList([...functionList, normalized]);
                setFunctionToAdd("");
            }
        }
    };
    const handleDeleteFunction = (func) => setFunctionList(functionList.filter(f => f !== func));

    return (
        <Dialog TransitionComponent={Transition} keepMounted open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontWeight: 'bold' }}>Filtri Mempool</DialogTitle>
            <DialogContent>
                <Box display="flex" gap={4} mt={1}>
                    {/* COLONNA DESTRA: Indirizzi e Funzioni */}
                    <Box flex={1}>
                        {/* GAS LIMIT */}
                        <Box display="flex" alignItems="center">
                            <Checkbox checked={filterGas} onChange={(e) => setFilterGas(e.target.checked)} />
                            <Typography fontWeight={700}>Gas Limit</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" gap={2} px={1}>
                            <Input
                                disabled={!filterGas} value={gasLimit[0]} type="number"
                                onChange={(e) => setGasLimit([Number(e.target.value), gasLimit[1]])}
                            />
                            <Input
                                disabled={!filterGas} value={gasLimit[1]} type="number"
                                onChange={(e) => setGasLimit([gasLimit[0], Number(e.target.value)])}
                            />
                        </Box>
                        <Slider
                            disabled={!filterGas} value={gasLimit} max={5000000} step={10000}
                            onChange={(e, val) => setGasLimit(val)} sx={{ mx: 1, width: '95%' }}
                        />

                        {/* GAS PRICE */}
                        <Box display="flex" alignItems="center" mt={2}>
                            <Checkbox checked={filterGasPrice} onChange={(e) => setFilterGasPrice(e.target.checked)} />
                            <Typography fontWeight={700}>Gas Price (Wei)</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" gap={2} px={1}>
                            <Input
                                disabled={!filterGasPrice} value={gasPrice[0]} type="number"
                                onChange={(e) => setGasPrice([Number(e.target.value), gasPrice[1]])}
                            />
                            <Input
                                disabled={!filterGasPrice} value={gasPrice[1]} type="number"
                                onChange={(e) => setGasPrice([gasPrice[0], Number(e.target.value)])}
                            />
                        </Box>
                        <Slider
                            disabled={!filterGasPrice} value={gasPrice} max={500000000000} step={1000000000}
                            onChange={(e, val) => setGasPrice(val)} sx={{ mx: 1, width: '95%' }}
                        />

                        <Typography fontWeight={700} mb={1}>Functions (Method ID)</Typography>
                        <Box display="flex" gap={1} mb={1}>
                            <TextField size="small" fullWidth placeholder="0xa9059cbb" value={functionToAdd} onChange={(e) => setFunctionToAdd(e.target.value)} />
                            <IconButton onClick={handleAddFunction} color="primary" sx={{ p: 0 }}><AddBoxIcon fontSize="large" /></IconButton>
                        </Box>
                        <Box height={85} overflow="auto" border={1} borderColor="divider" borderRadius={1} p={1}>
                            {functionList.map(func => (
                                <Box key={func} display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{func}</Typography>
                                    <IconButton size="small" onClick={() => handleDeleteFunction(func)}><DeleteIcon color="error" fontSize="small" /></IconButton>
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    {/* Indirizzi (From / To) */}
                    <Box flex={1}>
                        {/* FROM */}
                        <Typography fontWeight={700} mb={1}>Indirizzi Mittenti (From)</Typography>
                        <Box display="flex" gap={1} mb={1}>
                            <TextField 
                                size="small" fullWidth placeholder="0x..." value={fromToAdd}
                                onChange={(e) => setFromToAdd(e.target.value)}
                            />
                            <IconButton onClick={handleAddFrom} color="primary" sx={{ p: 0 }}>
                                <AddBoxIcon fontSize="large" />
                            </IconButton>
                        </Box>
                        <Box height={100} overflow="auto" mb={3} border={1} borderColor="divider" borderRadius={1} p={1}>
                            {fromList.map(addr => (
                                <Box key={addr} display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{addr.substring(0,20)}...</Typography>
                                    <IconButton size="small" onClick={() => handleDeleteFrom(addr)}>
                                        <DeleteIcon color="error" fontSize="small" />
                                    </IconButton>
                                </Box>
                            ))}
                        </Box>

                        {/* TO */}
                        <Typography fontWeight={700} mb={1}>Indirizzi Destinatari (To)</Typography>
                        <Box display="flex" gap={1} mb={1}>
                            <TextField 
                                size="small" fullWidth placeholder="0x..." value={toToAdd}
                                onChange={(e) => setToToAdd(e.target.value)}
                            />
                            <IconButton onClick={handleAddTo} color="primary" sx={{ p: 0 }}>
                                <AddBoxIcon fontSize="large" />
                            </IconButton>
                        </Box>
                        <Box height={100} overflow="auto" border={1} borderColor="divider" borderRadius={1} p={1}>
                            {toList.map(addr => (
                                <Box key={addr} display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{addr.substring(0,20)}...</Typography>
                                    <IconButton size="small" onClick={() => handleDeleteTo(addr)}>
                                        <DeleteIcon color="error" fontSize="small" />
                                    </IconButton>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
}