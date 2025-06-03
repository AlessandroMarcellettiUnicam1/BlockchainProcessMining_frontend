import React from 'react';
import { Box, TextField, Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useDataView } from '../../context/DataViewContext';
import SearchIcon from "@mui/icons-material/Search";
import DeleteSweepTwoToneIcon from "@mui/icons-material/DeleteSweepTwoTone";

// const data = [
//   {
//     id: 0,
//     sender: "0x1234567890123456789012345678901234567890",
//     numberOfTransactions: 100,
//     averageGasUsed: 124453
//   },
//   {
//     id: 1,
//     sender: "0x1234567890123456789012345678901234567890",
//     numberOfTransactions: 100,
//     averageGasUsed: 124453
//   },
//   {
//     id: 2,
//     sender: "0x1234567890123456789012345678901234567890",
//     numberOfTransactions: 100,
//     averageGasUsed: 124453
//   },
//   {
//     id: 3,
//     sender: "0x1234567890123456789012345678901234567890",
//     numberOfTransactions: 100,
//     averageGasUsed: 124453
//   },
//   {
//     id: 4,
//     sender: "0x1234567890123456789012345678901234567890",
//     numberOfTransactions: 100,
//     averageGasUsed: 124453
//   },
//   {
//     id: 5,
//     sender: "0x1234567890123456789012345678901234567890",
//     numberOfTransactions: 100,
//     averageGasUsed: 124453
//   }
// ]
const columns = [
  { field: 'sender', headerName: 'Sender', width: 400 },
  { field: 'numberOfTransactions', headerName: 'Number of Transactions', width: 200 },
  { field: 'averageGasUsed', headerName: 'Average Gas Used', width: 200 },
];

export default function MostActiveSenders() {
    const { data, setDataView } = useDataView();

    const [searchValue, setSearchValue] = React.useState("");
    const [filteredData, setFilteredData] = React.useState(data || []);

    return (
			<div>
				<h1>Most Active Senders</h1>
				<Box
					sx={{
						flexGrow: 1,
						width: { xs: "100%", md: "100%" },
						height: 400,
					}}>
					<Box
						sx={{
							display: "flex",
							flexDirection: "row",
							alignItems: "center",
							gap: 2,
							marginBottom: 2,
						}}>
						<TextField
							label="Search by Sender"
							variant="outlined"
							fullWidth
              value={searchValue}
              placeholder='0x...'
							onChange={(e) =>
								setSearchValue(e.target.value.toLowerCase())
							}
						/>
						<Button
							variant="contained"
							onClick={() =>
								setFilteredData(
									data.filter((item) =>
										item.sender.toLowerCase().includes(searchValue)
									)
								)
							}
							sx={{ width: "fit-content", height: "100%", minHeight: "56px" }}>
							<SearchIcon />
						</Button>
						<Button
							variant="contained"
							onClick={() => {
                setFilteredData(data);
                setSearchValue("");
              }}
							sx={{
								width: "fit-content",
								backgroundColor: "red",
								color: "white",
								height: "100%",
								minHeight: "56px",
							}}>
							<DeleteSweepTwoToneIcon />
						</Button>
					</Box>
					<DataGrid
						rows={filteredData.map((item, index) => ({
							id: index,
							sender: item.sender || "Unknown",
							numberOfTransactions: item.numberOfTransactions || 0,
							averageGasUsed: item.averageGasUsed || 0,
						}))}
						columns={columns}
					/>
				</Box>
			</div>
		);
}
