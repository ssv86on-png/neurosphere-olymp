'use client';
import React, { useState, useEffect } from 'react';
import { AppLayout, Loading } from '../components/index';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://neurosphere-olymp-api.vercel.app';

export default function LeaderboardPage() {
  const [users, setUsers] = useState([]);
  const [period, setPeriod] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/leaderboard?limit=50${period !== 'all' ? '&period=' + period : ''}`)
      .then(r => r.json())
      .then(data => { setUsers(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };

  return (
    <AppLayout title="🥇 Рейтинг" showBack>
      {/* Period Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { id: 'all', label: 'За всё время' },
          { id: 'weekly', label: 'Неделя' },
          { id: 'monthly', label: 'Месяц' },
        ].map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)} style={{
            flex: 1, padding: '8px 16px', borderRadius: 8, border: 'none',
            background: period === p.id ? '#3b82f6' : '#334155',
            color: '#fff', fontSize: 13, cursor: 'pointer',
          }}>{p.label}</button>
        ))}
      </div>

      {loading ? <Loading /> : (
        <>
          {users.map((u, i) => (
            <div key={u.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', marginBottom: 6,
              background: i < 3 ? '#1e293b' : 'transparent',
              borderRadius: 12,
              border: i < 3 ? `1px solid ${['#f59e0b', '#94a3b8', '#d97706'][i]}33` : '1px solid transparent',
            }}>
              <div style={{ fontSize: 22, width: 36, textAlign: 'center' }}>
                {medals[i + 1] || `#${i + 1}`}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc' }}>
                  {u.telegram_name || u.first_name || 'Аноним'}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  Уровень {u.level || 1} · {u.tasks_solved || 0} задач
                </div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fbbf24' }}>
                {u.xp || u.weekly_xp || 0}
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
              Рейтинг пуст. Будь первым!
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}
