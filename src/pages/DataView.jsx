import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import {FileUpload,FilterList} from "@mui/icons-material"
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
    CircularProgress,
    Typography,
    IconButton,
    Stack,
    InputLabel,
    FilledInput,
    Dialog,DialogContent, DialogTitle,
    Slide
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddBoxIcon from "@mui/icons-material/AddBox";
import { getData,importJSONToDB } from "../api/services";
import { useDataView } from "../context/DataViewContext";
import { useQuery, useQueryClient } from "react-query";
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="down" ref={ref} {...props} />;
});


const tabs = [
	{
		label: "Transaction",
		value: 0,
		type: "gasUsed",
		component: (data) => <GasUsed data={data} />,
	},
	{
		label: "Sender",
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
		label: "Input",
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
		label: "State Variable",
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
    const [txType,setTxType] = useState("public");
    const [openDialog,setOpenDialog] = useState(false);

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
            txHash: null,
            internalTxs: "public",
            minOccurrences: null
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
    const handleAddAddress = () => {
        if (!addressToAdd) return;

        const newAddresses = addressToAdd
            .split(/[,\s\n]+/)
            .map((addr) => addr.trim())
            .filter((addr) => addr.length > 0);

        setQueryState({
            ...query,
            contractAddress: [...(query.contractAddress || []), ...newAddresses],
        });
        setAddressToAdd("");
    };

    const handleDeleteAddress = (idx) => {
        setQueryState({
            ...query,
            contractAddress: query.contractAddress.filter(
                (_, i) => i !== idx
            ),
        })
    };

	return (
		<div>
			<Box sx={{ width: "100%" }}>
				<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <IconButton size="large" sx={{color: "#ffb703"}} onClick={() => setOpenDialog(true)}>
                        <FilterList fontSize="large"/>
                    </IconButton>
                    <Dialog
                        TransitionComponent={Transition}
                        keepMounted
                        maxWidth=""
                        open={openDialog}
                        onClose={()=>{setOpenDialog(false)}}
                    >
                        <DialogTitle>Filters</DialogTitle>
                        <DialogContent>
                    <Stack spacing={3} sx={{ p: 3 }}>
                        {/* Contract Addresses */}
                        <FormControl variant="filled">
                            <InputLabel sx={{ fontWeight: 700, fontSize: "18px" }}>
                                Contract Addresses
                            </InputLabel>
                            <Box display="flex" gap={1} mt={1}>
                                <FilledInput
                                    fullWidth
                                    multiline
                                    rows={3}
                                    placeholder="Add contract addresses (comma, space, or line-break)"
                                    value={addressToAdd}
                                    onChange={(e) => setAddressToAdd(e.target.value)}
                                />
                                <IconButton onClick={handleAddAddress} sx={{ alignSelf: "flex-start" }}>
                                    <AddBoxIcon color="primary" fontSize="large" />
                                </IconButton>
                            </Box>
                        </FormControl>

                        {/* Display Added Addresses */}
                        { query.contractAddress && query.contractAddress.length > 0 && (
                            <Box>
                                {query.contractAddress.map((addr, idx) => (
                                    <Box
                                        key={idx}
                                        display="flex"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        py={1}
                                    >
                                        <Typography>{addr}</Typography>
                                        <IconButton onClick={() => handleDeleteAddress(idx)}>
                                            <DeleteIcon color="error" fontSize="medium" />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Box>
                        )}

                        {/* Transaction Hash */}
                        <FormControl variant="filled">
                            <InputLabel sx={{ fontWeight: 700, fontSize: "18px" }}>
                                Transaction Hash
                            </InputLabel>
                            <FilledInput
                                value={query.txHash}
                                onChange={(e) => setQueryState({...query,txHash:e.target.value})}
                            />
                        </FormControl>

                        {/* Date Range */}
                        <Box sx={{display:"flex"}} gap={2}>
                            <FormControl variant="filled" fullWidth>
                                <InputLabel sx={{ fontWeight: 700, fontSize: "18px" }}>
                                    Date From
                                </InputLabel>
                                <FilledInput
                                    type="datetime-local"
                                    value={query.dateFrom}
                                    onChange={(e) => setQueryState({...query,dateFrom:e.target.value})}
                                />
                            </FormControl>
                            <FormControl variant="filled" fullWidth>
                                <InputLabel sx={{ fontWeight: 700, fontSize: "18px" }}>
                                    Date To
                                </InputLabel>
                                <FilledInput
                                    type="datetime-local"
                                    value={query.dateTo}
                                    onChange={(e) => setQueryState({...query,dateTo:e.target.value})}
                                />
                            </FormControl>
                        </Box>

                        {/* Block Range */}
                        <Box display="flex" gap={2}>
                            <FormControl variant="filled" fullWidth>
                                <InputLabel sx={{ fontWeight: 700, fontSize: "18px" }}>
                                    From Block
                                </InputLabel>
                                <FilledInput
                                    type="number"
                                    value={query.fromBlock}
                                    onChange={(e) => setQueryState({...query,fromBlock:e.target.value})}
                                />
                            </FormControl>
                            <FormControl variant="filled" fullWidth>
                                <InputLabel sx={{ fontWeight: 700, fontSize: "18px" }}>
                                    To Block
                                </InputLabel>
                                <FilledInput
                                    type="number"
                                    value={query.toBlock}
                                    onChange={(e) => setQueryState({...query,toBlock:e.target.value})}
                                />
                            </FormControl>
                        </Box>

                        {/* Min Occurrences */}
                        <FormControl variant="filled">
                            <InputLabel sx={{ fontWeight: 700, fontSize: "18px" }}>
                                Min Activity Occurrences
                            </InputLabel>
                            <FilledInput
                                type="number"
                                value={query.minOccurrences}
                                onChange={(e) => setQueryState({...query,minOccurrences:e.target.value})}
                            />
                        </FormControl>

                        {/* Transaction Type */}
                        <FormControl variant="filled">
                            <InputLabel sx={{ fontWeight: 700, fontSize: "18px", mb: 2 }}>
                                Transaction Type
                            </InputLabel>
                            <Box sx={{ mt: 7 }}>
                                <RadioGroup
                                    row
                                    value={txType}
                                    onChange={(e) => {setTxType(e.target.value);
                                                                            setQueryState({...query,internalTxs:e.target.value})}}>
                                    <FormControlLabel
                                        value="public"
                                        control={<Radio />}
                                        label="Show public transactions"
                                    />
                                    <FormControlLabel
                                        value="public+internal"
                                        control={<Radio />}
                                        label="Show public and internal transactions"
                                    />
                                    <FormControlLabel
                                        value="internal"
                                        control={<Radio />}
                                        label="Show internal transactions"
                                    />
                                </RadioGroup>
                            </Box>
                        </FormControl>



                        {/* Action Buttons */}
                        <Box display="flex" gap={2}>
                            <Button
                                variant="contained"
                                onClick={()=>{
                                                    invalidateQuery();
                                                    setOpenDialog(false)
                                    }
                                }
                                disabled={isLoading}
                                sx={{
                                    height: "50px",
                                    backgroundColor: "#66cdaa",
                                    "&:hover": { backgroundColor: "#6fa287" },
                                }}
                            >
                                {"Apply Filters"}
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={handleResetFilters}
                                disabled={isLoading}
                                sx={{ height: "50px" }}
                            >
                                Reset Filters
                            </Button>
                            <Button
                                component="label"
                                variant="contained"
                                startIcon={<FileUpload />}
                                sx={{
                                    height: "50px",
                                    minWidth: "200px",
                                    backgroundColor: "#86469C",
                                    "&:hover": { backgroundColor: "#512960" },
                                }}
                            >
                                Upload Collection
                                <HiddenInput type="file" onChange={handleImportJsonToDB} />
                            </Button>
                        </Box>
                    </Stack>
                        </DialogContent>
                    </Dialog>

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
