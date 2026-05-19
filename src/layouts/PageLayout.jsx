import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Stack,
  styled,
  Typography,
} from '@mui/material';
import JsonView from '@uiw/react-json-view';
import { darkTheme } from '@uiw/react-json-view/dark';
import { Download, FileUpload, Delete } from '@mui/icons-material';
import {
  _downloadCSV,
  _downloadCSVOCEL,
  _downloadJson,
  _downloadJSONOCEL,
  _downloadOCEL,
} from '../api/services';
import useDataContext from '../context/useDataContext';
import { Link, useLocation } from 'react-router';
import { HiddenInput } from '../components/HiddenInput';

const CardContentNoPadding = styled(CardContent)(`
  padding-top: 0;
  &:last-child {
    padding-bottom: 0;
  }
`);

const MAX_DISPLAY_SIZE = 49;

const limitJsonSize = (data) => {
  if (!data) return null;

  if (Array.isArray(data)) {
    if (data.length > MAX_DISPLAY_SIZE) {
      return [
        ...data.slice(0, MAX_DISPLAY_SIZE),
        { __note: `+ ${data.length - MAX_DISPLAY_SIZE} items` },
      ];
    }
    return data;
  }

  if (typeof data === 'object') {
    if (data.events || data.objects || data.eventTypes || data.objectTypes) {
      const result = {};
      for (const key of Object.keys(data)) {
        if (Array.isArray(data[key])) {
          if (data[key].length > MAX_DISPLAY_SIZE) {
            result[key] = [
              ...data[key].slice(0, MAX_DISPLAY_SIZE),
              { __note: `+ ${data[key].length - MAX_DISPLAY_SIZE} more ${key}` },
            ];
          } else {
            result[key] = data[key];
          }
        } else {
          result[key] = data[key];
        }
      }
      return result;
    }

    const keys = Object.keys(data);
    if (keys.length > MAX_DISPLAY_SIZE) {
      const limitedObj = {};
      keys.slice(0, MAX_DISPLAY_SIZE).forEach((key) => {
        limitedObj[key] = data[key];
      });
      limitedObj.__note = `+ ${keys.length - MAX_DISPLAY_SIZE} properties`;
      return limitedObj;
    }
    return data;
  }

  return data;
};

function PageLayout({ children, loading, setLoading }) {
  const { pathname } = useLocation();
  const path = pathname.replace(/\/$/, '');

  const { results, setResults, ocel, setOcel, setXes, xes } = useDataContext();

  const isXesPage = path.toLowerCase().includes('xes');
  const isOcelPage = path.toLowerCase().includes('ocel');
  const hasXes = Boolean(xes?.xesString);

  const [showOcel, setShowOcel] = useState(false);
  const [showXes, setShowXes] = useState(false);

  useEffect(() => {
    if (isXesPage && hasXes) {
      setShowXes(true);
    }
  }, [isXesPage, hasXes]);

  const xesPreview = useMemo(() => {
    const xesString = xes?.xesString || '<empty></empty>';
    return xesString.split('\n').slice(0, 100).join('\n');
  }, [xes]);

  const handleShowXes = () => {
    setShowXes((prev) => !prev);
  };

  const handleDeleteXes = () => {
    setResults(null);
    setXes({ xesString: null });
    setShowXes(false);
    window.history.replaceState({}, '', path);
  };

  const handleShowOcel = () => {
    setShowOcel((prev) => !prev);
  };

  const handleDelete = () => {
    setResults(null);
    setOcel({
      eventTypes: [],
      objectTypes: [],
      events: [],
      objects: [],
    });
    window.history.replaceState({}, '', path);
  };

  const handleFileChange = (e) => {
    const fileReader = new FileReader();
    fileReader.onload = (ev) => {
      const content = ev.target.result;
      setResults(JSON.parse(content));
    };
    fileReader.readAsText(e.target.files[0]);
    e.target.value = null;
  };

  const downloadJson = async () => {
    setLoading && setLoading(true);
    const response = await _downloadJson(results);
    const href = window.URL.createObjectURL(response);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = 'jsonLog.json';
    anchor.click();
    window.URL.revokeObjectURL(href);
    setLoading && setLoading(false);
  };

  const downloadCSV = async () => {
    setLoading && setLoading(true);
    const response = await _downloadCSV(results);
    const href = window.URL.createObjectURL(response);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = 'jsonLog.csv';
    anchor.click();
    window.URL.revokeObjectURL(href);
    setLoading && setLoading(false);
  };

  const downloadXES = async () => {
    setLoading && setLoading(true);
    try {
      const xesString = xes?.xesString || '';
      const blob = new Blob([xesString], { type: 'application/xml;charset=utf-8' });
      const href = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = href;
      anchor.download = 'log.xes';
      anchor.click();
      window.URL.revokeObjectURL(href);
    } catch (error) {
      console.error('Error downloading XES file:', error);
    } finally {
      setLoading && setLoading(false);
    }
  };

  const downloadOcel = async () => {
    const response = await _downloadOCEL(ocel);
    const href = window.URL.createObjectURL(response);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = 'ocel.json';
    anchor.click();
    window.URL.revokeObjectURL(href);
  };

  const downloadJSONOcel = async () => {
    const response = await _downloadJSONOCEL(ocel);
    const href = window.URL.createObjectURL(response);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = 'ocel.jsonocel';
    anchor.click();
    window.URL.revokeObjectURL(href);
  };

  const downloadCSVOcel = async () => {
    const response = await _downloadCSVOCEL(ocel);
    const href = window.URL.createObjectURL(response);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = 'ocel.csv';
    anchor.click();
    window.URL.revokeObjectURL(href);
  };

  const renderPageButtons = () => {
    if (isOcelPage) {
      return (
        <Box display="flex" justifyContent="space-between" gap={2}>
          <Button component="label" variant="contained" startIcon={<FileUpload />} sx={{ padding: 1, height: '55px' }}>
            Upload File
            <HiddenInput type="file" onChange={handleFileChange} />
          </Button>
          <Button variant="contained" onClick={downloadOcel} sx={{ padding: 1, width: '125px', height: '55px' }}>
            <Typography color="white">Download JSON</Typography>
          </Button>
          <Link to="/">
            <Button
              color="error"
              variant="contained"
              onClick={() => {
                setOcel({ eventTypes: [], objectTypes: [], events: [], objects: [] });
              }}
              sx={{ padding: 1, width: '125px', height: '55px' }}
            >
              <Typography>BACK</Typography>
            </Button>
          </Link>
          <Button
            variant="contained"
            onClick={downloadJSONOcel}
            sx={{
              padding: 1,
              width: '125px',
              height: '55px',
              backgroundColor: '#5316ec',
            }}
          >
            <Typography color="white">Download JSONOCEL</Typography>
          </Button>
          <Button
            variant="contained"
            onClick={downloadCSVOcel}
            sx={{
              padding: 1,
              width: '125px',
              height: '55px',
              backgroundColor: '#1dec16',
            }}
          >
            <Typography color="white">Download CSV OCEL</Typography>
          </Button>
        </Box>
      );
    }

    if (isXesPage) {
      return (
        <Box display="flex" justifyContent="space-evenly" alignItems="center" gap={1}>
          <Button
            disabled={!results}
            startIcon={<Download />}
            onClick={downloadJson}
            variant="contained"
            sx={{ padding: 1, width: 120 }}
          >
            <Typography variant="h6">JSON</Typography>
          </Button>
          <Button
            disabled={!xes?.xesString}
            startIcon={<Download />}
            onClick={downloadXES}
            variant="contained"
            sx={{
              padding: 1,
              width: 120,
              backgroundColor: '#38a651',
              '&:hover': { backgroundColor: '#2f6749' },
            }}
          >
            <Typography variant="h6">XES</Typography>
          </Button>
          <Button
            disabled={!results}
            startIcon={<Download />}
            onClick={downloadCSV}
            variant="contained"
            sx={{
              padding: 1,
              width: 120,
              backgroundColor: '#38a651',
              '&:hover': { backgroundColor: '#2f6749' },
            }}
          >
            <Typography variant="h6">CSV</Typography>
          </Button>
        </Box>
      );
    }

    return (
      <Box display="flex" justifyContent="space-evenly" alignItems="center" gap={1}>
        <Button
          disabled={!results}
          startIcon={<Download />}
          onClick={downloadJson}
          variant="contained"
          sx={{ padding: 1, width: 120 }}
        >
          <Typography variant="h6">JSON</Typography>
        </Button>
        <Button
          disabled={!results}
          startIcon={<Download />}
          onClick={downloadCSV}
          variant="contained"
          sx={{
            padding: 1,
            width: 120,
            backgroundColor: '#38a651',
            '&:hover': { backgroundColor: '#2f6749' },
          }}
        >
          <Typography variant="h6">CSV</Typography>
        </Button>
      </Box>
    );
  };

  console.log('PATH:', path);
  console.log('XES object:', xes);
  console.log('XES length:', xes?.xesString?.length);

  return (
    <Box display="flex" justifyContent="center" marginTop={5} paddingX={5} height="100%">
      <Grid container spacing={2}>
        <Grid item lg={6} md={12} width="100%">
          {children}
        </Grid>
        <Grid item lg={6} md={12} width="100%">
          <Stack spacing={1}>
            <Card sx={{ minWidth: '500px', height: '500px', backgroundColor: '#202020' }}>
              <Box
                height="40px"
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                padding={2}
              >
                <Typography variant="h5" color="#FFFFFF">
                  Contract Logs
                </Typography>

                {isOcelPage && (
                  <Button variant="contained" sx={{ padding: 1, width: '130px' }} onClick={handleShowOcel}>
                    {showOcel ? 'Show Logs' : 'Show OCEL'}
                  </Button>
                )}

                {!isXesPage && (
                  <Button
                    disabled={!results}
                    color="error"
                    onClick={handleDelete}
                    sx={{ padding: 0, '&.Mui-disabled': { color: 'rgba(255, 0, 0, 0.5)' } }}
                  >
                    <Delete />
                  </Button>
                )}

                {isXesPage && (
                  <Button variant="contained" sx={{ padding: 1, width: '140px' }} onClick={handleShowXes}>
                    {showXes ? 'Hide preview' : 'Show preview'}
                  </Button>
                )}

                {isXesPage && (
                  <Button
                    disabled={!xes?.xesString}
                    color="error"
                    onClick={handleDeleteXes}
                    sx={{ padding: 0, '&.Mui-disabled': { color: 'rgba(255, 0, 0, 0.5)' } }}
                  >
                    <Delete />
                  </Button>
                )}
              </Box>

              <CardContentNoPadding
                sx={{ height: 'calc(100% - 112px)', overflowY: 'auto', overflowX: 'auto', whiteSpace: 'pre', overflow: 'auto' }}
              >
                {loading ? (
                  <Box width="100%" height="100%" display="flex" justifyContent="center" alignItems="center">
                    <CircularProgress />
                  </Box>
                ) : showOcel ? (
                  <JsonView value={ocel} style={{ ...darkTheme, fontSize: '14px' }} width="100%" />
                ) : isXesPage && showXes && hasXes ? (
                  <Box
                    sx={{
                      width: '100%',
                      maxWidth: '100%',
                      overflowX: 'auto',
                      whiteSpace: 'pre',
                      backgroundColor: '#1e1e1e',
                      padding: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'inline-block',
                        minWidth: '100%',
                      }}
                    >
                      <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{xesPreview}</pre>
                    </Box>
                  </Box>
                ) : results ? (
                  <JsonView value={limitJsonSize(results)} style={{ ...darkTheme, fontSize: '14px' }} width="100%" />
                ) : null}
              </CardContentNoPadding>
            </Card>

            {renderPageButtons()}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

export default PageLayout;
