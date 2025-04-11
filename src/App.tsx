import React, { useState } from 'react';
import Header from './components/Header';
import FileUploader from './components/FileUploader';
import ComplianceDashboard from './components/ComplianceDashboard';
import ComplianceReport from './components/ComplianceReport';
import SettingsPanel from './components/SettingsPanel';
import LoginPage from './components/LoginPage';
import Sidebar from './components/Sidebar';
import { ComplianceStatus } from './types';
import { AuthProvider, useAuth } from './components/AuthContext';
import { fetchControlsByLevel } from './data/supabase'; // Import Supabase function
import { DBCMMCControl } from './data/supabase'; // Import CMMC Control interface
import GoogleCloudFindings from './components/GoogleCloudFindings';

function AppContent() {
  const { currentUser, loading } = useAuth();
  const [complianceData, setComplianceData] = useState<ComplianceStatus[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'upload' | 'dashboard' | 'report' | 'google-cmmc'>('upload');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [cmmcLevel, setCmmcLevel] = useState<'Level 1' | 'Level 2' | 'Level 3'>('Level 3');

  const handleFilesProcessed = (results: ComplianceStatus[], fileNames: string[]) => {
    setComplianceData((prev) => [...prev, ...results]);
    setFileName(fileNames.join(', '));
    setActiveTab('dashboard');
  };

  const handleTabChange = (tab: string) => {
    if (tab === 'upload' || tab === 'dashboard' || tab === 'report' || tab === 'google-cmmc') {
      setActiveTab(tab);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onSettingsClick={() => setIsSettingsOpen(true)}
        hasUploadedFile={complianceData.length > 0}
      />
      
      <div className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <Header onSettingsClick={() => setIsSettingsOpen(true)} />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* CMMC Level Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">CMMC Level:</label>
            <select
              value={cmmcLevel}
              onChange={(e) => setCmmcLevel(e.target.value as 'Level 1' | 'Level 2' | 'Level 3')}
              className="mt-1 block w-full max-w-xs p-2 border border-gray-300 rounded-md"
            >
              <option value="Level 1">Level 1</option>
              <option value="Level 2">Level 2</option>
              <option value="Level 3">Level 3</option>
            </select>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
            <div className="p-6">
              {activeTab === 'upload' && (
                <FileUploader onFilesProcessed={handleFilesProcessed} />
              )}
              
              {activeTab === 'dashboard' && complianceData.length > 0 && (
                <ComplianceDashboard
                  complianceData={complianceData}
                  fileName={fileName}
                  cmmcLevel={cmmcLevel}
                />
              )}
              
              {activeTab === 'report' && complianceData.length > 0 && (
                <ComplianceReport
                  complianceData={complianceData}
                  cmmcLevel={cmmcLevel}
                />
              )}
              
              {activeTab === 'google-cmmc' && (
                <GoogleCloudFindings />
              )}
            </div>
          </div>
        </main>

        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500">
              CMMC Level 3 Compliance Dashboard © 2025 | Powered by DefenseEye AI
            </p>
          </div>
        </footer>

        <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;