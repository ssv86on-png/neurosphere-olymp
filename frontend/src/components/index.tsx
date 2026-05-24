'use client';
import React, { useState, useEffect, createContext, useContext } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://neurosphere-olymp-api.vercel.app';

// ===== AUTH CONTEXT =====
const AuthContext = createContext(null);
export function useAuth() { return useContext(AuthContext); }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to restore from Telegram WebApp
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      const initData = tg.initDataUnsafe?.user;
      if (initData) {
        loginWithTelegram(initData);
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  async function loginWithTelegram(tgUser) {
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: tgUser.id,
          telegram_name: tgUser.username || `${tgUser.first_name} ${tgUser.last_name || ''}`.trim(),
          first_name: tgUser.first_name,
          last_name: tgUser.last_name,
          username: tgUser.username,
        }),
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
      }
    } catch (e) {
      console.error('Auth error:', e);
    }
    setLoading(false);
  }

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// ===== LAYOUT =====
export function AppLayout({ children, title, showBack = false }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('home');

  const tabs = [
    { id: 'home', label: 'Главная', icon: '🏠', href: '/' },
    { id: 'tasks', label: 'Задачи', icon: '📚', href: '/tasks' },
    { id: 'olympiads', label: 'Олимп', icon: '🏆', href: '/olympiads' },
    { id: 'leaderboard', label: 'Топ', icon: '🥇', href: '/leaderboard' },
    { id: 'profile', label: 'Профиль', icon: '👤', href: '/profile' },
  ];

  return (
    <div style={{
      maxWidth: 480, margin: '0 auto', minHeight: '100dvh',
      background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
      color: '#e2e8f0', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      paddingBottom: 80, position: 'relative',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px', display: 'flex', alignItems: 'center',
        justifyContent: showBack ? 'space-between' : 'center',
        borderBottom: '1px solid #334155',
      }}>
        {showBack && (
          <button onClick={() => window.history.back()} style={{
            background: '#334155', border: 'none', color: '#e2e8f0',
            borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 16,
          }}>← Назад</button>
        )}
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#f8fafc' }}>{title || 'НейроСфера'}</h1>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
            <span style={{ color: '#fbbf24' }}>⭐</span>
            <span style={{ fontWeight: 600 }}>{user.xp || 0}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: 16 }}>{children}</div>

      {/* Bottom Tabs */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        maxWidth: 480, width: '100%',
        background: '#1e293b', borderTop: '1px solid #334155',
        display: 'flex', justifyContent: 'space-around',
        padding: '8px 0', paddingBottom: 16, zIndex: 100,
      }}>
        {tabs.map(tab => (
          <a key={tab.id} href={tab.href} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 2, textDecoration: 'none', color: '#94a3b8', fontSize: 11,
            opacity: typeof window !== 'undefined' && window.location.pathname.startsWith(tab.href) ? 1 : 0.6,
          }}>
            <span style={{ fontSize: 22 }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

// ===== COMPONENTS =====

export function TaskCard({ task, onClick }) {
  const colors = { easy: '#22c55e', medium: '#eab308', hard: '#ef4444', expert: '#a855f7' };
  return (
    <div onClick={onClick} style={{
      background: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 10,
      border: '1px solid #334155', cursor: 'pointer',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc' }}>{task.title}</span>
        <span style={{
          background: colors[task.difficulty] || '#64748b',
          color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 11,
        }}>{task.difficulty}</span>
      </div>
      <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#94a3b8' }}>
        <span>📂 {task.category}</span>
        <span>⭐ +{task.xp_reward}</span>
      </div>
    </div>
  );
}

export function OlympiadCard({ olympiad, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: 'linear-gradient(135deg, #312e81, #1e1b4b)',
      borderRadius: 16, padding: 20, marginBottom: 12, cursor: 'pointer',
      border: '1px solid #4338ca',
    }}>
      <div style={{ fontSize: 14, color: '#a5b4fc', marginBottom: 4 }}>
        {olympiad.status === 'active' ? '🟢 Активна' : olympiad.status}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>
        🏆 {olympiad.title}
      </div>
      <div style={{ fontSize: 13, color: '#c7d2fe', marginBottom: 12 }}>
        {olympiad.description}
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#a5b4fc' }}>
        <span>📝 {olympiad.task_count} задач</span>
        <span>👥 {olympiad.participants || 0} участников</span>
      </div>
    </div>
  );
}

export function StatBar({ label, value, color = '#3b82f6', max = 100 }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 14 }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600 }}>{value}</span>
      </div>
      <div style={{ background: '#334155', borderRadius: 8, height: 8, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: 8, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

export function Loading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '3px solid #334155', borderTopColor: '#3b82f6',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
