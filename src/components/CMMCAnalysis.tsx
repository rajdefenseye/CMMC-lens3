import React, { useState } from 'react';
import axios from 'axios';

const CMMCAnalysis: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files?.[0] || null);
  };

  const handleAnalyzeClick = async () => {
    if (!selectedFile) {
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post('/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setAnalysisResults(response.data);
      setErrorMessage(null);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'An error occurred during analysis.');
      setAnalysisResults(null);
    }
  };

  return (
    <div className="mt-4">
      <input type="file" accept=".csv" onChange={handleFileChange} />
      <button
        className="ml-4 px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        onClick={handleAnalyzeClick}
        disabled={!selectedFile}
      >
        Analyze
      </button>

      {errorMessage && (
        <div className="mt-4 text-red-500">
          Error: {errorMessage}
        </div>
      )}

      {analysisResults && (
        <div className="mt-4">
          <h2>Analysis Results:</h2>
          <pre>{JSON.stringify(analysisResults, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default CMMCAnalysis;