import React, { useState, useEffect } from "react";

interface LogMapperProps {
  columns: string[]; // colonne estratte dal logHandler
  onMappingChange: (mapping: any) => void; // per inviare il mapping finale al padre
}

export default function LogMapper({
  columns,
  onMappingChange,
}: LogMapperProps) {
  // valori di default
  const [mapping, setMapping] = useState({
    function: "activity",
    contract: "receivingContract",
    block: "blockNumber",
    sender: "requester",
    timestamp: "timestamp",
    gasLimit: "gasLimit",
    gasUsed: "gasUsed",
    value: "value",
    SV: "stateVariable",
    CALL: "internalTxs",
    I: "inputs",
    E: "events",
  });

  // aggiornamento dei valori al cambio di tendina
  const handleSelectChange = (key: string, value: string) => {
    setMapping((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // avvisiamo il padre quando c'è un cambio di memoria
  useEffect(() => {
    onMappingChange(mapping);
  }, [mapping, onMappingChange]);

  // configurazione dei campi
  const mappingFields = [
    { id: "fun", label: "Function", key: "function", defaultVal: "activity" },
    {
      id: "ca",
      label: "Contract",
      key: "contract",
      defaultVal: "receivingContract",
    },
    { id: "b", label: "Block", key: "block", defaultVal: "blockNumber" },
    { id: "s", label: "Sender", key: "sender", defaultVal: "requester" },
    {
      id: "time",
      label: "Timestamp",
      key: "timestamp",
      defaultVal: "timestamp",
    },
    { id: "gL", label: "Gas Limit", key: "gasLimit", defaultVal: "gasLimit" },
    { id: "gU", label: "Gas Used", key: "gasUsed", defaultVal: "gasUsed" },
    { id: "V", label: "Value", key: "value", defaultVal: "value" },
    {
      id: "sv",
      label: "Storage Variables",
      key: "SV",
      defaultVal: "stateVariable",
    },
    {
      id: "call",
      label: "Internal Txs",
      key: "CALL",
      defaultVal: "internalTxs",
    },
    { id: "i", label: "Inputs", key: "I", defaultVal: "inputs" },
    { id: "e", label: "Events", key: "E", defaultVal: "events" },
  ];

  return (
    <div className="row mb-2">
      <div className="col-12">
        <div className="card">
          <div className="card-body">
            <div className="d-flex" style={{ justifyContent: "space-between" }}>
              <h5 className="card-title mb-3">Blockchain Log Mapping</h5>
              <span className="small">
                Scroll horizontally to view all mapping fields
              </span>
            </div>

            <div
              className="overflow-auto"
              style={{
                maxHeight: "200px",
                overflowX: "auto",
                overflowY: "hidden",
              }}
            >
              <div className="d-flex flex-nowrap gap-1 pb-1">
                {/* creazione dinamica delle tendine */}
                {mappingFields.map((field) => (
                  <div
                    key={field.id}
                    className="d-flex flex-column"
                    style={{ minWidth: "140px", flex: "0 0 140px" }}
                  >
                    <label
                      htmlFor={field.id}
                      className="form-label fw-semibold mb-2"
                    >
                      {field.label}
                    </label>
                    <select
                      id={field.id}
                      className="form-select log-columns"
                      value={(mapping as any)[field.key]}
                      onChange={(e) =>
                        handleSelectChange(field.key, e.target.value)
                      }
                    >
                      <option value="null"></option>
                      <option value={field.defaultVal}>
                        {field.defaultVal}
                      </option>

                      {/* generazione dinamica delle opzioni */}
                      {columns
                        .filter((colName) => colName !== field.defaultVal)
                        .map((colName, index) => (
                          <option key={index} value={colName}>
                            {colName}
                          </option>
                        ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
