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

export default function CoBlocklyPage() {

  const { mode } = useColorScheme();
  const isDarkMode = mode == 'dark';

  const [logColumns, setLogColumns] = useState([]); // stato per il LogHandler
  const [logMapping, setLogMapping] = useState({}); // stato per il LogMapper
  const [ruleText, setRuleText] = useState(""); // stato per l'editor CoBlockly

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
      <div className="row mb-2">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-0">CoBlock</h5>
                </div>
              </div>
            </div>

            <div className="card-body">
              <div className="mb-1">
                <label htmlFor="rule" className="form-label fw-semibold d-flex align-items-center">
                  <span>Textual Rule</span>
                </label>
                <form id="compileRule">
                  <div className="input-group">
                    <input 
                      id="rule" 
                      type="text" 
                      className="form-control form-control-lg"
                      placeholder="e.g., tx1(function == approveOrder AND sender == 0x123) occ"
                      aria-describedby="ruleHelp" 
                    />
                    <button type="submit" id="parserButton" className="btn btn-primary px-4">
                      Parse Rule
                    </button>
                  </div>
                </form>
              </div>
              <div id="errorParser"></div>{/*-- Dynamic message will appear here--*/}
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------Apply rule------------------------------------------------- */}
      <div className="row mb-2">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">Checking Results</h5>
              </div>
              <div id="spinner-container-rule" className="spinner-container" style={{ display: 'none' }}>
                <div className="d-flex align-items-center">
                  <div className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <span id="phase">Checking rule over log...</span>
                </div>
              </div>
              <form id="verifyRule">
                <button type="submit" className="btn btn-primary">Check rule over blockchain log</button>
              </form>
            </div>
            
            <div className="row p-4">
              <div className="col-4">
                <div className="text-center p-3 border rounded">
                  <div className="text-muted mb-1" style={{ color: 'darkgreen' }}>Compliant Traces</div>
                  <div id="ct" className="fs-4 fw-bold text-success">0</div>
                </div>
              </div>
              <div className="col-4">
                <div className="text-center p-3 border rounded">
                  <div className="text-muted mb-1">Non-compliant Traces</div>
                  <div id="nct" className="fs-4 fw-bold text-danger">0</div>
                </div>
              </div>
              <div className="col-4">
                <div className="text-center p-3 border rounded">
                  <div className="text-muted mb-1">Ignored Traces</div>
                  <div id="it" className="fs-4 fw-bold">0</div>
                </div>
              </div>
            </div>

            <div className="row mb-4 px-4">
              <div className="col-6">
                <h5>[preview] Compliant traces - <a id="downloadLinkC" href="#">Download full JSON</a></h5>
                <div id="jsoneditorC"></div>
              </div>
              <div className="col-6">
                <h5>[preview] Non-compliant traces - <a id="downloadLinkNC" href="#">Download full JSON</a></h5>
                <div id="jsoneditorNC"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}