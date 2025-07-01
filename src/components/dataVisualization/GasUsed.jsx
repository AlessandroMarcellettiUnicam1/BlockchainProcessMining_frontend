import React from "react";
import { PieChart } from "@mui/x-charts/PieChart";
import { Box } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useDataView } from "../../context/DataViewContext";
import { BarChart } from "@mui/x-charts/BarChart";
import { useDialogs } from "@toolpad/core/useDialogs";
import { ActivityDialog }  from "./dialogs/ActivityDialog";

const columns = [
	{ field: "smartContract", headerName: "Smart Contract", width: 300 },
	{ field: "count", headerName: "Count", width: 200 },
	{ field: "activity", headerName: "Activity", width: 200 },
	{ field: "gasUsed", headerName: "Gas Used", width: 200 },
];

export default function GasUsed() {
	const { data } = useDataView();
  const dialogs = useDialogs();

  const handleRowClick = async (params) => {
    await dialogs.open(ActivityDialog, {
        activity: params.row.activity,
    });
  };

  return (
    <div>
      <h1>Gas Used</h1>
      <p>Analysis of total gas consumption per activity</p>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 2,
        }}>
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: { xs: "column", md: "row" }, // Column on small screens, row on medium and above
            justifyContent: "center",
            alignItems: "center",
            gap: 2,
          }}>
          <PieChart
            series={[
              {
                data: data.map((item, index) => ({
                  id: index,
                  value: item.gasUsed,
                  label: item.activity,
                })),
                innerRadius: 11,
                outerRadius: 100,
                paddingAngle: 1,
                cx: 150,
                cy: 150,
              },
            ]}
            width={400}
            height={400}
            sx={{
              maxWidth: "100%",
              overflow: "visible"
            }}
          />
          <BarChart
            series={[
              {
                data: data ? data.map((item) => item.count) : [],
              },
            ]}
            height={290}
            width={400}
            xAxis={[{ data: data ? data.map((item) => item.activity) : [] }]}
            sx={{
              maxWidth: "100%",
              overflow: "visible"
            }}
          />
        </Box>
        <Box
          sx={{
            width: "100%",
            height: 400,
          }}>
          <DataGrid
            rows={data.map((item, index) => ({
              ...item,
              smartContract: item.contract || "N/A",
              id: index,
            }))}
            columns={columns}
            onRowClick={handleRowClick}
          />
        </Box>
      </Box>
    </div>
  );
}
