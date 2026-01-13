import React, { useEffect, useState } from 'react';
import { Box,Button, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import jp from 'jsonpath';
import useDataContext from '../../context/useDataContext';

function KeyType({ nameFrom, nameTo, objectToSet, index,setObjectsTypesItem }) {
    const { results } = useDataContext();
    const [objectTypesOptions, setObjectTypesOptions] = useState([]);
    objectToSet.index = index;
    // Extract unique keys (excluding numeric and mongo keys)
    function getUniqueKeys(json) {
        if (!json) return [];

        const paths = jp.paths(json, '$..*');
        const keys = new Set();

        paths.forEach(pathArray => {
            if (pathArray.length > 1) {
                const cleanPath = pathArray.slice(1);

                const filteredPath = cleanPath.filter(k =>
                    isNaN(k)
                    && !String(k).startsWith('_')
                    && !String(k).startsWith('$')
                );

                // Reject paths where "calls" appears more than once
                const callCount = filteredPath.filter(k => k === "calls").length;
                if (callCount > 1) return;

                if (filteredPath.length > 0) {
                    keys.add(filteredPath.join('.'));
                }
            }
        });

        return Array.from(keys);
    }

    useEffect(() => {
        if (results) {
            setObjectTypesOptions(getUniqueKeys(results));
        }
    }, [results]);
    const handleRemoveObject=(e)=>{
        setObjectsTypesItem(prev => prev.filter(item => item.index !== e.index))
    }
    const handleSelectObjectTypeNameFrom = (e) => {
        objectToSet.nameFrom=nameFrom
        objectToSet.from = e.target.value;
    };

    const handleSelectObjectTypeNameTo = (e) => {
        objectToSet.nameTo=nameTo
        objectToSet.to = e.target.value;
    };


    return (
        <Box display="flex" gap={2} >
            <FormControl fullWidth sx={{ width: 200 }}>
                <InputLabel id={`label-from-${index}`}>{nameFrom}</InputLabel>
                <Select
                    labelId={`label-from-${index}`}
                    id={`select-from-${index}`}
                    onChange={handleSelectObjectTypeNameFrom}
                    defaultValue=""
                >
                    {objectTypesOptions.length > 0 ? (
                        objectTypesOptions.map((key, i) => (
                            <MenuItem key={`${nameFrom}-${i}`} value={key}>{key}</MenuItem>
                        ))
                    ) : (
                        <MenuItem disabled>No Keys Found</MenuItem>
                    )}
                </Select>
            </FormControl>

            <FormControl fullWidth sx={{ width: 200 }}>
                <InputLabel id={`label-to-${index}`}>{nameTo}</InputLabel>
                <Select
                    labelId={`label-to-${index}`}
                    id={`select-to-${index}`}
                    onChange={handleSelectObjectTypeNameTo}
                    defaultValue=""
                >
                    {objectTypesOptions.length > 0 ? (
                        objectTypesOptions.map((key, i) => (
                            <MenuItem key={`${nameTo}-${i}`} value={key}>{key}</MenuItem>
                        ))
                    ) : (
                        <MenuItem disabled>No Keys Found</MenuItem>
                    )}
                </Select>
            </FormControl>
            <Box marginTop={1} >
                <Button onClick={() => handleRemoveObject(objectToSet)}>
                    <DeleteIcon sx={{fontSize: 30, color: "red"}}/>
                </Button>
            </Box>
        </Box>

    );
}

export default KeyType;
