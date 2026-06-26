'use client';

import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { MessageSquare, Settings, Activity, Building, LogOut, CheckSquare, UploadCloud } from 'lucide-react';
import { ChatInterface } from '../components/ChatInterface';
import { ReviewQueue } from '../components/ReviewQueue';
import { WorkflowRunner } from '../components/WorkflowRunner';
import { DocumentUploader } from '../components/DocumentUploader';

export default function Home() {
  const { token, role: userRole, tenantId, isLoading, isAuthenticated, isDemoMode, logout, demoUser, setDemoUser, login } = useAuth();
  const [activeTab, setActiveTab] = useState<'chat' | 'reviews' | 'workflows' | 'documents'>('chat');

  if (isLoading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Authenticating...</div>;
  }

  if (!isAuthenticated) {
    return null; // The hook should redirect or handle unauth
  }

  // Derive tenant/facility from the email or role for demo UI context
  const facility = tenantId === 'tenant_hospital_a' ? 'General Hospital A' : 
                   tenantId === 'tenant_hospital_b' ? 'Regional Clinic B' : 'Unknown Facility';



  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans flex flex-col">
      {/* Global Header */}
      <header className="bg-slate-900 border-b border-slate-800 h-14 px-6 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            careOS
          </h1>
          <div className="h-4 w-px bg-slate-700"></div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-800/50 px-2.5 py-1 rounded-md border border-slate-700/50">
            <Building className="w-3.5 h-3.5 text-slate-500" />
            {facility} <span className="text-slate-600">({tenantId})</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isDemoMode && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Simulate Role:</span>
              <select 
                value={demoUser.email}
                onChange={(e) => login(e.target.value)}
                className="bg-slate-800 text-slate-200 text-xs px-2 py-1 rounded border border-slate-700 outline-none"
              >
                <option value="clinician@hospital-a.demo">Dr. Sarah Chen (Clinician)</option>
                <option value="nurse@hospital-a.demo">James Rivera, RN (Nurse)</option>
                <option value="care_coordinator@hospital-a.demo">Aisha Patel (Care Coordinator)</option>
                <option value="admin@hospital-a.demo">Robert Kim (Admin)</option>
                <option value="compliance@hospital-a.demo">Elena Vasquez (Compliance)</option>
                <option value="patient@hospital-a.demo">Maria Gonzalez (Patient)</option>
              </select>
            </div>
          )}
          <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
            <div className="w-6 h-6 rounded-full bg-blue-900 flex items-center justify-center text-blue-300 text-xs font-bold uppercase">
              {demoUser.email?.[0]}
            </div>
            <span className="text-sm font-medium text-slate-300">{userRole.replace('_', ' ')}</span>
            <button onClick={() => logout()} className="ml-2 text-slate-500 hover:text-slate-300 transition" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Nav */}
        <div className="w-64 bg-slate-900/50 border-r border-slate-800 flex flex-col p-4 gap-2 shrink-0">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-3">Platform</div>
          
          <button 
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'chat' ? 'bg-blue-600/10 text-blue-400 border border-blue-900/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'}`}
          >
            <MessageSquare className="w-4 h-4" /> RAG Chat
          </button>
          
          <button 
            onClick={() => setActiveTab('workflows')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'workflows' ? 'bg-blue-600/10 text-blue-400 border border-blue-900/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'}`}
          >
            <Activity className="w-4 h-4" /> Agent Workflows
          </button>
          
          <button 
            onClick={() => setActiveTab('reviews')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'reviews' ? 'bg-blue-600/10 text-blue-400 border border-blue-900/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'}`}
          >
            <CheckSquare className="w-4 h-4" /> Review Queue
          </button>

          {(userRole === 'admin' || userRole === 'compliance_officer' || userRole === 'super_admin') && (
            <button 
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'documents' ? 'bg-blue-600/10 text-blue-400 border border-blue-900/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'}`}
            >
              <UploadCloud className="w-4 h-4" /> Document Ingestion
            </button>
          )}

          <div className="mt-auto space-y-2">
            <div className="text-[10px] text-slate-500 bg-slate-900 p-3 rounded border border-slate-800">
              <div className="font-semibold text-slate-400 mb-1">Architecture Note</div>
              Every query routes through the MCP governance layer before hitting the LLM. Data never leaves the tenant boundary.
            </div>
            <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-300 transition w-full">
              <Settings className="w-4 h-4" /> Settings
            </button>
          </div>
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-hidden relative">
          {activeTab === 'chat' && <ChatInterface token={token} selectedUserEmail={demoUser.email} userRole={userRole} />}
          {activeTab === 'reviews' && <div className="h-full overflow-y-auto"><ReviewQueue token={token} selectedUserEmail={demoUser.email} /></div>}
          {activeTab === 'workflows' && <div className="h-full p-8"><WorkflowRunner token={token} selectedUserEmail={demoUser.email} /></div>}
          {activeTab === 'documents' && <div className="h-full overflow-y-auto"><DocumentUploader token={token} selectedUserEmail={demoUser.email} /></div>}
        </main>
      </div>
    </div>
  );
}
