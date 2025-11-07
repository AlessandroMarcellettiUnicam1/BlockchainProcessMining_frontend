import React, {useState, useEffect} from 'react';

import {
    Alert,
    Box,
    Button, Checkbox, Chip, Dialog, DialogContent, DialogTitle,
    FilledInput,
    FormControl, IconButton, Input,
    InputLabel, MenuItem, Select, Slide, Slider, Snackbar,
    Stack, TextField,
    Typography,
} from "@mui/material";

import LinearProgress from "@mui/material/LinearProgress";
import {_sendData} from "../api/services";
import PageLayout from "../layouts/PageLayout";
import useDataContext from "../context/useDataContext";
import {HiddenInput} from "../components/HiddenInput";
import {FileUpload, FilterList} from "@mui/icons-material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddBoxIcon from "@mui/icons-material/AddBox";
import {DateTimePicker, LocalizationProvider} from "@mui/x-date-pickers";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import {DemoContainer} from "@mui/x-date-pickers/internals/demo";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import {Link} from "react-router";

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="down" ref={ref} {...props} />;
});

function DataExtractionInternalPage() {
    dayjs.extend(utc)

    const defaultDate = new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate()
    const defaultTime = new Date().getHours() + ':' + new Date().getMinutes()

    const {setResults} = useDataContext()

    const [contractName, setContractName] = useState("CakeOFT")

    // Separated states for From and To
    const [contractAddressesFrom, setContractAddressesFrom] = useState([]);
    const [addressToAddFrom, setAddressToAddFrom] = useState("");

    const [contractAddressesTo, setContractAddressesTo] = useState([]);
    const [addressToAddTo, setAddressToAddTo] = useState("");

    const [impl_contract, setImplContractAddress] = useState("")
    const [fromBlock, setFromBlock] = useState("18698008")
    const [toBlock, setToBlock] = useState("18698323")
    const [network, setNetwork] = useState("Mainnet")
    const [loading, setLoading] = useState(false)
    const [smartContract, setSmartContract] = useState(null)
    const [error, setError] = useState()

    const [openFilters, setOpenFilters] = useState(false)
    const [filterGasUsed, setFilterGasUsed] = useState(false)
    const [gasUsed, setGasUsed] = useState([0, 1000000])
    const [filterGasPrice, setFilterGasPrice] = useState(false)
    const [gasPrice, setGasPrice] = useState([0, 10000000000])
    const [filterTimestamp, setFilterTimestamp] = useState(false)
    const [timestamp, setTimestamp] = useState([dayjs.utc(defaultDate + 'T' + defaultTime), dayjs.utc(defaultDate + 'T' + defaultTime)])

    const [senders, setSenders] = useState([])
    const [senderToAdd, setSenderToAdd] = useState("")

    const [functions, setFunctions] = useState([])
    const [functionToAdd, setFunctionToAdd] = useState("")

    const [activeFilter, setActiveFilter] = useState(new Set())

    const sendData = async () => {
        setLoading(true)

        const filters = {
            gasUsed: filterGasUsed ? gasUsed : null,
            gasPrice: filterGasPrice ? gasPrice : null,
            timestamp: filterTimestamp ? timestamp : null,
            senders: senders,
            functions: functions
        }

        // Use contractAddressesFrom to send data
        const response = await _sendData(contractName, contractAddressesFrom, impl_contract, fromBlock, toBlock, network, smartContract, filters)

        if (response.status === 200) {
            setResults(response.data)
            setLoading(false)
        } else {
            setError(response.data)
            setLoading(false)
        }
    }

    const networks = ["Mainnet", "Sepolia", "Polygon", "Amoy"]

    useEffect(() => {
        switch (network) {
            case "Mainnet":
                setContractName("CakeOFT")
                setContractAddressesFrom([])
                setFromBlock("18698008")
                setToBlock("18698323")
                break
            case "Sepolia":
                setContractName("emergencyResponsePlan")
                setContractAddressesFrom([])
                setFromBlock("5713209")
                setToBlock("5713239")
                break
            case "Polygon":
                setContractName("")
                setContractAddressesFrom([])
                setFromBlock("")
                setToBlock("")
                break
            case "Amoy":
                setContractName("EmergencyResponsePlan")
                setContractAddressesFrom([])
                setFromBlock("10949056")
                setToBlock("10949424")
                break
            default:
                console.log("Change Network")
        }
    }, [network, smartContract]);

    const deletItemFromSet = (item) => {
        setActiveFilter(prevState => {
            const newSet = new Set(prevState)
            newSet.delete(item)
            return newSet
        })
    }

    const addItemToSet = (item) => {
        setActiveFilter(prevState => {
            const newSet = new Set(prevState)
            newSet.add(item)
            return newSet
        })
    }

    const handleNetworkChange = (e) => {
        setNetwork(e.target.value)
    }

    const handleContractUpload = (e) => {
        const file = e.target.files[0]
        setSmartContract(file)
        e.target.value = null
    }

    window.onclick = function (event) {
        setError(null)
    }

    const handleGasUsedBlur = () => {
        if (gasUsed[0] < 0) setGasUsed([0, gasUsed[1]])
        if (gasUsed[1] < 0) setGasUsed([gasUsed[0], 0])
    }

    const handleGasUsedChange = (event, newValue) => {
        if (!Array.isArray(newValue)) return
        setGasUsed([newValue[0], newValue[1]])
    }

    const handleGasUsedCheck = () => {
        if (!filterGasUsed) {
            addItemToSet("gasUsed")
        } else {
            deletItemFromSet("gasUsed")
        }
        setFilterGasUsed(!filterGasUsed)
    }

    const handleGasPriceChange = (event, newValue) => {
        if (!Array.isArray(newValue)) return
        setGasPrice([newValue[0], newValue[1]])
    }

    const handleGasPriceBlur = () => {
        if (gasPrice[0] < 0) setGasPrice([0, gasPrice[1]])
        if (gasPrice[1] < 0) setGasPrice([gasPrice[0], 0])
    }

    const handleGasPriceCheck = () => {
        if (!filterGasPrice) {
            addItemToSet("gasPrice")
        } else {
            deletItemFromSet("gasPrice")
        }
        setFilterGasPrice(!filterGasPrice)
    }

    const handleTimestampCheck = () => {
        if (!filterTimestamp) {
            addItemToSet("timestamp")
        } else {
            deletItemFromSet("timestamp")
        }
        setFilterTimestamp(!filterTimestamp)
    }

    const handleAddSenders = () => {
        setSenders([...senders, senderToAdd.toLowerCase()])
        setSenderToAdd("")
        addItemToSet("senders")
    }

    const handleAddFunctions = () => {
        setFunctions([...functions, functionToAdd])
        setFunctionToAdd("")
        addItemToSet("functions")
    }

    const handleDeleteSender = (e) => {
        const newSenders = senders.filter(sender => sender !== e.currentTarget.name.toLowerCase())
        setSenders(newSenders)
        if (newSenders.length === 0) {
            deletItemFromSet("senders")
        }
    }

    const handleDeleteFunction = (e) => {
        const newFunctions = functions.filter(func => func !== e.currentTarget.name)
        setFunctions(newFunctions)
        if (newFunctions.length === 0) {
            deletItemFromSet("functions")
        }
    }

    const handleDeleteFilter = (filter) => {
        deletItemFromSet(filter)
        if (filter === "gasUsed") {
            setFilterGasUsed(false)
        }
        if (filter === "gasPrice") {
            setFilterGasPrice(false)
        }
        if (filter === "timestamp") {
            setFilterTimestamp(false)
        }
        if (filter === "senders") {
            setSenders([])
        }
        if (filter === "functions") {
            setFunctions([])
        }
    }

    return (
        <>
            {error}
            <Dialog
                open={openFilters}
                TransitionComponent={Transition}
                keepMounted
                onClose={() => setOpenFilters(false)}
                maxWidth=""
            >
                <DialogTitle>Filters</DialogTitle>
                <DialogContent>
                    {/*Gas Used*/}
                    <Box>
                        <Typography fontWeight={700} fontSize="18px">Gas Used</Typography>
                        <Checkbox checked={filterGasUsed} onChange={handleGasUsedCheck}/>
                        <TextField
                            value={gasUsed[0]}
                            disabled={!filterGasUsed}
                            onChange={e => setGasUsed([e.target.value, gasUsed[1]])}
                            onBlur={handleGasUsedBlur}
                            type="number"
                            inputProps={{
                                step: 50,
                                min: 0,
                            }}
                        />
                        <TextField
                            value={gasUsed[1]}
                            disabled={!filterGasUsed}
                            onChange={e => setGasUsed([gasUsed[0], e.target.value])}
                            onBlur={handleGasUsedBlur}
                            type="number"
                            inputProps={{
                                step: 50,
                                min: 0,
                            }}
                        />
                        <Slider
                            getAriaLabel={() => 'Gas Used'}
                            value={gasUsed}
                            disabled={!filterGasUsed}
                            onChange={handleGasUsedChange}
                            max={1000000}
                            min={0}
                        />
                    </Box>
                    {/*GAS PRICE*/}
                    <Box>
                        <Typography fontWeight={700} fontSize="18px">Gas Price</Typography>
                        <Checkbox checked={filterGasPrice} onChange={handleGasPriceCheck}/>
                        <TextField
                            value={gasPrice[0]}
                            disabled={!filterGasPrice}
                            onChange={e => setGasPrice([e.target.value, gasPrice[1]])}
                            onBlur={handleGasPriceBlur}
                            type="number"
                            inputProps={{
                                step: 50,
                                min: 0,
                            }}
                        />
                        <TextField
                            value={gasPrice[1]}
                            disabled={!filterGasPrice}
                            onChange={e => setGasPrice([gasPrice[0], e.target.value])}
                            onBlur={handleGasPriceBlur}
                            type="number"
                            inputProps={{
                                step: 50,
                                min: 0,
                            }}
                        />
                        <Slider
                            getAriaLabel={() => 'Gas Price'}
                            value={gasPrice}
                            disabled={!filterGasPrice}
                            onChange={handleGasPriceChange}
                            max={10000000000}
                            min={0}
                        />
                    </Box>
                    <Box>
                        <Typography fontWeight={700} fontSize="18px">Senders</Typography>
                        <TextField value={senderToAdd} onChange={event => setSenderToAdd(event.target.value)}/>
                        <IconButton onClick={handleAddSenders}>
                            <AddBoxIcon color={"primary"} fontSize={"large"}/>
                        </IconButton>
                        <Box>
                            {
                                senders.map((sender, index) => (
                                    <Chip key={index} label={sender}
                                          onDelete={e => handleDeleteSender(e)}
                                          name={sender}
                                    />
                                ))
                            }
                        </Box>
                    </Box>
                    <Box>
                        <Typography fontWeight={700} fontSize="18px">Timestamp</Typography>
                        <Checkbox checked={filterTimestamp} onChange={handleTimestampCheck}/>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DemoContainer components={['DateTimePicker']}>
                                <DateTimePicker value={timestamp[0]}
                                                onChange={newValue => setTimestamp([newValue, timestamp[1]])}
                                                label="Start" disabled={!filterTimestamp}/>
                                <DateTimePicker value={timestamp[1]}
                                                onChange={newValue => setTimestamp([timestamp[0], newValue])}
                                                label="End" disabled={!filterTimestamp}/>
                            </DemoContainer>
                        </LocalizationProvider>
                    </Box>
                    <Box>
                        <Typography fontWeight={700} fontSize="18px">Functions</Typography>
                        <TextField value={functionToAdd} onChange={event => setFunctionToAdd(event.target.value)}/>
                        <IconButton onClick={handleAddFunctions}>
                            <AddBoxIcon color={"primary"} fontSize={"large"}/>
                        </IconButton>
                        <Box>
                            {
                                functions.map((func, index) => (
                                    <Chip key={index} label={func}
                                          onDelete={e => handleDeleteFunction(e)}
                                          name={func}
                                    />
                                ))
                            }
                        </Box>
                    </Box>
                </DialogContent>
            </Dialog>

            <PageLayout>
                <Typography variant="h2" textAlign="center" marginBottom={2}>Data Extraction Internal</Typography>
                <Stack spacing={2}>
                    <Box display="flex" gap={2}>
                        <Box flex={1}>
                            {/* Contract Addresses From */}
                            <Box>
                                <Typography fontWeight={700} fontSize="18px">Contract Addresses From</Typography>
                                <Box display="flex" gap={1} alignItems="flex-start">
                                    <TextField
                                        value={addressToAddFrom}
                                        onChange={e => setAddressToAddFrom(e.target.value)}
                                        placeholder="Add addresses (separated by comma, space, or line break)"
                                        size="small"
                                        fullWidth
                                        multiline
                                        rows={3}
                                    />
                                    <IconButton
                                        onClick={() => {
                                            if (addressToAddFrom) {
                                                const newAddresses = addressToAddFrom
                                                    .split(/[,\s\n]+/)
                                                    .map(addr => addr.trim())
                                                    .filter(addr => addr.length > 0);

                                                setContractAddressesFrom([...contractAddressesFrom, ...newAddresses]);
                                                setAddressToAddFrom("");
                                            }
                                        }}>
                                        <AddBoxIcon color="primary" fontSize="large"/>
                                    </IconButton>
                                </Box>
                                <Box mt={1}>
                                    {contractAddressesFrom.map((addr, idx) => (
                                        <Box key={idx} display="flex" justifyContent="space-between" alignItems="center"
                                             mt={1}>
                                            <Typography>{addr}</Typography>
                                            <IconButton onClick={() => setContractAddressesFrom(contractAddressesFrom.filter((a, i) => i !== idx))}>
                                                <DeleteIcon color="error" fontSize="medium"/>
                                            </IconButton>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </Box>

                        <Box flex={1}>
                            {/* Contract Addresses To */}
                            <Box>
                                <Typography fontWeight={700} fontSize="18px">Contract Addresses To</Typography>
                                <Box display="flex" gap={1} alignItems="flex-start">
                                    <TextField
                                        value={addressToAddTo}
                                        onChange={e => setAddressToAddTo(e.target.value)}
                                        placeholder="Add addresses (separated by comma, space, or line break)"
                                        size="small"
                                        fullWidth
                                        multiline
                                        rows={3}
                                    />
                                    <IconButton
                                        onClick={() => {
                                            if (addressToAddTo) {
                                                const newAddresses = addressToAddTo
                                                    .split(/[,\s\n]+/)
                                                    .map(addr => addr.trim())
                                                    .filter(addr => addr.length > 0);

                                                setContractAddressesTo([...contractAddressesTo, ...newAddresses]);
                                                setAddressToAddTo("");
                                            }
                                        }}>
                                        <AddBoxIcon color="primary" fontSize="large"/>
                                    </IconButton>
                                </Box>
                                <Box mt={1}>
                                    {contractAddressesTo.map((addr, idx) => (
                                        <Box key={idx} display="flex" justifyContent="space-between" alignItems="center"
                                             mt={1}>
                                            <Typography>{addr}</Typography>
                                            <IconButton onClick={() => setContractAddressesTo(contractAddressesTo.filter((a, i) => i !== idx))}>
                                                <DeleteIcon color="error" fontSize="medium"/>
                                            </IconButton>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </Box>
                    </Box>

                    {/* Implementation contract address */}
                    {/* <FormControl variant="filled">
                        <InputLabel sx={{fontWeight: 700, fontSize: "18px"}}>Implementation contract address</InputLabel>
                        <FilledInput
                            value={impl_contract}
                            label="Implementation contract address"
                            onChange={e => setImplContractAddress(e.target.value)}/>
                    </FormControl> */}

                    <Box display="flex" gap={2}>
                        <FormControl variant="filled" sx={{flex: 1}}>
                            <InputLabel sx={{fontWeight: 700, fontSize: "18px"}}>From Block</InputLabel>
                            <FilledInput
                                value={fromBlock}
                                label="From Block"
                                onChange={e => setFromBlock(e.target.value)}/>
                        </FormControl>

                        <FormControl variant="filled" sx={{flex: 1}}>
                            <InputLabel sx={{fontWeight: 700, fontSize: "18px"}}>To Block</InputLabel>
                            <FilledInput
                                value={toBlock}
                                label="To Block"
                                onChange={e => setToBlock(e.target.value)}/>
                        </FormControl>
                    </Box>

                    {smartContract &&
                        <>
                            <Chip label={smartContract.name}
                                  onDelete={() => setSmartContract(null)}
                            />
                        </>
                    }

                    <Button
                        fullWidth
                        component="label"
                        startIcon={<FileUpload/>}
                        variant="contained"
                        disabled={loading}
                        sx={{
                            padding: 1,
                            height: "40px",
                            backgroundColor: "#86469C",
                            '&:hover': {backgroundColor: "#512960"},
                            color: "#B9DCF7"
                        }}
                    >
                        Upload Smart Contract
                        <HiddenInput type="file" accept=".sol" onChange={handleContractUpload}/>
                    </Button>

                    {loading ?
                        <LinearProgress/>
                        :
                        <>
                            <Button
                                fullWidth
                                onClick={sendData}
                                startIcon={<FilterList/>}
                                variant="contained"
                                sx={{
                                    padding: 1,
                                    height: "40px"
                                }}
                            >
                                Extract Data
                            </Button>
                        </>
                    }
                </Stack>
            </PageLayout>
        </>
    );
}

export default DataExtractionInternalPage;
