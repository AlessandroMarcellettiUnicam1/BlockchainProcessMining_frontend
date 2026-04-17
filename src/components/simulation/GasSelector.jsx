import React from "react";
import { 
    Box, 
    Radio, 
    RadioGroup, 
    FormControlLabel, 
    FormControl, 
    FormLabel, 
    TextField 
} from '@mui/material';

export const GasSelector = ({
    isEIP1559, 
    onTypeChange, 
    gasPrice, 
    maxFeePerGas, 
    maxPriorityFeePerGas, 
    onInputChange
}) => {
    return (
        <Box sx={{ mt: 3, mb: 3, p: 2, border: '1px solid dimgray', borderRadius: 1 }}>
            <FormControl component="fieldset" fullWidth>
                <FormLabel component="legend">Gas Fee Model</FormLabel>
                <RadioGroup 
                    row 
                    value={isEIP1559 ? "eip1559" : "legacy"} 
                    onChange={onTypeChange}
                >
                    <FormControlLabel value="eip1559" control={<Radio />} label="EIP-1559" />
                    <FormControlLabel value="legacy" control={<Radio />} label="Legacy (Type 0)" />
                </RadioGroup>

                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    {isEIP1559 ? (
                        <>
                            <TextField
                                label="Max Fee Per Gas (Gwei)"
                                type="number"
                                fullWidth
                                value={maxFeePerGas || ''}
                                onChange={(e) => onInputChange('maxFeePerGas', e.target.value)}
                                placeholder="es. 45.5"
                                inputProps={{ step: "any" }}
                            />
                            <TextField
                                label="Max Priority Fee (Gwei)"
                                type="number"
                                fullWidth
                                value={maxPriorityFeePerGas || ''}
                                onChange={(e) => onInputChange('maxPriorityFeePerGas', e.target.value)}
                                placeholder="es. 2"
                                inputProps={{ step: "any" }}
                            />
                        </>
                    ) : (
                        <TextField
                            label="Gas Price (Gwei)"
                            type="number"
                            fullWidth
                            value={gasPrice || ''}
                            onChange={(e) => onInputChange('gasPrice', e.target.value)}
                            placeholder="es. 35"
                            inputProps={{ step: "any" }}
                        />
                    )}
                </Box>
            </FormControl>
        </Box>
    );
};