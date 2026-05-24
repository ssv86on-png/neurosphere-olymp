'use client';
import React from 'react';
import { AppLayout, Loading, useAuth } from '../../components/index';
import { getLeaderboard, getSolvedTasks } from '../../components/storage';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  if (!user) {
    return (
      <AppLayout title="👤 Профиль" showBack>
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
          Авторизуйся через Telegram, чтобы увидеть профиль
        </div>
      </AppLayout>
    );
  }

  const xpForNext = (user.level || 1) * 1000;
  const currentXp = user.xp % xpForNext;
  const solvedCount = user.tasks_solved || 0;
  const leaderboard = getLeaderboard();
  const rank = leaderboard.findIndex(u => u.telegram_id === user.telegram_id) + 1;
  
  const allAchievements = [
    { code: 'first_solve', title: 'Первое решение', icon: '🌟', desc: 'Решить первую задачу' },
    { code: 'solved_10', title: 'Десятка', icon: '🎯', desc: 'Решить 10 задач' },
    { code: 'solved_50', title: 'Мастер', icon: '🏅', desc: 'Решить 50 задач' },
    { code: 'xp_5000', title: '5000 XP', icon: '💎', desc: 'Накопить 5000 XP' },
  ];

  return (
    <AppLayout title="👤 Профиль" showBack>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, margin: '0 auto 12px',
        }}>👤</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc' }}>
          {user.first_name || user.telegram_name}
        </div>
        <div style={{ fontSize: 13, color: '#94a3b8' }}>
          Уровень {user.level || 1} · {rank > 0 ? `#${rank} в рейтинге` : 'Нет рейтинга'}
        </div>
      </div>

      {/* XP Bar */}
      <div style={{ background: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 14, color: '#fbbf24' }}>⭐ XP</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>{user.xp || 0}</span>
        </div>
        <div style={{ background: '#334155', borderRadius: 8, height: 10, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{
            width: `${(currentXp / xpForNext) * 100}%`, background: '#fbbf24',
            height: '100%', borderRadius: 8, transition: 'width 0.3s',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b' }}>
          <span>🏆 Уровень {user.level}</span>
          <span>🔥 Стрик: {user.streak || 0} дней</span>
          <span>✅ Решено: {solvedCount}</span>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', marginBottom: 12 }}>
        📊 Активность
      </div>
      <div style={{ background: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 16, border: '1px solid #334155' }}>
        <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>
          {solvedCount > 0 
            ? `Решено ${solvedCount} задач · заработано ${user.xp} XP`
            : 'Начни решать задачи, чтобы появилась активность'}
        </div>
      </div>

      {/* Achievements */}
      <div style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', marginBottom: 12 }}>🎖️ Достижения</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {allAchievements.map(a => {
          const unlocked = user.achievements?.includes(a.code);
          return (
            <div key={a.code} style={{
              background: unlocked ? '#1e293b' : '#0f172a',
              borderRadius: 12, padding: 14, textAlign: 'center',
              border: unlocked ? '1px solid #22c55e' : '1px solid #334155',
              opacity: unlocked ? 1 : 0.4,
            }}>
              <div style={{ fontSize: 32, marginBottom: 4 }}>{unlocked ? a.icon : '🔒'}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: unlocked ? '#22c55e' : '#64748b' }}>
                {a.title}
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{a.desc}</div>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
}
