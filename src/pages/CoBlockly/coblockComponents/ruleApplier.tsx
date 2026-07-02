import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import JSONEditor from 'jsoneditor';
//@ts-ignore
import 'jsoneditor/dist/jsoneditor.min.css';

interface RuleApplierProps {
  logMapping: any; 
  parsedRule: string | null; 
  totalTraces?: number; 
}

export default function RuleApplier({ logMapping, parsedRule, totalTraces = 0 }: RuleApplierProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [stats, setStats] = useState({ compliant: 0, nonCompliant: 0, ignored: 0 });
  const [downloadUrls, setDownloadUrls] = useState({ compliant: '#', nonCompliant: '#' });

  const editorCDiv = useRef<HTMLDivElement>(null);
  const editorNCDiv = useRef<HTMLDivElement>(null);
  
  const editorCInstance = useRef<any>(null);
  const editorNCInstance = useRef<any>(null);

  useEffect(() => {
    if (editorCDiv.current && !editorCInstance.current) {
      editorCInstance.current = new JSONEditor(editorCDiv.current, { mode: 'tree' });
    }
    if (editorNCDiv.current && !editorNCInstance.current) {
      editorNCInstance.current = new JSONEditor(editorNCDiv.current, { mode: 'tree' });
    }

    return () => {
      if (editorCInstance.current) {
        editorCInstance.current.destroy();
        editorCInstance.current = null; 
      }
      if (editorNCInstance.current) {
        editorNCInstance.current.destroy();
        editorNCInstance.current = null; 
      }
    };
  }, []);

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!parsedRule) {
      alert("Please compile a valid rule first!");
      return;
    }

    setIsLoading(true);
    console.log("Applying rule to event log...");

    const payload = {
      rule: { rule: parsedRule },
      mapping: logMapping
    };

    try {
      const response = await axios.post('http://127.0.0.1:8001/api/verifyRule', payload);
      
      const c = response.data.compliant;
      const nc = response.data.noncompliant;

      const urlC = window.URL.createObjectURL(new Blob([JSON.stringify(c)]));
      const urlNC = window.URL.createObjectURL(new Blob([JSON.stringify(nc)]));
      setDownloadUrls({ compliant: urlC, nonCompliant: urlNC });

      const ignoredCount = totalTraces - (c.length + nc.length);
      setStats({
        compliant: c.length,
        nonCompliant: nc.length,
        ignored: ignoredCount >= 0 ? ignoredCount : 0
      });

      if (editorCInstance.current) {
        editorCInstance.current.set(Object.fromEntries(Object.entries(c).slice(0, 20)));
      }
      if (editorNCInstance.current) {
        editorNCInstance.current.set(Object.fromEntries(Object.entries(nc).slice(0, 20)));
      }

    } catch (error) {
      console.error('Error submitting data:', error);
      alert('Error verifying rule. Check the console.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="row mb-2">
      <div className="col-12">
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-0">Checking Results</h5>
            </div>
            
            <div className="d-flex align-items-center gap-3">
              {isLoading && (
                <div className="spinner-container d-flex align-items-center text-primary">
                  <div className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <span>Checking rule over log...</span>
                </div>
              )}
              
              <form onSubmit={handleVerify}>
                <button type="submit" className="btn btn-primary" disabled={isLoading || !parsedRule}>
                  Check rule over blockchain log
                </button>
              </form>
            </div>
          </div>
          
          <div className="row p-4">
            <div className="col-4">
              <div className="text-center p-3 border rounded">
                <div className="text-muted mb-1" style={{ color: 'darkgreen' }}>Compliant Traces</div>
                <div className="fs-4 fw-bold text-success">{stats.compliant}</div>
              </div>
            </div>
            <div className="col-4">
              <div className="text-center p-3 border rounded">
                <div className="text-muted mb-1">Non-compliant Traces</div>
                <div className="fs-4 fw-bold text-danger">{stats.nonCompliant}</div>
              </div>
            </div>
            <div className="col-4">
              <div className="text-center p-3 border rounded">
                <div className="text-muted mb-1">Ignored Traces</div>
                <div className="fs-4 fw-bold">{stats.ignored}</div>
              </div>
            </div>
          </div>

          <div className="row mb-4 px-4">
            <div className="col-6">
              <h5>
                [preview] Compliant traces - 
                {downloadUrls.compliant !== '#' ? (
                  <a href={downloadUrls.compliant} download="compliant_set.json"> Download full JSON</a>
                ) : (
                  <span className="text-muted"> Download full JSON</span>
                )}
              </h5>
              <div ref={editorCDiv} style={{ height: '400px' }}></div>
            </div>
            <div className="col-6">
              <h5>
                [preview] Non-compliant traces - 
                {downloadUrls.nonCompliant !== '#' ? (
                  <a href={downloadUrls.nonCompliant} download="non-compliant_set.json"> Download full JSON</a>
                ) : (
                  <span className="text-muted"> Download full JSON</span>
                )}
              </h5>
              <div ref={editorNCDiv} style={{ height: '400px' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}