import React, { useState } from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";

function XesType({ name, objectToSet, options = [] }) {
  const [value, setValue] = useState("");

  const handleSelectObjectTypeName = (e) => {
    const selected = e.target.value;
    setValue(selected);
    objectToSet({ name, value: selected });
  };

  return (
    <Box display="flex">
      <Box>
        <FormControl fullWidth sx={{ width: 200 }}>
          <InputLabel>Key</InputLabel>
          <Select
            label="Key"
            value={value}
            onChange={handleSelectObjectTypeName}
          >
            {options.length > 0 ? (
              options.map((key, index) => (
                <MenuItem key={index} value={key}>
                  {key}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>No Keys Found</MenuItem>
            )}
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
}

export default XesType;