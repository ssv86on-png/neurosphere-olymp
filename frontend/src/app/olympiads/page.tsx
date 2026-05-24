'use client';
import React, { useState, useEffect } from 'react';
import { AppLayout, OlympiadCard, Loading } from '../../components/index';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://neurosphere-olymp-api.vercel.app';

export default function OlympiadsPage() {
  const [olympiads, setOlympiads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/olympiads`)
      .then(r => r.json())
      .then(data => { setOlympiads(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <AppLayout title="🏆 Олимпиады" showBack>
      {loading ? <Loading /> : (
        <>
          {olympiads.map(o => (
            <OlympiadCard key={o.id} olympiad={o} onClick={() => window.location.href = `/tasks?olympiad=${o.id}`} />
          ))}
          {olympiads.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
              Олимпиады скоро появятся
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}
