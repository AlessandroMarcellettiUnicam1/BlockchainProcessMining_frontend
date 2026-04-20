import React, { useState } from "react";
import { Container, Typography, Box, Alert, Stack } from '@mui/material';
import { _simulateTransaction } from "../api/services";
import { SimulationForm } from "../components/simulation/SimulationForm";
import { SimulationResult } from "../components/simulation/SimulationResult";
import { RotateLoader } from "react-spinners";
import { SimulationConsole } from "../components/simulation/SimulationConsole";

const SimulationPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [apiError, setApiError] = useState(null);
    const [logs, setLogs] = useState([]);

    const handleSimulate = async (payload) => {
        setIsLoading(true);
        setApiError(null);
        setResult(null);
        setLogs([]);
 
        const response = await _simulateTransaction(payload);

        if (response.status === 200 || response.status === 201) {
            setResult(response.data.data);
            setLogs(response.data.logs || []);
        } else {
            setResult({
                simulazione_fallita: true,
                codice_errore: response.status,
                dettaglio_server: response.data?.error || response.data
            });
        
            setLogs(response.data?.logs || []);
            setApiError("Error during the simulation.");
        }

        setIsLoading(false);
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="bold">
                    Transaction Simulator
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                    Simulate transactions on any block and analyze the decoded execution trace.
                </Typography>
            </Box>

            {apiError && (
                <Alert severity="error" sx={{ mb: 4 }} onClose={() => setApiError(null)}>
                    {apiError}
                </Alert>
            )}

            <Stack spacing={4}>
                <SimulationForm onSubmit={handleSimulate} isLoading={isLoading} />

                {isLoading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 5 }}>
                        <RotateLoader 
                            color="#1976d2"
                            loading={isLoading} 
                            size={15} 
                            margin={2}
                        />
                    </Box>
                )}

                {!isLoading && (
                    <>
                        <SimulationResult result={result} />
                        <SimulationConsole logs={logs} />
                    </>
                )}
            </Stack>
        </Container>
    );
};

export default SimulationPage;