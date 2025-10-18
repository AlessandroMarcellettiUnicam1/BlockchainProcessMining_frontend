import { BarChart } from "@mui/x-charts/BarChart";
import React from "react";
import { Box } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useDialogs } from "@toolpad/core/useDialogs";
import { CallsDialog } from "./dialogs/CallsDialog";
import axios from "axios";
import {useQuery} from "react-query";
import {useDataView} from "../../context/DataViewContext";


const columns = [
    {field: "transactionHash", headerName: "Transaction Hash",width:400},
    {field: "contractAddress", headerName: "Contract Address",width:400},
    {field: "functionName", headerName: "Function Name",width:300},
];

export default function Call({data}) {
    const dialogs = useDialogs();
    const query = useDataView();
    const { data:dataGrid } = useQuery({
        queryFn: () =>
            axios
                .post(
                    `http://localhost:8000/api/data/transactions`,
                    query
                )
                .then((res) => {
                    return res.data;
                }),
        keepPreviousData: true,
    });


    const handleRowClick = async (params) => {
        await dialogs.open(CallsDialog, {
            txHash: params.row.transactionHash
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
                        minWidth: {md: "400px"},
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
                        xAxis={[{data: data.map((item) => item.callType)}]}
                    />
                </Box>
                <Box
                    sx={{
                        flexGrow: 1,
                        width: "100%",
                        height: 400,
                    }}>
                    <DataGrid
                        rows = {(dataGrid || []).map((item,index)=> ({
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
