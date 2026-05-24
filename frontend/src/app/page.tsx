'use client';
import React, { useState, useEffect } from 'react';
import { AppLayout, Loading, useAuth } from '../components/index';
import TaskCard from '../components/index';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [taskStats, setTaskStats] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/tasks?limit=1`)
      .then(r => r.json())
      .then(data => setTaskStats({ total: data.total }))
      .catch(() => {});
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
            <div style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>
              Привет, {user.first_name || user.telegram_name}! 👋
            </div>
            <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 16 }}>
              Решай задачи, участвуй в олимпиадах и поднимайся в рейтинге
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
              {taskStats ? `${taskStats.total} задач` : ''} · 34 направления · AI-тьютор
            </div>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <QuickBtn href="/tasks" icon="📚" label="Задачи" sub={`${taskStats?.total || 926} шт`} color="#3b82f6" />
        <QuickBtn href="/olympiads" icon="🏆" label="Олимпиады" sub="6 турниров" color="#8b5cf6" />
        <QuickBtn href="/tutor" icon="🤖" label="AI-тьютор" sub="7 режимов" color="#06b6d4" />
        <QuickBtn href="/leaderboard" icon="🥇" label="Рейтинг" sub="Топ участников" color="#f59e0b" />
      </div>

      {/* Info Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <a href="/tasks" style={{
          textDecoration: 'none', background: '#1e293b', borderRadius: 12,
          padding: 16, border: '1px solid #334155',
        }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📚</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', marginBottom: 4 }}>
            {taskStats?.total || 926} задач
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>34 категории</div>
        </a>
        <a href="/olympiads" style={{
          textDecoration: 'none', background: '#1e293b', borderRadius: 12,
          padding: 16, border: '1px solid #334155',
        }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🏆</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', marginBottom: 4 }}>
            6 олимпиад
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Соревнуйся с другими</div>
        </a>
        <a href="/tutor" style={{
          textDecoration: 'none', background: '#1e293b', borderRadius: 12,
          padding: 16, border: '1px solid #334155',
        }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🤖</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', marginBottom: 4 }}>
            AI-тьютор
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>7 режимов обучения</div>
        </a>
        <a href="/leaderboard" style={{
          textDecoration: 'none', background: '#1e293b', borderRadius: 12,
          padding: 16, border: '1px solid #334155',
        }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🥇</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', marginBottom: 4 }}>
            Рейтинг
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Кто решил больше всех</div>
        </a>
      </div>
    </AppLayout>
  );
}

function QuickBtn({ href, icon, label, sub, color }) {
  return (
    <a href={href} style={{
      flex: 1, textDecoration: 'none', textAlign: 'center',
      background: '#1e293b', borderRadius: 12, padding: '12px 6px',
      border: `1px solid ${color}33`,
    }}>
      <div style={{ fontSize: 26, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#f8fafc' }}>{label}</div>
      <div style={{ fontSize: 10, color: '#64748b' }}>{sub}</div>
    </a>
  );
}
