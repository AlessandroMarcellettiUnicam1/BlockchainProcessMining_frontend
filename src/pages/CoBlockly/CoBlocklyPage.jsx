import React, { useEffect, useRef, useState } from 'react';
import './style.css';
import './blockly_style.css';
import 'jsoneditor/dist/jsoneditor.min.css';
import { startCoBlockly } from './main.ts';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useColorScheme } from '@mui/material/styles';
import LogHandler from './coblockComponents/LogHandler.tsx';
import LogMapper from './coblockComponents/logMapper.tsx';
import CoBlocklyEditor from './coblockComponents/CoBlocklyEditor.tsx';
import RuleParser from './coblockComponents/RuleParser.tsx';
import RuleApplier from './coblockComponents/RuleApplier.tsx';

export default function CoBlocklyPage() {

  const { mode } = useColorScheme();
  const isDarkMode = mode == 'dark';

  const [logColumns, setLogColumns] = useState([]); // stato per il LogHandler
  const [logMapping, setLogMapping] = useState({}); // stato per il LogMapper
  const [ruleText, setRuleText] = useState(""); // stato per l'editor CoBlockly
  const [parsedRule, setParsedRule] = useState(null); // stato per il parser

  return (
    <div className="container" data-bs-theme={isDarkMode ? 'dark' : 'light'}>
      <header className="mb-2">
        <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
          <div className="container-fluid">
            <a className="navbar-brand d-flex align-items-center" href="#">
              <div>
                <span className="fw-bold">Blockchain Compliance Checking Framework</span>
              </div>
            </a>
          </div>
        </nav>
      </header>

      {/* -----------------------------Blockchain Log Handling--------------------------------------- */}
      
      <LogHandler onLogUploaded={setLogColumns}/>

      {/* -----------------------------------Blockchain Log Mapping------------------------------------------------- */}
      <LogMapper 
        columns={logColumns} 
        onMappingChange={setLogMapping} 
      />

      {/* -----------------------------------CoBlockly------------------------------------------------- */}

      <CoBlocklyEditor onRuleTranslated={setRuleText} />

      {/* -----------------------------------Blockchain-based compliance rules------------------------------------------------- */}

      <RuleParser 
        ruleText={ruleText} 
        setRuleText={setRuleText} 
        onRuleParsed={setParsedRule} 
      />

      {/* -------------------------------------------Apply rule------------------------------------------------- */}

      <RuleApplier logMapping={logMapping} parsedRule={parsedRule} />

    </div>
  );
}