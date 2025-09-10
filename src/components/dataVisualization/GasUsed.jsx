import { PieChart } from "@mui/x-charts/PieChart";
import { Box, Typography, Paper, Grid } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { BarChart } from "@mui/x-charts/BarChart";
import { useDialogs } from "@toolpad/core/useDialogs";
import { ActivityDialog } from "./dialogs/ActivityDialog";

const columns = [
	{ field: "smartContract", headerName: "Smart Contract", width: 300 },
	{ field: "count", headerName: "Count", width: 120 },
	{ field: "activity", headerName: "Activity", width: 150 },
	{ field: "gasUsed", headerName: "Gas Used", width: 150 },
];

export default function GasUsed({ data }) {
	const dialogs = useDialogs();

	const handleRowClick = async (params) => {
		await dialogs.open(ActivityDialog, {
			activity: params.row.activity,
		});
	};

	return (
		<Box sx={{ p: 3 }}>
			<Box sx={{ mb: 2 }}>
				<Typography
					variant="h4"
					component="h1"
					gutterBottom>
					Gas Usage Analysis
				</Typography>
				<Typography
					variant="body1"
					color="text.secondary">
					Avg Gas Used per Transaction:{" "}
					<strong>
						{data.reduce((acc, item) => acc + item.gasUsed, 0) / data.length}
					</strong>
				</Typography>
			</Box>
			{/* Charts Section */}
			<Grid
				container
				spacing={3}
				sx={{ mb: 4 }}>
				{/* Pie Chart */}
				<Grid
					item
					xs={12}
					lg={6}>
					<Paper sx={{ p: 3, height: "100%" }}>
						<Typography
							variant="h6"
							gutterBottom>
							Gas Distribution
						</Typography>
						<Box sx={{ display: "flex", justifyContent: "center" }}>
							<PieChart
								series={[
									{
										data: data.map((item, index) => ({
											id: index,
											value: item.gasUsed,
											label: item.activity,
										})),
										innerRadius: 30,
										outerRadius: 120,
										paddingAngle: 2,
									},
								]}
								width={400}
								height={300}
								slotProps={{
									legend: {
										direction: "column",
										position: { vertical: "middle", horizontal: "right" },
									},
								}}
							/>
						</Box>
					</Paper>
				</Grid>

				{/* Bar Chart */}
				<Grid
					item
					xs={12}>
					<Paper sx={{ p: 3 }}>
						<Typography
							variant="h6"
							gutterBottom>
							Activity Count
						</Typography>
						<Box sx={{ width: "100%", overflowX: "auto" }}>
							<BarChart
								series={[
									{
										data: data.map((item) => item.count),
										label: "Transaction Count",
									},
								]}
								height={300}
								width={880}
								xAxis={[
									{
										data: data.map((item) => item.activity),
										scaleType: "band",
									},
								]}
								margin={{ left: 10, right: 10, top: 40, bottom: 80 }}
							/>
						</Box>
					</Paper>
				</Grid>
			</Grid>
			{/* Data Table */}
			<Paper sx={{ p: 3 }}>
				<Typography
					variant="h6"
					gutterBottom>
					Breakdown
				</Typography>
				<Box sx={{ height: 400, width: "100%" }}>
					<DataGrid
						rows={data.map((item, index) => ({
							...item,
							smartContract: item.contract || "N/A",
							id: index,
						}))}
						columns={columns}
						onRowClick={handleRowClick}
						pageSize={10}
						disableSelectionOnClick
						sx={{
							"& .MuiDataGrid-row:hover": {
								cursor: "pointer",
							},
						}}
					/>
				</Box>
			</Paper>
		</Box>
	);
}
