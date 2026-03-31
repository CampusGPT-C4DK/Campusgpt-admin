'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { adminAPI, handleApiError } from '@/lib/api';
import { Document, DocumentProgress, DocumentChunk, DocumentChunksResponse } from '@/lib/types';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import {
  Upload, Trash2, RefreshCw, FileText, Plus,
  Search, ChevronLeft, ChevronRight, X, CheckCircle,
  AlertCircle, Clock, Loader2, UploadCloud, FilePlus2,
  Activity, TrendingUp, Eye, Download, FileCode,
} from 'lucide-react';

type UploadMode = 'none' | 'single' | 'batch';

// ─── Progress tracker state per document ───
interface TrackedDoc {
  id: string;
  title: string;
  progress: DocumentProgress | null;
  polling: boolean;
}

// ─── Status Badge ─────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: 'badge-success',
    processing: 'badge-info',
    pending: 'badge-warning',
    failed: 'badge-danger',
  };
  const icons: Record<string, React.ReactNode> = {
    completed: <CheckCircle size={10} />,
    processing: <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />,
    pending: <Clock size={10} />,
    failed: <AlertCircle size={10} />,
  };
  return (
    <span className={`badge ${map[status] ?? 'badge-info'}`} style={{ gap: '4px' }}>
      {icons[status]}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ─── Document Detail Modal ───────────────────────────
interface DocumentDetailModalProps {
  document: Document;
  onClose: () => void;
}

function DocumentDetailModal({ document, onClose }: DocumentDetailModalProps) {
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [totalChunks, setTotalChunks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [expandedChunk, setExpandedChunk] = useState<number | null>(null);
  const [viewing, setViewing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [editingChunkId, setEditingChunkId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [savingChunk, setSavingChunk] = useState(false);
  const chunksPerPage = 10;

  useEffect(() => {
    fetchChunks();
  }, [page, document.id]);

  const fetchChunks = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDocumentChunks(
        document.id,
        page * chunksPerPage,
        chunksPerPage
      );
      
      // Update chunks and pagination info
      setChunks(response.chunks || []);
      setTotalChunks(response.total || 0);
      
      // Clear any editing state when fetching fresh chunks
      setEditingChunkId(null);
      setEditingContent('');
    } catch (err: any) {
      const errorMsg = handleApiError(err);
      toast.error(`Failed to load chunks: ${errorMsg}`);
      console.error('Failed to fetch chunks:', err);
      
      // On error, keep previously loaded chunks visible (don't clear them)
      // This provides better UX - user can still see old data while we show error
      // User can click "Refresh Chunks" to retry
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = async () => {
    if (!document.file_url) return;
    setViewing(true);
    try {
      // Fetch file with proper MIME type detection
      const response = await fetch(document.file_url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // Detect file type from response or document
      let mimeType = response.headers.get('content-type') || 'application/octet-stream';
      
      // If it's a PDF, ensure correct MIME type
      if (document.file_url.includes('.pdf') || mimeType.includes('pdf')) {
        mimeType = 'application/pdf';
      } else if (document.file_url.includes('.docx') || mimeType.includes('word')) {
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      } else if (document.file_url.includes('.doc') || mimeType.includes('msword')) {
        mimeType = 'application/msword';
      } else if (document.file_url.includes('.txt')) {
        mimeType = 'text/plain';
      }
      
      // Create blob with correct MIME type
      const typedBlob = new Blob([blob], { type: mimeType });
      const blobUrl = globalThis.URL.createObjectURL(typedBlob);
      
      // Open in new tab/window with viewer
      const viewer = window.open(blobUrl, '_blank', 'noopener,noreferrer');
      
      if (!viewer) {
        toast.error('Popup blocked. Try opening file in browser directly.');
        // Fallback: open file URL directly
        window.location.href = document.file_url;
      } else {
        toast.success('Opening document in viewer...');
      }
    } catch (err) {
      console.error('View error:', err);
      toast.error('Could not open document. Opening file directly...');
      // Final fallback - open file URL directly
      window.open(document.file_url, '_blank', 'noopener,noreferrer');
    } finally {
      setViewing(false);
    }
  };

  const handleDownloadDocument = async () => {
    if (!document.file_url) return;
    
    setDownloading(true);
    try {
      toast.success('Starting download...');
      
      // Fetch with proper headers
      const response = await fetch(document.file_url, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
        },
        mode: 'cors',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // Extract file extension from URL or use default
      let fileName = document.title || 'document';
      const urlParts = document.file_url.split('.');
      const extension = urlParts[urlParts.length - 1]?.split('?')[0] || 'pdf';
      if (!fileName.includes('.')) {
        fileName = `${fileName}.${extension}`;
      }
      
      // Create blob URL and download
      const url = globalThis.URL.createObjectURL(blob);
      const link = globalThis.document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      
      globalThis.document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        globalThis.URL.revokeObjectURL(url);
        globalThis.document.body.removeChild(link);
      }, 100);
      
      toast.success(`✅ Downloaded: ${fileName}`);
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Download failed. Opening file in browser instead...');
      // Fallback: open directly
      setTimeout(() => {
        window.open(document.file_url, '_blank', 'noopener,noreferrer');
      }, 500);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyUrl = () => {
    if (document.file_url) {
      navigator.clipboard.writeText(document.file_url).then(() => {
        setUrlCopied(true);
        toast.success('✅ File URL copied to clipboard!');
        setTimeout(() => setUrlCopied(false), 2000);
      }).catch(() => {
        toast.error('Failed to copy URL');
      });
    }
  };

  const handleStartEdit = (chunkId: string, content: string) => {
    setEditingChunkId(chunkId);
    setEditingContent(content);
  };

  const handleCancelEdit = () => {
    setEditingChunkId(null);
    setEditingContent('');
  };

  const handleSaveEdit = async () => {
    if (!editingChunkId || !editingContent.trim()) {
      toast.error('Content cannot be empty');
      return;
    }

    setSavingChunk(true);
    try {
      const result = await adminAPI.updateDocumentChunk(
        document.id,
        editingChunkId,
        editingContent.trim()
      );

      // Update local chunks with data from API response to ensure consistency
      setChunks(chunks.map(c => 
        c.id === editingChunkId 
          ? { 
              ...c, 
              content: result.content || editingContent,
              word_count: result.word_count || editingContent.trim().split(/\s+/).length,
              updated_at: result.updated_at || new Date().toISOString()
            }
          : c
      ));

      toast.success('✅ Chunk updated successfully!');
      setEditingChunkId(null);
      setEditingContent('');
    } catch (err: any) {
      const errorMsg = handleApiError(err);
      toast.error(errorMsg);
      
      // On error, keep editing state open so user can retry or cancel
      // Don't clear editingChunkId or editingContent - user can adjust and try again
      console.error('Failed to update chunk:', err);
    } finally {
      setSavingChunk(false);
    }
  };

  const totalPages = Math.ceil(totalChunks / chunksPerPage);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
      overflowY: 'auto',
    }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '900px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#60a5fa', marginBottom: '4px' }}>
              Document Details
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#f0f4ff' }}>
              {document.title}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '24px' }}>
            <X size={24} />
          </button>
        </div>

        {/* Document Metadata */}
        <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>Status</div>
              <StatusBadge status={document.status} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>Category</div>
              <span className="badge badge-purple">{document.category || 'general'}</span>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>File Size</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#94a3b8' }}>{formatSize(document.file_size)}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>Total Chunks</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#60a5fa' }}>{document.total_chunks || 0}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>Created</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#94a3b8' }}>
                {new Date(document.created_at).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>Document ID</div>
              <div style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: '#475569', wordBreak: 'break-all' }}>
                {document.id.slice(0, 12)}…
              </div>
            </div>
          </div>

          {document.description && (
            <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>Description</div>
              <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5' }}>{document.description}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            {document.file_url ? (
              <>
                <button
                  onClick={handleViewDocument}
                  disabled={viewing}
                  className="btn-primary"
                  style={{ fontSize: '12px', padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: viewing ? 0.6 : 1 }}
                >
                  {viewing ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Eye size={13} />}
                  {viewing ? 'Opening...' : 'View Document'}
                </button>
                <button
                  onClick={handleDownloadDocument}
                  disabled={downloading}
                  className="btn-primary"
                  style={{ fontSize: '12px', padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)', color: '#60a5fa', opacity: downloading ? 0.6 : 1 }}
                >
                  {downloading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={13} />}
                  {downloading ? 'Downloading...' : 'Download'}
                </button>
                <button
                  onClick={handleCopyUrl}
                  className="btn-secondary"
                  style={{ fontSize: '12px', padding: '8px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  title="Copy file URL to clipboard"
                >
                  <span style={{ fontSize: '10px' }}>📋</span> {urlCopied ? 'Copied!' : 'Copy URL'}
                </button>
              </>
            ) : (
              <div style={{ fontSize: '12px', color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={14} /> No file available for viewing
              </div>
            )}
            <button
              onClick={fetchChunks}
              className="btn-secondary"
              style={{ fontSize: '12px', padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              title="Refresh chunks list"
            >
              <RefreshCw size={13} /> Refresh Chunks
            </button>
          </div>
        </div>

        {/* Chunks Section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <FileCode size={18} color="#60a5fa" />
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#f0f4ff' }}>
              Document Chunks ({totalChunks})
            </h3>
          </div>

          {loading && page === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>
              <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', display: 'block' }} />
              Loading chunks…
            </div>
          ) : chunks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>
              <FileCode size={36} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
              No chunks available
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {chunks.map((chunk, idx) => (
                  <div
                    key={chunk.id}
                    style={{
                      padding: '14px',
                      borderRadius: '10px',
                      background: (expandedChunk === idx || editingChunkId === chunk.id) ? 'rgba(96,165,250,0.08)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${(expandedChunk === idx || editingChunkId === chunk.id) ? 'rgba(96,165,250,0.2)' : 'rgba(255,255,255,0.05)'}`,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Chunk Header */}
                    <div 
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: (expandedChunk === idx || editingChunkId === chunk.id) ? '12px' : 0, cursor: 'pointer' }}
                      onClick={() => {
                        // Don't collapse if editing
                        if (editingChunkId !== chunk.id) {
                          setExpandedChunk(expandedChunk === idx ? null : idx);
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                        <div style={{
                          width: '32px', height: '32px',
                          borderRadius: '8px',
                          background: 'rgba(96,165,250,0.1)',
                          border: '1px solid rgba(96,165,250,0.2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '12px', fontWeight: '700', color: '#60a5fa',
                        }}>
                          {chunk.chunk_index + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: '#d1d5db' }}>
                            Chunk {chunk.chunk_index + 1}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                            {chunk.word_count} words • Score: {(chunk.importance_score * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Updated Tag - Only show if chunk was actually updated after creation (more than 1 second difference) */}
                        {chunk.updated_at && chunk.created_at && (new Date(chunk.updated_at).getTime() - new Date(chunk.created_at).getTime()) > 1000 && (
                          <div style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: 'rgba(34,197,94,0.15)',
                            border: '1px solid rgba(34,197,94,0.3)',
                            color: '#22c55e',
                            fontSize: '10px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap',
                          }}>
                            ✓ Updated
                            <span style={{ fontSize: '9px', color: '#86efac', marginLeft: '4px' }}>
                              {new Date(chunk.updated_at).toLocaleDateString()} {new Date(chunk.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        )}
                        <div style={{ color: '#64748b' }}>
                          {(expandedChunk === idx || editingChunkId === chunk.id) ? '▼' : '▶'}
                        </div>
                      </div>
                    </div>

                    {/* Chunk Content */}
                    {(expandedChunk === idx || editingChunkId === chunk.id) && (
                      <div style={{ paddingLeft: '0px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        {editingChunkId === chunk.id ? (
                          // Edit Mode
                          <div style={{ marginBottom: '12px' }}>
                            <textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                background: 'rgba(0,0,0,0.3)',
                                border: '2px solid rgba(96,165,250,0.5)',
                                color: '#cbd5e1',
                                fontFamily: 'JetBrains Mono, monospace',
                                fontSize: '12px',
                                lineHeight: '1.6',
                                minHeight: '200px',
                                resize: 'vertical',
                                marginBottom: '12px',
                              }}
                              placeholder="Edit chunk content..."
                              autoFocus
                            />
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveEdit();
                                }}
                                disabled={savingChunk}
                                style={{
                                  padding: '8px 16px',
                                  borderRadius: '6px',
                                  background: 'rgba(52,211,153,0.2)',
                                  border: '1px solid rgba(52,211,153,0.4)',
                                  color: '#34d399',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  cursor: savingChunk ? 'not-allowed' : 'pointer',
                                  opacity: savingChunk ? 0.6 : 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                }}
                              >
                                {savingChunk ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={13} />}
                                {savingChunk ? 'Saving...' : 'Save Changes'}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelEdit();
                                }}
                                disabled={savingChunk}
                                style={{
                                  padding: '8px 16px',
                                  borderRadius: '6px',
                                  background: 'rgba(244,63,94,0.2)',
                                  border: '1px solid rgba(244,63,94,0.4)',
                                  color: '#f43f5e',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  cursor: savingChunk ? 'not-allowed' : 'pointer',
                                  opacity: savingChunk ? 0.6 : 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                }}
                              >
                                <X size={13} />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          // View Mode
                          <>
                            <div style={{
                              padding: '12px',
                              borderRadius: '8px',
                              background: 'rgba(0,0,0,0.2)',
                              border: '1px solid rgba(255,255,255,0.05)',
                              fontFamily: 'JetBrains Mono, monospace',
                              fontSize: '12px',
                              color: '#cbd5e1',
                              lineHeight: '1.6',
                              maxHeight: '300px',
                              overflowY: 'auto',
                              marginBottom: '12px',
                              whiteSpace: 'pre-wrap',
                              wordWrap: 'break-word',
                            }}>
                              {chunk.content}
                            </div>

                            {/* Edit Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEdit(chunk.id, chunk.content);
                              }}
                              style={{
                                padding: '8px 14px',
                                borderRadius: '6px',
                                background: 'rgba(96,165,250,0.15)',
                                border: '1px solid rgba(96,165,250,0.3)',
                                color: '#60a5fa',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s ease',
                                marginBottom: '12px',
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(96,165,250,0.25)'}
                              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(96,165,250,0.15)'}
                            >
                              ✏️ Edit This Chunk
                            </button>
                          </>
                        )}

                        {/* Chunk Metadata */}
                        {chunk.metadata && Object.keys(chunk.metadata).length > 0 && editingChunkId !== chunk.id && (
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '12px', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ fontWeight: '600', color: '#94a3b8' }}>📋 Metadata:</span>
                            <div style={{ marginTop: '6px', color: '#64748b' }}>
                              {Object.entries(chunk.metadata)
                                .map(([key, val]) => (
                                  <div key={key} style={{ marginTop: '3px', fontSize: '10px' }}>
                                    <span style={{ color: '#cbd5e1' }}>{key}:</span> {val}
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
                  <span style={{ fontSize: '12px', color: '#475569' }}>
                    Page {page + 1} of {totalPages} • Showing {chunks.length} of {totalChunks} chunks
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                      ← Prev
                    </button>
                    <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Inline progress bar for a document row ──
function DocProgressBar({ docId, initialStatus }: { docId: string; initialStatus: string }) {
  const [progress, setProgress] = useState<DocumentProgress | null>(null);
  const [done, setDone] = useState(initialStatus === 'completed' || initialStatus === 'failed');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (done) return;

    const poll = async () => {
      try {
        const p = await adminAPI.getDocumentProgress(docId);
        setProgress(p);
        if (p.status === 'completed' || p.status === 'failed' || p.progress >= 100) {
          setDone(true);
          if (timerRef.current) clearInterval(timerRef.current);
        }
      } catch {
        // silently ignore poll errors
      }
    };

    poll();
    timerRef.current = setInterval(poll, 2500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [docId, done]);

  if (done || !progress) return null;

  const pct = Math.round(progress.progress ?? 0);
  const stage = progress.stage || 'Processing';
  const color = progress.status === 'failed' ? '#f87171' : '#60a5fa';

  return (
    <div style={{ marginTop: '6px', minWidth: '160px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#475569', marginBottom: '3px' }}>
        <span style={{ color: color, fontWeight: '600' }}>{stage}</span>
        <span>{pct}%</span>
      </div>
      <div className="progress-bar" style={{ height: '4px', background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="progress-fill"
          style={{
            width: `${pct}%`,
            background: progress.status === 'failed'
              ? 'linear-gradient(135deg, #f87171, #dc2626)'
              : 'linear-gradient(135deg, #60a5fa, #a78bfa)',
            transition: 'width 0.6s ease',
          }}
        />
      </div>
      {progress.total_chunks > 0 && (
        <div style={{ fontSize: '10px', color: '#334155', marginTop: '2px' }}>
          {Math.round((pct / 100) * progress.total_chunks)} / {progress.total_chunks} chunks
        </div>
      )}
    </div>
  );
}

// ─── Post-upload progress modal ──────────────
function UploadProgressModal({
  documentId,
  title,
  onClose,
}: {
  documentId: string;
  title: string;
  onClose: () => void;
}) {
  const [progress, setProgress] = useState<DocumentProgress | null>(null);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const p = await adminAPI.getDocumentProgress(documentId);
        setProgress(p);
        if (p.status === 'completed' || p.progress >= 100) {
          setDone(true);
          clearInterval(timerRef.current!);
          toast.success('Document processing complete! ✅');
        } else if (p.status === 'failed') {
          setDone(true);
          clearInterval(timerRef.current!);
          toast.error(`Processing failed: ${p.error || 'Unknown error'}`);
        }
      } catch {/* ignore */}
    };

    poll();
    timerRef.current = setInterval(poll, 2000);
    return () => clearInterval(timerRef.current!);
  }, [documentId]);

  const pct = Math.round(progress?.progress ?? 0);
  const stage = progress?.stage || 'Initializing';
  const status = progress?.status || 'pending';

  const stageColor =
    status === 'failed' ? '#f87171'
    : status === 'completed' ? '#34d399'
    : '#60a5fa';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '460px', padding: '32px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#60a5fa', marginBottom: '4px' }}>
              Document Processing
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#f0f4ff', lineHeight: '1.3' }}>
              {title}
            </h3>
          </div>
          {done && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
              <X size={20} />
            </button>
          )}
        </div>

        {/* Big progress ring + bar */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          {/* Circle */}
          <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 16px' }}>
            <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="50"
                fill="none"
                stroke={stageColor}
                strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - pct / 100)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.6s ease', filter: `drop-shadow(0 0 6px ${stageColor}80)` }}
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}>
              {status === 'completed' ? (
                <CheckCircle size={32} color="#34d399" />
              ) : status === 'failed' ? (
                <AlertCircle size={32} color="#f87171" />
              ) : (
                <>
                  <span style={{ fontSize: '26px', fontWeight: '900', color: '#f0f4ff' }}>{pct}%</span>
                </>
              )}
            </div>
          </div>

          {/* Stage chip */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '6px 14px', borderRadius: '999px',
            background: `${stageColor}15`, border: `1px solid ${stageColor}30`,
            fontSize: '12px', fontWeight: '700', color: stageColor, marginBottom: '8px',
          }}>
            {status !== 'completed' && status !== 'failed' && (
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%', background: stageColor,
                animation: 'pulse-glow 1.5s ease-in-out infinite',
              }} />
            )}
            {stage}
          </div>
        </div>

        {/* Linear bar */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
            <span>Progress</span>
            <span style={{ fontWeight: '700', color: stageColor }}>{pct}%</span>
          </div>
          <div className="progress-bar" style={{ height: '8px', borderRadius: '999px' }}>
            <div
              className="progress-fill"
              style={{
                width: `${pct}%`,
                background: status === 'failed'
                  ? 'linear-gradient(135deg,#f87171,#dc2626)'
                  : status === 'completed'
                    ? 'linear-gradient(135deg,#34d399,#059669)'
                    : 'linear-gradient(135deg,#60a5fa,#a78bfa)',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>

        {/* Chunks info */}
        {progress?.total_chunks ? (
          <div style={{
            padding: '12px 14px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', justifyContent: 'space-between', marginBottom: '20px',
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#475569', marginBottom: '2px' }}>Chunks Processed</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#60a5fa' }}>
                {Math.round((pct / 100) * progress.total_chunks)}
                <span style={{ color: '#334155', fontSize: '13px' }}> / {progress.total_chunks}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#475569', marginBottom: '2px' }}>Document ID</div>
              <div style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: '#475569' }}>
                {documentId.slice(0, 12)}…
              </div>
            </div>
          </div>
        ) : null}

        {/* Error msg */}
        {progress?.error && (
          <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '16px', fontSize: '13px', color: '#f87171' }}>
            {progress.error}
          </div>
        )}

        {/* Close button (shown only when done) */}
        {done && (
          <button onClick={onClose} className="btn-primary" style={{ width: '100%' }}>
            {status === 'completed' ? <><CheckCircle size={14} /> Done</> : <><X size={14} /> Close</>}
          </button>
        )}

        {!done && (
          <p style={{ fontSize: '12px', color: '#334155', textAlign: 'center' }}>
            This dialog auto-updates every 2 seconds…
          </p>
        )}
      </div>
    </div>
  );
}

function formatSize(bytes?: number) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ─── Main component ───────────────────────────
export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [uploadMode, setUploadMode] = useState<UploadMode>('none');
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const limit = 10;

  // Track recently uploaded doc for progress modal
  const [trackingDoc, setTrackingDoc] = useState<{ id: string; title: string } | null>(null);

  // Document detail modal
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  // Single upload
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Batch upload
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const batchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchDocuments(); }, [page]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getDocuments(page * limit, limit);
      setDocuments(data.documents || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSingleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);

    // Fake network upload progress
    const interval = setInterval(() => {
      setUploadProgress(p => p !== null && p < 80 ? p + 8 : p);
    }, 250);

    try {
      const result = await adminAPI.uploadDocument(file, title, description, category);
      clearInterval(interval);
      setUploadProgress(100);
      await new Promise(r => setTimeout(r, 400));

      toast.success('File uploaded! Tracking processing progress… 🚀');
      setUploadMode('none');
      setFile(null); setTitle(''); setDescription(''); setCategory('general');
      setUploadProgress(null);
      fetchDocuments();

      // Open progress modal for the new doc
      if (result?.document_id) {
        setTrackingDoc({ id: result.document_id, title: title || file.name });
      }
    } catch (err) {
      clearInterval(interval);
      setUploadProgress(null);
      toast.error(handleApiError(err));
    } finally {
      setUploading(false);
    }
  };

  const handleBatchUpload = async () => {
    if (batchFiles.length === 0) return;
    setUploading(true);
    try {
      const titles = batchFiles.map(f => f.name.replace(/\.[^/.]+$/, ''));
      const result = await adminAPI.uploadBatchDocuments(batchFiles, titles);
      toast.success(`Batch upload complete! ${result.successful}/${result.total_files} files uploaded.`);
      setUploadMode('none');
      setBatchFiles([]);
      fetchDocuments();
    } catch (err) {
      toast.error(handleApiError(err));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, docTitle: string) => {
    if (!confirm(`Delete "${docTitle}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await adminAPI.deleteDocument(id);
      toast.success('Document deleted');
      fetchDocuments();
    } catch (err) {
      toast.error(handleApiError(err));
    } finally {
      setDeleting(null);
    }
  };

  const totalPages = Math.ceil(total / limit);
  const filtered = documents.filter(d =>
    !search ||
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.category?.toLowerCase().includes(search.toLowerCase())
  );

  const processingCount = documents.filter(d => d.status === 'processing' || d.status === 'pending').length;

  return (
    <div>
      {/* Progress modal (shows after upload) */}

      {trackingDoc && (
        <UploadProgressModal
          documentId={trackingDoc.id}
          title={trackingDoc.title}
          onClose={() => { setTrackingDoc(null); fetchDocuments(); }}
        />
      )}

      <Header
        title="Document Management"
        subtitle={`${total} documents · ${processingCount > 0 ? `${processingCount} processing` : 'All idle'}`}
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            {processingCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.15)', borderRadius: '8px', fontSize: '12px', color: '#60a5fa' }}>
                <Activity size={13} style={{ animation: 'pulse-glow 1.5s infinite' }} />
                {processingCount} processing
              </div>
            )}
            <button onClick={() => router.push('/dashboard/documents/upload')} className="btn-primary" style={{ fontSize: '13px', padding: '8px 14px' }}>
              <Plus size={14} /> Upload Documents
            </button>
          </div>
        }
      />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ── Single Upload Panel ── */}
        {uploadMode === 'single' && (
          <div className="glass-card animate-fade-in" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#f0f4ff' }}>Upload Document</h3>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                  A live processing tracker will appear after upload
                </p>
              </div>
              <button onClick={() => setUploadMode('none')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSingleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Drop zone */}
              <div
                className={`dropzone ${dragOver ? 'active' : ''}`}
                style={{ padding: '36px', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', gap: '12px' }}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => {
                  e.preventDefault(); setDragOver(false);
                  const f = e.dataTransfer.files[0];
                  if (f) { setFile(f); setTitle(f.name.replace(/\.[^/.]+$/, '')); }
                }}
              >
                {file ? (
                  <>
                    <FileText size={36} color="#60a5fa" />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: '#f0f4ff' }}>{file.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{formatSize(file.size)}</div>
                    </div>
                    <button type="button" onClick={e => { e.stopPropagation(); setFile(null); }} className="btn-danger" style={{ fontSize: '12px', padding: '6px 12px' }}>
                      <X size={12} /> Remove
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <UploadCloud size={24} color="#60a5fa" />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: '#f0f4ff' }}>Drop file here or click to browse</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>PDF, DOCX, TXT supported</div>
                    </div>
                  </>
                )}
                <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.doc" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setTitle(f.name.replace(/\.[^/.]+$/, '')); } }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#94a3b8', marginBottom: '8px' }}>Title *</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Document title" required className="input-field" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#94a3b8', marginBottom: '8px' }}>Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="input-field">
                    {['general', 'admissions', 'fees', 'academic', 'hostel', 'rules', 'events', 'faculty'].map(c => (
                      <option key={c} value={c} style={{ background: '#111827' }}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#94a3b8', marginBottom: '8px' }}>Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description…" className="input-field" style={{ minHeight: '80px', resize: 'vertical' }} />
              </div>

              {/* Upload Progress (network transfer) */}
              {uploadProgress !== null && (
                <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(96,165,250,0.05)', border: '1px solid rgba(96,165,250,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Loader2 size={12} color="#60a5fa" style={{ animation: 'spin 1s linear infinite' }} />
                      Uploading file to server…
                    </span>
                    <span style={{ fontWeight: '700', color: '#60a5fa' }}>{uploadProgress}%</span>
                  </div>
                  <div className="progress-bar" style={{ height: '6px' }}>
                    <div className="progress-fill" style={{ width: `${uploadProgress}%`, transition: 'width 0.3s ease' }} />
                  </div>
                  <p style={{ fontSize: '11px', color: '#334155', marginTop: '6px' }}>
                    A live processing tracker will open automatically once done ✨
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" disabled={!file || uploading} className="btn-primary">
                  {uploading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Uploading…</> : <><Upload size={14} /> Upload & Track</>}
                </button>
                <button type="button" onClick={() => setUploadMode('none')} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* ── Batch Upload Panel ── */}
        {uploadMode === 'batch' && (
          <div className="glass-card animate-fade-in" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#f0f4ff' }}>Batch Upload</h3>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Upload up to 10 documents at once</p>
              </div>
              <button onClick={() => { setUploadMode('none'); setBatchFiles([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <div
              className={`dropzone ${dragOver ? 'active' : ''}`}
              style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', gap: '16px', marginBottom: '20px' }}
              onClick={() => batchRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault(); setDragOver(false);
                const files = Array.from(e.dataTransfer.files).slice(0, 10);
                setBatchFiles(prev => [...prev, ...files].slice(0, 10));
              }}
            >
              <FilePlus2 size={40} color="#60a5fa" />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#f0f4ff' }}>Drop multiple files here</div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Up to 10 files • PDF, DOCX, TXT</div>
              </div>
              <input ref={batchRef} type="file" multiple accept=".pdf,.docx,.txt,.doc" style={{ display: 'none' }}
                onChange={e => { const files = Array.from(e.target.files || []).slice(0, 10); setBatchFiles(prev => [...prev, ...files].slice(0, 10)); }} />
            </div>

            {batchFiles.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                {batchFiles.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <FileText size={16} color="#60a5fa" />
                    <span style={{ flex: 1, fontSize: '13px', color: '#94a3b8' }}>{f.name}</span>
                    <span style={{ fontSize: '12px', color: '#475569' }}>{formatSize(f.size)}</span>
                    <button onClick={() => setBatchFiles(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleBatchUpload} disabled={batchFiles.length === 0 || uploading} className="btn-primary">
                {uploading
                  ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Uploading {batchFiles.length} files…</>
                  : <><UploadCloud size={14} /> Upload {batchFiles.length} Files</>}
              </button>
              <button onClick={() => { setUploadMode('none'); setBatchFiles([]); }} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}

        {/* ── Documents Table ── */}
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents…" className="input-field" style={{ paddingLeft: '36px', fontSize: '13px', height: '36px' }} />
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#475569' }}>{filtered.length} of {total} results</span>
              <button onClick={fetchDocuments} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '12px' }}>
                <RefreshCw size={13} />
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Category</th>
                  <th>Status / Progress</th>
                  <th>Size</th>
                  <th>Chunks</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                      {Array(7).fill(0).map((_, j) => (
                        <td key={j}><div className="shimmer" style={{ height: '20px', borderRadius: '4px' }} /></td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: '#475569' }}>
                      <FileText size={36} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
                      No documents found.{' '}
                      <button onClick={() => setUploadMode('single')} style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontWeight: '600' }}>
                        Upload your first document
                      </button>
                    </td>
                  </tr>
                ) : (
                  filtered.map(doc => (
                    <tr key={doc.id} onClick={() => setSelectedDocument(doc)} style={{ cursor: 'pointer' }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <FileText size={14} color="#60a5fa" />
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#f0f4ff', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {doc.title}
                            </div>
                            <div style={{ fontSize: '11px', color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>
                              {doc.id.slice(0, 8)}…
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-purple">{doc.category || 'general'}</span>
                      </td>
                      <td>
                        <StatusBadge status={doc.status} />
                        {/* Inline live progress bar for processing/pending docs */}
                        {(doc.status === 'processing' || doc.status === 'pending') && (
                          <DocProgressBar docId={doc.id} initialStatus={doc.status} />
                        )}
                      </td>
                      <td style={{ fontSize: '12px' }}>{formatSize(doc.file_size)}</td>
                      <td style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: '#60a5fa' }}>
                        {doc.total_chunks || '—'}
                      </td>
                      <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {/* Re-track progress button */}
                          {doc.status !== 'completed' && (
                            <button
                              onClick={() => setTrackingDoc({ id: doc.id, title: doc.title })}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 9px', borderRadius: '7px', border: '1px solid rgba(96,165,250,0.2)', background: 'rgba(96,165,250,0.07)', color: '#60a5fa', fontSize: '11px', cursor: 'pointer' }}
                              title="Track Progress"
                            >
                              <TrendingUp size={11} />
                            </button>
                          )}
                          <button
                            className="btn-danger"
                            style={{ padding: '5px 10px', fontSize: '12px' }}
                            onClick={() => handleDelete(doc.id, doc.title)}
                            disabled={deleting === doc.id}
                          >
                            {deleting === doc.id ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={12} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#475569' }}>Page {page + 1} of {totalPages}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setPage(p => p - 1)} disabled={page === 0} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>
                  <ChevronLeft size={14} /> Prev
                </button>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {selectedDocument && (
        <DocumentDetailModal
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
