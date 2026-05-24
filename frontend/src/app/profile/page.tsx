'use client';
import React, { useState, useEffect } from 'react';
import { AppLayout, StatBar, Loading, useAuth } from '../../components/index';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://neurosphere-olymp-api.vercel.app';

export default function ProfilePage() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetch(`${API}/api/achievements`)
      .then(r => r.json())
      .then(data => { setAchievements(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

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
  const currentXp = user.xp || 0;

  return (
    <AppLayout title="👤 Профиль" showBack>
      {/* Avatar & Name */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, margin: '0 auto 12px',
        }}>👤</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc' }}>
          {user.first_name || user.telegram_name}
        </div>
        <div style={{ fontSize: 13, color: '#94a3b8' }}>Уровень {user.level || 1}</div>
      </div>

      {/* Stats */}
      <div style={{ background: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <StatBar label="XP до следующего уровня" value={currentXp % xpForNext} max={xpForNext} color="#fbbf24" />
        <StatBar label="Решено задач" value={user.tasks_solved || 0} max={100} color="#22c55e" />
        <StatBar label="Серия дней" value={user.streak || 0} max={30} color="#f97316" />
      </div>

      {/* Achievements */}
      <div style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', marginBottom: 12 }}>🎖️ Достижения</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {achievements.map(a => (
          <div key={a.id} style={{
            background: '#1e293b', borderRadius: 12, padding: 12, textAlign: 'center',
            border: '1px solid #334155',
          }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>{a.icon}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>{a.title}</div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
