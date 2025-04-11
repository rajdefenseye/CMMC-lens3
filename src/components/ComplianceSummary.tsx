import React from 'react';
import { Shield, AlertCircle, ChevronRight, BarChart3 } from 'lucide-react';
import { ComplianceSummary as ComplianceSummaryType } from '../types';
import { format } from 'date-fns';

interface ComplianceSummaryProps {
  summary: ComplianceSummaryType;
}

export const ComplianceSummary: React.FC<ComplianceSummaryProps> = ({ summary }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Shield className="h-8 w-8 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900 ml-2">CMMC Level 3 Compliance</h2>
        </div>
        <span className="text-sm text-gray-500">
          Last updated: {format(new Date(summary.lastUpdated), 'MMM d, yyyy HH:mm')}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="col-span-1">
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-bold text-indigo-600">{summary.overallScore}%</span>
              </div>
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#E5E7EB"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#4F46E5"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56 * (summary.overallScore / 100)} ${2 * Math.PI * 56}`}
                />
              </svg>
            </div>
            <span className="mt-2 text-sm font-medium text-gray-600">Overall Compliance Score</span>
          </div>
        </div>

        <div className="col-span-2">
          <div className="space-y-4">
            {summary.domainScores.map((domain) => (
              <div key={domain.domain} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{domain.domain}</span>
                  <span className="text-sm font-medium text-gray-600">{domain.score}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 rounded-full h-2"
                    style={{ width: `${domain.score}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {domain.findings} findings ({domain.criticalFindings} critical)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI-Generated Recommendations</h3>
        <div className="space-y-3">
          {summary.recommendations.map((recommendation, index) => (
            <div key={index} className="flex items-start">
              <AlertCircle className="h-5 w-5 text-indigo-600 mt-0.5 mr-2 flex-shrink-0" />
              <span className="text-gray-600">{recommendation}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button className="flex items-center text-sm text-indigo-600 hover:text-indigo-700">
          View detailed report
          <ChevronRight className="h-4 w-4 ml-1" />
        </button>
      </div>
    </div>
  );
};