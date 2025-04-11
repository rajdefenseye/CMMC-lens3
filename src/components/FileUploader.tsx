import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, AlertCircle } from "lucide-react";
import { analyzeComplianceData } from "../services/vertexAIService";
// Import the upsert function and your authentication method
import { upsertUserRecord } from "../data/supabase";
import { getCurrentUser } from "../services/firebaseService";

interface FileUploaderProps {
  onFileProcessed?: (results: any[], fileName: string) => void;
  onFilesProcessed?: (results: any[], fileNames: string[]) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileProcessed,
  onFilesProcessed,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For multi-file logic, we combine results from all files
  const processMultipleFiles = async (acceptedFiles: File[]) => {
    const allResults: any[] = [];
    const fileNames: string[] = [];

    for (const file of acceptedFiles) {
      const text = await file.text();
      const results = await analyzeComplianceData(text);

      // Merge each file's results and record file name
      allResults.push(...results);
      fileNames.push(file.name);
    }

    // OPTIONAL: If you want to update the user record after processing files:
    const user = getCurrentUser();
    if (user) {
      // If processing multiple files, you might store a comma-separated string
      await upsertUserRecord({
        user_id: user.uid,
        user_name: user.displayName || user.email?.split('@')[0] || 'Unknown',
        user_email: user.email || '',
        uploaded_file_name: fileNames.join(", "),
        file_uploaded_at: new Date().toISOString(),
      });
    }

    // Fire callbacks with your processed results
    if (onFilesProcessed) {
      onFilesProcessed(allResults, fileNames);
    } else if (onFileProcessed && acceptedFiles.length === 1) {
      onFileProcessed(allResults, fileNames[0]);
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setIsProcessing(true);
      setError(null);

      try {
        await processMultipleFiles(acceptedFiles);
      } catch (err) {
        console.error("Error processing file(s):", err);
        setError("Failed to process CSV file(s). Please try again.");
      } finally {
        setIsProcessing(false);
      }
    },
    [onFileProcessed, onFilesProcessed]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    multiple: true,
    disabled: isProcessing,
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
        } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center space-y-4">
          {isProcessing ? (
            <>
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-lg font-medium text-gray-700">
                Processing CSV with AI...
              </p>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-blue-500" />
              <p className="text-lg font-medium text-gray-700">
                {isDragActive
                  ? "Drop the CSV file(s) here"
                  : "Drag and drop your CSV file(s) here"}
              </p>
              <p className="text-sm text-gray-500 mt-1">or click to browse files</p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
};

export default FileUploader;