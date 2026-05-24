'use client';
import React, { useState, useEffect } from 'react';
import { AppLayout, Loading, useAuth } from '../../components/index';
import { registerForOlympiad, getOlympiadParticipants, getSolvedTasks } from '../../components/storage';

const API = process.env.NEXT_PUBLIC_API_URL || '';

const OLYMPIADS = [
  {
    id: 1, title: 'Алгоритмическое многоборье',
    description: '5 задач по алгоритмам. Сортировка, поиск, графы, ДП, строки.',
    status: 'active', difficulty: 'mixed', category: 'algorithms',
    taskIds: [1, 2, 3, 4, 5], duration: 120,
    startDate: '2026-05-20T10:00:00Z', endDate: '2026-06-20T10:00:00Z',
  },
  {
    id: 2, title: 'Python-мастер',
    description: '4 задачи по Python: декораторы, генераторы, асинхронность, тестирование.',
    status: 'active', difficulty: 'medium', category: 'python',
    taskIds: [29, 30, 31, 32], duration: 90,
    startDate: '2026-05-22T10:00:00Z', endDate: '2026-06-22T10:00:00Z',
  },
  {
    id: 3, title: 'Структуры данных',
    description: '5 задач: стек, дерево, хеш-таблица, граф, куча.',
    status: 'active', difficulty: 'hard', category: 'data-structures',
    taskIds: [9, 11, 13, 15, 17], duration: 150,
    startDate: '2026-05-25T10:00:00Z', endDate: '2026-06-25T10:00:00Z',
  },
  {
    id: 4, title: 'SQL Battle',
    description: '3 задачи по SQL: JOIN, подзапросы, оконные функции.',
    status: 'draft', difficulty: 'medium', category: 'sql',
    taskIds: [33, 34, 35], duration: 60,
    startDate: '2026-06-01T10:00:00Z', endDate: '2026-07-01T10:00:00Z',
  },
  {
    id: 5, title: 'Web-разработка',
    description: '4 задачи: HTML/CSS, REST API, WebSocket, безопасность.',
    status: 'draft', difficulty: 'medium', category: 'web',
    taskIds: [17, 18, 19, 20], duration: 120,
    startDate: '2026-06-05T10:00:00Z', endDate: '2026-07-05T10:00:00Z',
  },
  {
    id: 6, title: 'Гранд-финал «НейроСфера»',
    description: '10 задач по всем направлениям. Победитель получает special achievement!',
    status: 'draft', difficulty: 'expert', category: 'mixed',
    taskIds: [1, 9, 21, 25, 33, 41, 45, 49, 53, 57], duration: 240,
    startDate: '2026-06-15T10:00:00Z', endDate: '2026-07-15T10:00:00Z',
  },
];

export default function OlympiadsPage() {
  const { user, refreshUser } = useAuth();
  const [olympiads, setOlympiads] = useState(OLYMPIADS);
  const [selected, setSelected] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [solvedTasks, setSolvedTasks] = useState(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      setOlympiads(prev => prev.map(o => ({
        ...o,
        participants: getOlympiadParticipants(o.id),
      })));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user) {
      setSolvedTasks(new Set(getSolvedTasks(user.telegram_id)));
    }
  }, [user]);

  useEffect(() => {
    if (!selected) return;
    const updateTimer = () => {
      const end = new Date(selected.endDate).getTime();
      const now = Date.now();
      const diff = end - now;
      if (diff <= 0) { setTimeLeft('Завершена'); return; }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${days}д ${hours}ч ${mins}м`);
    };
    updateTimer();
    const timer = setInterval(updateTimer, 60000);
    return () => clearInterval(timer);
  }, [selected]);

  function handleRegister(olympiad) {
    if (user) {
      registerForOlympiad(user.telegram_id, olympiad.id);
      refreshUser();
      setOlympiads(prev => prev.map(o => 
        o.id === olympiad.id ? { ...o, participants: getOlympiadParticipants(o.id) } : o
      ));
      setSelected(olympiad);
    }
  }

  if (selected) {
    const solvedInOlymp = selected.taskIds.filter(id => solvedTasks.has(id)).length;
    
    return (
      <AppLayout title={`🏆 ${selected.title}`} showBack>
        <div style={{ marginBottom: 16 }}>
          <button onClick={() => setSelected(null)} style={{
            background: '#334155', border: 'none', color: '#94a3b8',
            padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
          }}>← К списку олимпиад</button>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #312e81, #1e1b4b)', borderRadius: 16,
          padding: 20, marginBottom: 16, border: '1px solid #4338ca',
        }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>
            {selected.title}
          </div>
          <div style={{ fontSize: 14, color: '#c7d2fe', marginBottom: 12 }}>
            {selected.description}
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#a5b4fc' }}>
            <span>⏱ {selected.duration} мин</span>
            <span>📝 {selected.taskIds.length} задач</span>
            <span>👥 {selected.participants || 0} участников</span>
          </div>
          {timeLeft && (
            <div style={{ marginTop: 8, fontSize: 14, color: '#fbbf24', fontWeight: 600 }}>
              ⏳ Осталось: {timeLeft}
            </div>
          )}
        </div>

        {/* Tasks in Olympiad */}
        <div style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', marginBottom: 12 }}>
          📚 Задачи ({solvedInOlymp}/{selected.taskIds.length} решено)
        </div>
        
        {selected.taskIds.map((taskId, i) => {
          const solved = solvedTasks.has(taskId);
          return (
            <a key={taskId} href={`/tasks/solve?id=${taskId}`} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16', marginBottom: 8,
              background: '#1e293b', borderRadius: 12,
              border: solved ? '1px solid #22c55e' : '1px solid #334155',
              textDecoration: 'none',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: solved ? '#22c55e' : '#334155',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, color: solved ? '#fff' : '#94a3b8',
              }}>{solved ? '✓' : i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: solved ? '#22c55e' : '#f8fafc', fontWeight: 600 }}>
                  Задача {i + 1}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {solved ? 'Решена ✓' : 'Ожидает решения'}
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                ⭐ +{100 + i * 50} XP
              </div>
            </a>
          );
        })}
      </AppLayout>
    );
  }

  return (
    <AppLayout title="🏆 Олимпиады" showBack>
      {olympiads.map(o => (
        <div key={o.id} style={{
          background: 'linear-gradient(135deg, #312e81, #1e1b4b)', borderRadius: 16,
          padding: 20, marginBottom: 12, cursor: 'pointer',
          border: o.status === 'active' ? '1px solid #4338ca' : '1px solid #334155',
        }} onClick={() => o.status === 'active' ? handleRegister(o) : null}>
          <div style={{ fontSize: 14, color: o.status === 'active' ? '#4ade80' : '#94a3b8', marginBottom: 4 }}>
            {o.status === 'active' ? '🟢 Активна · Нажми чтобы участвовать' : '⚪ Скоро'}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>
            🏆 {o.title}
          </div>
          <div style={{ fontSize: 13, color: '#c7d2fe', marginBottom: 12 }}>
            {o.description}
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#a5b4fc' }}>
            <span>⏱ {o.duration} мин</span>
            <span>📝 {o.taskIds.length} задач</span>
            <span>📂 {o.category}</span>
          </div>
        </div>
      ))}
    </AppLayout>
  );
}
