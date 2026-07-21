import React, { useState } from "react";
import { isAddress } from "web3-validator";
import {
  Box,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  Paper,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

export default function MempoolFilter({
  monitoredContracts,
  setMonitoredContracts,
}) {
  const [inputAddress, setInputAddress] = useState("");
  const [addressError, setAddressError] = useState(false);

  const handleAddContract = () => {
    if (isAddress(inputAddress)) {
      const normalizedAddress = inputAddress.toLowerCase();

      if (!monitoredContracts.includes(normalizedAddress)) {
        setMonitoredContracts([...monitoredContracts, normalizedAddress]);
      }

      setInputAddress("");
      setAddressError(false);
    } else {
      setAddressError(true);
    }
  };

  const handleDeleteContract = (addressToRemove) => {
    setMonitoredContracts(
      monitoredContracts.filter((addr) => addr !== addressToRemove),
    );
  };

  return (
    <Box>
      {/* Input e Bottone Confirm */}
      <Box display="flex" alignItems="flex-start" gap={2} mb={3}>
        <TextField
          label="Contract Address"
          variant="outlined"
          fullWidth
          value={inputAddress}
          onChange={(e) => setInputAddress(e.target.value)}
          error={addressError}
          helperText={
            addressError
              ? "Invalid EVM Address (Must be 0x... and 42 chars)"
              : "Enter a valid 0x... address"
          }
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleAddContract}
          disabled={!inputAddress}
          sx={{ height: "56px", minWidth: "120px" }}
        >
          Confirm
        </Button>
      </Box>

      {/* Lista dei contratti monitorati */}
      {monitoredContracts.length > 0 && (
        <Paper variant="outlined">
          <List dense>
            {monitoredContracts.map((address, index) => (
              <ListItem
                key={index}
                secondaryAction={
                  <IconButton
                    edge="end"
                    color="error"
                    onClick={() => handleDeleteContract(address)}
                  >
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText primary={address} />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
}
