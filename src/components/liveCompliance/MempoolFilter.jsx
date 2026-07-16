import React, { useState } from 'react';
import { isAddress } from "web3-validator";
import { 
    Box, 
    Typography, 
    Button,
    TextField
} from '@mui/material';

export default function MempoolFilter({ 
    validAddress, 
    setValidAddress,
    implAddress,
    setImplAddress
}) {
    const [inputAddress, setInputAddress] = useState("");
    const [addressError, setAddressError] = useState(false);

    const [inputImplAddress, setInputImplAddress] = useState("");
    const [implAddressError, setImplAddressError] = useState(false);

    const handleConfirmMainAddress = () => {
        if (isAddress(inputAddress)) {
            setValidAddress(inputAddress.toLowerCase());
            setAddressError(false);
        } else {
            setValidAddress("");
            setAddressError(true);
        }
    }

    const handleConfirmImplAddress = () => {
        if (inputImplAddress === "") {
            setImplAddress("");
            setImplAddressError(false);
        } else if (isAddress(inputImplAddress)) {
            setImplAddress(inputImplAddress.toLowerCase());
            setImplAddressError(false);
        } else {
            setImplAddress("");
            setImplAddressError(true);
        }
    }

    return (
        <Box>
            {/* Prima riga: Main Contract Address */}
            <Box display="flex" alignItems="flex-start" gap={2} mb={3}>
                <TextField 
                    label="Contract Address (Proxy or Main)" 
                    variant="outlined" 
                    fullWidth
                    value={inputAddress}
                    onChange={(e) => setInputAddress(e.target.value)}
                    error={addressError} 
                    helperText={addressError ? "Invalid EVM Address (Must be 0x... and 42 chars)" : "Enter a valid 0x... address"}
                />
                <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleConfirmMainAddress}
                    disabled={!inputAddress} 
                    sx={{ height: '56px', width: '120px' }}
                >
                    Confirm
                </Button>
            </Box>

            {/* Seconda riga: Implementation Contract Address */}
            <Box display="flex" alignItems="flex-start" gap={2} mb={3}>
                <TextField 
                    label="Implementation Contract Address (Optional)" 
                    variant="outlined" 
                    fullWidth
                    value={inputImplAddress}
                    onChange={(e) => setInputImplAddress(e.target.value)}
                    error={implAddressError} 
                    helperText={implAddressError ? "Invalid EVM Address (Must be 0x... and 42 chars)" : "Leave empty if the contract is not a Proxy"}
                />
                <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleConfirmImplAddress}
                    sx={{ height: '56px', width: '120px' }}
                >
                    Confirm
                </Button>
            </Box>

            {/* Area Feedback */}
            <Box mt={2}>
                {validAddress && !addressError && (
                    <Typography variant="body2" color="success.main" mb={0.5}>
                        ✓ Main Contract locked: {validAddress.substring(0,6)}...{validAddress.substring(38)}
                    </Typography>
                )}
                {implAddress && !implAddressError && (
                    <Typography variant="body2" color="success.main">
                        ✓ Implementation locked: {implAddress.substring(0,6)}...{implAddress.substring(38)}
                    </Typography>
                )}
            </Box>
        </Box> 
    );
}