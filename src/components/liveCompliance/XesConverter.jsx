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
  "status",
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
  const [isConversionDone, setIsConversionDone] = useState(false); 

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
        alert("Invalid JSON file");
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
    setIsConversionDone(false);
    try {
      let cleanData = [];

      if (dataSource !== "empty") {
        cleanData = transactionsJson;
        if (cleanData && cleanData.data) cleanData = cleanData.data;
        if (!Array.isArray(cleanData)) cleanData = [cleanData];
      }

      const payload = {
        data: cleanData,
        case_col: mapping.case_col,
        activity_col: mapping.activity_col,
        time_col: mapping.time_col,
        xes_name: "base_log_session",
        previousSessionId: previousSessionId,
      };

      const response = await _convertLogsToXes(payload);

      let columnsToPass = response.columns;

      if (
        dataSource === "empty" ||
        !columnsToPass ||
        columnsToPass.length === 0
      ) {
        columnsToPass = [...jsonKeys];
      }

      onConversionSuccess(response.sessionId, columnsToPass);
      setIsConversionDone(true);
    } catch (error) {
      console.error("Errore durante la conversione", error);
      alert("Conversion error");
    } finally {
      setIsConverting(false);
    }
  };

  const isDataReady =
    dataSource === "empty" ||
    (transactionsJson && Object.keys(transactionsJson).length > 0);
  const isMappingComplete =
    mapping.case_col && mapping.activity_col && mapping.time_col;

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
          <FormControlLabel
            value="empty"
            control={<Radio />}
            label="No starting log"
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
        {dataSource === "empty" && (
          <Typography variant="body2" color="textSecondary" sx={{ py: 1 }}>
            Monitoring will start with an empty log
          </Typography>
        )}
      </Box>

      {dataSource !== "empty" && transactionsJson && (
        <Typography variant="body2" color="success.main" mb={2}>
          ✓ Transactions loaded
        </Typography>
      )}

      <Box mt={3}>
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

      <Box mt={3}>
        <Button
          variant="contained"
          color="primary"
          disabled={isConverting || !isDataReady || !isMappingComplete}
          onClick={handleConfirmAndConvert}
        >
          {isConverting ? "Converting..." : "Generate base XES"}
        </Button>
      </Box>

      {isConversionDone && (
        <Typography variant="body2" color="success.main" mt={4}>
          ✓ Base XES log created.
        </Typography>
      )}
    </Box>
  );
}
