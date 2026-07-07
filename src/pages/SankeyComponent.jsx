import React, { useEffect, useMemo, useRef, useState } from "react";
import {
	Box,
	Button,
	CircularProgress,
	FormControl,
	FormControlLabel,
	IconButton,
	InputLabel,
	MenuItem,
	Paper,
	Radio,
	RadioGroup,
	Select,
	Stack,
	Switch,
	TextField,
	Tooltip as MuiTooltip,
	Typography,
} from "@mui/material";
import {
	Add,
	Delete,
	FileUpload,
	FilterList,
	RestartAlt,
	ZoomIn,
	ZoomOut,
} from "@mui/icons-material";
import axios from "axios";
import * as echarts from "echarts/core";
import { SankeyChart } from "echarts/charts";
import { TooltipComponent, ToolboxComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { useQuery } from "react-query";
import { HiddenInput } from "../components/HiddenInput";
import { GraphFilter } from "../components/GraphFilter";
import { CollectionDropdown } from "../components/dataVisualization/CollectionDropdown";
import useDataContext from "../context/useDataContext";
import {
	applyLogFilters,
	getCallRecords,
	getUniqueKeys,
	getValuesByPath,
	stripCallsPrefix,
} from "../utils/logPathUtils";

echarts.use([SankeyChart, TooltipComponent, ToolboxComponent, CanvasRenderer]);

const DEFAULT_LAYERS = ["sender", "contractAddress", "functionName"];
const BATCH_SIZE = 2500;
const LAYER_COLORS = [
	"#1565c0",
	"#00897b",
	"#ef6c00",
	"#7b1fa2",
	"#455a64",
	"#c62828",
	"#6a1b9a",
	"#2e7d32",
];

const waitForBrowser = () =>
	new Promise((resolve) => {
		if ("requestIdleCallback" in window) {
			window.requestIdleCallback(resolve, { timeout: 50 });
			return;
		}
		setTimeout(resolve, 0);
	});

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const shortValue = (value) => {
	if (value === null || value === undefined || value === "") return "Unknown";
	const text = String(value);
	if (/^0x[a-fA-F0-9]{40}$/.test(text) || text.length > 28) {
		return `${text.slice(0, 8)}...${text.slice(-6)}`;
	}
	return text;
};

const toPositiveNumber = (value) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const getWeight = (record, tx, strategy, path) => {
	if (strategy === "occurrences") return 1;
	if (!path) return 1;

	const source = path.startsWith("calls.") ? record : tx;
	const effectivePath = path.startsWith("calls.") ? stripCallsPrefix(path) : path;
	const total = getValuesByPath(source, effectivePath).reduce(
		(sum, value) => sum + toPositiveNumber(value),
		0
	);

	return total > 0 ? total : 0;
};

const addNode = (nodes, nodeIndexes, layer, value, layerIndex) => {
	const key = `${layerIndex}:${layer}:${value || "Unknown"}`;
	if (nodeIndexes.has(key)) return key;

	nodeIndexes.set(key, nodes.length);
	nodes.push({
		name: key,
		layer,
		rawValue: value || "Unknown",
		itemStyle: { color: LAYER_COLORS[layerIndex % LAYER_COLORS.length] },
		label: { formatter: shortValue(value) },
	});

	return key;
};

const addLink = (links, source, target, weight) => {
	if (!source || !target || source === target || weight <= 0) return;

	const key = `${source}->${target}`;
	const existing = links.get(key);
	if (existing) {
		existing.value += weight;
		existing.occurrences += 1;
		return;
	}

	links.set(key, { source, target, value: weight, occurrences: 1 });
};

const finalizeSankeyData = (nodes, links, minOccurrences) => {
	const filteredLinks = Array.from(links.values()).filter(
		(link) => link.occurrences >= minOccurrences
	);
	const connectedNodeNames = new Set();

	filteredLinks.forEach((link) => {
		connectedNodeNames.add(link.source);
		connectedNodeNames.add(link.target);
	});

	return {
		nodes: nodes.filter((node) => connectedNodeNames.has(node.name)),
		links: filteredLinks,
	};
};

const processRecordLayers = (
	record,
	tx,
	selectedLayers,
	nodes,
	nodeIndexes,
	links,
	weightStrategy,
	weightPath,
) => {
	const allCallLayers = selectedLayers.every((layer) => layer.path.startsWith("calls."));
	const weight = getWeight(record, tx, weightStrategy, weightPath);
	if (weight <= 0) return;

	for (let index = 0; index < selectedLayers.length - 1; index += 1) {
		const sourceLayer = selectedLayers[index];
		const targetLayer = selectedLayers[index + 1];
		const sourceRoot = allCallLayers ? record : tx;
		const targetRoot = allCallLayers ? record : tx;
		const sourcePath = allCallLayers ? stripCallsPrefix(sourceLayer.path) : sourceLayer.path;
		const targetPath = allCallLayers ? stripCallsPrefix(targetLayer.path) : targetLayer.path;
		const sourceValues = Array.from(new Set(getValuesByPath(sourceRoot, sourcePath)));
		const targetValues = Array.from(new Set(getValuesByPath(targetRoot, targetPath)));

		sourceValues.forEach((sourceValue) => {
			targetValues.forEach((targetValue) => {
				const source = addNode(nodes, nodeIndexes, sourceLayer.path, sourceValue, index);
				const target = addNode(nodes, nodeIndexes, targetLayer.path, targetValue, index + 1);
				addLink(links, source, target, weight);
			});
		});
	}
};

const buildSankeyDataAsync = async ({
	log,
	layers,
	minOccurrences,
	weightStrategy,
	weightPath,
	onProgress,
	tokenRef,
}) => {
	const nodes = [];
	const nodeIndexes = new Map();
	const links = new Map();
	const transactions = Array.isArray(log) ? log : [];
	const selectedLayers = layers.filter((layer) => layer.path);
	const allCallLayers = selectedLayers.every((layer) => layer.path.startsWith("calls."));

	for (let start = 0; start < transactions.length; start += BATCH_SIZE) {
		if (tokenRef.cancelled) return null;

		const batch = transactions.slice(start, start + BATCH_SIZE);
		batch.forEach((tx) => {
			if (allCallLayers) {
				getCallRecords(tx).forEach((record) => {
					processRecordLayers(
						record,
						tx,
						selectedLayers,
						nodes,
						nodeIndexes,
						links,
						weightStrategy,
						weightPath,
					);
				});
				return;
			}

			processRecordLayers(
				tx,
				tx,
				selectedLayers,
				nodes,
				nodeIndexes,
				links,
				weightStrategy,
				weightPath,
			);
		});

		onProgress(Math.min(start + batch.length, transactions.length), transactions.length);
		await waitForBrowser();
	}

	return finalizeSankeyData(nodes, links, minOccurrences);
};

const parseNodeKey = (nodeKey) => {
	const [, layer, ...valueParts] = String(nodeKey).split(":");
	return { layer, value: valueParts.join(":") };
};

const SankeyChartView = ({ data, height, width, zoom, readableLabels }) => {
	const chartRef = useRef(null);
	const chartInstanceRef = useRef(null);
	const labelScale = readableLabels && zoom < 1 ? 1 / zoom : zoom;
	const labelFontSize = clamp(Math.round(12 * labelScale), 10, 30);
	const labelWidth = clamp(Math.round(150 * labelScale), 120, 460);

	const option = useMemo(
		() => ({
			backgroundColor: "#ffffff",
			tooltip: {
				trigger: "item",
				triggerOn: "mousemove",
				formatter: (params) => {
					if (params.dataType === "edge") {
						const source = parseNodeKey(params.data.source);
						const target = parseNodeKey(params.data.target);
						return [
							`<strong>${source.layer}</strong>: ${source.value}`,
							`<strong>${target.layer}</strong>: ${target.value}`,
							`<strong>Occurrences</strong>: ${Number(params.data.occurrences || 0).toLocaleString()}`,
							`<strong>Weight</strong>: ${Number(params.data.value || 0).toLocaleString()}`,
						].join("<br/>");
					}
					return `<strong>${params.data.layer}</strong>: ${params.data.rawValue}`;
				},
			},
			toolbox: { right: 16, top: 8, feature: { restore: {}, saveAsImage: {} } },
			series: [
				{
					type: "sankey",
					data: data.nodes,
					links: data.links,
					top: 48,
					right: 180,
					bottom: 32,
					left: 180,
					nodeWidth: 18,
					nodeGap: 18,
					nodeAlign: "justify",
					layoutIterations: 64,
					draggable: true,
					emphasis: { focus: "adjacency" },
					label: {
						show: true,
						color: "#263238",
						fontSize: labelFontSize,
						overflow: "truncate",
						width: labelWidth,
					},
					lineStyle: { color: "gradient", curveness: 0.48, opacity: 0.35 },
					itemStyle: { borderColor: "#ffffff", borderWidth: 1 },
				},
			],
		}),
		[data, labelFontSize, labelWidth],
	);

	useEffect(() => {
		if (!chartRef.current) return undefined;

		const chart = echarts.init(chartRef.current, null, { renderer: "canvas" });
		chartInstanceRef.current = chart;
		const resizeObserver = new ResizeObserver(() => chart.resize());
		resizeObserver.observe(chartRef.current);

		return () => {
			resizeObserver.disconnect();
			chart.dispose();
			chartInstanceRef.current = null;
		};
	}, []);

	useEffect(() => {
		chartInstanceRef.current?.setOption(option, true);
	}, [option]);

	return <Box ref={chartRef} sx={{ height, width }} />;
};

const SankeyComponent = () => {
	const { results, setResults } = useDataContext();
	const [rawData, setRawData] = useState(null);
	const [dataSource, setDataSource] = useState("file");
	const [selectedCollections, setSelectedCollections] = useState([]);
	const [query, setQuery] = useState({});
	const [appliedQuery, setAppliedQuery] = useState({});
	const [openFilterDialog, setOpenFilterDialog] = useState(false);
	const [layers, setLayers] = useState(DEFAULT_LAYERS.map((path) => ({ path })));
	const [minOccurrences, setMinOccurrences] = useState(1);
	const [weightStrategy, setWeightStrategy] = useState("occurrences");
	const [weightPath, setWeightPath] = useState("");
	const [sankeyData, setSankeyData] = useState({ nodes: [], links: [] });
	const [progress, setProgress] = useState(null);
	const [zoom, setZoom] = useState(1);
	const [readableLabels, setReadableLabels] = useState(false);
	const buildTokenRef = useRef({ cancelled: false });
	const viewportRef = useRef(null);

	const { data: collections } = useQuery({
		queryKey: ["collections"],
		queryFn: async () => {
			const response = await axios.get("http://localhost:8000/api/collections");
			return response.data;
		},
	});

	const { refetch, isLoading } = useQuery({
		queryKey: ["sankeyData", query],
		queryFn: () =>
			axios.post("http://localhost:8000/api/transactions", query).then((response) => {
				setRawData(response.data);
				return response.data;
			}),
		enabled: false,
	});

	const displayedResults = useMemo(
		() => applyLogFilters(rawData || results || [], appliedQuery),
		[rawData, results, appliedQuery],
	);
	const layerOptions = useMemo(() => getUniqueKeys(rawData || results), [rawData, results]);
	const chartSize = useMemo(
		() => ({
			width: clamp(1200 + sankeyData.links.length * 18, 1300, 5200),
			height: clamp(620 + sankeyData.nodes.length * 18, 700, 5200),
		}),
		[sankeyData.links.length, sankeyData.nodes.length],
	);

	useEffect(() => {
		if (!layerOptions.length) return;
		setLayers((currentLayers) => {
			const validLayers = currentLayers.filter((layer) => layerOptions.includes(layer.path));
			if (validLayers.length >= 2) return currentLayers;
			const defaults = DEFAULT_LAYERS.filter((path) => layerOptions.includes(path));
			return (defaults.length >= 2 ? defaults : layerOptions.slice(0, 3)).map((path) => ({ path }));
		});
	}, [layerOptions]);

	useEffect(() => {
		if (
			!Array.isArray(displayedResults) ||
			displayedResults.length === 0 ||
			layers.filter((l) => l.path).length < 2
		) {
			setSankeyData({ nodes: [], links: [] });
			return undefined;
		}

		buildTokenRef.current.cancelled = true;
		const token = { cancelled: false };
		buildTokenRef.current = token;
		setProgress({ done: 0, total: displayedResults.length });

		buildSankeyDataAsync({
			log: displayedResults,
			layers,
			minOccurrences,
			weightStrategy,
			weightPath,
			tokenRef: token,
			onProgress: (done, total) => setProgress({ done, total }),
		}).then((data) => {
			if (!token.cancelled && data) {
				setSankeyData(data);
				setProgress(null);
			}
		});

		return () => {
			token.cancelled = true;
		};
	}, [displayedResults, layers, minOccurrences, weightStrategy, weightPath]);

	const handleFileChange = (event) => {
		const file = event.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (loadEvent) => {
			try {
				const parsed = JSON.parse(loadEvent.target.result);
				const rows = Array.isArray(parsed) ? parsed : [];
				setRawData(rows);
				setAppliedQuery({});
				setResults(rows);
			} catch (err) {
				console.error("Invalid JSON file", err);
			}
		};
		reader.readAsText(file);
		event.target.value = null;
	};

	const updateLayer = (index, path) => {
		setLayers((currentLayers) =>
			currentLayers.map((layer, layerIndex) => (layerIndex === index ? { path } : layer)),
		);
	};

	const addLayer = () => setLayers((currentLayers) => [...currentLayers, { path: "" }]);
	const removeLayer = (index) =>
		setLayers((currentLayers) => currentLayers.filter((_, layerIndex) => layerIndex !== index));
	const updateZoom = (nextZoom) => setZoom(clamp(nextZoom, 0.35, 2.5));
	const resetView = () => {
		setZoom(1);
		viewportRef.current?.scrollTo({ left: 0, top: 0, behavior: "smooth" });
	};

	const applyFilters = (nextQuery = query) => {
		setAppliedQuery(nextQuery);

		if (dataSource === "database") {
			refetch().then((result) => {
				if (result.data) {
					setRawData(result.data);
					setResults(applyLogFilters(result.data, nextQuery));
				}
			});
			return;
		}

		setResults(applyLogFilters(rawData || results || [], nextQuery));
	};

	const resetFilters = () => {
		setAppliedQuery({});
		if (rawData) {
			setResults(rawData);
		}
		setOpenFilterDialog(false);
	};

	return (
		<Box sx={{ width: "100%" }}>
			<Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" mb={3}>
				<FormControl>
					<RadioGroup row value={dataSource} onChange={(e) => setDataSource(e.target.value)}>
						<FormControlLabel value="file" control={<Radio />} label="JSON File" />
						<FormControlLabel value="database" control={<Radio />} label="Database" />
					</RadioGroup>
				</FormControl>
				{dataSource === "file" && (
					<Button component="label" variant="contained" startIcon={<FileUpload />} sx={{ height: 55 }}>
						Upload File
						<HiddenInput type="file" onChange={handleFileChange} />
					</Button>
				)}
				<IconButton
					size="large"
					sx={{ color: "#ffb703" }}
					onClick={() => setOpenFilterDialog(true)}
				>
					<FilterList fontSize="large" />
				</IconButton>
				<GraphFilter
					open={openFilterDialog}
					onClose={resetFilters}
					query={query}
					setQuery={setQuery}
					isLoading={isLoading}
					onApply={(nextQuery) => {
						applyFilters(nextQuery);
						setOpenFilterDialog(false);
					}}
					title="Sankey Filters"
					dynamicFilterOptions={layerOptions}
				/>
				<TextField
					label="Min occurrences"
					size="small"
					type="number"
					value={minOccurrences}
					onChange={(e) => setMinOccurrences(Math.max(1, Number(e.target.value) || 1))}
					inputProps={{ min: 1 }}
					sx={{ width: 170 }}
				/>
				<FormControl size="small" sx={{ minWidth: 190 }}>
					<InputLabel>Weight strategy</InputLabel>
					<Select
						label="Weight strategy"
						value={weightStrategy}
						onChange={(event) => setWeightStrategy(event.target.value)}
					>
						<MenuItem value="occurrences">Occurrences</MenuItem>
						<MenuItem value="field">Numeric field</MenuItem>
					</Select>
				</FormControl>
				{weightStrategy === "field" && (
					<FormControl size="small" sx={{ minWidth: 260 }}>
						<InputLabel>Weight field</InputLabel>
						<Select label="Weight field" value={weightPath} onChange={(e) => setWeightPath(e.target.value)}>
							{layerOptions.map((path) => (
								<MenuItem key={path} value={path}>{path}</MenuItem>
							))}
						</Select>
					</FormControl>
				)}
				<Stack direction="row" spacing={1} alignItems="center">
					<MuiTooltip title="Zoom out">
						<IconButton size="small" onClick={() => updateZoom(zoom - 0.15)}><ZoomOut fontSize="small" /></IconButton>
					</MuiTooltip>
					<Typography variant="body2" sx={{ minWidth: 44, textAlign: "center" }}>{Math.round(zoom * 100)}%</Typography>
					<MuiTooltip title="Zoom in">
						<IconButton size="small" onClick={() => updateZoom(zoom + 0.15)}><ZoomIn fontSize="small" /></IconButton>
					</MuiTooltip>
					<MuiTooltip title="Reset view">
						<IconButton size="small" onClick={resetView}><RestartAlt fontSize="small" /></IconButton>
					</MuiTooltip>
				</Stack>
				<FormControlLabel
					control={
						<Switch
							checked={readableLabels}
							onChange={(event) => setReadableLabels(event.target.checked)}
							size="small"
						/>
					}
					label="Readable labels"
				/>
				<Typography variant="body2" color="text.secondary">
					{Array.isArray(displayedResults) ? `${displayedResults.length} log entries, ${sankeyData.links.length} links` : "No log loaded"}
				</Typography>
			</Stack>
			{dataSource === "database" && (
				<Stack spacing={2} mb={3}>
					<CollectionDropdown
						selectedCollections={selectedCollections}
						setSelectedCollections={setSelectedCollections}
						collections={collections}
						query={query}
						setQueryState={setQuery}
					/>
					<Button
						variant="contained"
						onClick={() =>
							refetch().then((result) => {
								if (result.data) {
									setRawData(result.data);
									setResults(applyLogFilters(result.data, appliedQuery));
								}
							})
						}
						disabled={isLoading || !query.selectedCollection?.length}
						sx={{ width: 180 }}
					>
						Generate Sankey
					</Button>
				</Stack>
			)}
			<Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" mb={3}>
				{layers.map((layer, index) => (
					<Stack key={`sankey-layer-${index}`} direction="row" spacing={0.5} alignItems="center">
						<FormControl size="small" sx={{ minWidth: 230 }}>
							<InputLabel>{`Layer ${index + 1}`}</InputLabel>
							<Select label={`Layer ${index + 1}`} value={layer.path} onChange={(event) => updateLayer(index, event.target.value)}>
								{layerOptions.length > 0 ? layerOptions.map((path) => (
									<MenuItem key={path} value={path}>{path}</MenuItem>
								)) : <MenuItem disabled>No keys found</MenuItem>}
							</Select>
						</FormControl>
						<MuiTooltip title="Remove layer">
							<span>
								<IconButton size="small" onClick={() => removeLayer(index)} disabled={layers.length <= 2}>
									<Delete fontSize="small" />
								</IconButton>
							</span>
						</MuiTooltip>
					</Stack>
				))}
				<Button variant="outlined" startIcon={<Add />} onClick={addLayer} disabled={!layerOptions.length}>Add Layer</Button>
			</Stack>
			<Paper ref={viewportRef} sx={{ height: "calc(100vh - 220px)", minHeight: 560, overflow: "auto", p: 2 }}>
				{progress ? (
					<Stack alignItems="center" justifyContent="center" sx={{ height: "100%" }} spacing={2}>
						<CircularProgress />
						<Typography>{`Processing ${progress.done.toLocaleString()} / ${progress.total.toLocaleString()} transactions`}</Typography>
					</Stack>
				) : sankeyData.nodes.length > 0 && sankeyData.links.length > 0 ? (
					<Box sx={{ height: chartSize.height * zoom, position: "relative", width: chartSize.width * zoom }}>
						<Box sx={{ height: chartSize.height, left: 0, position: "absolute", top: 0, transform: `scale(${zoom})`, transformOrigin: "0 0", width: chartSize.width }}>
							<SankeyChartView
								data={sankeyData}
								height={chartSize.height}
								width={chartSize.width}
								zoom={zoom}
								readableLabels={readableLabels}
							/>
						</Box>
					</Box>
				) : (
					<Stack alignItems="center" justifyContent="center" sx={{ height: "100%" }}>
						<Typography color="text.secondary">Upload a JSON log and select at least two layers.</Typography>
					</Stack>
				)}
			</Paper>
		</Box>
	);
};

export default SankeyComponent;
