import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';

interface ReviewQueueProps {
  token: string | null;
  selectedUserEmail: string;
}

export function ReviewQueue({ token, selectedUserEmail }: ReviewQueueProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionModal, setActionModal] = useState<{ isOpen: boolean, reviewId: string | null, actionType: 'approve' | 'reject' | null }>({
    isOpen: false, reviewId: null, actionType: null
  });
  const [notes, setNotes] = useState("");
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const fetchReviews = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/reviews/`, {
        headers: { Authorization: `Bearer ${token}`, 'X-Demo-User': selectedUserEmail },
      });
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    const interval = setInterval(fetchReviews, 10000);
    return () => clearInterval(interval);
  }, [token, selectedUserEmail]);

  const handleAction = async () => {
    if (!token || !actionModal.reviewId || !actionModal.actionType) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/reviews/${actionModal.reviewId}/${actionModal.actionType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'X-Demo-User': selectedUserEmail },
        body: JSON.stringify({ notes }),
      });
      setActionModal({ isOpen: false, reviewId: null, actionType: null });
      setNotes("");
      fetchReviews();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading && reviews.length === 0) return <div className="p-8 text-slate-400">Loading queue...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Clock className="text-blue-400" /> Human Review Queue
        </h2>
        <button onClick={fetchReviews} className="text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded transition">Refresh</button>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl text-center text-slate-400">
          No pending tasks.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r.id} className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col gap-4 transition hover:border-slate-700">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded text-xs font-mono uppercase tracking-wider">{r.task_type}</span>
                    {r.priority === 'high' && <span className="bg-red-900/50 text-red-400 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> HIGH PRIORITY</span>}
                  </div>
                  <h3 className="font-semibold text-slate-200 mt-2">{r.reason}</h3>
                  <div className="text-sm text-slate-500 mt-1 flex gap-4">
                    <span>Task ID: <span className="font-mono text-slate-400">{r.id}</span></span>
                    <span>Patient: <span className="font-mono text-slate-400">{r.patient_id}</span></span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setActionModal({ isOpen: true, reviewId: r.id, actionType: 'approve' })}
                    className="bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 px-4 py-2 rounded font-medium text-sm transition flex items-center gap-1"
                  >
                    <CheckCircle className="w-4 h-4"/> Approve
                  </button>
                  <button 
                    onClick={() => setActionModal({ isOpen: true, reviewId: r.id, actionType: 'reject' })}
                    className="bg-red-600/20 text-red-400 hover:bg-red-600/40 px-4 py-2 rounded font-medium text-sm transition flex items-center gap-1"
                  >
                    <XCircle className="w-4 h-4"/> Reject
                  </button>
                </div>
              </div>
              
              <button 
                onClick={() => setExpandedTask(expandedTask === r.id ? null : r.id)}
                className="text-xs text-blue-400 hover:text-blue-300 text-left w-max"
              >
                {expandedTask === r.id ? 'Hide Context Snapshot' : 'View Context Snapshot'}
              </button>

              {expandedTask === r.id && (
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 mt-2 text-xs font-mono text-slate-400 overflow-x-auto">
                  <pre>{JSON.stringify(r.context_snapshot, null, 2)}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Review Action Modal */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className={`p-4 border-b ${actionModal.actionType === 'approve' ? 'border-emerald-900/50 bg-emerald-900/20 text-emerald-400' : 'border-red-900/50 bg-red-900/20 text-red-400'}`}>
              <h3 className="font-semibold flex items-center gap-2">
                {actionModal.actionType === 'approve' ? <CheckCircle className="w-5 h-5"/> : <XCircle className="w-5 h-5"/>}
                {actionModal.actionType === 'approve' ? 'Approve Task' : 'Reject Task'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Resolution Notes (Required for Audit)</label>
                <textarea 
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Enter reasoning for this decision..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg p-3 text-sm text-slate-200 outline-none h-32 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  onClick={() => { setActionModal({ isOpen: false, reviewId: null, actionType: null }); setNotes(""); }}
                  className="px-4 py-2 rounded text-sm font-medium text-slate-400 hover:text-slate-200 transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAction}
                  disabled={notes.trim().length < 5}
                  className={`px-6 py-2 rounded text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${
                    actionModal.actionType === 'approve' 
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                      : 'bg-red-600 hover:bg-red-500 text-white'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
