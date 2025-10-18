import {useState,useMemo} from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import { Box,ButtonGroup,Button } from "@mui/material";

export default function Time({ data }) {
    const [timeRange,setTimeRange] = useState("all");
    const filteredData = useMemo(() => {
        if (!data || data.length === 0) return [];

        const max = new Date(Math.max(...data.map((item) => new Date(item.date))));
        const min = new Date(max);

        switch (timeRange) {
            case "1m":
                min.setMonth(max.getMonth() - 1);
                break;
            case "6m":
                min.setMonth(max.getMonth() - 6);
                break;
            case "1y":
                min.setFullYear(max.getFullYear() - 1);
                break;
            default:
                return data;
        }

        return data.filter((item) => new Date(item.date) >= min);
    }, [data, timeRange]);

    return (
		<Box sx={{ width: "100%" }}>
			<h1>Gas used and Transaction Count over Time</h1>
            <Box>
                <ButtonGroup variant="outlined">
                    <Button
                        variant = {timeRange==="1m" ? "contained" : "outlined"}
                        onClick = {()=>setTimeRange("1m")}
                    >
                        1 Month
                    </Button>
                    <Button
                        variant = {timeRange==="6m" ? "contained" : "outlined"}
                        onClick = {()=>setTimeRange("6m")}
                    >
                        6 Month
                    </Button>
                    <Button
                        variant = {timeRange==="1y" ? "contained" : "outlined"}
                        onClick = {()=>setTimeRange("1y")}
                    >
                        1 Year
                    </Button>
                    <Button
                        variant = {timeRange==="all" ? "contained" : "outlined"}
                        onClick = {()=>setTimeRange("all")}
                    >
                        All
                    </Button>
                </ButtonGroup>
            </Box>
			<LineChart
				xAxis={[
					{
						data: filteredData.map((item) => new Date(Date.parse(item.date))),
						scaleType: "time",
						tickFormat: (date) => date.toLocaleDateString(),
					},
				]}
				series={[
					{
						data: filteredData.map((item) => item.gasUsed),
						label: "Gas Used",
						color: "#4CAF50", // Green for gas used
					},
				]}
				height={400}
				margin={{ left: 70, right: 30, top: 30, bottom: 60 }}
				skipAnimation={true}
				sx={{
					".MuiLineElement-root": {
						strokeWidth: 2,
					},
					".MuiMarkElement-root": {
						display: "none", // Hide individual points
					},
				}}
			/>
			<LineChart
				xAxis={[
					{
						data: filteredData.map((item) => new Date(Date.parse(item.date))),
						scaleType: "time",
						tickFormat: (date) => date.toLocaleDateString(),
					},
				]}
				series={[
					{
						data: filteredData.map((item) => item.transactionCount),
						label: "Transaction Count",
						color: "#F7931A", // Bitcoin orange
					},
				]}
				height={400}
				margin={{ left: 70, right: 30, top: 30, bottom: 60 }}
				skipAnimation={true}
				sx={{
					".MuiLineElement-root": {
						strokeWidth: 2,
					},
					".MuiMarkElement-root": {
						display: "none", // Hide individual points
					},
				}}
			/>
		</Box>
	);
}
