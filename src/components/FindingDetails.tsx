import React from 'react';
import { X, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { Finding } from '../types';
import { format } from 'date-fns';

interface FindingDetailsProps {
  finding: Finding;
  onClose: () => void;
}

export const FindingDetails: React.FC<FindingDetailsProps> = ({ finding, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{finding.title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                finding.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                finding.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {finding.severity}
              </span>
              <span className="flex items-center text-gray-500">
                {finding.status === 'OPEN' && <AlertTriangle className="h-4 w-4 mr-1" />}
                {finding.status === 'IN_PROGRESS' && <Clock className="h-4 w-4 mr-1" />}
                {finding.status === 'RESOLVED' && <CheckCircle className="h-4 w-4 mr-1" />}
                {finding.status}
              </span>
              <span className="text-gray-500">
                Discovered {format(new Date(finding.discoveredAt), 'MMM d, yyyy')}
              </span>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-600">{finding.description}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">CMMC Control</h3>
              <p className="text-gray-600">{finding.cmmcControl}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">3PAO Assessment</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600">{finding.assessment}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Remediation Steps</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Review and implement encryption for all storage buckets containing sensitive data</li>
                <li>Configure appropriate access controls following the principle of least privilege</li>
                <li>Enable comprehensive audit logging for all critical services</li>
                <li>Document all changes and updates in the system security plan</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};