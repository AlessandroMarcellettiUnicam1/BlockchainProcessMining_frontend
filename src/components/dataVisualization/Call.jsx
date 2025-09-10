import { BarChart } from "@mui/x-charts/BarChart";
import React from "react";
import { Box } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useDialogs } from "@toolpad/core/useDialogs";
import { CallsDialog } from "./dialogs/CallsDialog";

const columns = [
	{ field: "callType", headerName: "Call Type", width: 400 },
	{ field: "count", headerName: "Occurrences", width: 200 },
];

export default function Call({ data }) {
	const dialogs = useDialogs();

	const handleRowClick = async (params) => {
		await dialogs.open(CallsDialog, {
			callType: params.row.callType,
		});
	};
	return (
		<div>
			<h1>Call</h1>
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: 2,
				}}>
				<Box
					sx={{
						width: "100%",
						minWidth: { md: "400px" },
						display: "flex",
						justifyContent: "center",
					}}>
					<BarChart
						series={[
							{
								data: data.map((item) => item.count),
							},
						]}
						height={290}
						width={400}
						xAxis={[{ data: data.map((item) => item.callType) }]}
					/>
				</Box>
				<Box
					sx={{
						flexGrow: 1,
						width: "100%",
						height: 400,
					}}>
					<DataGrid
						rows={data.map((item, index) => ({
							id: index,
							...item,
						}))}
						columns={columns}
						onRowClick={handleRowClick}
					/>
				</Box>
			</Box>
		</div>
	);
}
