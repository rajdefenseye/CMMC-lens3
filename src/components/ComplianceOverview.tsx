import React from 'react';
import { Shield, AlertTriangle, TrendingUp, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ComplianceAnalysis, RiskLevel } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface ComplianceOverviewProps {
  analysis: ComplianceAnalysis;
}

const riskLevelColors: Record<RiskLevel, { bg: string; text: string }> = {
  LOW: { bg: 'bg-green-100', text: 'text-green-800' },
  MEDIUM: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  HIGH: { bg: 'bg-orange-100', text: 'text-orange-800' },
  CRITICAL: { bg: 'bg-red-100', text: 'text-red-800' }
};

export const ComplianceOverview: React.FC<ComplianceOverviewProps> = ({ analysis }) => {
  const pieData = [
    { name: 'Compliant', value: analysis.overallScore },
    { name: 'Non-Compliant', value: 100 - analysis.overallScore }
  ];

  const COLORS = ['#4F46E5', '#E5E7EB'];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Shield className="h-8 w-8 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900 ml-2">CMMC Level 3 Overview</h2>
        </div>
        <span className="text-sm text-gray-500">
          Last updated: {format(new Date(analysis.lastUpdated), 'MMM d, yyyy HH:mm')}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1">
          <div className="flex flex-col items-center">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-4">
              <span className="text-4xl font-bold text-indigo-600">{analysis.overallScore}%</span>
              <p className="text-gray-600">Overall Compliance Score</p>
            </div>
          </div>
        </div>

        <div className="col-span-2">
          <div className="space-y-4">
            <div className={`rounded-lg p-4 ${riskLevelColors[analysis.riskLevel].bg}`}>
              <div className="flex items-center">
                <AlertTriangle className={`h-5 w-5 ${riskLevelColors[analysis.riskLevel].text} mr-2`} />
                <span className={`font-medium ${riskLevelColors[analysis.riskLevel].text}`}>
                  Overall Risk Level: {analysis.riskLevel}
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                Critical Gaps
              </h3>
              <ul className="space-y-2">
                {analysis.criticalGaps.map((gap, index) => (
                  <li key={index} className="flex items-start">
                    <span className="h-2 w-2 mt-2 rounded-full bg-red-600 mr-2" />
                    <span className="text-gray-700">{gap}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <TrendingUp className="h-5 w-5 text-indigo-600 mr-2" />
                Key Recommendations
              </h3>
              <ul className="space-y-2">
                {analysis.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start">
                    <span className="h-2 w-2 mt-2 rounded-full bg-indigo-600 mr-2" />
                    <span className="text-gray-700">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};