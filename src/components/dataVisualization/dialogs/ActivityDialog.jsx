import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import Alert from "@mui/material/Alert";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import axios from "axios";
import { useDataView } from "../../../context/DataViewContext";
import { Box } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

const columns = [
	{ field: "smartContract", headerName: "Smart Contract", width: 300 },
	{ field: "txHash", headerName: "Transaction Hash", width: 300 },
	{ field: "activity", headerName: "Activity", width: 200 },
	{ field: "timestamp", headerName: "Timestamp", width: 200 },
	{ field: "gasUsed", headerName: "Gas Used", width: 200 },
	{ field: "blockNumber", headerName: "Block Number", width: 200 },
	{ field: "inputs", headerName: "Inputs", width: 200 },
	{ field: "events", headerName: "Events", width: 200 },
];

function ActivityDialog({ open, onClose, payload }) {
	const [activityData, setActivityData] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const { query } = useDataView();

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			setError(null);
			try {
				const response = await axios.post(
					`http://localhost:8000/api/data/activities?activity=${payload.activity}`,
					query
				);
				if (response.status === 200) {
					setActivityData(response.data);
				} else {
					setError("Failed to fetch activity data");
				}
				setLoading(false);
			} catch (error) {
				setError(error.message || "An error occurred");
				setLoading(false);
			}
		};
		if (open && payload.activity) {
			fetchData();
		}
	}, [open, payload.activity, query]);
	return (
		<Dialog
			fullWidth
			maxWidth="xl"
			open={open}
			onClose={() => onClose()}>
			<DialogTitle>
				Activity Overview for activity: {payload.activity}
			</DialogTitle>
			<DialogContent>
				{loading && <p>Loading activity data...</p>}
				{error && <Alert severity="error">{error}</Alert>}
				{activityData && (
					<Box
						sx={{
							width: "100%",
							height: 600,
						}}>
						<DataGrid
							rows={activityData.map((item, index) => ({
								...item,
								id: index,
							}))}
							columns={columns}
						/>
					</Box>
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={() => onClose()}>Close</Button>
			</DialogActions>
		</Dialog>
	);
}

ActivityDialog.propTypes = {
	onClose: PropTypes.func.isRequired,
	open: PropTypes.bool.isRequired,
	payload: PropTypes.shape({
		activity: PropTypes.string,
	}).isRequired,
};

export { ActivityDialog };
