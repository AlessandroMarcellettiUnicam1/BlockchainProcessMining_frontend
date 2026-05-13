/* import React, {useEffect, useState} from 'react';
import {Box, Button, Stack, Typography} from "@mui/material";
import AddBoxIcon from '@mui/icons-material/AddBox';

import CustomTypography from "../components/CustomTypography";
import ObjectType from "../components/objectTypes/ObjectType";

import ActivityEventType from "../components/eventTypes/ActivityEventType";
import useDataContext from "../context/useDataContext";
import PageLayout from '../layouts/PageLayout';
import XesType from '../components/xesType/XesType';
import { _ocelXes } from '../api/services';


function XesPage() {

    const {results} = useDataContext();

    const [loading, setLoading] = useState(false)

    const [caseId, setCaseId] = useState([])

    const [activityKey, setActivityKey] = useState([])

    const [timestamp, setTimestamp] = useState([])

    const {setXes} = useDataContext()


    const sendObjectForXes = () => {
            setLoading(true)
            _ocelXes({caseId,activityKey,timestamp},results).then((response) => {
                // const xmlString =response.data.xesString;
                // const parser = new DOMParser();
                // const xmlDoc = parser.parseFromString(xmlString, "text/xml");
                // console.log(xmlDoc.documentElement);
                setXes(response.data)
                setLoading(false)
            }).then()
        }
    return (
        <PageLayout loading={loading}>
            <Box display="flex" justifyContent="center">
                <Box position="relative" height="100%" width={520} paddingBottom={2}>
                    <Typography variant="h3">
                        Selection form
                    </Typography>
                    <Stack marginY={3} height="calc(100vh - 300px)" overflow="auto">
                        <CustomTypography>
                            Case Id
                            <XesType name="case_id"
                            objectToSet={setCaseId}/>
                        </CustomTypography>
                        <CustomTypography>
                            activity key
                            <XesType name="activity_key"
                            objectToSet={setActivityKey}
                            />
                        </CustomTypography>
                        <CustomTypography>
                            timestamp
                            <XesType name="timestamp"
                            objectToSet={setTimestamp}
                            />
                        </CustomTypography>
                    </Stack>
                </Box>
            </Box>
            <Box display="flex" justifyContent="center">
                <Button  component="label" variant="contained" onClick={sendObjectForXes} sx={{padding: 1}}>
                    Create Xes file
                </Button>
            </Box>
        </PageLayout>
    )
}

export default XesPage;
 */
/* import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Stack,
  Typography,
} from '@mui/material';

import CustomTypography from '../components/CustomTypography';
import useDataContext from '../context/useDataContext';
import PageLayout from '../layouts/PageLayout';
import XesType from '../components/xesType/XesType';
import { _ocelXes } from '../api/services';

function XesPage() {
  const { results, setResults, setXes } = useDataContext();

  const [loading, setLoading] = useState(false);
  const [caseId, setCaseId] = useState([]);
  const [activityKey, setActivityKey] = useState([]);
  const [timestamp, setTimestamp] = useState([]);

  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [localResults, setLocalResults] = useState(null);

  const activeResults = localResults ?? results;

  const previewKeys = useMemo(() => {
    if (!Array.isArray(activeResults) || activeResults.length === 0) return [];
    const first = activeResults[0];
    if (!first || typeof first !== 'object') return [];
    return Object.keys(first).slice(0, 18);
  }, [activeResults]);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setUploadedFileName(file.name);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!Array.isArray(parsed)) {
        throw new Error('Il file JSON deve contenere un array di transazioni.');
      }

      setLocalResults(parsed);
      if (typeof setResults === 'function') {
        setResults(parsed);
      }
    } catch (error) {
      setLocalResults(null);
      setUploadedFileName('');
      setUploadError(error instanceof Error ? error.message : 'Errore nel caricamento del file');
    }
  };

  const sendObjectForXes = () => {
    if (!activeResults || !Array.isArray(activeResults) || activeResults.length === 0) {
      setUploadError('Carica prima un file JSON valido.');
      return;
    }

    setLoading(true);
    _ocelXes({ caseId, activityKey, timestamp }, activeResults)
      .then((response) => {
        setXes(response.data);
      })
      .catch((error) => {
        setUploadError(
          error?.response?.data?.message ||
            error?.message ||
            'Errore durante la creazione del file XES'
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <PageLayout loading={loading}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '360px 1fr' },
          gap: 3,
          alignItems: 'start',
          px: 2,
        }}
      >
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            p: 2.5,
            minHeight: 360,
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="h5" sx={{ mb: 2 }}>
            Upload JSON
          </Typography>

          <Stack spacing={2}>
            <Button variant="outlined" component="label">
              Carica file JSON
              <input
                hidden
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
              />
            </Button>

            {uploadedFileName && (
              <Alert severity="success">File caricato: {uploadedFileName}</Alert>
            )}

            {uploadError && <Alert severity="error">{uploadError}</Alert>}

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Anteprima chiavi rilevate
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {previewKeys.length > 0 ? (
                  previewKeys.map((key) => <Chip key={key} label={key} size="small" />)
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Nessun dato caricato.
                  </Typography>
                )}
              </Stack>
            </Box>

            <Typography variant="body2" color="text.secondary">
              Il file caricato viene passato alla pagina XES e usato per la conversione.
            </Typography>
          </Stack>
        </Box>

        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            p: 2.5,
            minHeight: 360,
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="h4">Selection form</Typography>

          <Stack marginY={3} spacing={2} maxHeight="calc(100vh - 300px)" overflow="auto">
            <CustomTypography>
              Case Id
              <XesType name="case_id" objectToSet={setCaseId} />
            </CustomTypography>

            <CustomTypography>
              activity key
              <XesType name="activity_key" objectToSet={setActivityKey} />
            </CustomTypography>

            <CustomTypography>
              timestamp
              <XesType name="timestamp" objectToSet={setTimestamp} />
            </CustomTypography>
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Data source: {uploadedFileName || 'dataset già presente nel contesto'}
          </Typography>

          <Box display="flex" justifyContent="center">
            <Button
              component="label"
              variant="contained"
              onClick={sendObjectForXes}
              sx={{ padding: 1 }}
              disabled={!activeResults || activeResults.length === 0}
            >
              Create Xes file
            </Button>
          </Box>
        </Box>
      </Box>
    </PageLayout>
  );
}

export default XesPage;
 */
import React, { useState } from 'react';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';

import CustomTypography from '../components/CustomTypography';
import useDataContext from '../context/useDataContext';
import PageLayout from '../layouts/PageLayout';
import XesType from '../components/xesType/XesType';
import { _ocelXes, _extractXesKeys } from '../api/services';

function XesPage() {
  const { results, setXes } = useDataContext();

  const [loading, setLoading] = useState(false);
  const [caseId, setCaseId] = useState([]);
  const [activityKey, setActivityKey] = useState([]);
  const [timestamp, setTimestamp] = useState([]);

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');

  const [availableKeys, setAvailableKeys] = useState([]);

  const handleFileChange = async (event) => {
  const file = event.target.files?.[0] ?? null;
  setFileError('');

  if (!file) {
    setSelectedFile(null);
    setAvailableKeys([]);
    return;
  }

  const isJson = file.name.toLowerCase().endsWith('.json') || file.type === 'application/json';
  if (!isJson) {
    setSelectedFile(null);
    setAvailableKeys([]);
    setFileError('Seleziona un file JSON valido.');
    return;
  }

  setSelectedFile(file);

  const response = await _extractXesKeys(file);
  if (response.status >= 200 && response.status < 300) {
    setAvailableKeys(response.data.keys || []);
  } else {
    setAvailableKeys([]);
    setFileError(response.data?.message || 'Impossibile estrarre le chiavi dal file');
  }
};

  /* const sendObjectForXes = () => {
    if (!selectedFile) {
      setFileError('Prima carica il file JSON da convertire.');
      return;
    }

    setLoading(true);
    _ocelXes({ caseId, activityKey, timestamp }, selectedFile)
      .then((response) => {
        setXes(response.data);
      })
      .catch((error) => {
        setFileError(
          error?.response?.data?.message ||
            error?.message ||
            'Errore durante la creazione del file XES'
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }; */
  const sendObjectForXes = () => {
  if (!selectedFile) {
    setFileError('Prima carica il file JSON da convertire.');
    return;
  }

  setLoading(true);

  _ocelXes({ caseId, activityKey, timestamp }, selectedFile)
    .then((response) => {
      setXes(response.data);

      const xesString = response.data?.xesString;
      if (!xesString) {
        throw new Error("XES string not found in response");
      }

      const blob = new Blob([xesString], { type: "application/xml;charset=utf-8" });
      const href = window.URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = "log.xes";
      anchor.click();

      window.URL.revokeObjectURL(href);
    })
    .catch((error) => {
      setFileError(
        error?.response?.data?.message ||
          error?.message ||
          'Errore durante la creazione del file XES'
      );
    })
    .finally(() => {
      setLoading(false);
    });
};

  return (
    <PageLayout loading={loading}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '360px 1fr' },
          gap: 3,
          alignItems: 'start',
        }}
      >
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            p: 2.5,
            minHeight: 360,
          }}
        >
          <Typography variant="h5" sx={{ mb: 2 }}>
            Upload file JSON
          </Typography>

          <Stack spacing={2}>
            <Button variant="outlined" component="label">
              Carica JSON
              <input hidden type="file" accept="application/json,.json" onChange={handleFileChange} />
            </Button>

            {selectedFile && (
              <Alert severity="success">File selezionato: {selectedFile.name}</Alert>
            )}

            {fileError && <Alert severity="error">{fileError}</Alert>}

            {/* <Typography variant="body2" color="text.secondary">
              Il file non viene più letto nel browser: viene inviato direttamente al backend.
            </Typography> */}
          </Stack>
        </Box>

        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            p: 2.5,
            minHeight: 360,
          }}
        >
          <Typography variant="h3">Selection form</Typography>

          <Stack marginY={3} height="calc(100vh - 300px)" overflow="auto">
            <CustomTypography>
              Case Id
              <XesType name="case_id" objectToSet={setCaseId} options={availableKeys} />
            </CustomTypography>
            <CustomTypography>
              activity key
              <XesType name="activity_key" objectToSet={setActivityKey} options={availableKeys} />
            </CustomTypography>
            <CustomTypography>
              timestamp
              <XesType name="timestamp" objectToSet={setTimestamp} options={availableKeys} />
            </CustomTypography>
          </Stack>

          <Box display="flex" justifyContent="center">
            <Button
              component="label"
              variant="contained"
              onClick={sendObjectForXes}
              sx={{ padding: 1 }}
              disabled={!selectedFile}
            >
              Create Xes file
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Dataset attivo: {selectedFile ? selectedFile.name : 'nessun file caricato'}
          </Typography>
        </Box>
      </Box>
    </PageLayout>
  );
}

export default XesPage;
