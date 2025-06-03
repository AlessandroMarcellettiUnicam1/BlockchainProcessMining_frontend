import { LineChart } from "@mui/x-charts/LineChart";
import { Box } from "@mui/material";
import { useDataView } from "../../context/DataViewContext";
export default function Time() {

  const { data } = useDataView();

  return (
		<Box sx={{ width: "100%" }}>
			<h1>Gas used and Transaction Count over Time</h1>

			<LineChart
				xAxis={[
					{
						data: data.map((item) => new Date(Date.parse(item.date))),
						scaleType: "time",
						tickFormat: (date) => date.toLocaleDateString(),
					},
				]}
				series={[
					{
						data: data.map((item) => item.gasUsed),
						label: "Gas Used",
						color: "#4CAF50", // Green for gas used
					},
				]}
				height={400}
				margin={{ left: 70, right: 30, top: 30, bottom: 60 }}
				sx={{
					".MuiLineElement-root": {
						strokeWidth: 2,
					},
				}}
			/>
			<LineChart
				xAxis={[
					{
						data: data.map((item) => new Date(Date.parse(item.date))),
						scaleType: "time",
						tickFormat: (date) => date.toLocaleDateString(),
					},
				]}
				series={[
					{
						data: data.map((item) => item.transactionCount),
						label: "Transaction Count",
						color: "#F7931A", // Bitcoin orange
					},
				]}
				height={400}
				margin={{ left: 70, right: 30, top: 30, bottom: 60 }}
				sx={{
					".MuiLineElement-root": {
						strokeWidth: 2,
					},
				}}
			/>
		</Box>
	);
}
