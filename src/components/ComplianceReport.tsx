import React, { useState } from 'react';
import { ComplianceStatus } from '../types';
import { generateComplianceReport } from '../services/vertexAIService';
import { FileText, Download, Loader } from 'lucide-react';

/**
 * Props interface for the ComplianceReport component
 */
interface ComplianceReportProps {
  /** Array of compliance status objects from the uploaded CSV */
  complianceData: ComplianceStatus[];

  // ADDED CODE: Additional prop to capture CMMC level (defaults to 'Level 3' if not provided)
  cmmcLevel?: 'Level 1' | 'Level 2' | 'Level 3';
}

/**
 * ComplianceReport component that generates and displays an AI-powered
 * compliance assessment report based on the provided compliance data
 * 
 * @param complianceData - Array of compliance status objects
 * @param cmmcLevel - The selected CMMC level (1, 2, or 3)
 */
const ComplianceReport: React.FC<ComplianceReportProps> = ({
  complianceData,
  cmmcLevel = 'Level 3', // ADDED CODE: default to 'Level 3'
}) => {
  // State for storing the generated report content
  const [report, setReport] = useState<string | null>(null);

  // State for tracking if a report is currently being generated
  const [isGenerating, setIsGenerating] = useState(false);

  // State for controlling the expanded/collapsed view of the report
  const [isExpanded, setIsExpanded] = useState(false);

  /**
   * Handles the generation of a compliance report using Vertex AI
   * Updates state to show loading indicator and stores the result
   */
  const handleGenerateReport = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    try {
      // ADDED CODE: Pass cmmcLevel as an extra parameter
      const generatedReport = await generateComplianceReport(complianceData, cmmcLevel);
      setReport(generatedReport);
      setIsExpanded(true);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Handles downloading the generated report as a markdown file
   */
  const handleDownloadReport = () => {
    if (!report) return;

    // Create a blob from the report content
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);

    // Create and trigger a download link
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cmmc-compliance-report.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Simple markdown renderer for displaying the report
   * In a real app, you would use a proper markdown renderer library
   * 
   * @param markdown - Markdown content to render
   * @returns React elements representing the rendered markdown
   */
  const renderMarkdown = (markdown: string) => {
    // Very simple markdown renderer for demo purposes
    // In a real app, use a proper markdown renderer
    const lines = markdown.split('\n');
    return (
      <div className="markdown">
        {lines.map((line, index) => {
          if (line.startsWith('# ')) {
            return <h1 key={index} className="text-2xl font-bold mt-4 mb-2">{line.substring(2)}</h1>;
          } else if (line.startsWith('## ')) {
            return <h2 key={index} className="text-xl font-semibold mt-4 mb-2">{line.substring(3)}</h2>;
          } else if (line.startsWith('### ')) {
            return <h3 key={index} className="text-lg font-medium mt-3 mb-2">{line.substring(4)}</h3>;
          } else if (line.startsWith('- ')) {
            return <li key={index} className="ml-4">{line.substring(2)}</li>;
          } else if (line.startsWith('1. ')) {
            return <li key={index} className="ml-4 list-decimal">{line.substring(3)}</li>;
          } else if (line.trim() === '') {
            return <br key={index} />;
          } else {
            return <p key={index} className="my-2">{line}</p>;
          }
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      {/* Report header with action buttons */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-700">AI-Generated Compliance Report</h3>

        <div className="flex space-x-2">
          {/* Download button - only shown when a report exists */}
          {report && (
            <button
              onClick={handleDownloadReport}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </button>
          )}

          {/* Generate/Regenerate report button */}
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              isGenerating ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            {isGenerating ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                {report ? 'Regenerate Report' : 'CMMC Readiness Audit Report'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Report content area */}
      {report ? (
        <div className="border rounded-md p-4 bg-gray-50">
          {/* Report content with conditional height limit */}
          <div className={`overflow-hidden ${isExpanded ? '' : 'max-h-60'}`}>
            {renderMarkdown(report)}
          </div>

          {/* Gradient fade-out for collapsed view */}
          {!isExpanded && (
            <div className="relative">
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-gray-50 to-transparent"></div>
            </div>
          )}

          {/* Show more/less toggle button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {isExpanded ? 'Show Less' : 'Show More'}
          </button>
        </div>
      ) : (
        // Placeholder when no report has been generated yet
        <div className="text-center py-8 border border-dashed rounded-md">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">
            Click "Generate Report" to create an AI-powered compliance assessment report
          </p>
          <p className="text-sm text-gray-400 mt-2">
            The report will include detailed findings and recommendations based on your data
          </p>
        </div>
      )}
    </div>
  );
};

export default ComplianceReport;
