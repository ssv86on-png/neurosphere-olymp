'use client';
import React, { useState } from 'react';

export default function OnboardingPage() {
  const [step, setStep] = useState(0);

  const slides = [
    {
      icon: '🏆',
      title: 'НейроСфера — Олимпиады',
      desc: 'Решай задачи, соревнуйся в рейтинге, получай достижения и учись с AI-тьютором',
    },
    {
      icon: '📚',
      title: '926 задач по 34 направлениям',
      desc: 'Алгоритмы, структуры данных, математика, SQL, веб-разработка и многое другое',
    },
    {
      icon: '🤖',
      title: 'AI-тьютор с 7 режимами',
      desc: 'Объяснение, отладка, теория, практика — Socratic метод помогает понять, а не запомнить',
    },
    {
      icon: '🏅',
      title: 'Рейтинг и достижения',
      desc: 'Соревнуйся с другими, открывай достижения, становись легендой',
    },
  ];

  const s = slides[step];

  return (
    <div style={{
      maxWidth: 480, margin: '0 auto', minHeight: '100dvh',
      background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
      color: '#e2e8f0', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      padding: 40, textAlign: 'center',
    }}>
      <div style={{ fontSize: 80, marginBottom: 32 }}>{s.icon}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc', marginBottom: 16 }}>
        {s.title}
      </div>
      <div style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.6, marginBottom: 40 }}>
        {s.desc}
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
        {slides.map((_, i) => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: step === i ? '#3b82f6' : '#334155',
          }} />
        ))}
      </div>

      {/* Buttons */}
      {step < slides.length - 1 ? (
        <button onClick={() => setStep(step + 1)} style={{
          padding: '14px 32px', borderRadius: 12, border: 'none',
          background: '#3b82f6', color: '#fff', fontSize: 16, fontWeight: 600,
          cursor: 'pointer',
        }}>Далее</button>
      ) : (
        <button onClick={() => window.location.href = '/'} style={{
          padding: '14px 32px', borderRadius: 12, border: 'none',
          background: '#22c55e', color: '#fff', fontSize: 16, fontWeight: 600,
          cursor: 'pointer',
        }}>🚀 Начать</button>
      )}
    </div>
  );
}
