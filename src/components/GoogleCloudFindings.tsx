import React, { useEffect, useState } from 'react';
import { fetchSecurityFindings, SecurityFinding } from '../data/supabase';
import { AlertTriangle, CheckCircle, XCircle, Clock, Info, RefreshCw, Shield, Database, Loader2, FileText } from 'lucide-react';
import { analyzeComplianceData } from '../services/vertexAIService';
import { ComplianceStatus } from '../types';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import ComplianceReport from './ComplianceReport';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const GoogleCloudFindings: React.FC = () => {
  const [findings, setFindings] = useState<SecurityFinding[]>([]);
  const [complianceData, setComplianceData] = useState<ComplianceStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [processingAnalysis, setProcessingAnalysis] = useState<boolean>(false);
  const [complianceScore, setComplianceScore] = useState<number>(0);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [loadingStage, setLoadingStage] = useState<string>('Initializing...');
  const [safeguardBreakdown, setSafeguardBreakdown] = useState<Record<string, number>>({});
  const [showComplianceReport, setShowComplianceReport] = useState(false);

  // Force the loading screen to be visible on component mount
  useEffect(() => {
    // Reset states on component mount
    setLoading(true);
    setLoadingProgress(0);
    setLoadingStage('Initializing...');
    
    // Start the loading process
    const loadFindings = async () => {
      try {
        // Start progress simulation immediately
        let progress = 0;
        const simulateProgress = setInterval(() => {
          progress += 2;
          if (progress >= 40) {
            clearInterval(simulateProgress);
          }
          setLoadingProgress(Math.min(40, progress));
        }, 100);

        // Step 1: Database connection
        setLoadingStage('Connecting to database...');
        await new Promise(resolve => setTimeout(resolve, 500)); // Artificial delay for UX
        setLoadingProgress(10);
        
        // Step 2: Fetching findings
        setLoadingStage('Fetching security findings...');
        const data = await fetchSecurityFindings();
        setFindings(data);
        setLoadingProgress(50);
        
        // Step 3: Process with AI
        if (data.length > 0) {
          setLoadingStage('Analyzing with Gemini AI...');
          clearInterval(simulateProgress); // Stop the simulation
          
          // Process the findings
          try {
            setProcessingAnalysis(true);
            const csvData = convertFindingsToCSV(data);
            setLoadingProgress(70);
            
            setLoadingStage('Processing with AI models...');
            const results = await analyzeComplianceData(csvData);
            setComplianceData(results);
            setLoadingProgress(90);
            
            setLoadingStage('Finalizing results...');
            setTimeout(() => {
              setLoadingProgress(100);
              setTimeout(() => {
                setLoading(false);
              }, 500); // Short delay before hiding the loading screen
            }, 500);
          } catch (err) {
            console.error('Error analyzing findings:', err);
            setError('Failed to analyze findings with AI');
            setLoading(false);
          } finally {
            setProcessingAnalysis(false);
          }
        } else {
          // No findings to process
          setLoadingProgress(100);
          setTimeout(() => {
            setLoading(false);
          }, 500);
        }
      } catch (err) {
        console.error('Error loading findings:', err);
        setError('Failed to load security findings');
        setLoading(false);
      }
    };

    loadFindings();
  }, []);

  // Function to convert security findings to CSV format for AI analysis
  const convertFindingsToCSV = (securityFindings: SecurityFinding[]): string => {
    // Create CSV header
    const headers = ['ID', 'Category', 'Resource', 'Severity', 'State', 'Description', 'Create Time'];
    
    // Create CSV rows
    const rows = securityFindings.map(finding => {
      const description = typeof finding.source_properties === 'object' && finding.source_properties
        ? finding.source_properties.description || 
          finding.source_properties.summary || 
          finding.source_properties.title || 
          `${finding.category} finding`
        : `${finding.category || 'Security'} finding`;
      
      return [
        finding.finding_id,
        finding.category || 'Unknown',
        finding.resource_name || 'N/A',
        finding.severity || 'Unknown',
        finding.state || 'Unknown',
        description,
        finding.create_time || 'Unknown'
      ];
    });
    
    // Combine headers and rows into CSV string
    const csvData = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    return csvData;
  };

  // Calculate compliance score based on findings
  useEffect(() => {
    if (complianceData.length > 0) {
      calculateComplianceScore();
      calculateSafeguardBreakdown();
    }
  }, [complianceData]);

  // Function to calculate compliance score
  const calculateComplianceScore = () => {
    if (complianceData.length === 0) {
      setComplianceScore(0);
      return;
    }

    // Count by severity/status
    const severityCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      compliant: 0
    };

    complianceData.forEach(item => {
      const status = item.status.toLowerCase();
      if (status === 'critical') severityCounts.critical++;
      else if (status === 'high') severityCounts.high++;
      else if (status === 'medium') severityCounts.medium++;
      else if (status === 'low') severityCounts.low++;
      else if (status === 'compliant') severityCounts.compliant++;
    });

    // Calculate weighted score (more weight to critical/high findings)
    const totalFindings = complianceData.length;
    
    // Use fixed weights for each severity level
    const criticalWeight = 1.0;
    const highWeight = 0.8;
    const mediumWeight = 0.5;
    const lowWeight = 0.2;
    
    // Calculate weighted penalty
    const weightedNonCompliant = 
      (severityCounts.critical * criticalWeight) + 
      (severityCounts.high * highWeight) + 
      (severityCounts.medium * mediumWeight) + 
      (severityCounts.low * lowWeight);
    
    // Calculate max possible penalty (if all findings were critical)
    const maxPossiblePenalty = totalFindings * criticalWeight;
    
    // Calculate percentage of compliance (100% - percentage of actual penalty out of max penalty)
    const compliancePercentage = 100 - ((weightedNonCompliant / maxPossiblePenalty) * 100);
    
    // Ensure score is between 0-100
    const finalScore = Math.max(0, Math.min(100, compliancePercentage));
    
    // Round to whole number
    setComplianceScore(Math.round(finalScore));
  };

  // New function to calculate safeguard breakdown
  const calculateSafeguardBreakdown = () => {
    if (complianceData.length === 0) {
      setSafeguardBreakdown({});
      return;
    }

    // Extract safeguard domains from practice IDs (assuming format like "AC.1.001" where "AC" is the domain)
    const breakdown: Record<string, number> = {};
    
    complianceData.forEach(item => {
      // Extract domain from practiceId (e.g., "AC" from "AC.1.001")
      const domain = item.practiceId.split('.')[0];
      
      if (domain) {
        if (breakdown[domain]) {
          breakdown[domain]++;
        } else {
          breakdown[domain] = 1;
        }
      }
    });
    
    setSafeguardBreakdown(breakdown);
  };

  // Prepare data for the pie chart
  const preparePieChartData = () => {
    const domains = Object.keys(safeguardBreakdown);
    
    // Define colors for different CMMC domains
    const domainColors: Record<string, string> = {
      AC: 'rgba(54, 162, 235, 0.7)', // Access Control
      AT: 'rgba(255, 99, 132, 0.7)',  // Awareness and Training
      AU: 'rgba(255, 206, 86, 0.7)',  // Audit and Accountability
      CM: 'rgba(75, 192, 192, 0.7)',  // Configuration Management
      IA: 'rgba(153, 102, 255, 0.7)', // Identification and Authentication
      IR: 'rgba(255, 159, 64, 0.7)',  // Incident Response
      MA: 'rgba(199, 199, 199, 0.7)', // Maintenance
      MP: 'rgba(83, 102, 255, 0.7)',  // Media Protection
      PS: 'rgba(255, 99, 192, 0.7)',  // Personnel Security
      PE: 'rgba(159, 255, 64, 0.7)',  // Physical Protection
      RE: 'rgba(255, 182, 193, 0.7)', // Recovery
      RM: 'rgba(150, 75, 0, 0.7)',    // Risk Management
      CA: 'rgba(128, 0, 128, 0.7)',   // Security Assessment
      SC: 'rgba(60, 179, 113, 0.7)',  // System and Communications Protection
      SI: 'rgba(106, 90, 205, 0.7)',  // System and Information Integrity
    };

    
    
    // Fallback color for any unlisted domains
    const defaultColor = 'rgba(128, 128, 128, 0.7)';
    
    return {
      labels: domains,
      datasets: [
        {
          data: domains.map(domain => safeguardBreakdown[domain]),
          backgroundColor: domains.map(domain => domainColors[domain] || defaultColor),
          borderColor: domains.map(domain => {
            const bgColor = domainColors[domain] || defaultColor;
            return bgColor.replace('0.7', '1');
          }),
          borderWidth: 1
        }
      ]
    };
  };

  // Reprocess findings with AI (for manual refresh)
  const reprocessFindings = async () => {
    if (findings.length === 0) return;
    
    try {
      setProcessingAnalysis(true);
      
      // Convert findings to CSV format
      const csvData = convertFindingsToCSV(findings);
      
      // Send to Vertex AI service
      const results = await analyzeComplianceData(csvData);
      
      // Set the processed data
      setComplianceData(results);
    } catch (err) {
      console.error('Error processing findings with AI:', err);
      setError('Failed to analyze security findings with AI');
    } finally {
      setProcessingAnalysis(false);
    }
  };

  // Helper functions for UI (continue with your existing ones)
  const getSeverityIcon = (severity: string | undefined) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'high':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'low':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string | undefined) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-orange-500 bg-orange-50';
      case 'low':
        return 'text-blue-500 bg-blue-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  const getDescription = (finding: SecurityFinding) => {
    if (typeof finding.source_properties === 'object' && finding.source_properties) {
      return finding.source_properties.description || 
             finding.source_properties.summary || 
             finding.source_properties.title || 
             `${finding.category} finding`;
    }
    
    return `${finding.category || 'Security'} finding`;
  };

  // Count findings by severity
  const getSeverityCounts = () => {
    const counts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    findings.forEach(finding => {
      const severity = finding.severity?.toLowerCase() || 'low';
      if (severity === 'critical') counts.critical++;
      else if (severity === 'high') counts.high++;
      else if (severity === 'medium') counts.medium++;
      else counts.low++;
    });

    return counts;
  };

  const severityCounts = getSeverityCounts();
  const totalFindings = findings.length;

  // Get compliance status text and color
  const getComplianceStatusInfo = () => {
    let text = '';
    let color = '';
    let bgColor = '';
    
    if (complianceScore >= 95) {
      bgColor = 'bg-green-600';
      color = 'text-green-600';
      text = 'Excellent';
    } else if (complianceScore > 70) {
      bgColor = 'bg-orange-600';
      color = 'text-orange-600';
      text = 'Needs Improvement';
    } else {
      bgColor = 'bg-red-600';
      color = 'text-red-600';
      text = 'Critical';
    }
    
    return { text, color, bgColor };
  };

  const complianceStatus = getComplianceStatusInfo();

  // Explain domain abbreviations
  const getDomainName = (abbr: string) => {
    const domainNames: Record<string, string> = {
      AC: 'Access Control',
      AT: 'Awareness and Training',
      AU: 'Audit and Accountability',
      CM: 'Configuration Management',
      IA: 'Identification and Authentication',
      IR: 'Incident Response',
      MA: 'Maintenance',
      MP: 'Media Protection',
      PS: 'Personnel Security',
      PE: 'Physical Protection',
      RE: 'Recovery',
      RM: 'Risk Management',
      CA: 'Security Assessment',
      SC: 'System & Comms Protection',
      SI: 'System & Info Integrity',
    };
    
    return domainNames[abbr] || abbr;
  };

  // Render loading UI
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <div className="w-full max-w-md bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="p-8">
            <div className="flex items-center justify-center mb-6">
              <Shield className="h-16 w-16 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
              Loading CMMC Security Analysis
            </h2>
            <p className="text-gray-600 text-center mb-6">
              {loadingStage}
            </p>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-4 mb-6">
              <div 
                className="bg-blue-600 h-4 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            
            {/* Loading percentage */}
            <div className="text-center font-semibold text-blue-600">
              {loadingProgress}% Complete
            </div>
            
            {/* Loading steps */}
            <div className="mt-8">
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className={`rounded-full h-8 w-8 flex items-center justify-center mr-3 ${loadingProgress >= 10 ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'}`}>
                    <Database className="h-4 w-4" />
                  </div>
                  <span className={loadingProgress >= 10 ? 'text-gray-800' : 'text-gray-400'}>
                  Initiating Threat Analysis
                  </span>
                  {loadingProgress >= 10 && <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />}
                </div>
                
                <div className="flex items-center">
                  <div className={`rounded-full h-8 w-8 flex items-center justify-center mr-3 ${loadingProgress >= 60 ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'}`}>
                    <Loader2 className={`h-4 w-4 ${loadingProgress >= 60 && loadingProgress < 90 ? 'animate-spin' : ''}`} />
                  </div>
                  <span className={loadingProgress >= 60 ? 'text-gray-800' : 'text-gray-400'}>
                  Performing Threat Analysis
                  </span>
                  {loadingProgress >= 90 && <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />}
                </div>
                
                <div className="flex items-center">
                  <div className={`rounded-full h-8 w-8 flex items-center justify-center mr-3 ${loadingProgress >= 95 ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'}`}>
                    <Shield className="h-4 w-4" />
                  </div>
                  <span className={loadingProgress >= 95 ? 'text-gray-800' : 'text-gray-400'}>
                    Translating Security Gaps into Compliance Risks
                  </span>
                  {loadingProgress >= 100 && <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // The rest of your component (error state, compliance dashboard, etc.)
  if (error) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-red-500 text-center">
          <XCircle className="h-12 w-12 mx-auto mb-2" />
          <p className="text-lg font-semibold">{error}</p>
          <p>Please try again later or contact support.</p>
        </div>
      </div>
    );
  }

  // Actual findings display (your existing code)
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Google CMMC Security Findings</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowComplianceReport(true)}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              complianceData.length > 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            disabled={complianceData.length === 0}
          >
            <FileText className="h-4 w-4 mr-2" />
            CMMC Readiness Audit Report
          </button>
        </div>
      </div>
      
      {/* Overall Compliance Score Dashboard */}
      {complianceData.length > 0 ? (
        <div className="mb-8 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Compliance Score */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative flex items-center justify-center">
                  <svg className="w-40 h-40">
                    <circle
                      className="text-gray-200"
                      strokeWidth="10"
                      stroke="currentColor"
                      fill="transparent"
                      r="60"
                      cx="80"
                      cy="80"
                    />
                    <circle
                      className={`${complianceScore >= 95 ? 'text-green-600' : complianceScore > 70 ? 'text-orange-600' : 'text-red-600'}`}
                      strokeWidth="10"
                      strokeDasharray={`${complianceScore * 3.77} 376.8`}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="60"
                      cx="80"
                      cy="80"
                      transform="rotate(-90 80 80)"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-bold">{complianceScore}%</span>
                    <span className={`text-sm font-medium ${complianceStatus.color}`}>
                      {complianceStatus.text}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-gray-700 font-medium">Overall Compliance Score</p>
              </div>
              
              {/* Findings Summary */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Findings Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center">
                      <span className="h-3 w-3 bg-red-600 rounded-full mr-2"></span>
                      Critical
                    </span>
                    <span className="font-medium">{severityCounts.critical}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center">
                      <span className="h-3 w-3 bg-orange-500 rounded-full mr-2"></span>
                      High
                    </span>
                    <span className="font-medium">{severityCounts.high}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center">
                      <span className="h-3 w-3 bg-yellow-500 rounded-full mr-2"></span>
                      Medium
                    </span>
                    <span className="font-medium">{severityCounts.medium}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center">
                      <span className="h-3 w-3 bg-blue-500 rounded-full mr-2"></span>
                      Low
                    </span>
                    <span className="font-medium">{severityCounts.low}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center font-medium">
                    <span>Total Findings</span>
                    <span>{totalFindings}</span>
                  </div>
                </div>
              </div>
              
              {/* Safeguards Breakdown Pie Chart (Replacing Key Recommendations) */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Safeguards Breakdown</h3>
                <div className="h-48">
                  {Object.keys(safeguardBreakdown).length > 0 ? (
                    <Pie 
                      data={preparePieChartData()} 
                      options={{
                        plugins: {
                          legend: {
                            position: 'right',
                            labels: {
                              boxWidth: 12,
                              font: {
                                size: 10
                              }
                            }
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const percentage = ((value as number) / totalFindings * 100).toFixed(1);
                                return `${getDomainName(label)}: ${value} (${percentage}%)`;
                              }
                            }
                          }
                        },
                        maintainAspectRatio: false
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      No safeguard data available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8 border rounded-lg shadow-md p-6 bg-gray-50 text-center">
          <p className="text-gray-500">No compliance data available. Security findings require AI analysis to display CMMC compliance metrics.</p>
        </div>
      )}

      {/* Safeguards Breakdown Table */}
      {Object.keys(safeguardBreakdown).length > 0 ? (
        <div className="mb-8 border rounded-lg shadow-md p-6 bg-white">
          <h2 className="text-xl font-semibold mb-4">Safeguards Distribution</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.keys(safeguardBreakdown).sort().map(domain => (
              <div key={domain} className="flex justify-between items-center p-3 border rounded-lg bg-gray-50">
                <div>
                  <span className="font-medium">{domain}</span>
                  <p className="text-sm text-gray-600">{getDomainName(domain)}</p>
                </div>
                <div className="flex items-center">
                  <div className="h-6 w-6 rounded-full flex items-center justify-center text-white font-medium bg-blue-600 text-xs">
                    {safeguardBreakdown[domain]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : complianceData.length > 0 && (
        <div className="mb-8 border rounded-lg shadow-md p-6 bg-gray-50 text-center">
          <h2 className="text-xl font-semibold mb-4">Safeguards Distribution</h2>
          <p className="text-gray-500">No safeguard distribution data available.</p>
        </div>
      )}


      
      {/* CMMC Compliance Analysis Results */}
      {complianceData.length > 0 ? (
        
        <div className="mb-8 border rounded-lg shadow-md p-6 bg-white">
          <h2 className="text-xl font-semibold mb-4">CMMC Compliance Analysis</h2>
          
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Control ID</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Severity</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Finding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">\
                
                {complianceData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{item.practiceId}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        item.status.toLowerCase() === 'high' || item.status.toLowerCase() === 'critical' 
                          ? 'bg-red-100 text-red-800' 
                          : item.status.toLowerCase() === 'medium'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-blue-100 text-blue-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500">
                      <div>
                        <p className="font-medium text-gray-900">{item.insights}</p>
                        {item.threePAOAssessment && (
                          <p className="mt-1 text-xs text-gray-500">
                            Status: {item.threePAOAssessment.status}, 
                            Notes: {item.threePAOAssessment.notes}
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="mb-8 border rounded-lg shadow-md p-6 bg-gray-50 text-center">
          <h2 className="text-xl font-semibold mb-4">CMMC Compliance Analysis</h2>
          <p className="text-gray-500">No compliance analysis data available. Analysis requires AI processing of security findings.</p>
        </div>
      )}

      {/* Compliance Report Modal */}
      {showComplianceReport && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Compliance Report</h2>
                <button
                  onClick={() => setShowComplianceReport(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              <ComplianceReport 
                complianceData={complianceData}
                cmmcLevel="Level 3"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleCloudFindings;