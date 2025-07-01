import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import Alert from "@mui/material/Alert";
import { RichTreeView } from "@mui/x-tree-view/RichTreeView";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import axios from "axios";
import { useDataView } from "../../../context/DataViewContext";
import { Box } from "@mui/material";

function TransactionsDialog({ open, onClose, payload }) {
	const [transactionsData, setTransactionsData] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const { query } = useDataView();

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			setError(null);
			try {
				const response = await axios.post(
					`http://localhost:8000/api/data/txs?sender=${payload.sender}`,
					query
				);
				if (response.status === 200) {
					setTransactionsData(response.data);
				} else {
					setError("Failed to fetch activity data");
				}
				setLoading(false);
			} catch (error) {
				setError(error.message || "An error occurred");
				setLoading(false);
			}
		};
		if (open && payload.sender) {
			fetchData();
		}
	}, [open, payload.sender, query]);
	return (
		<Dialog
			fullWidth
			maxWidth="xl"
			open={open}
			onClose={() => onClose()}>
			<DialogTitle>Transactions of: {payload.sender}</DialogTitle>
			<DialogContent>
				{loading && <p>Loading sender's transactions...</p>}
				{error && <Alert severity="error">{error}</Alert>}
				{transactionsData && (
					<Box
						sx={{
							width: "100%",
							height: 600,
						}}>
						<RichTreeView items={transactionsData} />
					</Box>
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={() => onClose()}>Close</Button>
			</DialogActions>
		</Dialog>
	);
}

TransactionsDialog.propTypes = {
	onClose: PropTypes.func.isRequired,
	open: PropTypes.bool.isRequired,
	payload: PropTypes.shape({
		sender: PropTypes.string,
	}).isRequired,
};

export { TransactionsDialog };
