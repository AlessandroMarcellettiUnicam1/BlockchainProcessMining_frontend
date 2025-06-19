import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import React, { useRef, useEffect } from "react";
import GasUsed from "../components/dataVisualization/GasUsed";
import Events from "../components/dataVisualization/Events";
import Call from "../components/dataVisualization/Call";
import Activity from "../components/dataVisualization/Activity";
import Inputs from "../components/dataVisualization/Inputs";
import MostActiveSenders from "../components/dataVisualization/MostActiveSenders";
import StorageState from "../components/dataVisualization/StorageState";
import Time from "../components/dataVisualization/Time";
import { Button, TextField, CircularProgress } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { getData } from "../api/services";
import { useDataView } from "../context/DataViewContext";

const tabs = [
	{
		label: "Gas Used",
		value: 0,
		type: "gasUsed",
		component: <GasUsed />,
	},
	{
		label: "Activity",
		value: 1,
		type: "activity",
		component: <Activity />,
	},
	{
		label: "Most Active Senders",
		value: 2,
		type: "mostActiveSenders",
		component: <MostActiveSenders />,
	},
	{
		label: "Time",
		value: 3,
		type: "time",
		component: <Time />,
	},
	{
		label: "Inputs",
		value: 4,
		type: "inputs",
		component: <Inputs />,
	},
	{
		label: "Events",
		value: 5,
		type: "events",
		component: <Events />,
	},
	{
		label: "Call",
		value: 6,
		type: "call",
		component: <Call />,
	},
	{
		label: "Storage State",
		value: 7,
		type: "storageState",
		component: <StorageState />,
	},
];

export default function DataViewPage() {
	const {
		selectedTab,
		setSelectedTabState,
		setLoadingState,
		setErrorState,
		setDataView,
		query,
		setQueryState,
	} = useDataView();

	const onFetchData = async ({ type }) => {
		console.log(
			"[DataView] Fetching data with type:",
			type,
			"and query:",
			query
		);
		setLoadingState(true);
		setErrorState(null);
		try {
			const response = await getData({ type, query });
			console.log("[DataView] Response Data:", response);
			setDataView(response.data);
		} catch (error) {
			setErrorState(error.message || "Failed to fetch data");
		} finally {
			setLoadingState(false);
		}
	};

	useEffect(() => {
		onFetchData({ type: tabs[selectedTab].type, query });
	}, []);

	return (
		<div>
			<Box sx={{ width: "100%" }}>
				<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
					<Box
						sx={{
							display: "flex",
							flexWrap: "wrap",
							gap: 2,
							p: 2,
							alignItems: "center",
						}}>
						<TextField
							label="Smart Contract Address"
							variant="outlined"
							size="small"
							placeholder="0x..."
							value={query.contractAddress || ""}
							onChange={(e) =>
								setQueryState({ ...query, contractAddress: e.target.value })
							}
							sx={{ minWidth: 250 }}
						/>
						<Box sx={{ display: "flex", gap: 2 }}>
							<DateTimePicker
								label="Date From"
								slotProps={{ textField: { size: "small" } }}
								value={query.dateFrom ? new Date(query.dateFrom) : null}
								onChange={(newValue) =>
									setQueryState({
										...query,
										dateFrom: newValue ? newValue.toISOString() : null,
									})
								}
							/>
							<DateTimePicker
								label="Date To"
								slotProps={{ textField: { size: "small" } }}
								value={query.dateTo ? new Date(query.dateTo) : null}
								onChange={(newValue) => {
									setQueryState({
										...query,
										dateTo: newValue ? newValue.toISOString() : null,
									});
								}}
							/>
						</Box>
						<Box sx={{ display: "flex", gap: 2 }}>
							<TextField
								label="From Block"
								type="number"
								variant="outlined"
								size="small"
								value={query.fromBlock || ""}
								onChange={(e) =>
									setQueryState({ ...query, fromBlock: e.target.value })
								}
								InputProps={{ inputProps: { min: 0 } }}
							/>
							<TextField
								label="To Block"
								type="number"
								variant="outlined"
								size="small"
								value={query.toBlock || ""}
								onChange={(e) =>
									setQueryState({ ...query, toBlock: e.target.value })
								}
								InputProps={{ inputProps: { min: 0 } }}
							/>
						</Box>
						<Button
							variant="contained"
							onClick={() =>
								onFetchData({ type: tabs[selectedTab].type, query })
							}>
							Apply Filters
						</Button>
						<Button
							variant="outlined"
							onClick={() => {
								setQueryState({
									contractAddress: null,
									dateFrom: null,
									dateTo: null,
									fromBlock: null,
									toBlock: null,
								});
								onFetchData({ type: tabs[selectedTab].type });
							}}>
							Reset Filters
						</Button>
					</Box>
					<Tabs
						value={selectedTab}
						onChange={(_, newValue) => {
							setSelectedTabState(newValue);
							onFetchData({ type: tabs[newValue].type, query });
						}}
						aria-label="basic tabs">
						{tabs.map((tab, index) => (
							<Tab
								key={index}
								label={tab.label}
							/>
						))}
					</Tabs>
				</Box>
				<TabContent />
			</Box>
		</div>
	);
}

function TabContent() {
	const { loading, data, error, selectedTab, query } = useDataView();
  // Error state
	if (error) {
		return (
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					height: "400px",
				}}>
				<p style={{ color: "red" }}>{error}</p>
			</Box>
		);
	}
  // Loading state
	if (loading) {
		return (
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					height: "400px",
				}}>
				<CircularProgress />
			</Box>
		);
	}
  // Empty data state
  if (!data || data.length === 0 || !isNaN(data)) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
        }}>
        <p>No data available for this tab with the selected filters:</p>
        <Box sx={{ maxWidth: "400px", textAlign: "center", mb: 2 }}>
          {query.contractAddress && (
            <p><strong>Contract Address:</strong> {query.contractAddress}</p>
          )}
          {query.dateFrom && (
            <p><strong>Date From:</strong> {new Date(query.dateFrom).toLocaleDateString()}</p>
          )}
          {query.dateTo && (
            <p><strong>Date To:</strong> {new Date(query.dateTo).toLocaleDateString()}</p>
          )}
          {query.fromBlock && (
            <p><strong>From Block:</strong> {query.fromBlock}</p>
          )}
          {query.toBlock && (
            <p><strong>To Block:</strong> {query.toBlock}</p>
          )}
          {!query.contractAddress && !query.dateFrom && !query.dateTo &&
           !query.fromBlock && !query.toBlock && (
            <p>No filters applied</p>
          )}
        </Box>
        <p>Please adjust your filters or try a different tab.</p>
      </Box>
    );
  }
		// Data state
		return (
			<>
				{tabs.map((tab, index) => (
					<CustomTabPanel
						key={index}
						value={selectedTab}
						index={index}>
						{tab.component}
					</CustomTabPanel>
				))}
			</>
		);
}

function CustomTabPanel(props) {
	const { children, value, index, ...other } = props;

	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`tabpanel-${index}`}
			aria-labelledby={`tab-${index}`}
			{...other}>
			{value === index && <Box sx={{ p: 3 }}>{children}</Box>}
		</div>
	);
}
