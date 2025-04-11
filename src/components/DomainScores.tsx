import React from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { DomainSummary } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Label, Cell } from 'recharts';

interface DomainScoresProps {
  domainSummaries: DomainSummary[];
}

const PRACTICE_COLORS = {
  'Access Control': '#4F46E5',
  'Audit & Accountability': '#10B981',
  'Configuration Management': '#F59E0B',
  'Identification & Authentication': '#EC4899',
  'System & Communications': '#6366F1',
  'System & Information Integrity': '#8B5CF6'
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-600">
          Compliance Score: {payload[0].value}%
        </p>
      </div>
    );
  }
  return null;
};

const renderCustomBarLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  return (
    <text
      x={x + width / 2}
      y={y - 5}
      fill="#4B5563"
      textAnchor="middle"
      fontSize="12"
    >
      {`${value}%`}
    </text>
  );
};

export const DomainScores: React.FC<DomainScoresProps> = ({ domainSummaries }) => {
  const chartData = domainSummaries.map(domain => ({
    ...domain,
    fill: PRACTICE_COLORS[domain.domain as keyof typeof PRACTICE_COLORS] || '#4F46E5'
  }));

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Shield className="h-8 w-8 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900 ml-2">Domain Compliance Scores</h2>
        </div>
      </div>

      <div className="h-96 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 40, right: 30, left: 60, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="domain"
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
              tick={{ fill: '#4B5563', fontSize: 12 }}
            >
              <Label
                value="Practice Domains"
                position="bottom"
                offset={50}
                style={{ fill: '#374151', fontSize: 14, fontWeight: 500 }}
              />
            </XAxis>
            <YAxis
              tick={{ fill: '#4B5563', fontSize: 12 }}
            >
              <Label
                value="Compliance Score (%)"
                angle={-90}
                position="left"
                offset={45}
                style={{ fill: '#374151', fontSize: 14, fontWeight: 500 }}
              />
            </YAxis>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value) => {
                const code = value.split(' ')[0];
                return `${code} - ${value}`;
              }}
            />
            <Bar
              dataKey="score"
              label={renderCustomBarLabel}
              isAnimationActive={true}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {domainSummaries.map((domain) => (
          <div key={domain.domain} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">{domain.domain}</span>
              <span className="text-sm font-medium text-gray-600">{domain.score}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="rounded-full h-2"
                style={{
                  width: `${domain.score}%`,
                  backgroundColor: PRACTICE_COLORS[domain.domain as keyof typeof PRACTICE_COLORS] || '#4F46E5'
                }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">
                {domain.findings} findings
              </span>
              {domain.criticalFindings > 0 && (
                <span className="flex items-center text-red-600">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {domain.criticalFindings} critical
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};