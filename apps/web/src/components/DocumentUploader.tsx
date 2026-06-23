import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface DocumentUploaderProps {
  token: string | null;
  selectedUserEmail: string;
}

export function DocumentUploader({ token, selectedUserEmail }: DocumentUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [patientId, setPatientId] = useState('pat_001');
  const [docType, setDocType] = useState('clinical_note');
  const [sensitivity, setSensitivity] = useState('normal');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file || !token) return;
    setStatus('uploading');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patient_id', patientId);
    formData.append('doc_type', docType);
    formData.append('sensitivity_level', sensitivity);
    formData.append('consent_scope', 'treatment');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/documents/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Demo-User': selectedUserEmail
        },
        body: formData,
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.detail || 'Upload failed');
      
      // Trigger ingest
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/documents/${data.document_id}/ingest`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Demo-User': selectedUserEmail
        }
      });

      setStatus('success');
      setMessage(`Document ingested successfully (ID: ${data.document_id})`);
      setFile(null);
    } catch (e: any) {
      setStatus('error');
      setMessage(e.message || 'An error occurred during upload');
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-slate-100 mb-2 flex items-center gap-2">
          <Upload className="text-blue-400" /> Secure Document Ingestion
        </h2>
        <p className="text-slate-400 text-sm mb-8">
          Upload documents securely to the S3 landing bucket. Files are automatically scanned for malware before moving to the OpenSearch RAG index.
        </p>

        <div className="space-y-6">
          <div 
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${file ? 'border-blue-500 bg-blue-900/10' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".txt,.pdf,.json"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFile(e.target.files[0]);
                  setStatus('idle');
                }
              }}
            />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-12 h-12 text-blue-400" />
                <span className="font-medium text-slate-200">{file.name}</span>
                <span className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <Upload className="w-10 h-10 mb-2" />
                <span className="font-medium">Click to browse or drag file here</span>
                <span className="text-xs">Supports .txt, .pdf, .json (Max 10MB)</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Patient ID</label>
              <input 
                type="text" 
                value={patientId}
                onChange={e => setPatientId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded p-2 text-sm text-slate-200 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Document Type</label>
              <select 
                value={docType}
                onChange={e => setDocType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded p-2 text-sm text-slate-200 outline-none"
              >
                <option value="clinical_note">Clinical Note</option>
                <option value="lab_report">Lab Report</option>
                <option value="imaging_report">Imaging Report</option>
                <option value="discharge_summary">Discharge Summary</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Sensitivity Level</label>
              <select 
                value={sensitivity}
                onChange={e => setSensitivity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded p-2 text-sm text-slate-200 outline-none"
              >
                <option value="normal">Normal (Standard PHI)</option>
                <option value="restricted">Restricted (e.g. Behavioral Health, Sub. Abuse)</option>
                <option value="confidential">Confidential (Employee Health)</option>
              </select>
            </div>
          </div>

          <button 
            onClick={handleUpload}
            disabled={!file || status === 'uploading'}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {status === 'uploading' ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Uploading & Ingesting...</>
            ) : (
              <><Upload className="w-5 h-5" /> Secure Upload</>
            )}
          </button>

          {status === 'success' && (
            <div className="bg-emerald-900/30 border border-emerald-800 text-emerald-400 p-3 rounded flex items-center gap-2 text-sm">
              <CheckCircle className="w-5 h-5 shrink-0" /> {message}
            </div>
          )}
          
          {status === 'error' && (
            <div className="bg-red-900/30 border border-red-800 text-red-400 p-3 rounded flex items-center gap-2 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" /> {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
