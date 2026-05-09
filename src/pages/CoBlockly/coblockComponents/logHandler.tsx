import React, { useState } from 'react';
import axios from 'axios';

interface LogUploadProps {
  onLogUploaded: (columns: string[]) => void;
}

export default function LogHandler({ onLogUploaded }: LogUploadProps) {

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const [logStats, setLogStats] = useState({
    logName: 'No log loaded',
    numEvents: 0,
    numTraces: 0,
    isLoaded: false
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Evita il ricaricamento della pagina

    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    setIsLoading(true);
    setLogStats({ logName: 'Uploading...', numEvents: 0, numTraces: 0, isLoaded: false });

    try {
      const response = await axios.post('http://127.0.0.1:8001/api/uploadLog', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // 4. Aggiorniamo le statistiche con i dati del backend!
      setLogStats({
        logName: response.data.logName,
        numEvents: response.data.numEvents,
        numTraces: response.data.numTraces,
        isLoaded: true
      });

      // 5. Avvisiamo il "Padre" passando l'array delle colonne
      if (response.data.columns) {
        onLogUploaded(response.data.columns);
      }

    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Check console.');
      setLogStats({ logName: 'Error', numEvents: 0, numTraces: 0, isLoaded: false });
    } finally {
      // Spegniamo lo spinner a prescindere da come è andata
      setIsLoading(false);
    }
  };

  return (
    <div className="row mb-2">
      {/* ----------------------------- Log Upload Section ----------------------------- */}
      <div className="col-md-6">
        <div className="card h-100">
          <div className="card-body">
            <div className="mb-2">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="card-title">Log Upload</h5>
                <span className="form-text">Accepted format: .xes, .csv</span>
              </div>
            </div>
            
            <form onSubmit={handleUpload}>
              <div className="mb-4">
                <input 
                  type="file" 
                  className="form-control" 
                  accept=".xes, .csv" 
                  onChange={handleFileChange} // Agganciamo la scelta del file
                />
              </div>
              <div className="d-flex align-items-center gap-2">
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                  Upload Log
                </button>
                
                {isLoading && (
                  <div className="spinner-container d-flex align-items-center">
                    <div className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <span>Uploading blockchain log...</span>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ----------------------------- Log Statistics Section ----------------------------- */}
      <div className="col-md-6">
        <div className="card h-100">
          <div className="card-body">
            <div className="mb-2">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="card-title">Log Statistics</h5>
                <span className={`badge ${logStats.isLoaded ? 'bg-success' : 'bg-secondary'}`}>
                  {logStats.logName}
                </span>
              </div>
            </div>
            <div className="row g-3">
              <div className="col-6">
                <div className="text-center p-3 border rounded">
                  <div className="text-muted mb-1">Events Loaded</div>
                  <div className="fs-4 fw-bold text-primary">{logStats.numEvents}</div>
                </div>
              </div>
              <div className="col-6">
                <div className="text-center p-3 border rounded">
                  <div className="text-muted mb-1">Traces Loaded</div>
                  <div className="fs-4 fw-bold text-primary">{logStats.numTraces}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}