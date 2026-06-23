import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';

interface ChatMessage {
  type: 'system' | 'user' | 'assistant' | 'error';
  content: string;
  route?: string;
  confidence?: number;
  requires_human_review?: boolean;
  citations?: any[];
  disclaimer?: string;
  safety_flags?: string[];
  review_task_id?: string;
  memory_used?: boolean;
}

interface ChatInterfaceProps {
  token: string | null;
  selectedUserEmail: string;
  userRole: string;
}

export function ChatInterface({ token, selectedUserEmail, userRole }: ChatInterfaceProps) {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(`chat_${selectedUserEmail}`);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved chat", e);
      }
    } else {
      setMessages([{ type: 'system', content: `Logged in. Every response is governed by MCP.` }]);
    }
  }, [selectedUserEmail]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`chat_${selectedUserEmail}`, JSON.stringify(messages));
    }
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedUserEmail]);

  const sendMessage = async () => {
    if (!query.trim() || !token) return;
    const userMessage: ChatMessage = { type: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'X-Demo-User': selectedUserEmail },
        body: JSON.stringify({ query, patient_id: userRole === 'patient' ? 'pat_001' : undefined }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        type: 'assistant', 
        content: data.response, 
        route: data.route, 
        confidence: data.confidence,
        requires_human_review: data.requires_human_review, 
        citations: data.citations || [],
        disclaimer: data.disclaimer, 
        safety_flags: data.safety_flags, 
        review_task_id: data.human_review_task_id,
        memory_used: data.memory_used
      }]);
    } catch (e) {
      setMessages(prev => [...prev, { type: 'error', content: 'API unreachable. Is docker compose running?' }]);
    } finally {
      setIsLoading(false);
      setQuery("");
    }
  };

  const handleClear = () => {
    setMessages([{ type: 'system', content: `Chat cleared. New session started.` }]);
    localStorage.removeItem(`chat_${selectedUserEmail}`);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <div className="flex justify-between items-center px-6 py-2 border-b border-slate-800 bg-slate-900">
        <span className="text-sm font-medium text-slate-300">Active Session</span>
        <button onClick={handleClear} className="text-xs text-slate-500 hover:text-slate-300 transition">Clear History</button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {messages.map((m, i) => (
          <div key={i} className={m.type === 'user' ? 'text-right' : ''}>
            {m.type === 'system' && <div className="text-xs text-center text-slate-500 my-4 bg-slate-900/50 py-1 rounded-full w-max mx-auto px-4 border border-slate-800">{m.content}</div>}
            {m.type === 'error' && <div className="text-xs text-red-400 my-4 bg-red-950/30 p-3 rounded border border-red-900/50">{m.content}</div>}
            {m.type === 'user' && <div className="inline-block bg-[#0284c8] text-white px-4 py-2 rounded-2xl rounded-tr-none max-w-[70%] text-sm shadow-md">{m.content}</div>}
            {m.type === 'assistant' && (
              <div className="max-w-3xl text-left">
                <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
                  <span className="font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded shadow-sm">{m.route}</span>
                  <span className="text-emerald-400">conf {Math.round((m.confidence || 0) * 100)}%</span>
                  {m.requires_human_review && <span className="flex items-center gap-1 text-amber-400"><Clock className="w-3 h-3"/> REQUIRES HUMAN REVIEW</span>}
                  {m.safety_flags && m.safety_flags.length > 0 && <span className="text-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> {m.safety_flags.join(', ')}</span>}
                </div>
                
                <div className="bg-slate-900 border border-slate-700/50 p-5 rounded-2xl rounded-tl-none text-sm leading-relaxed text-slate-200 shadow-md">
                  <div className="whitespace-pre-wrap">{m.content}</div>
                  
                  {m.citations && m.citations.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-800">
                      <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Citations</div>
                      <div className="space-y-2">
                        {m.citations.map((c: any, idx: number) => (
                          <div key={idx} className="flex gap-2 items-start text-xs bg-slate-950/50 p-2 rounded border border-slate-800 hover:border-slate-700 transition">
                            <span className="bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded font-mono shrink-0">[{c.doc_type}]</span>
                            <span className="text-slate-400 leading-snug">"{c.snippet}"</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-1 mt-2 px-2">
                  {m.disclaimer && <span className="text-[10px] text-slate-500 italic">{m.disclaimer}</span>}
                  {m.review_task_id && <span className="text-xs text-amber-400 flex items-center gap-1"><Clock className="w-3 h-3"/> Task created: {m.review_task_id}</span>}
                  {m.memory_used && <span className="text-xs text-purple-400">Governed memory preference applied</span>}
                </div>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 text-sm p-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
            Thinking with full governance...
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <input 
            value={query} 
            onChange={e => setQuery(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Ask anything (labs, discharge, chest pain concern, general medical question...)" 
            className="flex-1 bg-slate-950/80 border border-slate-700 focus:border-[#0284c8] rounded-xl px-5 py-3 text-sm outline-none shadow-inner transition-colors" 
          />
          <button 
            onClick={sendMessage} 
            disabled={!query.trim() || isLoading} 
            className="px-8 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-medium disabled:opacity-50 transition-all shadow-md"
          >
            Send
          </button>
        </div>
        <div className="text-[10px] text-center text-slate-500 mt-3">
          This is a reference implementation. Never for clinical use without formal validation and compliance sign-off.
        </div>
      </div>
    </div>
  );
}
