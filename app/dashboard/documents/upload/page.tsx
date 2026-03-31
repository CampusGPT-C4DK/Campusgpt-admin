'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminAPI, handleApiError } from '@/lib/api';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import {
  Upload, X, FileText, UploadCloud, FilePlus2,
  Loader2, ArrowLeft, CheckCircle, Trash2, AlertCircle,
  File, Tag, AlignLeft, Sparkles,
} from 'lucide-react';

type UploadTab = 'single' | 'batch';

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

// ─── Upload Progress Modal Component ───────────────────────────
function UploadProgressModal({
  documentId,
  title,
  onComplete,
}: {
  documentId: string;
  title: string;
  onComplete: () => void;
}) {
  const [progress, setProgress] = useState<any>(null);
  const [done, setDone] = useState(false);
  const [autoRedirect, setAutoRedirect] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();

  useEffect(() => {
    let redirectTimer: NodeJS.Timeout | null = null;

    const poll = async () => {
      try {
        const p = await adminAPI.getDocumentProgress(documentId);
        setProgress(p);

        // Check if processing is complete
        if (p.status === 'completed' || p.progress >= 100) {
          setDone(true);
          if (timerRef.current) clearInterval(timerRef.current);
          toast.success('✅ Document processing complete! Redirecting...', { autoClose: 3000 });

          // Auto-redirect after 3 seconds
          setAutoRedirect(true);
          redirectTimer = setTimeout(() => {
            router.push('/dashboard/documents');
          }, 3000);
        } else if (p.status === 'failed') {
          setDone(true);
          if (timerRef.current) clearInterval(timerRef.current);
          toast.error(`❌ Processing failed: ${p.error || 'Unknown error'}`, { autoClose: 5000 });
        }
      } catch (err) {
        console.error('Progress poll error:', err);
        // Silently ignore poll errors
      }
    };

    // Initial poll
    poll();

    // Poll every 2 seconds
    timerRef.current = setInterval(poll, 2000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [documentId, router]);

  const pct = Math.round(progress?.progress ?? 0);
  const stage = progress?.stage || 'Initializing...';
  const status = progress?.status || 'processing';
  const totalChunks = progress?.total_chunks || 0;
  const chunksProcessed = progress?.chunks_processed || 0;

  const getStageColor = () => {
    switch (status) {
      case 'completed': return '#34d399';
      case 'failed': return '#f87171';
      default: return '#60a5fa';
    }
  };

  const getStageIcon = () => {
    switch (status) {
      case 'completed': return <CheckCircle size={20} color="#34d399" />;
      case 'failed': return <AlertCircle size={20} color="#f87171" />;
      default: return <Loader2 size={20} color="#60a5fa" style={{ animation: 'spin 1s linear infinite' }} />;
    }
  };

  const stageMessages: Record<string, string> = {
    uploading: '📤 Uploading file...',
    extracting_text: '📖 Extracting text from document...',
    cleaning_text: '✨ Cleaning and formatting text...',
    chunking: '✂️ Splitting into chunks...',
    embedding: '🧠 Generating embeddings...',
    storing: '💾 Storing in database...',
    completed: '✅ Processing completed!',
    failed: '❌ Processing failed',
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          width: '100%',
          maxWidth: '500px',
          padding: '40px',
          borderRadius: '20px',
          background: 'linear-gradient(145deg, rgba(15,23,42,0.95), rgba(10,15,25,0.98))',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'rgba(255, 255, 255, 0.08)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <div style={{
            fontSize: '12px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#60a5fa',
            marginBottom: '8px',
          }}>
            📄 Document Processing
          </div>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '800',
            color: '#f0f4ff',
            lineHeight: '1.4',
            marginBottom: '4px',
            wordBreak: 'break-word',
          }}>
            {title}
          </h2>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
            {stageMessages[stage] || stage}
          </p>
        </div>

        {/* Large center icon + progress ring */}
        <div style={{
          position: 'relative',
          width: '140px',
          height: '140px',
          margin: '0 auto 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* Background circle */}
          <svg
            width="140"
            height="140"
            style={{
              position: 'absolute',
              inset: 0,
              transform: 'rotate(-90deg)',
            }}
          >
            <circle
              cx="70"
              cy="70"
              r="60"
              fill="none"
              stroke="rgba(255, 255, 255, 0.06)"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="70"
              cy="70"
              r="60"
              fill="none"
              stroke={getStageColor()}
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 60}`}
              strokeDashoffset={`${2 * Math.PI * 60 * (1 - pct / 100)}`}
              strokeLinecap="round"
              style={{
                transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                filter: `drop-shadow(0 0 8px ${getStageColor()}40)`,
              }}
            />
          </svg>

          {/* Center content */}
          <div
            style={{
              position: 'relative',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {getStageIcon()}
            <div style={{
              fontSize: '28px',
              fontWeight: '800',
              color: '#f0f4ff',
              marginTop: '8px',
            }}>
              {pct}%
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            fontWeight: '600',
            color: '#94a3b8',
            marginBottom: '10px',
          }}>
            <span>Overall Progress</span>
            <span>{pct}% Complete</span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            borderRadius: '4px',
            background: 'rgba(255, 255, 255, 0.06)',
            overflow: 'hidden',
          }}>
            <div
              style={{
                height: '100%',
                background: `linear-gradient(90deg, ${getStageColor()}, ${getStageColor()}dd)`,
                width: `${pct}%`,
                transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                borderRadius: '4px',
                boxShadow: `0 0 12px ${getStageColor()}60`,
              }}
            />
          </div>
        </div>

        {/* Stage details */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          fontSize: '12px',
          marginBottom: '24px',
          padding: '16px',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.04)',
        }}>
          <div>
            <div style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.05em' }}>Current Stage</div>
            <div style={{ color: '#f0f4ff', fontWeight: '600' }}>{stageMessages[stage] || stage}</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.05em' }}>Chunks</div>
            <div style={{ color: '#f0f4ff', fontWeight: '600' }}>
              {totalChunks > 0 ? `${chunksProcessed} / ${totalChunks}` : 'Calculating...'}
            </div>
          </div>
        </div>

        {/* Status message */}
        {status === 'completed' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '14px',
              borderRadius: '10px',
              background: 'rgba(52, 211, 153, 0.1)',
              border: '1px solid rgba(52, 211, 153, 0.2)',
              fontSize: '12px',
              color: '#34d399',
              textAlign: 'center',
              marginBottom: '16px',
            }}
          >
            ✅ Document is now ready to use! {autoRedirect && 'Redirecting...'}
          </motion.div>
        )}

        {status === 'failed' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '14px',
              borderRadius: '10px',
              background: 'rgba(248, 113, 113, 0.1)',
              border: '1px solid rgba(248, 113, 113, 0.2)',
              fontSize: '12px',
              color: '#f87171',
              textAlign: 'center',
              marginBottom: '16px',
            }}
          >
            ❌ Processing encountered an error. Please try again.
          </motion.div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {status === 'completed' && (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/dashboard/documents')}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #34d399, #10b981)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
              >
                Go to Documents
              </motion.button>
              <button
                onClick={onComplete}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'transparent',
                  color: '#94a3b8',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.color = '#f0f4ff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
              >
                Upload More
              </button>
            </>
          )}

          {status === 'failed' && (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/dashboard/documents')}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#f0f4ff',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                Back to Documents
              </motion.button>
              <button
                onClick={onComplete}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(248, 113, 113, 0.3)',
                  background: 'transparent',
                  color: '#f87171',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Try Again
              </button>
            </>
          )}

          {status !== 'completed' && status !== 'failed' && (
            <div style={{
              flex: 1,
              padding: '12px',
              borderRadius: '10px',
              background: 'rgba(96, 165, 250, 0.1)',
              color: '#60a5fa',
              fontSize: '13px',
              fontWeight: '600',
              textAlign: 'center',
              border: '1px solid rgba(96, 165, 250, 0.2)',
            }}>
              Processing... Please wait
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function UploadPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<UploadTab>('single');

  /* ── Single upload state ── */
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('general');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [uploadedDocId, setUploadedDocId] = useState<string | null>(null);
  const [uploadedTitle, setUploadedTitle] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  /* ── Batch upload state ── */
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [batchDragOver, setBatchDragOver] = useState(false);
  const batchRef = useRef<HTMLInputElement>(null);

  const handleSingleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) { toast.error('File and title are required'); return; }
    setUploading(true);
    try {
      const result = await adminAPI.uploadDocument(file, title.trim(), description.trim(), category);
      setUploadedDocId(result.document_id);
      setUploadedTitle(title);
      setShowProgress(true);
      
      // Show success and redirect after brief delay to allow backend to start processing
      toast.success(`"${title.trim()}" uploaded! Processing started... 🎉`);
      setTimeout(() => {
        router.push('/dashboard/documents');
      }, 2000);
      
      // Clear form
      setFile(null);
      setTitle('');
      setDescription('');
    } catch (err) {
      toast.error(handleApiError(err, 'Upload failed'));
    } finally {
      setUploading(false);
    }
  };

  const handleBatchUpload = async () => {
    if (batchFiles.length === 0) return;
    setUploading(true);
    let ok = 0, fail = 0;
    for (const f of batchFiles) {
      try {
        await adminAPI.uploadDocument(f, f.name.replace(/\.[^/.]+$/, ''), '', 'general');
        ok++;
      } catch { fail++; }
    }
    setUploading(false);
    if (ok) toast.success(`${ok} file${ok > 1 ? 's' : ''} uploaded successfully! 🎉`);
    if (fail) toast.error(`${fail} file${fail > 1 ? 's' : ''} failed to upload`);
    if (ok > 0) router.push('/dashboard/documents');
  };

  const tabStyle = (active: boolean) => ({
    flex: 1, padding: '12px 0', borderRadius: '10px', border: 'none',
    fontSize: '14px', fontWeight: active ? '700' : '500',
    cursor: 'pointer', transition: 'all 0.2s',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    ...(active ? {
      backgroundImage: 'linear-gradient(135deg, rgba(96,165,250,0.12), rgba(167,139,250,0.08))',
      color: '#60a5fa',
      boxShadow: '0 0 16px rgba(96,165,250,0.08)',
    } : {
      backgroundColor: 'transparent',
      color: '#64748b',
    }),
  } as React.CSSProperties);

  const inputContainerStyle = {
    position: 'relative' as const, borderRadius: '12px',
    backgroundColor: 'rgba(10,14,23,0.6)',
    borderWidth: '1px', borderStyle: 'solid' as const, borderColor: 'rgba(255,255,255,0.06)',
    transition: 'all 0.2s',
  };

  const inputStyle = {
    width: '100%', padding: '13px 14px 13px 42px',
    background: 'transparent', border: 'none', outline: 'none',
    color: '#f0f4ff', fontSize: '14px', fontFamily: 'Inter, sans-serif', borderRadius: '12px',
  };

  const labelStyle = {
    display: 'block' as const, fontSize: '12px', fontWeight: '600',
    color: '#94a3b8', marginBottom: '8px', letterSpacing: '0.03em',
  };

  return (
    <div>
      <Header
        title="Upload Documents"
        subtitle="Add new documents to your CampusGPT knowledge base"
        actions={
          <button
            onClick={() => router.push('/dashboard/documents')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '9px 18px', borderRadius: '10px', border: 'none',
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.08)',
              color: '#94a3b8', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#f0f4ff'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            <ArrowLeft size={14} /> Back to Documents
          </button>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ padding: '28px 32px', maxWidth: '780px', margin: '0 auto' }}
      >
        {/* ═══ TAB SWITCHER ═══ */}
        <div style={{
          display: 'flex', gap: '4px', padding: '4px', borderRadius: '14px',
          backgroundColor: 'rgba(255,255,255,0.02)',
          borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.04)',
          marginBottom: '28px',
        }}>
          <button onClick={() => setActiveTab('single')} style={tabStyle(activeTab === 'single')}>
            <UploadCloud size={16} /> Single Upload
          </button>
          <button onClick={() => setActiveTab('batch')} style={tabStyle(activeTab === 'batch')}>
            <FilePlus2 size={16} /> Batch Upload
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* ═══════ SINGLE UPLOAD ═══════ */}
          {activeTab === 'single' && (
            <motion.div
              key="single"
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.25 }}
            >
              <div style={{
                padding: '32px', borderRadius: '18px',
                background: 'linear-gradient(145deg, rgba(23,28,37,0.85), rgba(15,19,29,0.92))',
                borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.05)',
                borderTop: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    backgroundImage: 'linear-gradient(135deg, rgba(96,165,250,0.12), rgba(167,139,250,0.08))',
                    borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(96,165,250,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Upload size={20} color="#60a5fa" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#f0f4ff' }}>Upload Document</h3>
                    <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>A live processing tracker will appear after upload</p>
                  </div>
                </div>

                <form onSubmit={handleSingleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                  {/* ── Dropzone ── */}
                  <motion.div
                    whileHover={{ scale: 1.005 }}
                    onClick={() => fileRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => {
                      e.preventDefault(); setDragOver(false);
                      const f = e.dataTransfer.files[0];
                      if (f) { setFile(f); setTitle(f.name.replace(/\.[^/.]+$/, '')); }
                    }}
                    style={{
                      padding: '40px', borderRadius: '14px', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px',
                      backgroundColor: dragOver ? 'rgba(96,165,250,0.06)' : 'rgba(10,14,23,0.5)',
                      borderWidth: '2px', borderStyle: 'dashed',
                      borderColor: dragOver ? 'rgba(96,165,250,0.35)' : 'rgba(255,255,255,0.06)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {file ? (
                      <>
                        <div style={{
                          width: '56px', height: '56px', borderRadius: '14px',
                          backgroundImage: 'linear-gradient(135deg, rgba(96,165,250,0.12), rgba(96,165,250,0.05))',
                          borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(96,165,250,0.18)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <FileText size={26} color="#60a5fa" />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '15px', fontWeight: '600', color: '#f0f4ff' }}>{file.name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>{formatSize(file.size)}</div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setFile(null); setTitle(''); }}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            padding: '6px 14px', borderRadius: '8px', border: 'none',
                            backgroundColor: 'rgba(239,68,68,0.08)', color: '#f87171',
                            fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.15)')}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)')}
                        >
                          <X size={12} /> Remove
                        </button>
                      </>
                    ) : (
                      <>
                        <div style={{
                          width: '60px', height: '60px', borderRadius: '16px',
                          backgroundImage: 'linear-gradient(135deg, rgba(96,165,250,0.1), rgba(96,165,250,0.04))',
                          borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(96,165,250,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <UploadCloud size={26} color="#60a5fa" />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '15px', fontWeight: '600', color: '#f0f4ff' }}>Drop your file here or click to browse</div>
                          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '5px' }}>PDF, DOCX, TXT supported • Max 50MB</div>
                        </div>
                      </>
                    )}
                    <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.doc" style={{ display: 'none' }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setTitle(f.name.replace(/\.[^/.]+$/, '')); } }} />
                  </motion.div>

                  {/* ── Form fields ── */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
                    <div>
                      <label style={labelStyle}><File size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Title *</label>
                      <div style={inputContainerStyle}>
                        <Tag size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} />
                        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Document title" required style={inputStyle} />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Category</label>
                      <div style={{ ...inputContainerStyle, padding: 0 }}>
                        <select value={category} onChange={e => setCategory(e.target.value)}
                          style={{
                            width: '100%', padding: '13px 14px',
                            background: 'transparent', border: 'none', outline: 'none',
                            color: '#f0f4ff', fontSize: '14px', fontFamily: 'Inter, sans-serif', borderRadius: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="general" style={{ background: '#0f131d' }}>General</option>
                          <option value="academic" style={{ background: '#0f131d' }}>Academic</option>
                          <option value="administrative" style={{ background: '#0f131d' }}>Administrative</option>
                          <option value="research" style={{ background: '#0f131d' }}>Research</option>
                          <option value="policies" style={{ background: '#0f131d' }}>Policies</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}><AlignLeft size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Description (optional)</label>
                    <div style={inputContainerStyle}>
                      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of this document..."
                        rows={3}
                        style={{
                          width: '100%', padding: '13px 14px', resize: 'vertical',
                          background: 'transparent', border: 'none', outline: 'none',
                          color: '#f0f4ff', fontSize: '14px', fontFamily: 'Inter, sans-serif', borderRadius: '12px',
                          lineHeight: '1.6',
                        }}
                      />
                    </div>
                  </div>

                  {/* ── Submit Buttons ── */}
                  <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
                    <motion.button
                      type="submit" disabled={!file || !title.trim() || uploading}
                      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      style={{
                        flex: 1, padding: '14px', borderRadius: '12px', border: 'none',
                        backgroundImage: (!file || !title.trim() || uploading) ? 'none' : 'linear-gradient(135deg, #3b82f6, #6366f1, #7c3aed)',
                        backgroundColor: (!file || !title.trim() || uploading) ? 'rgba(59,130,246,0.2)' : undefined,
                        color: 'white', fontSize: '14px', fontWeight: '700', cursor: (!file || !title.trim() || uploading) ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        boxShadow: (!file || !title.trim() || uploading) ? 'none' : '0 6px 24px rgba(59,130,246,0.3)',
                        transition: 'all 0.3s', opacity: (!file || !title.trim() || uploading) ? 0.6 : 1,
                      }}
                    >
                      {uploading ? (
                        <><Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Uploading...</>
                      ) : (
                        <><Sparkles size={15} /> Upload & Process</>
                      )}
                    </motion.button>
                    <button
                      type="button"
                      onClick={() => router.push('/dashboard/documents')}
                      style={{
                        padding: '14px 24px', borderRadius: '12px', border: 'none',
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.08)',
                        color: '#94a3b8', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* ═══════ BATCH UPLOAD ═══════ */}
          {activeTab === 'batch' && (
            <motion.div
              key="batch"
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
            >
              <div style={{
                padding: '32px', borderRadius: '18px',
                background: 'linear-gradient(145deg, rgba(23,28,37,0.85), rgba(15,19,29,0.92))',
                borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.05)',
                borderTop: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    backgroundImage: 'linear-gradient(135deg, rgba(167,139,250,0.12), rgba(96,165,250,0.08))',
                    borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(167,139,250,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <FilePlus2 size={20} color="#a78bfa" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#f0f4ff' }}>Batch Upload</h3>
                    <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Upload up to 10 files at once with auto-detected names</p>
                  </div>
                </div>

                {/* ── Batch Dropzone ── */}
                <motion.div
                  whileHover={{ scale: 1.005 }}
                  onClick={() => batchRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setBatchDragOver(true); }}
                  onDragLeave={() => setBatchDragOver(false)}
                  onDrop={e => {
                    e.preventDefault(); setBatchDragOver(false);
                    const files = Array.from(e.dataTransfer.files).slice(0, 10);
                    setBatchFiles(prev => [...prev, ...files].slice(0, 10));
                  }}
                  style={{
                    padding: '40px', borderRadius: '14px', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px',
                    backgroundColor: batchDragOver ? 'rgba(167,139,250,0.06)' : 'rgba(10,14,23,0.5)',
                    borderWidth: '2px', borderStyle: 'dashed',
                    borderColor: batchDragOver ? 'rgba(167,139,250,0.35)' : 'rgba(255,255,255,0.06)',
                    transition: 'all 0.2s', marginBottom: '20px',
                  }}
                >
                  <div style={{
                    width: '60px', height: '60px', borderRadius: '16px',
                    backgroundImage: 'linear-gradient(135deg, rgba(167,139,250,0.1), rgba(167,139,250,0.04))',
                    borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(167,139,250,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <FilePlus2 size={26} color="#a78bfa" />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#f0f4ff' }}>Drop multiple files here</div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '5px' }}>Up to 10 files • PDF, DOCX, TXT</div>
                  </div>
                  <input ref={batchRef} type="file" multiple accept=".pdf,.docx,.txt,.doc" style={{ display: 'none' }}
                    onChange={e => { const files = Array.from(e.target.files || []).slice(0, 10); setBatchFiles(prev => [...prev, ...files].slice(0, 10)); }} />
                </motion.div>

                {/* ── File List ── */}
                {batchFiles.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>
                      {batchFiles.length} file{batchFiles.length > 1 ? 's' : ''} selected
                    </div>
                    {batchFiles.map((f, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '11px 14px', borderRadius: '10px',
                          backgroundColor: 'rgba(255,255,255,0.02)',
                          borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.04)',
                        }}
                      >
                        <FileText size={15} color="#60a5fa" />
                        <span style={{ flex: 1, fontSize: '13px', color: '#c1c7d3', fontWeight: '500' }}>{f.name}</span>
                        <span style={{ fontSize: '11px', color: '#475569' }}>{formatSize(f.size)}</span>
                        <button
                          onClick={() => setBatchFiles(prev => prev.filter((_, j) => j !== i))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', transition: 'color 0.2s' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* ── Batch Buttons ── */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <motion.button
                    onClick={handleBatchUpload}
                    disabled={batchFiles.length === 0 || uploading}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    style={{
                      flex: 1, padding: '14px', borderRadius: '12px', border: 'none',
                      backgroundImage: (batchFiles.length === 0 || uploading) ? 'none' : 'linear-gradient(135deg, #a78bfa, #6366f1, #3b82f6)',
                      backgroundColor: (batchFiles.length === 0 || uploading) ? 'rgba(167,139,250,0.2)' : undefined,
                      color: 'white', fontSize: '14px', fontWeight: '700',
                      cursor: (batchFiles.length === 0 || uploading) ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      boxShadow: (batchFiles.length === 0 || uploading) ? 'none' : '0 6px 24px rgba(167,139,250,0.25)',
                      opacity: (batchFiles.length === 0 || uploading) ? 0.6 : 1, transition: 'all 0.3s',
                    }}
                  >
                    {uploading ? (
                      <><Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Uploading {batchFiles.length} files...</>
                    ) : (
                      <><UploadCloud size={15} /> Upload {batchFiles.length} File{batchFiles.length !== 1 ? 's' : ''}</>
                    )}
                  </motion.button>
                  <button
                    onClick={() => { setBatchFiles([]); }}
                    style={{
                      padding: '14px 24px', borderRadius: '12px', border: 'none',
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.08)',
                      color: '#94a3b8', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)')}
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info note */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          style={{
            marginTop: '20px', padding: '16px 18px', borderRadius: '12px',
            backgroundColor: 'rgba(34,211,238,0.04)',
            borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(34,211,238,0.1)',
            display: 'flex', gap: '12px', alignItems: 'flex-start',
          }}
        >
          <CheckCircle size={16} color="#22d3ee" style={{ flexShrink: 0, marginTop: '1px' }} />
          <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.7' }}>
            <span style={{ color: '#22d3ee', fontWeight: '700' }}>AI Processing.</span>{' '}
            After upload, our AI engine will automatically chunk your documents, generate vector embeddings, and index them for instant retrieval. You can track progress in real-time.
          </div>
        </motion.div>
      </motion.div>

      {/* Progress Modal - Show after upload */}
      {showProgress && uploadedDocId && (
        <UploadProgressModal
          documentId={uploadedDocId}
          title={uploadedTitle}
          onComplete={() => {
            setShowProgress(false);
            setUploadedDocId(null);
            setUploadedTitle('');
          }}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
