'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { toast } from 'react-toastify';
import {
  Settings, Server, Database, Cpu, Shield, Globe,
  Save, RefreshCw, AlertTriangle, CheckCircle, Info,
  ChevronRight, Cloud, Zap, HardDrive,
} from 'lucide-react';

interface SettingSection {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
}

const sections: SettingSection[] = [
  { id: 'general', label: 'General', icon: Settings, color: '#60a5fa' },
  { id: 'ai', label: 'AI Models', icon: Zap, color: '#a78bfa' },
  { id: 'storage', label: 'Storage', icon: HardDrive, color: '#34d399' },
  { id: 'security', label: 'Security', icon: Shield, color: '#fb923c' },
  { id: 'system', label: 'System Info', icon: Server, color: '#22d3ee' },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('general');
  const [saving, setSaving] = useState(false);

  const [generalSettings, setGeneralSettings] = useState({
    appName: 'CampusGPT',
    appVersion: '2.0.0',
    maxUploadSizeMb: 50,
    allowedFileTypes: '.pdf,.docx,.txt,.doc',
    maxConcurrentUploads: 3,
    paginationLimit: 20,
  });

  const [aiSettings, setAiSettings] = useState({
    primaryModel: 'gpt-4-turbo',
    fallbackModel: 'gpt-3.5-turbo',
    maxTokens: 2000,
    temperature: 0.7,
    confidenceThreshold: 60,
    streamingEnabled: true,
    cacheEnabled: true,
    cacheTtlSeconds: 3600,
  });

  const [systemInfo] = useState({
    nodeVersion: '18.x',
    nextVersion: '14.x',
    platform: 'Windows',
    uptime: '99.8%',
    lastDeployment: '2026-03-17',
    apiVersion: 'v2',
    backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000',
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    toast.success('Settings saved successfully! ✨');
  };

  const renderGeneral = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {[
          { label: 'Application Name', key: 'appName' as const, type: 'text' },
          { label: 'App Version', key: 'appVersion' as const, type: 'text' },
          { label: 'Max Upload Size (MB)', key: 'maxUploadSizeMb' as const, type: 'number' },
          { label: 'Max Concurrent Uploads', key: 'maxConcurrentUploads' as const, type: 'number' },
        ].map(field => (
          <div key={field.key}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#94a3b8', marginBottom: '8px' }}>
              {field.label}
            </label>
            <input
              type={field.type}
              value={generalSettings[field.key]}
              onChange={(e) => setGeneralSettings(prev => ({ ...prev, [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value }))}
              className="input-field"
            />
          </div>
        ))}
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#94a3b8', marginBottom: '8px' }}>
          Allowed File Types
        </label>
        <input value={generalSettings.allowedFileTypes}
          onChange={(e) => setGeneralSettings(prev => ({ ...prev, allowedFileTypes: e.target.value }))}
          className="input-field" placeholder=".pdf,.docx,.txt" />
        <p style={{ fontSize: '11px', color: '#475569', marginTop: '6px' }}>Comma-separated file extensions</p>
      </div>

      <div style={{ padding: '16px', background: 'rgba(96,165,250,0.05)', border: '1px solid rgba(96,165,250,0.1)', borderRadius: '10px', display: 'flex', gap: '10px' }}>
        <Info size={16} color="#60a5fa" style={{ flexShrink: 0, marginTop: '1px' }} />
        <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6' }}>
          These settings affect document upload restrictions. Changes take effect immediately after saving.
        </p>
      </div>
    </div>
  );

  const renderAI = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#94a3b8', marginBottom: '8px' }}>Primary LLM Model</label>
          <select value={aiSettings.primaryModel}
            onChange={(e) => setAiSettings(prev => ({ ...prev, primaryModel: e.target.value }))}
            className="input-field">
            {['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'claude-3-opus', 'gemini-pro'].map(m => (
              <option key={m} value={m} style={{ background: '#111827' }}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#94a3b8', marginBottom: '8px' }}>Fallback Model</label>
          <select value={aiSettings.fallbackModel}
            onChange={(e) => setAiSettings(prev => ({ ...prev, fallbackModel: e.target.value }))}
            className="input-field">
            {['gpt-3.5-turbo', 'gpt-4', 'gemini-flash'].map(m => (
              <option key={m} value={m} style={{ background: '#111827' }}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#94a3b8', marginBottom: '8px' }}>Max Tokens</label>
          <input type="number" value={aiSettings.maxTokens}
            onChange={(e) => setAiSettings(prev => ({ ...prev, maxTokens: Number(e.target.value) }))}
            className="input-field" />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#94a3b8', marginBottom: '8px' }}>
            Temperature: {aiSettings.temperature}
          </label>
          <input type="range" min="0" max="1" step="0.1" value={aiSettings.temperature}
            onChange={(e) => setAiSettings(prev => ({ ...prev, temperature: Number(e.target.value) }))}
            style={{ width: '100%', accentColor: '#60a5fa', height: '36px' }} />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#94a3b8', marginBottom: '8px' }}>
          Confidence Threshold: {aiSettings.confidenceThreshold}%
        </label>
        <input type="range" min="0" max="100" step="5" value={aiSettings.confidenceThreshold}
          onChange={(e) => setAiSettings(prev => ({ ...prev, confidenceThreshold: Number(e.target.value) }))}
          style={{ width: '100%', accentColor: '#60a5fa', height: '36px' }} />
        <p style={{ fontSize: '11px', color: '#475569', marginTop: '6px' }}>Responses below this threshold will display a low-confidence warning</p>
      </div>

      {/* Toggle settings */}
      {[
        { key: 'streamingEnabled' as const, label: 'Enable Streaming Responses', desc: 'Stream AI responses in real-time', color: '#60a5fa' },
        { key: 'cacheEnabled' as const, label: 'Enable Response Cache', desc: 'Cache frequent answers for faster responses', color: '#34d399' },
      ].map(toggle => (
        <div key={toggle.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#f0f4ff' }}>{toggle.label}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{toggle.desc}</div>
          </div>
          <button
            onClick={() => setAiSettings(prev => ({ ...prev, [toggle.key]: !prev[toggle.key] }))}
            style={{
              width: '48px', height: '26px', borderRadius: '999px', border: 'none', cursor: 'pointer',
              background: aiSettings[toggle.key] ? toggle.color : 'rgba(255,255,255,0.1)',
              transition: 'all 0.2s ease', position: 'relative',
            }}
          >
            <div style={{
              width: '20px', height: '20px', borderRadius: '50%', background: 'white',
              position: 'absolute', top: '3px',
              left: aiSettings[toggle.key] ? '24px' : '4px',
              transition: 'left 0.2s ease',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }} />
          </button>
        </div>
      ))}
    </div>
  );

  const renderSystem = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {Object.entries(systemInfo).map(([key, value]) => (
        <div key={key} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 16px', background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px',
        }}>
          <span style={{ fontSize: '13px', color: '#64748b', textTransform: 'capitalize' }}>
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </span>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#f0f4ff', fontFamily: 'JetBrains Mono, monospace' }}>
            {value}
          </span>
        </div>
      ))}

      <div style={{ padding: '16px', background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.1)', borderRadius: '10px', display: 'flex', gap: '10px', marginTop: '8px' }}>
        <CheckCircle size={16} color="#34d399" style={{ flexShrink: 0, marginTop: '1px' }} />
        <div>
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#34d399', marginBottom: '4px' }}>All Systems Operational</p>
          <p style={{ fontSize: '12px', color: '#64748b' }}>All services are running normally. Last checked just now.</p>
        </div>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {[
        { label: 'JWT Token Expiry', value: '24 hours' },
        { label: 'Max Login Attempts', value: '5 per hour' },
        { label: 'CORS Origins', value: 'localhost:3000' },
        { label: 'Rate Limiting', value: '100 req/min' },
      ].map((item, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px' }}>
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>{item.label}</span>
          <span className="badge badge-info" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{item.value}</span>
        </div>
      ))}
      <div style={{ padding: '16px', background: 'rgba(251,146,60,0.05)', border: '1px solid rgba(251,146,60,0.1)', borderRadius: '10px', display: 'flex', gap: '10px' }}>
        <AlertTriangle size={16} color="#fb923c" style={{ flexShrink: 0, marginTop: '1px' }} />
        <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6' }}>
          Security settings are managed by your backend configuration. Changes here are for display only. Edit your backend <code style={{ color: '#fb923c' }}>.env</code> for real changes.
        </p>
      </div>
    </div>
  );

  const renderStorage = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {[
        { label: 'Storage Provider', value: 'Supabase Storage', color: '#60a5fa' },
        { label: 'Vector Database', value: 'pgvector', color: '#a78bfa' },
        { label: 'Cache Backend', value: 'Redis', color: '#34d399' },
        { label: 'Database', value: 'PostgreSQL', color: '#fb923c' },
      ].map((item, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>{item.label}</span>
          </div>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#f0f4ff' }}>{item.value}</span>
        </div>
      ))}
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'general': return renderGeneral();
      case 'ai': return renderAI();
      case 'system': return renderSystem();
      case 'security': return renderSecurity();
      case 'storage': return renderStorage();
      default: return null;
    }
  };

  return (
    <div>
      <Header title="Settings" subtitle="Configure your CampusGPT system" />

      <div style={{ padding: '28px', display: 'flex', gap: '20px', minHeight: 'calc(100vh - 72px)' }}>
        {/* Left sidebar */}
        <div className="glass-card" style={{ width: '220px', flexShrink: 0, padding: '12px', alignSelf: 'flex-start' }}>
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                padding: '10px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: activeSection === s.id ? `${s.color}12` : 'transparent',
                color: activeSection === s.id ? s.color : '#64748b',
                marginBottom: '2px', transition: 'all 0.2s ease', textAlign: 'left',
              }}
            >
              <s.icon size={16} />
              <span style={{ fontSize: '13px', fontWeight: '600', flex: 1 }}>{s.label}</span>
              {activeSection === s.id && <ChevronRight size={14} />}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="glass-card animate-fade-in" style={{ padding: '28px' }}>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#f0f4ff', marginBottom: '4px' }}>
                {sections.find(s => s.id === activeSection)?.label} Settings
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b' }}>
                Configure your {sections.find(s => s.id === activeSection)?.label.toLowerCase()} preferences
              </p>
            </div>

            {renderContent()}

            {activeSection !== 'system' && (
              <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '12px' }}>
                <button onClick={handleSave} disabled={saving} className="btn-primary">
                  {saving ? <>
                    <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Saving...
                  </> : <>
                    <Save size={14} /> Save Changes
                  </>}
                </button>
                <button className="btn-secondary">
                  <RefreshCw size={14} /> Reset to Default
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
