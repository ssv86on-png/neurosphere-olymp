'use client';
import React, { useState, useEffect } from 'react';
import { AppLayout, TaskCard, Loading, useAuth } from '../../components/index';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://neurosphere-olymp-api.vercel.app';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/tasks?limit=50`)
      .then(r => r.json())
      .then(data => { setTasks(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.difficulty === filter);
  const difficulties = ['all', 'easy', 'medium', 'hard', 'expert'];

  return (
    <AppLayout title="📚 Задачи" showBack>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 8 }}>
        {difficulties.map(d => (
          <button key={d} onClick={() => setFilter(d)} style={{
            padding: '6px 16px', borderRadius: 20, border: 'none',
            background: filter === d ? '#3b82f6' : '#334155',
            color: '#fff', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
          }}>{d === 'all' ? 'Все' : d}</button>
        ))}
      </div>

      {loading ? <Loading /> : (
        <>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>
            Найдено {filtered.length} задач
          </div>
          {filtered.map(t => (
            <TaskCard key={t.id} task={t} onClick={() => window.location.href = `/tasks?id=${t.id}`} />
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
              Нет задач с таким уровнем сложности
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}
