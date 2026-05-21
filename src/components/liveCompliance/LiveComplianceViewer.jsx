import React, { useState, useRef, useEffect } from "react";
import JSONEditor from "jsoneditor";
import "jsoneditor/dist/jsoneditor.min.css";

export default function LiveComplianceViewer({
  compliantData,
  nonCompliantData,
  stats,
}) {
  const [downloadUrls, setDownloadUrls] = useState({
    compliant: "#",
    nonCompliant: "#",
  });

  const editorCDiv = useRef(null);
  const editorNCDiv = useRef(null);
  const editorCInstance = useRef(null);
  const editorNCInstance = useRef(null);

  // inizializzazione degli editor
  useEffect(() => {
    if (editorCDiv.current && !editorCInstance.current) {
      editorCInstance.current = new JSONEditor(editorCDiv.current, {
        mode: "tree",
      });
    }
    if (editorNCDiv.current && !editorNCInstance.current) {
      editorNCInstance.current = new JSONEditor(editorNCDiv.current, {
        mode: "tree",
      });
    }

    // distrugge le istanze quando il componente viene smontato
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

  // aggiornamento dinamico dei dati (eseguito ogni volta che cambiano le props)
  useEffect(() => {
    if (!compliantData || !nonCompliantData) return;

    // generazione dinamica dei link per il download dei file completi
    const urlC = window.URL.createObjectURL(
      new Blob([JSON.stringify(compliantData)]),
    );
    const urlNC = window.URL.createObjectURL(
      new Blob([JSON.stringify(nonCompliantData)]),
    );
    setDownloadUrls({ compliant: urlC, nonCompliant: urlNC });

    // iniezione dei dati nei riquadri JSONEditor (limitato a 20 elementi per non bloccare il DOM)
    if (editorCInstance.current) {
      const cData = Array.isArray(compliantData)
        ? Object.fromEntries(Object.entries(compliantData).slice(0, 20))
        : compliantData;
      editorCInstance.current.set(cData);
    }
    if (editorNCInstance.current) {
      const ncData = Array.isArray(nonCompliantData)
        ? Object.fromEntries(Object.entries(nonCompliantData).slice(0, 20))
        : nonCompliantData;
      editorNCInstance.current.set(ncData);
    }

    return () => {
      window.URL.revokeObjectURL(urlC);
      window.URL.revokeObjectURL(urlNC);
    };
  }, [compliantData, nonCompliantData]);

  return (
    <div className="card mb-2">
      {/* Riquadro Statistiche */}
      <div className="row p-4">
        <div className="col-4">
          <div className="text-center p-3 border rounded">
            <div className="text-muted mb-1" style={{ color: "darkgreen" }}>
              Compliant Traces
            </div>
            <div className="fs-4 fw-bold text-success">
              {stats?.compliant || 0}
            </div>
          </div>
        </div>
        <div className="col-4">
          <div className="text-center p-3 border rounded">
            <div className="text-muted mb-1">Non-compliant Traces</div>
            <div className="fs-4 fw-bold text-danger">
              {stats?.nonCompliant || 0}
            </div>
          </div>
        </div>
        <div className="col-4">
          <div className="text-center p-3 border rounded">
            <div className="text-muted mb-1">Ignored Traces</div>
            <div className="fs-4 fw-bold">{stats?.ignored || 0}</div>
          </div>
        </div>
      </div>

      {/* Riquadri JSONEditor */}
      <div className="row mb-4 px-4">
        <div className="col-6">
          <h5 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>
            [preview] Compliant traces -
            {downloadUrls.compliant !== "#" ? (
              <a
                href={downloadUrls.compliant}
                download="compliant_set.json"
                style={{ fontSize: "1rem", marginLeft: "5px" }}
              >
                {" "}
                Download full JSON
              </a>
            ) : (
              <span
                className="text-muted"
                style={{ fontSize: "1rem", marginLeft: "5px" }}
              >
                {" "}
                Download full JSON
              </span>
            )}
          </h5>
          <div ref={editorCDiv} style={{ height: "400px" }}></div>
        </div>

        <div className="col-6">
          <h5 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>
            [preview] Non-compliant traces -
            {downloadUrls.nonCompliant !== "#" ? (
              <a
                href={downloadUrls.nonCompliant}
                download="non-compliant_set.json"
                style={{ fontSize: "1rem", marginLeft: "5px" }}
              >
                {" "}
                Download full JSON
              </a>
            ) : (
              <span
                className="text-muted"
                style={{ fontSize: "1rem", marginLeft: "5px" }}
              >
                {" "}
                Download full JSON
              </span>
            )}
          </h5>
          <div ref={editorNCDiv} style={{ height: "400px" }}></div>
        </div>
      </div>
    </div>
  );
}
