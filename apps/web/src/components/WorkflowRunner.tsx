import React, { useState } from 'react';
import { Activity, Clock, FileText, CheckCircle, AlertTriangle, ChevronRight, Loader2 } from 'lucide-react';

interface WorkflowRunnerProps {
  token: string | null;
  selectedUserEmail: string;
}

export function WorkflowRunner({ token, selectedUserEmail }: WorkflowRunnerProps) {
  const [loadingWorkflow, setLoadingWorkflow] = useState<string | null>(null);
  const [workflowResult, setWorkflowResult] = useState<any>(null);

  const runWorkflow = async (type: string, payload: any) => {
    if (!token) return;
    setLoadingWorkflow(type);
    setWorkflowResult(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/workflows/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Demo-User': selectedUserEmail
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setWorkflowResult({ type, data });
    } catch (e) {
      console.error(e);
      setWorkflowResult({ type, error: "Workflow failed to execute" });
    } finally {
      setLoadingWorkflow(null);
    }
  };

  const renderDischargeResult = (data: any) => {
    return (
      <div className="space-y-6">
        {data.requires_human_review && (
          <div className="bg-amber-950/40 border border-amber-900/50 p-4 rounded-lg flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-amber-500 font-semibold mb-1">Human Review Required</h4>
              <p className="text-amber-200/70 text-sm">Task <span className="font-mono bg-amber-900/40 px-1 py-0.5 rounded text-amber-400">{data.review_task_id}</span> has been deposited into the queue. Workflow is paused.</p>
            </div>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="bg-slate-800/50 px-4 py-3 border-b border-slate-800 flex justify-between items-center">
            <h4 className="font-semibold text-slate-200 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> Readiness Checklist</h4>
          </div>
          <div className="p-4 space-y-3 text-sm">
            {data.checklist && Object.entries(data.checklist).map(([key, value]: [string, any]) => (
              <div key={key} className="flex items-center justify-between p-2 rounded hover:bg-slate-800/50 transition">
                <span className="text-slate-300 capitalize">{key.replace(/_/g, ' ')}</span>
                {value ? 
                  <span className="text-emerald-400 font-medium flex items-center gap-1"><CheckCircle className="w-4 h-4"/> Met</span> : 
                  <span className="text-red-400 font-medium flex items-center gap-1"><XCircle className="w-4 h-4"/> Unmet</span>
                }
              </div>
            ))}
          </div>
        </div>

        {data.blockers && data.blockers.length > 0 && (
          <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-4">
            <h4 className="font-semibold text-red-400 mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Active Blockers</h4>
            <ul className="space-y-2">
              {data.blockers.map((b: string, i: number) => (
                <li key={i} className="text-sm text-red-300 flex items-start gap-2">
                  <span className="mt-1 text-red-500">•</span> {b}
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.draft_summary && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h4 className="font-semibold text-slate-200 mb-3">Draft Discharge Summary</h4>
            <div className="text-sm text-slate-400 whitespace-pre-wrap leading-relaxed">{data.draft_summary}</div>
          </div>
        )}
      </div>
    );
  };

  const renderRiskSignalResult = (data: any) => {
    return (
      <div className="space-y-6">
        <div className={`p-5 rounded-xl border flex items-start gap-4 ${
          data.risk_level === 'high' ? 'bg-red-950/30 border-red-900/50' : 
          data.risk_level === 'medium' ? 'bg-amber-950/30 border-amber-900/50' : 
          'bg-emerald-950/30 border-emerald-900/50'
        }`}>
          <Activity className={`w-8 h-8 shrink-0 mt-1 ${
            data.risk_level === 'high' ? 'text-red-500' : 
            data.risk_level === 'medium' ? 'text-amber-500' : 
            'text-emerald-500'
          }`} />
          <div>
            <h3 className={`text-xl font-bold capitalize mb-1 ${
              data.risk_level === 'high' ? 'text-red-400' : 
              data.risk_level === 'medium' ? 'text-amber-400' : 
              'text-emerald-400'
            }`}>{data.risk_level} Risk Detected</h3>
            <p className="text-slate-300 text-sm">{data.summary}</p>
          </div>
        </div>

        {data.signals && data.signals.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-200">Contributing Signals</h4>
            {data.signals.map((s: any, i: number) => (
              <div key={i} className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex items-center justify-between">
                <span className="text-slate-300 text-sm">{s.description}</span>
                <span className={`text-xs px-2 py-1 rounded font-mono uppercase ${
                  s.severity === 'high' ? 'bg-red-900/30 text-red-400' :
                  s.severity === 'medium' ? 'bg-amber-900/30 text-amber-400' :
                  'bg-emerald-900/30 text-emerald-400'
                }`}>{s.severity}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderGenericResult = (data: any) => (
    <pre className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs font-mono text-slate-400 overflow-auto max-h-96">
      {JSON.stringify(data, null, 2)}
    </pre>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
      {/* Sidebar Controls */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Activity className="text-blue-400" /> Agentic Workflows
        </h2>
        <p className="text-slate-400 text-sm">
          Run LangGraph-powered deterministic workflows. Workflows that detect clinical risk will pause and create a Human Review Task in the queue.
        </p>

        <div className="space-y-3">
          <button 
            onClick={() => runWorkflow('discharge-planning', { patient_id: "pat_001", query: "Draft discharge summary for Maria" })}
            disabled={loadingWorkflow !== null}
            className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 p-4 rounded-xl text-left transition group disabled:opacity-50"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-blue-400">Deep Agent: Discharge Planning</span>
              {loadingWorkflow === 'discharge-planning' ? <Loader2 className="w-5 h-5 text-blue-400 animate-spin" /> : <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-blue-400 transition" />}
            </div>
            <p className="text-xs text-slate-500">Evaluates blockers, creates a checklist, and drafts a safe summary.</p>
          </button>

          <button 
            onClick={() => runWorkflow('risk-signal', { patient_id: "pat_001" })}
            disabled={loadingWorkflow !== null}
            className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 p-4 rounded-xl text-left transition group disabled:opacity-50"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-amber-400">Clinical Risk Signal</span>
              {loadingWorkflow === 'risk-signal' ? <Loader2 className="w-5 h-5 text-amber-400 animate-spin" /> : <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-amber-400 transition" />}
            </div>
            <p className="text-xs text-slate-500">Scans recent labs and notes for actionable deterioration risks.</p>
          </button>

          <button 
            onClick={() => runWorkflow('chart-summary', { patient_id: "pat_001" })}
            disabled={loadingWorkflow !== null}
            className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 p-4 rounded-xl text-left transition group disabled:opacity-50"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-emerald-400">72h Chart Summary</span>
              {loadingWorkflow === 'chart-summary' ? <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" /> : <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 transition" />}
            </div>
            <p className="text-xs text-slate-500">Synthesizes the last 72 hours of clinical activity into a structured view.</p>
          </button>
        </div>
      </div>

      {/* Results View */}
      <div className="bg-slate-900/50 border-l border-slate-800 p-6 -mr-8 -my-8 overflow-y-auto">
        {loadingWorkflow ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            <p>Orchestrating agentic workflow...</p>
          </div>
        ) : workflowResult ? (
          <div>
            <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
              <FileText className="text-blue-400" /> Workflow Output
            </h3>
            {workflowResult.error ? (
              <div className="bg-red-950/30 border border-red-900/50 text-red-400 p-4 rounded-lg">
                {workflowResult.error}
              </div>
            ) : (
              <>
                {workflowResult.type === 'discharge-planning' && renderDischargeResult(workflowResult.data)}
                {workflowResult.type === 'risk-signal' && renderRiskSignalResult(workflowResult.data)}
                {workflowResult.type === 'chart-summary' && renderGenericResult(workflowResult.data)}
              </>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center">
            <Activity className="w-16 h-16 mb-4 opacity-20" />
            <p>Select a workflow from the left<br/>to view its execution output.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Need to define XCircle locally since it wasn't imported from lucide-react in the top block to prevent errors if we missed it
const XCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
