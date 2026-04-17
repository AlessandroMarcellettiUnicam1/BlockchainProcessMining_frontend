import React, { useState, useEffect} from "react";
import { 
    Box, 
    TextField, 
    Radio, 
    RadioGroup, 
    FormControlLabel, 
    FormControl, 
    FormLabel, 
    Button, 
    IconButton, 
    Typography 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { encodeABI} from "../../utils/formatter";

export const DataInputSelector = ({ onDataReady, onError }) => {
    const [mode, setMode] = useState('hex'); 
    const [hexValue, setHexValue] = useState('');
    const [signature, setSignature] = useState('');
    const [args, setArgs] = useState([]);

    // Effetto per calcolare l'esadecimale ogni volta che l'utente modifica i campi dinamici
    useEffect(() => {
        if (mode === 'hex') {
            onDataReady(hexValue);
            onError(null);
            return;
        }

        if (mode === 'function' && signature) {
            try {
                const encodedHex = encodeABI(signature, args);
                onDataReady(encodedHex);
                onError(null);
            } catch (err) {
                onError("Errore di formattazione ABI. Controlla i tipi nella firma e i parametri.");
                onDataReady("0x");
            }
        }
    }, [mode, hexValue, signature, args, onDataReady, onError]);

    const handleAddArg = () => setArgs([...args, '']);
    
    const handleRemoveArg = (index) => {
        const newArgs = [...args];
        newArgs.splice(index, 1);
        setArgs(newArgs);
    };

    const handleArgChange = (index, value) => {
        const newArgs = [...args];
        newArgs[index] = value;
        setArgs(newArgs);
    };

    return (
        <Box sx={{ mt: 2, mb: 3, p: 2, border: '1px solid dimgray', borderRadius: 1 }}>
            <FormControl component="fieldset" fullWidth>
                <FormLabel component="legend">Input Data (Payload)</FormLabel>
                <RadioGroup 
                    row 
                    value={mode} 
                    onChange={(e) => setMode(e.target.value)}
                >
                    <FormControlLabel value="hex" control={<Radio />} label="Raw Hex" />
                    <FormControlLabel value="function" control={<Radio />} label="ABI Encoding (Function)" />
                </RadioGroup>

                <Box sx={{ mt: 2 }}>
                    {mode === 'hex' ? (
                        <TextField
                            label="Input Data (Hex)"
                            multiline
                            rows={3}
                            fullWidth
                            value={hexValue}
                            onChange={(e) => setHexValue(e.target.value)}
                            placeholder="e.g. 0x..."
                        />
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                label="Function Signature"
                                fullWidth
                                value={signature}
                                onChange={(e) => setSignature(e.target.value)}
                                placeholder="e.g. transfer(address,uint256)"
                                helperText="Warning: Enter the exact name and types without spaces between the parameters."
                            />
                            
                            <Typography variant="subtitle2" color="text.secondary">Parameters:</Typography>
                            
                            {args.map((arg, index) => (
                                <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <TextField
                                        label={`Parameter ${index + 1}`}
                                        fullWidth
                                        size="small"
                                        value={arg}
                                        onChange={(e) => handleArgChange(index, e.target.value)}
                                    />
                                    <IconButton color="error" onClick={() => handleRemoveArg(index)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                            ))}
                            
                            <Button 
                                startIcon={<AddIcon />} 
                                onClick={handleAddArg} 
                                sx={{ alignSelf: 'flex-start' }}
                            >
                                Add Parameter
                            </Button>
                        </Box>
                    )}
                </Box>
            </FormControl>
        </Box>
    );
};