import React, { useState, useCallback, useEffect } from 'react';
import { Shield, AlertTriangle, Search, Filter, Settings, BarChart3 } from 'lucide-react';
import { Finding, ServiceAccountCredentials, ComplianceAnalysis } from '../types';
import { FindingCard } from './FindingCard';
import { mockFindings, mockComplianceSummary } from '../data';
import { FindingDetails } from './FindingDetails';
import { SettingsPanel } from './SettingsPanel';
import { ComplianceOverview } from './ComplianceOverview';
import { DomainScores } from './DomainScores';
import { VertexAIService } from '../services/VertexAIService';

export const Dashboard: React.FC = () => {
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [findings, setFindings] = useState<Finding[]>(mockFindings);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complianceAnalysis, setComplianceAnalysis] = useState<ComplianceAnalysis | null>(null);
  const [vertexService, setVertexService] = useState<VertexAIService | null>(null);

  useEffect(() => {
    // Initialize with mock data
    const mockAnalysis: ComplianceAnalysis = {
      overallScore: 75,
      domainSummaries: mockComplianceSummary.domainScores,
      criticalGaps: [
        'Unencrypted data at rest in multiple storage systems',
        'Missing multi-factor authentication for privileged accounts',
        'Inadequate audit logging and monitoring capabilities'
      ],
      recommendations: mockComplianceSummary.recommendations,
      riskLevel: 'MEDIUM',
      lastUpdated: new Date().toISOString()
    };
    setComplianceAnalysis(mockAnalysis);
  }, []);

  const handleSaveConfig = useCallback(async (credentials: ServiceAccountCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const service = new VertexAIService(credentials.private_key);
      setVertexService(service);
      
      const analysis = await service.analyzeComplianceData(findings);
      setComplianceAnalysis(analysis);
    } catch (error) {
      setError('Failed to analyze compliance data. Please check your credentials and try again.');
      console.error('Failed to analyze data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [findings]);

  const filteredFindings = findings.filter(finding =>
    finding.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    finding.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const criticalCount = findings.filter(f => f.severity === 'CRITICAL').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-semibold text-gray-900">CMMC Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-red-100 px-3 py-1 rounded-full">
                <AlertTriangle className="h-4 w-4 text-red-600 mr-1" />
                <span className="text-sm font-medium text-red-600">{criticalCount} Critical Findings</span>
              </div>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {complianceAnalysis && (
          <>
            <ComplianceOverview analysis={complianceAnalysis} />
            <DomainScores domainSummaries={complianceAnalysis.domainSummaries} />
          </>
        )}

        <div className="flex justify-between items-center mb-6 mt-8">
          <h2 className="text-2xl font-bold text-gray-900">Security Findings</h2>
          <div className="flex space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search findings..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              <Filter className="h-5 w-5 mr-2" />
              Filter
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFindings.map(finding => (
              <FindingCard
                key={finding.id}
                finding={finding}
                onClick={setSelectedFinding}
              />
            ))}
          </div>
        )}
      </main>

      {selectedFinding && (
        <FindingDetails
          finding={selectedFinding}
          onClose={() => setSelectedFinding(null)}
        />
      )}

      {showSettings && (
        <SettingsPanel 
          onClose={() => setShowSettings(false)}
          onSaveConfig={handleSaveConfig}
        />
      )}
    </div>
  );
};