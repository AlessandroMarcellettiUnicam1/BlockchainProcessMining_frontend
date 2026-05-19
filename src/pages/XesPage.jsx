import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from '@mui/material';
import { FileUpload } from '@mui/icons-material';

import useDataContext from '../context/useDataContext';
import PageLayout from '../layouts/PageLayout';
import CustomTypography from '../components/CustomTypography';
import XesType from '../components/xesType/XesType';
import { CollectionDropdown } from '../components/dataVisualization/CollectionDropdown';
import {
  _ocelXes,
  _extractXesKeys,
  _getCollections,
  _getTransactionsFromCollections,
} from '../api/services';

function createJsonFileFromRecords(records, fileName = 'database-log.json') {
  return new File([JSON.stringify(records, null, 2)], fileName, {
    type: 'application/json',
  });
}

function XesPage() {
  const { setXes } = useDataContext();

  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState('file');

  const [caseId, setCaseId] = useState([]);
  const [activityKey, setActivityKey] = useState([]);
  const [timestamp, setTimestamp] = useState([]);

  const [sourceFile, setSourceFile] = useState(null);
  const [sourceLabel, setSourceLabel] = useState('');
  const [sourceError, setSourceError] = useState('');
  const [availableKeys, setAvailableKeys] = useState([]);

  const [collections, setCollections] = useState([]);
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [collectionsError, setCollectionsError] = useState('');
  const [databaseLoading, setDatabaseLoading] = useState(false);
  const [databaseQuery, setDatabaseQuery] = useState({ selectedCollection: [] });

  const sourceTitle = useMemo(() => {
    return dataSource === 'file' ? 'JSON file' : 'Database';
  }, [dataSource]);

  const resetDatabaseState = () => {
    setCollections([]);
    setSelectedCollections([]);
    setCollectionsError('');
    setDatabaseLoading(false);
    setDatabaseQuery({ selectedCollection: [] });
  };

  const resetFileState = () => {
    setSourceFile(null);
    setSourceLabel('');
    setSourceError('');
    setAvailableKeys([]);
  };

  const handleSourceChange = (event) => {
    const nextSource = event.target.value;
    setDataSource(nextSource);
    setSourceError('');
    setCollectionsError('');

    if (nextSource === 'file') {
      resetDatabaseState();
      resetFileState();
    } else {
      resetFileState();
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0] ?? null;
    setSourceError('');

    if (!file) {
      resetFileState();
      return;
    }

    const isJson = file.name.toLowerCase().endsWith('.json') || file.type === 'application/json';
    if (!isJson) {
      resetFileState();
      setSourceError('Please select a valid JSON file.');
      return;
    }

    setSourceFile(file);
    setSourceLabel(file.name);

    try {
      const response = await _extractXesKeys(file);
      if (response.status >= 200 && response.status < 300) {
        setAvailableKeys(response.data.keys || []);
      } else {
        setAvailableKeys([]);
        setSourceError(response.data?.message || 'Unable to extract keys from the file.');
      }
    } catch (error) {
      setAvailableKeys([]);
      setSourceError(error?.response?.data?.message || error?.message || 'Unable to extract keys from the file.');
    }
  };

  useEffect(() => {
    let active = true;

    if (dataSource !== 'database') return undefined;

    const loadCollections = async () => {
      setCollectionsLoading(true);
      setCollectionsError('');

      try {
        const response = await _getCollections();
        const names = response?.data ?? [];
        if (!active) return;
        setCollections(Array.isArray(names) ? names : []);
      } catch (error) {
        if (!active) return;
        setCollections([]);
        setCollectionsError(
          error?.response?.data?.message ||
            error?.response?.data ||
            error?.message ||
            'Failed to load collections from MongoDB.'
        );
      } finally {
        if (active) setCollectionsLoading(false);
      }
    };

    loadCollections();

    return () => {
      active = false;
    };
  }, [dataSource]);

  useEffect(() => {
    let active = true;

    if (dataSource !== 'database') return undefined;

    if (!selectedCollections.length) {
      resetFileState();
      return undefined;
    }

    const loadDatabaseSelection = async () => {
      setDatabaseLoading(true);
      setCollectionsError('');
      setSourceError('');

      try {
        const response = await _getTransactionsFromCollections(selectedCollections);
        const records = response?.data ?? [];

        if (!active) return;

        if (!Array.isArray(records) || records.length === 0) {
          setAvailableKeys([]);
          setSourceFile(null);
          setSourceLabel('');
          setSourceError('No documents were returned for the selected collections.');
          return;
        }

        const tempFile = createJsonFileFromRecords(
          records,
          `database-${selectedCollections.join('-').toLowerCase() || 'selection'}.json`
        );

        setSourceFile(tempFile);
        setSourceLabel(`${selectedCollections.length} selected collection(s)`);

        const keyResponse = await _extractXesKeys(tempFile);
        if (!active) return;

        if (keyResponse.status >= 200 && keyResponse.status < 300) {
          setAvailableKeys(keyResponse.data.keys || []);
        } else {
          setAvailableKeys([]);
          setSourceError(keyResponse.data?.message || 'Unable to extract keys from selected database data.');
        }
      } catch (error) {
        if (!active) return;
        setAvailableKeys([]);
        setSourceFile(null);
        setSourceLabel('');
        setSourceError(
          error?.response?.data?.message ||
            error?.response?.data ||
            error?.message ||
            'Failed to load data from the selected collections.'
        );
      } finally {
        if (active) setDatabaseLoading(false);
      }
    };

    loadDatabaseSelection();

    return () => {
      active = false;
    };
  }, [dataSource, selectedCollections]);

  const sendObjectForXes = () => {
    if (!sourceFile) {
      setSourceError(
        dataSource === 'file'
          ? 'Please upload a JSON file first.'
          : 'Please select at least one collection from the database.'
      );
      return;
    }

    setLoading(true);
    setSourceError('');

    _ocelXes({ caseId, activityKey, timestamp }, sourceFile)
      .then((response) => {
        setXes(response.data);
      })
      .catch((error) => {
        setSourceError(
          error?.response?.data?.message ||
            error?.message ||
            'Error while creating the XES file.'
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <PageLayout loading={loading || collectionsLoading || databaseLoading}>
      <Box sx={{ width: '100%', px: { xs: 2, md: 4 }, pb: 4 }}>
        <Stack spacing={3} sx={{ width: '100%' }}>

          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Data source
              </Typography>

              <FormControl>
                <RadioGroup value={dataSource} onChange={handleSourceChange}>
                  <FormControlLabel value="file" control={<Radio />} label="JSON File" />
                  <FormControlLabel value="database" control={<Radio />} label="Database" />
                </RadioGroup>
              </FormControl>

              <Divider sx={{ my: 2.5 }} />

              {dataSource === 'file' && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                  <Button
                    component="label"
                    variant="contained"
                    startIcon={<FileUpload />}
                    sx={{ minHeight: 48, px: 2.5 }}
                  >
                    Upload file
                    <input hidden type="file" accept="application/json,.json" onChange={handleFileChange} />
                  </Button>

                  {sourceLabel && (
                    <Alert severity="success" sx={{ flex: 1, minWidth: 280 }}>
                      Selected file: {sourceLabel}
                    </Alert>
                  )}
                </Box>
              )}

              {dataSource === 'database' && (
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <CollectionDropdown
                    selectedCollections={selectedCollections}
                    setSelectedCollections={setSelectedCollections}
                    collections={collections}
                    query={databaseQuery}
                    setQueryState={setDatabaseQuery}
                  />

                  {collectionsError && <Alert severity="error">{collectionsError}</Alert>}
                  {collectionsLoading && <Alert severity="info">Loading collections from MongoDB...</Alert>}
                  {!collectionsLoading && !collectionsError && collections.length === 0 && (
                    <Alert severity="warning">
                      No collections available in the database.
                    </Alert>
                  )}
                </Box>
              )}

              {sourceError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {sourceError}
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                XES field mapping
              </Typography>

              <Stack spacing={2}>
                <CustomTypography>
                  Case ID
                  <XesType name="case_id" objectToSet={setCaseId} options={availableKeys} />
                </CustomTypography>

                <CustomTypography>
                  Activity key
                  <XesType name="activity_key" objectToSet={setActivityKey} options={availableKeys} />
                </CustomTypography>

                <CustomTypography>
                  Timestamp
                  <XesType name="timestamp" objectToSet={setTimestamp} options={availableKeys} />
                </CustomTypography>
              </Stack>
            </CardContent>
          </Card>

          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Generation
              </Typography>

              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  Active source: {sourceTitle}
                </Typography>

                {sourceLabel && (
                  <Typography variant="body2" color="text.secondary">
                    Selected data: {sourceLabel}
                  </Typography>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    onClick={sendObjectForXes}
                    disabled={!sourceFile}
                    sx={{ minWidth: 220, minHeight: 48 }}
                  >
                    Create XES file
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </PageLayout>
  );
}

export default XesPage;
