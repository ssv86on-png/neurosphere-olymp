'use client';
import React, { useState, useEffect } from 'react';
import { AppLayout, TaskCard, OlympiadCard, StatBar, Loading, useAuth } from '../components/index';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://neurosphere-olymp-api.vercel.app';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [olympiads, setOlympiads] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [tasksRes, olympRes] = await Promise.all([
          fetch(`${API}/api/tasks?limit=3`),
          fetch(`${API}/api/olympiads`),
        ]);
        if (tasksRes.ok) setRecentTasks(await tasksRes.json());
        if (olympRes.ok) {
          const data = await olympRes.json();
          setOlympiads(data.slice(0, 2));
        }
      } catch (e) {
        setError('Не удалось загрузить данные');
      }
    }
    load();
  }, []);

  if (loading) return <AppLayout><Loading /></AppLayout>;

  return (
    <AppLayout title="🏆 НейроСфера">
      {/* Welcome */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f, #1e293b)',
        borderRadius: 16, padding: 24, marginBottom: 16,
        border: '1px solid #334155',
      }}>
        {user ? (
          <>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>
              Привет, {user.first_name || user.telegram_name}!
            </div>
            <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 16 }}>
              Продолжай решать задачи и подниматься в рейтинге
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#fbbf24' }}>{user.xp || 0}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>XP</div>
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#3b82f6' }}>{user.level || 1}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Уровень</div>
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#22c55e' }}>{user.tasks_solved || 0}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Решено</div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>
              🏆 НейроСфера — Олимпиады
            </div>
            <div style={{ fontSize: 14, color: '#94a3b8' }}>
              926 задач · 34 направления · AI-тьютор
            </div>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <ActionButton href="/tasks" icon="📚" label="Задачи" color="#3b82f6" />
        <ActionButton href="/olympiads" icon="🏆" label="Олимпиады" color="#8b5cf6" />
        <ActionButton href="/tutor" icon="🤖" label="AI-тьютор" color="#06b6d4" />
        <ActionButton href="/leaderboard" icon="🥇" label="Рейтинг" color="#f59e0b" />
      </div>

      {/* Active Olympiads */}
      {olympiads.length > 0 && (
        <>
          <SectionTitle>🏆 Активные олимпиады</SectionTitle>
          {olympiads.map(o => (
            <OlympiadCard key={o.id} olympiad={o} onClick={() => window.location.href = `/olympiads`} />
          ))}
        </>
      )}

      {/* Recent Tasks */}
      {recentTasks.length > 0 && (
        <>
          <SectionTitle>📚 Новые задачи</SectionTitle>
          {recentTasks.map(t => (
            <TaskCard key={t.id} task={t} onClick={() => window.location.href = `/tasks?id=${t.id}`} />
          ))}
        </>
      )}

      {error && (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
          {error}
        </div>
      )}
    </AppLayout>
  );
}

function ActionButton({ href, icon, label, color }) {
  return (
    <a href={href} style={{
      flex: 1, textDecoration: 'none', textAlign: 'center',
      background: '#1e293b', borderRadius: 12, padding: '12px 8px',
      border: `1px solid ${color}33`,
    }}>
      <div style={{ fontSize: 28, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 11, color: '#94a3b8' }}>{label}</div>
    </a>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', marginBottom: 12, marginTop: 8 }}>
      {children}
    </div>
  );
}
