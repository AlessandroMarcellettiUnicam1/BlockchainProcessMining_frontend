import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import RuleParser from './CoBlockly/coblockComponents/RuleParser.tsx';

export default function RealTimeCompliance() {

    const [ruleText, setRuleText] = useState("");
    const [parsedRule, setParsedRule] = useState(null);

    return (
        <Box p={4}>
    
            {/* Definizione della regola CoBlock */}
            <Box mb={4} p={3} border={1} borderRadius={2} borderColor="grey.300">
                
                <Typography variant="h6" mb={3} fontWeight="bold" color="primary">
                    1. Define a CoBlock rule
                </Typography>
                
                <RuleParser 
                    ruleText={ruleText} 
                    setRuleText={setRuleText} 
                    onRuleParsed={setParsedRule} 
                />

                {parsedRule && (
                    <Typography variant="body2" color="success.main" mt={1}>
                        ✓ Rule parsed and saved in page memory.
                    </Typography>
                )}

            </Box>
            
        </Box>
    );
}