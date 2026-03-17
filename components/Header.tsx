'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Bell, Search, RefreshCw } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      padding: '20px 28px',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'rgba(13,20,36,0.8)',
      backdropFilter: 'blur(20px)',
      position: 'sticky',
      top: 0,
      zIndex: 5,
    }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.02em', color: '#f0f4ff' }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>{subtitle}</p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {actions}

        {/* Time display */}
        <div style={{
          fontSize: '13px', fontWeight: '600', color: '#475569',
          padding: '6px 12px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '8px',
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          {time}
        </div>

        {/* Notification bell */}
        <button style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#64748b', position: 'relative',
          transition: 'all 0.2s ease',
        }}>
          <Bell size={16} />
          <div style={{
            position: 'absolute', top: '8px', right: '8px',
            width: '6px', height: '6px', borderRadius: '50%',
            background: '#60a5fa',
          }} />
        </button>
      </div>
    </div>
  );
}
