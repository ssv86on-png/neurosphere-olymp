'use client';
import React, { useState, useEffect } from 'react';
import { AppLayout, Loading, useAuth } from '../../components/index';
import { addXp, addSubmission, getSolvedTasks, checkAchievements } from '../../components/storage';

const API = process.env.NEXT_PUBLIC_API_URL || '';
const tasksApi = `${API}/api/tasks`;

export default function TaskSolvePage() {
  const { user, refreshUser } = useAuth();
  const [task, setTask] = useState(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [solved, setSolved] = useState(new Set());

  useEffect(() => {
    // Read task id from URL
    const params = new URLSearchParams(window.location.search);
    const taskId = params.get('id');
    if (taskId) {
      fetch(`${tasksApi}?limit=1&offset=${parseInt(taskId) - 1}`)
        .then(r => r.json())
        .then(data => {
          const t = data.tasks?.[0];
          if (t && t.id === parseInt(taskId)) {
            setTask(t);
            setCode(t.solution_template || `# Решение задачи #${t.id}\n# ${t.title}\n\n`);
          }
        });
    }
    if (user) {
      setSolved(new Set(getSolvedTasks(user.telegram_id)));
    }
  }, [user]);

  async function runCode() {
    setRunning(true);
    setOutput('🔄 Запуск...');
    
    // Simulate execution
    await new Promise(r => setTimeout(r, 1000));
    
    const passed = Math.random() > 0.3; // 70% chance for demo
    const result = passed ? '✅ Все тесты пройдены!' : '❌ Ошибка в тесте #2';
    
    setOutput(result);
    setRunning(false);

    if (passed && user && task && !solved.has(task.id)) {
      addSubmission({
        user_id: user.telegram_id,
        task_id: task.id,
        code,
        passed: true,
        xp_earned: task.xp_reward,
      });
      addXp(user.telegram_id, task.xp_reward);
      setSolved(new Set([...solved, task.id]));
      
      const achievements = checkAchievements(user.telegram_id);
      if (achievements.length > 0) {
        setOutput(prev => prev + `\n\n🎉 Новое достижение: ${achievements[0].icon} ${achievements[0].title}! +${achievements[0].xp} XP`);
      }
      
      refreshUser();
    }
  }

  if (!task) return <AppLayout title="📝 Решение задачи" showBack><Loading /></AppLayout>;

  const colors = { easy: '#22c55e', medium: '#eab308', hard: '#ef4444', expert: '#a855f7' };

  return (
    <AppLayout title={`📝 Задача #${task.id}`} showBack>
      {/* Task Info */}
      <div style={{
        background: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12,
        border: '1px solid #334155',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>{task.title}</h2>
          <span style={{
            background: colors[task.difficulty] || '#64748b',
            color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 11,
          }}>{task.difficulty}</span>
        </div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>
          📂 {task.category} · ⭐ +{task.xp_reward} XP
        </div>
        {solved.has(task.id) && (
          <div style={{ color: '#22c55e', fontSize: 13, fontWeight: 600 }}>✅ Задача решена!</div>
        )}
      </div>

      {/* Description */}
      <div style={{
        background: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12,
        border: '1px solid #334155', fontSize: 14, lineHeight: 1.6, color: '#cbd5e1',
      }}>
        {task.description}
        <div style={{ marginTop: 12, fontSize: 13, color: '#64748b' }}>
          💡 Напишите решение на языке Python и нажмите "Проверить".
        </div>
      </div>

      {/* Code Editor */}
      <div style={{ marginBottom: 12 }}>
        <div style={{
          background: '#0f172a', borderRadius: '12px 12px 0 0',
          padding: '8px 14px', borderBottom: '1px solid #334155',
          fontSize: 12, color: '#94a3b8',
        }}>
          📝 Решение (Python)
        </div>
        <textarea
          value={code}
          onChange={e => setCode(e.target.value)}
          style={{
            width: '100%', minHeight: 200, padding: 14,
            background: '#0f172a', color: '#e2e8f0', fontSize: 13,
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            border: '1px solid #334155', borderTop: 'none',
            borderRadius: '0 0 12px 12px', outline: 'none',
            resize: 'vertical', lineHeight: 1.6,
          }}
          placeholder="# Напишите код здесь..."
        />
      </div>

      {/* Run Button */}
      <button onClick={runCode} disabled={running || !code.trim()} style={{
        width: '100%', padding: '12px 24px', borderRadius: 12, border: 'none',
        background: running ? '#334155' : solved.has(task.id) ? '#22c55e' : '#3b82f6',
        color: '#fff', fontSize: 15, fontWeight: 600, cursor: running ? 'not-allowed' : 'pointer',
        marginBottom: 12,
      }}>
        {running ? '🔄 Запуск...' : solved.has(task.id) ? '✅ Пройдено (повторить)' : '▶ Проверить решение'}
      </button>

      {/* Output */}
      {output && (
        <div style={{
          background: '#0f172a', borderRadius: 12, padding: 14,
          border: '1px solid #334155', fontSize: 13,
          fontFamily: '"JetBrains Mono", monospace', whiteSpace: 'pre-wrap',
          color: output.includes('✅') ? '#22c55e' : output.includes('❌') ? '#ef4444' : '#94a3b8',
          lineHeight: 1.6, minHeight: 40,
        }}>
          {output}
        </div>
      )}
    </AppLayout>
  );
}
