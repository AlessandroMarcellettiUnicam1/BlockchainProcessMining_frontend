import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import {FileUpload} from "@mui/icons-material"
import { HiddenInput } from "../components/HiddenInput";
import React, { useRef, useEffect, useCallback, useMemo } from "react";
import GasUsed from "../components/dataVisualization/GasUsed";
import Events from "../components/dataVisualization/Events";
import Call from "../components/dataVisualization/Call";
import Inputs from "../components/dataVisualization/Inputs";
import MostActiveSenders from "../components/dataVisualization/MostActiveSenders";
import StorageState from "../components/dataVisualization/StorageState";
import Time from "../components/dataVisualization/Time";
import { Button, TextField, CircularProgress } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { getData,importJSONToDB } from "../api/services";
import { useDataView } from "../context/DataViewContext";
import { useQuery, useQueryClient } from "react-query";

const tabs = [
	{
		label: "Gas Used",
		value: 0,
		type: "gasUsed",
		component: (data) => <GasUsed data={data} />,
	},
	{
		label: "Most Active Senders",
		value: 1,
		type: "mostActiveSenders",
		component: (data) => <MostActiveSenders data={data} />,
	},
	{
		label: "Time",
		value: 2,
		type: "time",
		component: (data) => <Time data={data} />,
	},
	{
		label: "Inputs",
		value: 3,
		type: "inputs",
		component: (data) => <Inputs data={data} />,
	},
	{
		label: "Events",
		value: 4,
		type: "events",
		component: (data) => <Events data={data} />,
	},
	{
		label: "Call",
		value: 5,
		type: "call",
		component: (data) => <Call data={data} />,
	},
	{
		label: "Storage State",
		value: 6,
		type: "storageState",
		component: (data) => <StorageState data={data} />,
	},
];

export default function DataViewPage() {
	const { selectedTab, setSelectedTabState, query, setQueryState } =
		useDataView();

	const { isLoading, data, error } = useQuery({
		queryKey: ["data", selectedTab, query],
		queryFn: () =>
			getData({
				type: tabs[selectedTab].type,
				query: query ?? null,
			}).then((r) => {
				return r.data;
			}),
	});

	console.log({ isLoading, data, error });

	const queryClient = useQueryClient();
	const invalidateQuery = () => {
		queryClient.invalidateQueries({ queryKey: ["data"] });
	};

	const handleResetFilters = () => {
		const resetQuery = {
			contractAddress: null,
			dateFrom: null,
			dateTo: null,
			fromBlock: null,
			toBlock: null,
		};
		setQueryState(resetQuery);
	};

	const handleImportJsonToDB=(e)=>{
		const fileReader = new FileReader();
		fileReader.onload = (event) => {
			const content = event.target.result;
			importJSONToDB(content)
		};
		if (e.target.files[0]) {
			fileReader.readAsText(e.target.files[0]);
		}
		e.target.value = null;
	}

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
								onChange={(e) =>
									setQueryState({
										...query,
										dateFrom: e ? e.toISOString() : null,
									})
								}
							/>
							<DateTimePicker
								label="Date To"
								slotProps={{ textField: { size: "small" } }}
								value={query.dateTo ? new Date(query.dateTo) : null}
								onChange={(e) =>
									setQueryState({
										...query,
										dateTo: e ? e.toISOString() : null,
									})
								}
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
							/>
						</Box>
						<Button
							variant="contained"
							onClick={invalidateQuery}
							disabled={isLoading}>
							{isLoading ? "Loading..." : "Apply Filters"}
						</Button>
						<Button
							variant="outlined"
							onClick={handleResetFilters}
							disabled={isLoading}>
							Reset Filters
						</Button>
						<Button
								  component="label"
								  variant="contained"
								  startIcon={<FileUpload />}
								  sx={{ padding: 1, height: "55px" }}
								>
								  Upload collection
								  <HiddenInput type="file" onChange={handleImportJsonToDB} />
								</Button>
					</Box>
					<Tabs
						value={selectedTab}
						onChange={(_, newValue) => setSelectedTabState(newValue)}
						aria-label="tabs">
						{tabs.map((tab, index) => (
							<Tab
								key={index}
								label={tab.label}
							/>
						))}
					</Tabs>
				</Box>
				{error && <ErrorState {...error} />}
				{isLoading && <LoadingState />}
				{(!data || (Array.isArray(data) && data.length === 0)) &&
					!isLoading &&
					!error && <EmptyState />}
				{data && Array.isArray(data) && data.length > 0 && (
					<Box sx={{ p: 3 }}>{tabs[selectedTab]?.component(data)}</Box>
				)}
			</Box>
		</div>
	);
}

const ErrorState = ({ error }) => (
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

const LoadingState = () => (
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

const EmptyState = () => {
	const { query } = useDataView();

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
					<p>
						<strong>Contract Address:</strong> {query.contractAddress}
					</p>
				)}
				{query.dateFrom && (
					<p>
						<strong>Date From:</strong>{" "}
						{new Date(query.dateFrom).toLocaleDateString()}
					</p>
				)}
				{query.dateTo && (
					<p>
						<strong>Date To:</strong>{" "}
						{new Date(query.dateTo).toLocaleDateString()}
					</p>
				)}
				{query.fromBlock && (
					<p>
						<strong>From Block:</strong> {query.fromBlock}
					</p>
				)}
				{query.toBlock && (
					<p>
						<strong>To Block:</strong> {query.toBlock}
					</p>
				)}
				{!query.contractAddress &&
					!query.dateFrom &&
					!query.dateTo &&
					!query.fromBlock &&
					!query.toBlock && <p>No filters applied</p>}
			</Box>
			<p>Please adjust your filters or try a different tab.</p>
		</Box>
	);
};
