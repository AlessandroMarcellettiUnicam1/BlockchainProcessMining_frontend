import React from 'react';
import { 
    Accordion, 
    AccordionSummary, 
    AccordionDetails, 
    Typography, 
    TextField, 
    Box 
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export const AdvancedParams = ({ 
    nonce, 
    chainId, 
    txIndex, 
    accessList, 
    onInputChange 
}) => {
    return (
        <Accordion sx={{ mb: 3 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography fontWeight="medium">Parametri Avanzati (Opzionali)</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <TextField
                        label="Nonce"
                        type="number"
                        fullWidth
                        value={nonce || ''}
                        onChange={(e) => onInputChange('nonce', e.target.value)}
                        placeholder="es. 12"
                    />
                    <TextField
                        label="Chain ID"
                        type="number"
                        fullWidth
                        value={chainId || ''}
                        onChange={(e) => onInputChange('chainId', e.target.value)}
                        placeholder="es. 1 (Mainnet)"
                    />
                    <TextField
                        label="Transaction Index"
                        type="number"
                        fullWidth
                        value={txIndex || ''}
                        onChange={(e) => onInputChange('txIndex', e.target.value)}
                        helperText="Simulazione intra-blocco"
                    />
                </Box>
                <TextField
                    label="Access List (JSON Array)"
                    multiline
                    rows={4}
                    fullWidth
                    value={accessList || ''}
                    onChange={(e) => onInputChange('accessList', e.target.value)}
                    placeholder='[{"address": "0x...", "storageKeys": ["0x..."]}]'
                />
            </AccordionDetails>
        </Accordion>
    );
};