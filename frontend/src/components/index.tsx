'use client';
import React, { useState, useEffect, createContext, useContext } from 'react';
import { getData, setData, addUser, getUser, addXp, addSubmission, getSolvedTasks, getLeaderboard, checkAchievements } from './storage';

export { getData, setData, addUser, getUser, addXp, addSubmission, getSolvedTasks, getLeaderboard, checkAchievements };
export { registerForOlympiad, getOlympiadParticipants } from './storage';

const API = process.env.NEXT_PUBLIC_API_URL || '';

// ===== AUTH =====
export const AuthContext = createContext(null);
export function useAuth() { return useContext(AuthContext); }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      const initData = tg.initDataUnsafe?.user;
      if (initData) {
        let u = getUser(initData.id);
        if (!u) {
          u = addUser({
            telegram_id: initData.id,
            telegram_name: initData.username || `${initData.first_name} ${initData.last_name || ''}`.trim(),
            first_name: initData.first_name,
            last_name: initData.last_name,
            username: initData.username,
          });
        }
        setUser(u);
      }
    }
    setLoading(false);
  }, []);

  const refreshUser = () => {
    if (user) {
      setUser({ ...getUser(user.telegram_id) });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// ===== LAYOUT =====
export function AppLayout({ children, title, showBack = false }) {
  const { user } = useAuth();
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
            <span style={{ color: '#3b82f6', fontSize: 12 }}>Lv.{user.level || 1}</span>
          </div>
        )}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
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
            opacity: typeof window !== 'undefined' && window.location.pathname === tab.href ? 1 : 0.6,
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
export function TaskCard({ task, onClick, solved }) {
  const colors = { easy: '#22c55e', medium: '#eab308', hard: '#ef4444', expert: '#a855f7' };
  return (
    <div onClick={onClick} style={{
      background: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 8,
      border: solved ? '1px solid #22c55e' : '1px solid #334155',
      cursor: 'pointer',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: solved ? '#22c55e' : '#f8fafc' }}>
          {solved ? '✅ ' : ''}#{task.id} {task.title}
        </span>
        <span style={{ background: colors[task.difficulty] || '#64748b', color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 11 }}>{task.difficulty}</span>
      </div>
      <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#64748b' }}>
        <span>📂 {task.category}</span>
        <span>⭐ +{task.xp_reward}</span>
      </div>
    </div>
  );
}

export function OlympiadCard({ olympiad, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: 'linear-gradient(135deg, #312e81, #1e1b4b)', borderRadius: 16,
      padding: 20, marginBottom: 12, cursor: 'pointer', border: '1px solid #4338ca',
    }}>
      <div style={{ fontSize: 14, color: '#a5b4fc', marginBottom: 4 }}>
        {olympiad.status === 'active' ? '🟢 Активна' : '⚪ Скоро'}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>🏆 {olympiad.title}</div>
      <div style={{ fontSize: 13, color: '#c7d2fe', marginBottom: 12 }}>{olympiad.description}</div>
      <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#a5b4fc' }}>
        <span>📝 {olympiad.taskIds?.length || 0} задач</span>
        <span>👥 {olympiad.participants || 0} участников</span>
      </div>
    </div>
  );
}

export function StatBar({ label, value, color = '#3b82f6', max = 100 }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600 }}>{value}{max > 0 ? `/${max}` : ''}</span>
      </div>
      <div style={{ background: '#334155', borderRadius: 6, height: 6, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: 6 }} />
      </div>
    </div>
  );
}

export function Loading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #334155', borderTopColor: '#3b82f6', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
