import React, { useState } from 'react';
import { Box, TextField, Button, Paper, Typography, Stack, Alert } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { GasSelector } from './GasSelector';
import { AdvancedParams } from './AdvancedParams';
import { DataInputSelector } from './DataInputSelector';
import { 
    ethToHex, 
    formatData, 
    numberToHex, 
    gweiToHex,
    formatAccessList,
    formatBlockInput  
} from '../../utils/formatter';

export const SimulationForm = ({ onSubmit, isLoading }) => {
    const [formValues, setFormValues] = useState({
        from: '',
        to: '',
        value: '',
        gasLimit: '',
        blockNumber: '',
        gasPrice: '',
        maxFeePerGas: '',
        maxPriorityFeePerGas: '',
        nonce: '',
        chainId: '',
        txIndex: '',
        accessList: ''
    });

    const [isEIP1559, setIsEIP1559] = useState(true);
    const [formError, setFormError] = useState(null);

    const [compiledData, setCompiledData] = useState('0x');
    const [abiError, setAbiError] = useState(null);

    const handleInputChange = (field, value) => {
        setFormValues(prev => ({ ...prev, [field]: value }));
        setFormError(null); 
    };

    const handleGasTypeChange = (e) => {
        const isStandard = e.target.value === "eip1559";
        setIsEIP1559(isStandard);
        // Svuota i campi del gas per evitare conflitti nel payload finale
        setFormValues(prev => ({
            ...prev,
            gasPrice: '',
            maxFeePerGas: '',
            maxPriorityFeePerGas: ''
        }));
    };

    const handleSubmit = () => {
        if (abiError) {
            setFormError(abiError);
            return;
        }

        try {
            const transactionParams = {
                from: formValues.from || undefined,
                to: formValues.to || undefined,
                value: ethToHex(formValues.value),
                data: formatData(formValues.data),
                gas: numberToHex(formValues.gasLimit),
                data: formatData(compiledData),
                nonce: numberToHex(formValues.nonce),
                chainId: numberToHex(formValues.chainId),
                accessList: formatAccessList(formValues.accessList)
            };

            // scelta dinamica del tipo di gas
            if (isEIP1559) {
                transactionParams.maxFeePerGas = gweiToHex(formValues.maxFeePerGas);
                transactionParams.maxPriorityFeePerGas = gweiToHex(formValues.maxPriorityFeePerGas);
            } else {
                transactionParams.gasPrice = gweiToHex(formValues.gasPrice);
            }

            const configParams = { }

            if (formValues.txIndex) {
                configParams.transactionIndex = numberToHex(formValues.txIndex);
            
            }

            const finalPayload = {
                params: [
                    transactionParams,                             
                    formatBlockInput(formValues.blockNumber),      
                    configParams                                   
                ]
            };

            onSubmit(finalPayload);

        } catch (error) {
            setFormError(error.message);
        }
    };

    return (
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" mb={3}>
                Transaction Configuration
            </Typography>

            {/* bannder di errore */}
            {formError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {formError}
                </Alert>
            )}

            <Stack spacing={3}>
                {/* RIGHE BASE: From, To e Blocco */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        label="From Address"
                        fullWidth
                        value={formValues.from}
                        onChange={(e) => handleInputChange('from', e.target.value)}
                        placeholder="0x..."
                    />
                    <TextField
                        label="To Address"
                        fullWidth
                        value={formValues.to}
                        onChange={(e) => handleInputChange('to', e.target.value)}
                        placeholder="0x..."
                    />
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        label="Value (ETH)"
                        type="number"
                        fullWidth
                        value={formValues.value}
                        onChange={(e) => handleInputChange('value', e.target.value)}
                        placeholder="es. 1.5"
                        inputProps={{ step: "any" }}
                    />
                    <TextField
                        label="Target Block"
                        fullWidth
                        value={formValues.blockNumber}
                        onChange={(e) => handleInputChange('blockNumber', e.target.value)}
                        placeholder="es. latest, pending, o 17500000"
                    />
                    <TextField
                        label="Gas Limit"
                        type="number"
                        fullWidth
                        value={formValues.gasLimit}
                        onChange={(e) => handleInputChange('gasLimit', e.target.value)}
                        placeholder="es. 21000"
                    />
                </Box>

                <DataInputSelector 
                    onDataReady={(hex) => setCompiledData(hex)} 
                    onError={(err) => setAbiError(err)} 
                />

                <GasSelector 
                    isEIP1559={isEIP1559}
                    onTypeChange={handleGasTypeChange}
                    gasPrice={formValues.gasPrice}
                    maxFeePerGas={formValues.maxFeePerGas}
                    maxPriorityFeePerGas={formValues.maxPriorityFeePerGas}
                    onInputChange={handleInputChange}
                />

                <AdvancedParams 
                    nonce={formValues.nonce}
                    chainId={formValues.chainId}
                    txIndex={formValues.txIndex}
                    accessList={formValues.accessList}
                    onInputChange={handleInputChange}
                />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button 
                        variant="contained" 
                        size="large" 
                        onClick={handleSubmit}
                        disabled={isLoading}
                        startIcon={<PlayArrowIcon />}
                        disableElevation
                    >
                        {isLoading ? 'Simulating...' : 'Run Simulation'}
                    </Button>
                </Box>
            </Stack>
        </Paper>
    );
}

