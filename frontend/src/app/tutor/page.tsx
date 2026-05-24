'use client';
import React, { useState } from 'react';
import { AppLayout, Loading, useAuth } from '../../components/index';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://neurosphere-olymp-api.vercel.app';

const modes = [
  { id: 'socratic', label: '🧠 Сократ', desc: 'Наводящие вопросы' },
  { id: 'explain', label: '📖 Объяснение', desc: 'Подробный разбор' },
  { id: 'debug', label: '🐛 Отладка', desc: 'Поиск ошибок' },
  { id: 'theory', label: '📚 Теория', desc: 'Определения и примеры' },
  { id: 'practice', label: '✏️ Практика', desc: 'Задания и фидбек' },
  { id: 'fast', label: '⚡ Быстро', desc: '2-3 предложения' },
  { id: 'full', label: '📖 Полный', desc: 'Теория + практика' },
];

export default function TutorPage() {
  const { user } = useAuth();
  const [mode, setMode] = useState('socratic');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  async function ask() {
    if (!question.trim()) return;
    const q = question;
    setQuestion('');
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/tutor/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token'),
        },
        body: JSON.stringify({ question: q, mode }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.answer }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Извините, сервер недоступен. Попробуйте позже.' }]);
    }
    setLoading(false);
  }

  return (
    <AppLayout title="🤖 AI-тьютор" showBack>
      {/* Mode Selector */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {modes.map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} style={{
            padding: '6px 12px', borderRadius: 20, border: 'none',
            background: mode === m.id ? '#3b82f6' : '#334155',
            color: '#fff', fontSize: 12, cursor: 'pointer',
          }} title={m.desc}>{m.label}</button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ marginBottom: 16, maxHeight: 400, overflowY: 'auto' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🤖</div>
            <div style={{ fontSize: 14 }}>Задай вопрос по задаче или теме</div>
            <div style={{ fontSize: 12, marginTop: 8, color: '#64748b' }}>
              Режим: {modes.find(m => m.id === mode)?.desc}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{
            padding: '10px 14px', borderRadius: 12, marginBottom: 8,
            background: msg.role === 'user' ? '#3b82f6' : '#1e293b',
            color: '#f8fafc', fontSize: 14, lineHeight: 1.5,
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
          }}>
            {msg.text}
          </div>
        ))}
        {loading && <Loading />}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 8, position: 'sticky', bottom: 0 }}>
        <input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && ask()}
          placeholder="Спроси AI-тьютора..."
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #334155',
            background: '#1e293b', color: '#f8fafc', fontSize: 14, outline: 'none',
          }}
        />
        <button onClick={ask} disabled={loading || !question.trim()} style={{
          padding: '10px 16px', borderRadius: 8, border: 'none',
          background: loading ? '#334155' : '#3b82f6',
          color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14,
        }}>{loading ? '...' : '→'}</button>
      </div>
    </AppLayout>
  );
}
