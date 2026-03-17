'use client';

import { useState, useEffect } from 'react';
import { chatAPI, handleApiError } from '@/lib/api';
import { ChatHistory } from '@/lib/types';
import { toast } from 'react-toastify';
import Header from '@/components/Header';
import {
  MessageSquare, Search, Filter, ChevronLeft, ChevronRight,
  RefreshCw, Clock, Zap, User, Bot, ChevronDown, ChevronUp,
  TrendingUp, BarChart2,
} from 'lucide-react';

function ConfidenceBadge({ score }: { score?: number }) {
  if (score === undefined || score === null) return <span className="badge badge-info">N/A</span>;
  const pct = Math.round(score);
  const cls = pct >= 80 ? 'badge-success' : pct >= 60 ? 'badge-warning' : 'badge-danger';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span className={`badge ${cls}`}>{pct}%</span>
      <div style={{ width: '60px', height: '4px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: '999px', background: pct >= 80 ? '#34d399' : pct >= 60 ? '#fbbf24' : '#f87171' }} />
      </div>
    </div>
  );
}

export default function ChatsPage() {
  const [chats, setChats] = useState<ChatHistory[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [minConfidence, setMinConfidence] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const limit = 15;

  useEffect(() => { fetchChats(); }, [page]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const data = await chatAPI.getHistory(page * limit, limit);
      setChats(data.history || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const filtered = chats.filter(c => {
    const matchSearch = !search || c.question.toLowerCase().includes(search.toLowerCase()) || c.answer.toLowerCase().includes(search.toLowerCase());
    const matchConf = !minConfidence || (c.confidence_score !== undefined && c.confidence_score >= Number(minConfidence));
    return matchSearch && matchConf;
  });

  const totalPages = Math.ceil(total / limit);

  const avgConf = chats.length
    ? Math.round(chats.filter(c => c.confidence_score !== undefined).reduce((s, c) => s + (c.confidence_score || 0), 0) / chats.filter(c => c.confidence_score !== undefined).length)
    : 0;

  const avgTime = chats.length
    ? Math.round(chats.filter(c => c.response_time_ms).reduce((s, c) => s + (c.response_time_ms || 0), 0) / chats.filter(c => c.response_time_ms).length)
    : 0;

  return (
    <div>
      <Header
        title="Chat History"
        subtitle={`${total} total conversations`}
        actions={
          <button onClick={fetchChats} className="btn-secondary" style={{ fontSize: '13px', padding: '8px 14px' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        }
      />

      <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Analytics Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
          {[
            { label: 'Total Chats', value: total.toLocaleString(), icon: MessageSquare, color: '#60a5fa' },
            { label: 'Avg Confidence', value: `${avgConf}%`, icon: TrendingUp, color: '#34d399' },
            { label: 'Avg Response Time', value: `${(avgTime / 1000).toFixed(1)}s`, icon: Clock, color: '#fb923c' },
            { label: 'This Page', value: filtered.length.toString(), icon: BarChart2, color: '#a78bfa' },
          ].map((m, i) => (
            <div key={i} className="glass-card" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${m.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <m.icon size={18} color={m.color} />
              </div>
              <div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#f0f4ff' }}>{m.value || '—'}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{m.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="glass-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '400px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search questions or answers..." className="input-field" style={{ paddingLeft: '36px', height: '36px', fontSize: '13px' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={14} color="#64748b" />
              <span style={{ fontSize: '13px', color: '#64748b' }}>Min Confidence:</span>
              <select value={minConfidence} onChange={(e) => setMinConfidence(e.target.value)} className="input-field" style={{ width: '120px', height: '36px', fontSize: '13px' }}>
                <option value="">All</option>
                <option value="80">80%+ (High)</option>
                <option value="60">60%+ (Medium)</option>
                <option value="40">40%+ (Low)</option>
              </select>
            </div>
            <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#475569' }}>
              {filtered.length} results
            </div>
          </div>
        </div>

        {/* Chats List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading
            ? Array(5).fill(0).map((_, i) => (
                <div key={i} className="glass-card shimmer" style={{ height: '100px', borderRadius: '14px' }} />
              ))
            : filtered.length === 0 ? (
              <div className="glass-card" style={{ padding: '56px', textAlign: 'center' }}>
                <MessageSquare size={40} style={{ margin: '0 auto 16px', opacity: 0.2, display: 'block' }} />
                <p style={{ color: '#475569' }}>No chat history found.</p>
              </div>
            ) : filtered.map((chat) => (
              <div key={chat.id} className="glass-card animate-fade-in" style={{ overflow: 'hidden' }}>
                {/* Chat header */}
                <div
                  style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', gap: '14px', alignItems: 'flex-start' }}
                  onClick={() => setExpanded(expanded === chat.id ? null : chat.id)}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User size={16} color="#60a5fa" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#f0f4ff', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {chat.question}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <ConfidenceBadge score={chat.confidence_score} />
                      {chat.response_time_ms && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
                          <Clock size={11} />
                          {(chat.response_time_ms / 1000).toFixed(2)}s
                        </div>
                      )}
                      {chat.model_used && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
                          <Zap size={11} color="#a78bfa" />
                          {chat.model_used}
                        </div>
                      )}
                      <div style={{ fontSize: '11px', color: '#475569', marginLeft: 'auto' }}>
                        {new Date(chat.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <div style={{ color: '#475569', flexShrink: 0 }}>
                    {expanded === chat.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Expanded answer */}
                {expanded === chat.id && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '16px 20px 16px 70px', background: 'rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Bot size={13} color="#a78bfa" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: '#a78bfa', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          AI Response
                        </div>
                        <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.65', whiteSpace: 'pre-wrap' }}>
                          {chat.answer}
                        </p>
                        {chat.retrieved_chunks && chat.retrieved_chunks.length > 0 && (
                          <div style={{ marginTop: '10px', fontSize: '12px', color: '#475569' }}>
                            📎 {chat.retrieved_chunks.length} source chunks used
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#475569' }}>Page {page + 1} of {totalPages}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setPage(p => p - 1)} disabled={page === 0} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '13px' }}>
                <ChevronLeft size={14} /> Previous
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '13px' }}>
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
