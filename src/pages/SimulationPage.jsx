import React, { useState } from "react";
import { Container, Typography, Box, Alert, Stack } from '@mui/material';
import { _simulateTransaction } from "../api/services";
import { SimulationFrom } from "../components/simulation/SimulationForm";
import { SimulationResult } from "../components/simulation/SimulationResult";

export const SimulationPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [apiError, setApiError] = useState(null);

    const handleSimulate = async (payload) => {
        setIsLoading(true);
        setApiError(null);
        setResult(null);
 
        const response = await _simulateTransaction(payload);

        if (response.status === 200 || response.status === 201) {
            setResult(response.data);
        } else {
            const errorMessage = response.data?.message || "Errore imprevisto durante la simulazione";
            setApiError(errorMessage);
        }

        setIsLoading(false);
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="bold">
                    EVM Transaction Simulator
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                    Simula transazioni su qualsiasi blocco e analizza la traccia di esecuzione decodificata.
                </Typography>
            </Box>

            {apiError && (
                <Alert severity="error" sx={{ mb: 4 }} onClose={() => setApiError(null)}>
                    {apiError}
                </Alert>
            )}

            <Stack spacing={4}>
                <SimulationForm onSubmit={handleSimulate} isLoading={isLoading} />
                <SimulationResult result={result} />
            </Stack>
        </Container>
    );
};