import React, { useState } from 'react';
import { isAddress } from "web3-validator";
import { 
    Box, 
    Typography, 
    FormControl, 
    RadioGroup, 
    FormControlLabel, 
    Radio,
    Button,
    TextField
} from '@mui/material';

export default function MempoolFilter({ 
    validAddress, 
    setValidAddress
    // addressFilters, 
    // setAddressFilters 
}) {
    const [inputAddress, setInputAddress] = useState("");
    const [addressError, setAddressError] = useState(false);

    const handleConfirmAddress = async () => {
        if (isAddress(inputAddress)) {
            setValidAddress(inputAddress.toLowerCase());
            setAddressError(false);
        } 
        else {
            setValidAddress("");
            setAddressError(true);
        }
    }

    return (

        <Box>
            <Box display="flex" alignItems="flex-start" gap={2} mb={3}>
                <TextField 
                    label="Contract Address" 
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
                    onClick={handleConfirmAddress}
                    disabled={!inputAddress} 
                    sx={{ height: '56px' }}
                >
                    Confirm
                </Button>
            </Box>

            {/* <FormControl>
                <Typography variant="body2" color="textSecondary" mb={1}>Filter Direction:</Typography>
                    <RadioGroup row value={addressFilters} onChange={(e) => setAddressFilters(e.target.value)}>
                        <FormControlLabel value="from" control={<Radio />} label="From" />
                        <FormControlLabel value="to" control={<Radio />} label="To" />
                        <FormControlLabel value="both" control={<Radio />} label="Both" />
                    </RadioGroup>
            </FormControl> */}

            {validAddress && (
                <Typography variant="body2" color="success.main" mt={2}>
                    ✓ Filter locked: Listening for transactions with {validAddress.substring(0,6)}...{validAddress.substring(38)}
                </Typography>
            )}
        </Box> 
    );
}