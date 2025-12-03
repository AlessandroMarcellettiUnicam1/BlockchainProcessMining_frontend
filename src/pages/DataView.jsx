import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import {FileUpload} from "@mui/icons-material"
import { HiddenInput } from "../components/HiddenInput";
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import GasUsed from "../components/dataVisualization/GasUsed";
import Events from "../components/dataVisualization/Events";
import Call from "../components/dataVisualization/Call";
import Inputs from "../components/dataVisualization/Inputs";
import MostActiveSenders from "../components/dataVisualization/MostActiveSenders";
import StorageState from "../components/dataVisualization/StorageState";
import Time from "../components/dataVisualization/Time";
import {
    Button,
    TextField,
    CircularProgress,
    Typography,
    IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddBoxIcon from "@mui/icons-material/AddBox";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { getData,importJSONToDB } from "../api/services";
import { useDataView } from "../context/DataViewContext";
import { useQuery, useQueryClient } from "react-query";
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';

const tabs = [
	{
		label: "Transaction Analysis",
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
    const [addressToAdd, setAddressToAdd] = useState("");
    const [value,setValue] = useState("public");

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
                        <Box>
                            <Typography fontWeight={700} fontSize="18px">
                                Contract Addresses
                            </Typography>

                            <Box display="flex" gap={1} alignItems="flex-start" mt={1}>
                                <TextField
                                    placeholder="Add contract addresses (comma, space, or line-break)"
                                    size="small"
                                    fullWidth
                                    multiline
                                    rows={3}
                                    value={addressToAdd}
                                    onChange={(e) => setAddressToAdd(e.target.value)}
                                />

                                <IconButton
                                    onClick={() => {
                                        if (!addressToAdd) return;

                                        const newAddresses = addressToAdd
                                            .split(/[,\s\n]+/)
                                            .map((addr) => addr.trim())
                                            .filter((addr) => addr.length > 0);

                                        // Update the query state to store an array
                                        setQueryState({
                                            ...query,
                                            contractAddress: [...(query.contractAddress || []), ...newAddresses],
                                        });

                                        setAddressToAdd("");
                                    }}
                                >
                                    <AddBoxIcon color="primary" fontSize="large" />
                                </IconButton>
                            </Box>

                            {/* Display Added Addresses */}
                            <Box mt={1}>
                                {(query.contractAddress || []).map((addr, idx) => (
                                    <Box
                                        key={idx}
                                        display="flex"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        mt={1}
                                    >
                                        <Typography>{addr}</Typography>
                                        <IconButton
                                            onClick={() =>
                                                setQueryState({
                                                    ...query,
                                                    contractAddress: query.contractAddress.filter(
                                                        (_, i) => i !== idx
                                                    ),
                                                })
                                            }
                                        >
                                            <DeleteIcon color="error" fontSize="medium" />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                        <TextField
                            label="Transaction Hash"
                            variant="outlined"
                            size="small"
                            value = {query.txHash || ""}
                            onChange={(e)=>
                                setQueryState({ ...query, txHash: e.target.value })
                            }
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
                        <Box sx = {{display:"flex",gap:2}}>
                            <FormControl>
                                <RadioGroup value={value}
                                onChange={(e) => {
                                    setValue(e.target.value);
                                    setQueryState({...query, internalTxs: e.target.value });
                                }}>
                                    <FormControlLabel value="public" control={<Radio />} label={"Show public transactions"}/>
                                    <FormControlLabel value="public+internal" control={<Radio />} label={"Show public and internal transactions"}/>
                                    <FormControlLabel value="internal" control={<Radio />} label={"Show internal transactions"}/>
                                </RadioGroup>
                            </FormControl>
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
                        <Box>
                            <TextField
                                label="Min Activity Occurrences"
                                type="number"
                                variant="outlined"
                                size="small"
                                onChange={(e) =>
                                    setQueryState({ ...query, minOccurrences: e.target.value })}
                            />
                        </Box>
                        <Box
                            sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 2,
                            p: 2,
                            alignItems: "center",
                        }}>
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
				{data && (
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
