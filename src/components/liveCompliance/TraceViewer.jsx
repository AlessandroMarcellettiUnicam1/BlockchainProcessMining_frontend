import React from "react";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Paper,
  Divider,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTheme } from "@mui/material/styles";

const getTraceId = (traceArray, caseColumn) => {
  if (!traceArray || traceArray.length === 0) return "Unknown";
  const firstEvent = traceArray[0];

  if (caseColumn && firstEvent[caseColumn]) {
    return firstEvent[caseColumn];
  }

  // fallbak
  return "Trace";
};

export default function TraceViewer({
  compliantData = [],
  nonCompliantData = [],
  ignoredData = [],
  stats,
  sourceType,
  sourceId,
  step,
  caseColumn,
}) {
  const theme = useTheme();

  // Appiattiamo i dati in un unico array visivo
  const visualList = [
    ...compliantData.map((trace) => ({
      data: trace,
      status: "compliant",
      label: "Compliant",
      color: "success",
    })),
    ...nonCompliantData.map((trace) => ({
      data: trace,
      status: "noncompliant",
      label: "Non-Compliant",
      color: "error",
    })),
    ...ignoredData.map((trace) => ({
      data: trace,
      status: "ignored",
      label: "Ignored",
      color: "default",
    })),
  ];

  // Determiniamo dinamicamente titoli e colori in base alla sorgente (Mempool vs Blocco)
  const isSimulation = sourceType === "SIMULATION_RESULT";
  const sourceLabel = isSimulation ? "Mempool Transaction" : "Confirmed Block";
  const sourceColor = isSimulation ? "text.secondary" : "primary.main";

  return (
    <Box sx={{ width: "100%" }}>
      {/* SEZIONE 1: Resoconto dell'Evento con Hash/BlockNumber dinamico */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          border: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="subtitle2" color="text.secondary">
            STEP {step} - Compliance Result
          </Typography>
          <Typography
            variant="caption"
            fontWeight="bold"
            color={sourceColor}
            sx={{
              bgcolor:"transparent",
              px: 1,
              py: 0.5,
              borderRadius: 1,
            }}
          >
            {sourceLabel}: {sourceId}
          </Typography>
        </Box>

        <Box display="flex" gap={2}>
          <Box
            flex={1}
            textAlign="center"
            p={1}
            border={1}
            borderColor="success.light"
            borderRadius={1}
            bgcolor="background.default"
          >
            <Typography
              variant="caption"
              color="success.main"
              fontWeight="bold"
            >
              COMPLIANT
            </Typography>
            <Typography variant="h5" color="success.main" fontWeight="bold">
              {stats?.compliant || 0}
            </Typography>
          </Box>
          <Box
            flex={1}
            textAlign="center"
            p={1}
            border={1}
            borderColor="error.light"
            borderRadius={1}
            bgcolor="background.default"
          >
            <Typography variant="caption" color="error.main" fontWeight="bold">
              NON-COMPLIANT
            </Typography>
            <Typography variant="h5" color="error.main" fontWeight="bold">
              {stats?.nonCompliant || 0}
            </Typography>
          </Box>
          <Box
            flex={1}
            textAlign="center"
            p={1}
            border={1}
            borderColor="divider"
            borderRadius={1}
            bgcolor="background.default"
          >
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight="bold"
            >
              IGNORED
            </Typography>
            <Typography variant="h5" color="text.primary" fontWeight="bold">
              {stats?.ignored || 0}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Divider sx={{ mb: 2 }} />

      {/* SEZIONE 2: Lista delle Tracce modificate */}
      <Typography variant="subtitle2" fontWeight="bold" mb={1}>
        Processed Traces ({visualList.length})
      </Typography>

      {visualList.length === 0 ? (
        <Typography variant="body2" color="text.secondary" fontStyle="italic">
          No Trace Returned
        </Typography>
      ) : (
        visualList.map((item, index) => {
          const caseId = getTraceId(item.data, caseColumn);

          return (
            <Accordion
              key={`trace-${index}`}
              disableGutters
              sx={{
                mb: 1,
                border: 1,
                borderColor: `${item.color}.main`,
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary
                expandMoreIcon={<ExpandMoreIcon />}
                sx={{ bgcolor: "background.default" }}
              >
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  width="100%"
                  pr={2}
                >
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    Case ID: {caseId}
                  </Typography>
                  <Chip
                    label={item.label}
                    color={item.color}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: "bold" }}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails
                sx={{
                  bgcolor: "background.paper", 
                  p: 0,
                  borderTop: 1,
                  borderColor: "divider",
                }}
              >
                <Box
                  component="pre"
                  sx={{
                    m: 0,
                    p: 2,
                    overflowX: "auto",
                    maxHeight: "400px",
                    overflowY: "auto",
                    fontSize: "0.75rem",
                    fontFamily: "monospace",
                  }}
                >
                  {JSON.stringify(item.data, null, 2)}
                </Box>
              </AccordionDetails>
            </Accordion>
          );
        })
      )}
    </Box>
  );
}
