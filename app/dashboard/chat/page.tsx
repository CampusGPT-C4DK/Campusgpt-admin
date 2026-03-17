'use client';

import { useState, useEffect, useRef } from 'react';
import { adminAPI, handleApiError } from '@/lib/api';
import { toast } from 'react-toastify';
import Header from '@/components/Header';
import {
  Send, Bot, User, Zap, Clock, BarChart2, X,
  MessageSquarePlus, Trash2, ChevronDown, Copy,
  CheckCircle, AlertCircle, Loader2, Sparkles,
  FileText, BookOpen,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  confidence_score?: number;
  confidence_label?: string;
  response_time_ms?: number;
  sources?: any[];
  isLoading?: boolean;
  isError?: boolean;
}

const SUGGESTED_QUESTIONS = [
  'What are the hostel fees for 2026?',
  'How do I apply for admission?',
  'What are the exam schedules?',
  'What scholarship programs are available?',
  'What documents are needed for enrollment?',
];

function ConfidencePill({ score, label }: { score?: number; label?: string }) {
  if (!score) return null;
  const pct = Math.round(score);
  const color = pct >= 80 ? '#34d399' : pct >= 60 ? '#fbbf24' : '#f87171';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: '11px', color: color, fontWeight: '600' }}>
        {pct}% confidence
      </span>
      {label && <span style={{ fontSize: '11px', color: '#475569' }}>· {label}</span>}
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [category, setCategory] = useState('');
  const [showSources, setShowSources] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (question?: string) => {
    const q = question || input.trim();
    if (!q || sending) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: q,
      timestamp: new Date(),
    };
    const loadingMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setInput('');
    setSending(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const token = localStorage.getItem('access_token');

      const res = await fetch(`${backendUrl}/api/chat/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          question: q,
          ...(category ? { category } : {}),
          include_sources: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || 'Failed to get response');

      const assistantMsg: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: data.answer || 'No answer returned.',
        timestamp: new Date(),
        confidence_score: data.confidence_score,
        confidence_label: data.confidence_label,
        response_time_ms: data.response_time_ms,
        sources: data.sources || [],
      };

      setMessages(prev => [...prev.slice(0, -1), assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: err.message || 'Failed to get a response. Please check the backend connection.',
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev.slice(0, -1), errorMsg]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const clearChat = () => {
    setMessages([]);
  };

  const totalChats = messages.filter(m => m.role === 'user').length;
  const avgConf = messages
    .filter(m => m.confidence_score)
    .reduce((s, m) => s + (m.confidence_score || 0), 0) /
    (messages.filter(m => m.confidence_score).length || 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header
        title="AI Chat Testing"
        subtitle="Test the knowledge base with real queries via /api/chat/ask"
        actions={
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Category filter */}
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="input-field"
              style={{ width: '150px', height: '36px', fontSize: '13px' }}
            >
              <option value="">All Categories</option>
              {['admissions', 'fees', 'hostel', 'academic', 'rules', 'events', 'faculty'].map(c => (
                <option key={c} value={c} style={{ background: '#111827' }}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
            {messages.length > 0 && (
              <button onClick={clearChat} className="btn-secondary" style={{ fontSize: '13px', padding: '8px 14px', color: '#f87171' }}>
                <Trash2 size={14} /> Clear
              </button>
            )}
            <button onClick={() => setMessages([])} className="btn-primary" style={{ fontSize: '13px', padding: '8px 14px' }}>
              <MessageSquarePlus size={14} /> New Chat
            </button>
          </div>
        }
      />

      {/* Analytics strip */}
      {messages.length > 0 && (
        <div style={{
          display: 'flex', gap: '24px', alignItems: 'center',
          padding: '10px 28px',
          background: 'rgba(13,20,36,0.8)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          fontSize: '12px',
        }}>
          {[
            { label: 'Messages', value: messages.filter(m => m.role === 'user').length, icon: MessageSquarePlus, color: '#60a5fa' },
            { label: 'Avg Confidence', value: `${Math.round(avgConf || 0)}%`, icon: BarChart2, color: '#34d399' },
            {
              label: 'Last Response Time',
              value: (() => {
                const last = [...messages].reverse().find(m => m.response_time_ms);
                return last?.response_time_ms ? `${(last.response_time_ms / 1000).toFixed(2)}s` : '—';
              })(),
              icon: Clock,
              color: '#fb923c',
            },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <s.icon size={13} color={s.color} />
              <span style={{ color: '#64748b' }}>{s.label}:</span>
              <span style={{ fontWeight: '700', color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Chat area */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Empty state */}
        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '32px', paddingTop: '40px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '24px', margin: '0 auto 20px',
                background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(167,139,250,0.2))',
                border: '1px solid rgba(96,165,250,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={36} color="#60a5fa" />
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#f0f4ff', marginBottom: '8px' }}>
                Test the AI Knowledge Base
              </h2>
              <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '400px', lineHeight: '1.6' }}>
                Ask any question to test what the AI knows from uploaded documents. Uses the live <code style={{ color: '#60a5fa', fontSize: '12px' }}>/api/chat/ask</code> endpoint.
              </p>
            </div>

            {/* Suggested questions */}
            <div style={{ width: '100%', maxWidth: '600px' }}>
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', textAlign: 'center' }}>
                Suggested Questions
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    style={{
                      padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(99,179,237,0.1)',
                      background: 'rgba(255,255,255,0.02)', color: '#94a3b8', fontSize: '14px',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease',
                      display: 'flex', alignItems: 'center', gap: '10px',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(96,165,250,0.06)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(96,165,250,0.2)';
                      (e.currentTarget as HTMLElement).style.color = '#f0f4ff';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,179,237,0.1)';
                      (e.currentTarget as HTMLElement).style.color = '#94a3b8';
                    }}
                  >
                    <Zap size={14} color="#60a5fa" style={{ flexShrink: 0 }} />
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className="animate-fade-in"
            style={{
              display: 'flex',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              gap: '12px',
              alignItems: 'flex-start',
              maxWidth: '900px',
              width: '100%',
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            {/* Avatar */}
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, #3b82f6, #7c3aed)'
                : msg.isError
                  ? 'rgba(239,68,68,0.15)'
                  : 'linear-gradient(135deg, rgba(96,165,250,0.2), rgba(167,139,250,0.2))',
              border: msg.role === 'assistant' && !msg.isError ? '1px solid rgba(96,165,250,0.2)' : 'none',
            }}>
              {msg.role === 'user'
                ? <User size={16} color="white" />
                : msg.isError
                  ? <AlertCircle size={16} color="#f87171" />
                  : <Bot size={16} color="#60a5fa" />}
            </div>

            {/* Bubble */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                padding: '14px 18px',
                borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #3b82f6, #6366f1)'
                  : msg.isError
                    ? 'rgba(239,68,68,0.08)'
                    : 'rgba(17,24,39,0.95)',
                border: msg.role === 'user' ? 'none'
                  : msg.isError
                    ? '1px solid rgba(239,68,68,0.2)'
                    : '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
                position: 'relative',
              }}>
                {msg.isLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{
                          width: '7px', height: '7px', borderRadius: '50%',
                          background: '#60a5fa', opacity: 0.7,
                          animation: `bounce 1.2s ease-in-out ${i * 0.15}s infinite`,
                        }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>Thinking...</span>
                  </div>
                ) : (
                  <>
                    <p style={{
                      fontSize: '14px',
                      lineHeight: '1.65',
                      color: msg.role === 'user' ? 'white' : msg.isError ? '#f87171' : '#e2e8f0',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}>
                      {msg.content}
                    </p>

                    {/* Confidence & metadata for AI messages */}
                    {msg.role === 'assistant' && !msg.isError && (
                      <>
                        <ConfidencePill score={msg.confidence_score} label={msg.confidence_label} />

                        {/* Sources toggle */}
                        {msg.sources && msg.sources.length > 0 && (
                          <button
                            onClick={() => setShowSources(showSources === msg.id ? null : msg.id)}
                            style={{
                              marginTop: '10px', background: 'none', border: 'none',
                              cursor: 'pointer', color: '#60a5fa', fontSize: '12px',
                              display: 'flex', alignItems: 'center', gap: '4px', padding: 0,
                            }}
                          >
                            <BookOpen size={12} />
                            {showSources === msg.id ? 'Hide' : `Show`} {msg.sources.length} sources
                            <ChevronDown size={11} style={{ transform: showSources === msg.id ? 'rotate(180deg)' : '', transition: '0.2s' }} />
                          </button>
                        )}
                        {showSources === msg.id && msg.sources && (
                          <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {msg.sources.map((src: any, i: number) => (
                              <div key={i} style={{
                                padding: '8px 10px', borderRadius: '6px',
                                background: 'rgba(96,165,250,0.06)',
                                border: '1px solid rgba(96,165,250,0.1)',
                              }}>
                                <div style={{ fontSize: '11px', color: '#60a5fa', fontWeight: '600', marginBottom: '2px' }}>
                                  <FileText size={10} style={{ display: 'inline', marginRight: '4px' }} />
                                  Chunk #{src.chunk_index ?? i + 1}
                                </div>
                                <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                  {src.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                {/* Copy button for AI messages */}
                {msg.role === 'assistant' && !msg.isLoading && !msg.isError && (
                  <button
                    onClick={() => copyToClipboard(msg.content)}
                    style={{
                      position: 'absolute', top: '10px', right: '10px',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '6px', width: '26px', height: '26px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: '#64748b', opacity: 0,
                    }}
                    className="copy-btn"
                    title="Copy"
                  >
                    <Copy size={12} />
                  </button>
                )}
              </div>

              {/* Timestamp & meta */}
              <div style={{
                fontSize: '11px', color: '#334155', marginTop: '4px',
                display: 'flex', gap: '8px',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                {msg.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                {msg.response_time_ms && (
                  <span style={{ color: '#334155' }}>
                    · {(msg.response_time_ms / 1000).toFixed(2)}s
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{
        padding: '16px 28px 24px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(7,11,20,0.9)',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{
          display: 'flex', gap: '12px', alignItems: 'flex-end',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(99,179,237,0.1)',
          borderRadius: '14px',
          padding: '12px 14px',
          transition: 'border-color 0.2s',
        }}
          onFocus={e => (e.currentTarget.style.borderColor = 'rgba(96,165,250,0.4)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'rgba(99,179,237,0.1)')}
        >
          <Bot size={18} color="#64748b" style={{ flexShrink: 0, marginBottom: '2px' }} />
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything from the knowledge base… (Enter to send, Shift+Enter for new line)"
            rows={1}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: '#f0f4ff', fontSize: '14px', resize: 'none', lineHeight: '1.5',
              fontFamily: 'Inter, sans-serif', maxHeight: '120px', overflowY: 'auto',
            }}
            onInput={e => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || sending}
            className="btn-primary"
            style={{
              padding: '8px 16px', fontSize: '13px', flexShrink: 0,
              opacity: !input.trim() || sending ? 0.5 : 1,
              cursor: !input.trim() || sending ? 'not-allowed' : 'pointer',
            }}
          >
            {sending
              ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
              : <Send size={16} />
            }
          </button>
        </div>
        <p style={{ fontSize: '11px', color: '#334155', textAlign: 'center', marginTop: '8px' }}>
          Connected to <code style={{ color: '#60a5fa' }}>POST /api/chat/ask</code> · Admin test mode
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        .copy-btn { transition: opacity 0.2s; }
        div:hover > div .copy-btn { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
