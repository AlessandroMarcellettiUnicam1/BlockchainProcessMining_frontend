import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Select,
  MenuItem,
  InputLabel,
  Tooltip,
  IconButton,
} from "@mui/material";
import { FileUpload } from "@mui/icons-material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useQuery } from "react-query";
import {
  _getCollections,
  _getTransactionsFromDb,
  _convertLogsToXes,
} from "../../api/services.js";
import { HiddenInput } from "../HiddenInput";
import { CollectionDropdown } from "../dataVisualization/CollectionDropdown";

const jsonKeys = [
  "functionName",
  "transactionHash",
  "blockNumber",
  "contractAddress",
  "sender",
  "gasUsed",
  "timestamp",
  "inputs",
  "value",
  "storageState",
  "internalTxs",
  "events",
];

export default function XesConverter({
  mapping,
  setMapping,
  onConversionSuccess,
  previousSessionId,
}) {
  const [dataSource, setDataSource] = useState("database");
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [query, setQuery] = useState({});
  const [transactionsJson, setTransactionsJson] = useState(null);
  const [isConverting, setIsConverting] = useState(false);

  const { data: collections } = useQuery({
    queryKey: ["collections"],
    queryFn: _getCollections,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  const { data: dbResults } = useQuery({
    queryKey: ["dbData", query],
    queryFn: () => _getTransactionsFromDb(query),
    enabled: dataSource === "database" && query.selectedCollection?.length > 0,
  });

  useEffect(() => {
    if (dbResults) {
      setTransactionsJson(dbResults);
    }
  }, [dbResults]);

  const handleFileChange = (e) => {
    const fileReader = new FileReader();
    fileReader.onload = (event) => {
      const content = event.target.result;
      try {
        const parsed = JSON.parse(content);
        setTransactionsJson(parsed);
      } catch (err) {
        console.error("Invalid JSON file");
        alert("Il file non è un JSON valido");
      }
    };
    if (e.target.files[0]) {
      fileReader.readAsText(e.target.files[0]);
    }
    e.target.value = null;
  };

  const handleMappingChange = (field) => (event) => {
    setMapping({ ...mapping, [field]: event.target.value });
  };

  const handleConfirmAndConvert = async () => {
    setIsConverting(true);
    try {
      let cleanData = transactionsJson;
      if (cleanData && cleanData.data) cleanData = cleanData.data;
      if (!Array.isArray(cleanData)) cleanData = [cleanData];

      const payload = {
        data: cleanData,
        case_col: mapping.case_col,
        activity_col: mapping.activity_col,
        time_col: mapping.time_col,
        xes_name: "base_log_session",
        previousSessionId: previousSessionId,
      };

      const response = await _convertLogsToXes(payload);

      onConversionSuccess(response.sessionId, response.columns);

      alert("Conversione XES completata. Session ID: " + response.sessionId);
    } catch (error) {
      console.error("Errore durante la conversione", error);
      alert("Errore durante la conversione");
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <Box>
      <FormControl mb={2}>
        <RadioGroup
          row
          value={dataSource}
          onChange={(e) => setDataSource(e.target.value)}
        >
          <FormControlLabel
            value="file"
            control={<Radio />}
            label="JSON File"
          />
          <FormControlLabel
            value="database"
            control={<Radio />}
            label="Database"
          />
        </RadioGroup>
      </FormControl>

      <Box mt={2}>
        {dataSource === "file" && (
          <Button
            component="label"
            variant="contained"
            startIcon={<FileUpload />}
          >
            Upload File
            <HiddenInput
              type="file"
              accept=".json, application/json"
              onChange={handleFileChange}
            />
          </Button>
        )}
        {dataSource === "database" && (
          <CollectionDropdown
            selectedCollections={selectedCollections}
            setSelectedCollections={setSelectedCollections}
            collections={collections}
            query={query}
            setQueryState={setQuery}
          />
        )}
      </Box>

      {transactionsJson && (
        <Box mt={3}>
          <Typography variant="body2" color="success.main" mb={2}>
            ✓ Transactions loaded
          </Typography>

          <Box display="flex" gap={2} mb={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Case Id</InputLabel>
              <Select
                value={mapping.case_col}
                label="Case Id"
                onChange={handleMappingChange("case_col")}
              >
                {jsonKeys.map((key) => (
                  <MenuItem key={key} value={key}>
                    {key}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Activity Key</InputLabel>
              <Select
                value={mapping.activity_col}
                label="Activity Key"
                onChange={handleMappingChange("activity_col")}
              >
                {jsonKeys.map((key) => (
                  <MenuItem key={key} value={key}>
                    {key}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Timestamp</InputLabel>
              <Select
                value={mapping.time_col}
                label="Timestamp"
                onChange={handleMappingChange("time_col")}
              >
                {jsonKeys.map((key) => (
                  <MenuItem key={key} value={key}>
                    {key}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      )}

      <Box mt={3}>
        <Button
          variant="contained"
          color="primary"
          disabled={
            isConverting ||
            !transactionsJson ||
            transactionsJson.length === 0 ||
            !mapping.case_col ||
            !mapping.activity_col ||
            !mapping.time_col
          }
          onClick={handleConfirmAndConvert}
        >
          {isConverting ? "Converting..." : "Generate base XES"}
        </Button>
      </Box>
    </Box>
  );
}
