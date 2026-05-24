'use client';
import React, { useState } from 'react';
import { AppLayout, Loading, useAuth } from '../../components/index';

const API = process.env.NEXT_PUBLIC_API_URL || '';

const modes = [
  { id: 'socratic', label: '🧠 Сократ', desc: 'Наводящие вопросы вместо ответов' },
  { id: 'explain', label: '📖 Объяснение', desc: 'Пошаговый подробный разбор' },
  { id: 'debug', label: '🐛 Отладка', desc: 'Поиск и исправление ошибок' },
  { id: 'theory', label: '📚 Теория', desc: 'Определения и примеры' },
  { id: 'practice', label: '✏️ Практика', desc: 'Задание + обратная связь' },
  { id: 'fast', label: '⚡ Быстро', desc: 'Ответ в 2-3 предложения' },
  { id: 'full', label: '📖 Полный', desc: 'Теория + примеры + практика' },
];

export default function TutorPage() {
  const { user } = useAuth();
  const [mode, setMode] = useState('socratic');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  async function askAI() {
    if (!question.trim()) return;
    const q = question;
    setQuestion('');
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setLoading(true);

    try {
      // Try OpenRouter API
      const openRouterKey = process.env.NEXT_PUBLIC_OPENROUTER_KEY || '';
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://neurosphere-olymp.vercel.app',
          'X-Title': 'Neurosphere Olympiad',
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat-v3-0324:free',
          messages: [
            { role: 'system', content: getPrompt(mode) },
            { role: 'user', content: q }
          ],
          max_tokens: 800,
        }),
      });

      const data = await res.json();
      let answer = data.choices?.[0]?.message?.content;
      
      if (!answer) {
        // Fallback responses
        answer = getFallback(mode, q);
      }

      setMessages(prev => [...prev, { role: 'assistant', text: answer }]);
    } catch (e) {
      const fallback = getFallback(mode, q);
      setMessages(prev => [...prev, { role: 'assistant', text: fallback }]);
    }
    setLoading(false);
  }

  function getPrompt(mode) {
    const prompts = {
      socratic: 'Ты — AI-тьютор НейроСфера Олимпиады. Используй Socratic метод: задавай наводящие вопросы, помогай ученику найти решение самому. Отвечай НЕ готовым ответом, а серией вопросов. Если ученик просит подсказку — дай её постепенно, шаг за шагом. Говори на русском, дружелюбно.',
      explain: 'Ты — AI-тьютор НейроСфера Олимпиады. Объясни тему подробно, шаг за шагом, с примерами кода. Используй простой и понятный язык. Приводи аналогии из реальной жизни.',
      debug: 'Ты — AI-тьютор НейроСфера Олимпиады. Помоги найти ошибку. Проанализируй проблему, объясни причину, предложи исправление. Покажи правильный код.',
      theory: 'Ты — AI-тьютор НейроСфера Олимпиады. Дай теоретическое объяснение: определение, основные свойства, примеры использования, типичные ошибки.',
      practice: 'Ты — AI-тьютор НейроСфера Олимпиады. Предложи практическое задание по теме. После решения дай обратную связь и рекомендации.',
      fast: 'Ты — AI-тьютор НейроСфера Олимпиады. Дай краткий, сжатый ответ в 2-3 предложения. Только суть, без воды.',
      full: 'Ты — AI-тьютор НейроСфера Олимпиады. Полный разбор: теория + примеры кода + практическое задание + типичные ошибки + дополнительные материалы.',
    };
    return prompts[mode] || prompts.socratic;
  }

  function getFallback(mode, q) {
    const fallbacks = {
      socratic: `Отличный вопрос! Давай разберёмся вместе.

1️⃣ Что ты уже знаешь по этой теме?
2️⃣ Какие подходы уже пробовал?
3️⃣ В чём именно видишь сложность?

Ответь на эти вопросы, и мы вместе найдём решение! 🎯`,
      explain: `Давай разберём тему "${q}" по шагам.

**Шаг 1:** Определение и основные концепции
**Шаг 2:** Простой пример
**Шаг 3:** Более сложный случай
**Шаг 4:** Типичные ошибки

Какой аспект интересует больше всего?`,
      debug: `Давай найдём ошибку вместе! 🔍

Для начала проверь:
1️⃣ Синтаксис — нет ли пропущенных скобок/двоеточий
2️⃣ Типы данных — правильные ли типы передаются
3️⃣ Граничные случаи — что при пустом вводе?
4️⃣ Логика — правильный ли алгоритм?

Покажи свой код — я помогу найти проблему!`,
      theory: `📚 **${q}** — хорошая тема для изучения!

**Определение:**
Это фундаментальная концепция, которая используется для решения класса задач.

**Основные свойства:**
• Простота реализации
• Эффективность в типовых случаях
• Широкая применимость

Нужно более детальное объяснение с примерами?`,
      practice: `✏️ **Практическое задание по теме "${q}":**

Реализуй функцию, которая демонстрирует применение этой концепции. 

**Требования:**
- Корректная обработка граничных случаев
- Понятный код с комментариями
- Оптимальная сложность

Напиши решение — я проверю и дам feedback!`,
      fast: `⚡ **Быстрый ответ по теме "${q}":**

Это фундаментальная концепция, которая решает задачу оптимальным способом. Используется во многих алгоритмах и реальных проектах. Ключевые моменты: простота, эффективность, надёжность.`,
      full: `📖 **Полный разбор темы "${q}"**

**1️⃣ Теория**
Определение и математическая основа.

**2️⃣ Пример кода**
\`\`\`python
# Пример реализации
def solve(data):
    # Базовый случай
    if not data:
        return None
    # Основная логика
    result = process(data)
    return result
\`\`\`

**3️⃣ Практическое задание**
Напиши свою реализацию с тестами.

**4️⃣ Типичные ошибки**
- Забыть про граничные случаи
- Неправильная оценка сложности

Нужно что-то уточнить?`,
    };
    return fallbacks[mode] || fallbacks.socratic;
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

      {mode && (
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12, textAlign: 'center' }}>
          Режим: {modes.find(m => m.id === mode)?.desc}
        </div>
      )}

      {/* Messages */}
      <div style={{ marginBottom: 16, minHeight: 200 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🤖</div>
            <div style={{ fontSize: 14, marginBottom: 8 }}>Задай вопрос по задаче или теме</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Например: «Объясни бинарный поиск» или «Помоги с задачей #5»
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{
            padding: '10px 14px', borderRadius: 12, marginBottom: 8,
            background: msg.role === 'user' ? '#3b82f6' : '#1e293b',
            color: '#f8fafc', fontSize: 14, lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
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
          onKeyDown={e => e.key === 'Enter' && !loading && askAI()}
          placeholder="Спроси AI-тьютора..."
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #334155',
            background: '#1e293b', color: '#f8fafc', fontSize: 14, outline: 'none',
          }}
        />
        <button onClick={askAI} disabled={loading || !question.trim()} style={{
          padding: '10px 20px', borderRadius: 8, border: 'none',
          background: loading ? '#334155' : '#3b82f6',
          color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14,
        }}>{loading ? '...' : '→'}</button>
      </div>
    </AppLayout>
  );
}
