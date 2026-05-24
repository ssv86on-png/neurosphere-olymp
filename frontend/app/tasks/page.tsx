'use client';
import React, { useState, useEffect } from 'react';
import { AppLayout, Loading } from '../components/index';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('all');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const categories = ['all', 'algorithms', 'data-structures', 'strings', 'graphs', 'dp', 'math', 'sql', 
    'python', 'javascript', 'go', 'java', 'web', 'security', 'devops',
    'cpp', 'rust', 'kotlin', 'swift', 'typescript', 'php', 'ruby',
    'ml', 'nlp', 'cv', 'database', 'network', 'os', 'parallel',
    'blockchain', 'game-dev', 'mobile', 'compiler', 'testing', 'design'];

  const difficulties = ['all', 'easy', 'medium', 'hard', 'expert'];

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('limit', '50');
    params.set('offset', String(page * 50));
    if (filter !== 'all') params.set('difficulty', filter);
    if (category !== 'all') params.set('category', category);
    
    fetch(`${API}/api/tasks?${params}`)
      .then(r => r.json())
      .then(data => {
        setTasks(data.tasks || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filter, category, page]);

  return (
    <AppLayout title="📚 Задачи" showBack>
      {/* Category Pills */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 8, overflowX: 'auto',
        paddingBottom: 8, flexWrap: 'wrap',
      }}>
        {categories.slice(0, 8).map(c => (
          <button key={c} onClick={() => { setCategory(c); setPage(0); }} style={{
            padding: '4px 12px', borderRadius: 16, border: 'none',
            background: category === c ? '#3b82f6' : '#334155',
            color: '#fff', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap',
          }}>{c === 'all' ? 'Все' : c}</button>
        ))}
      </div>

      {/* Difficulty Pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {difficulties.map(d => (
          <button key={d} onClick={() => { setFilter(d); setPage(0); }} style={{
            padding: '6px 16px', borderRadius: 20, border: 'none',
            background: filter === d ? '#3b82f6' : '#334155',
            color: '#fff', fontSize: 13, cursor: 'pointer',
          }}>{d === 'all' ? 'Все уровни' : d}</button>
        ))}
      </div>

      {loading ? <Loading /> : (
        <>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>
            📚 {total} задач · показано {tasks.length}
          </div>
          
          {tasks.map(t => (
            <TaskItem key={t.id} task={t} />
          ))}

          {tasks.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
              Нет задач с такими фильтрами
            </div>
          )}

          {/* Pagination */}
          {total > 50 && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{
                padding: '8px 20px', borderRadius: 8, border: 'none',
                background: page === 0 ? '#334155' : '#3b82f6',
                color: '#fff', cursor: page === 0 ? 'not-allowed' : 'pointer',
              }}>← Назад</button>
              <span style={{ padding: '8px', color: '#94a3b8' }}>
                {page + 1} / {Math.ceil(total / 50)}
              </span>
              <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * 50 >= total} style={{
                padding: '8px 20px', borderRadius: 8, border: 'none',
                background: (page + 1) * 50 >= total ? '#334155' : '#3b82f6',
                color: '#fff', cursor: (page + 1) * 50 >= total ? 'not-allowed' : 'pointer',
              }}>Далее →</button>
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}

function TaskItem({ task }) {
  const colors = { easy: '#22c55e', medium: '#eab308', hard: '#ef4444', expert: '#a855f7' };
  return (
    <a href={`/solve?id=${task.id}`} style={{
      display: 'block', textDecoration: 'none',
    }}>
    <div style={{
      background: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 8,
      border: '1px solid #334155',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc' }}>
          #{task.id} {task.title}
        </span>
        <span style={{
          background: colors[task.difficulty] || '#64748b',
          color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 11,
        }}>{task.difficulty}</span>
      </div>
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
        {task.description}
      </div>
      <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#64748b' }}>
        <span>📂 {task.category}</span>
        <span>⭐ +{task.xp_reward} XP</span>
        <span>{task.source}</span>
      </div>
    </div>
    </a>
  );
}
