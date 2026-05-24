'use client';

// ===== In-Memory + LocalStorage Store =====

const STORAGE_KEY = 'neurosphere_data';

function getStore() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { users: [], submissions: [], olympiadRegistrations: [] };
}

function saveStore(store) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {}
}

// Users
export function getData(key) {
  const store = getStore();
  return store ? store[key] : [];
}

export function setData(key, val) {
  const store = getStore();
  if (!store) return;
  store[key] = val;
  saveStore(store);
}

export function getUser(telegramId) {
  const store = getStore();
  if (!store) return null;
  return store.users.find(u => u.telegram_id === telegramId) || null;
}

export function addUser(data) {
  const store = getStore();
  if (!store) return null;
  const existing = store.users.find(u => u.telegram_id === data.telegram_id);
  if (existing) return existing;
  
  const user = {
    id: store.users.length + 1,
    telegram_id: data.telegram_id,
    telegram_name: data.telegram_name || 'User',
    first_name: data.first_name || '',
    xp: 0,
    level: 1,
    tasks_solved: 0,
    streak: 0,
    last_active: new Date().toISOString(),
    achievements: [],
    createdAt: new Date().toISOString(),
  };
  store.users.push(user);
  saveStore(store);
  return user;
}

export function addXp(telegramId, amount) {
  const store = getStore();
  if (!store) return null;
  const user = store.users.find(u => u.telegram_id === telegramId);
  if (!user) return null;
  user.xp = (user.xp || 0) + amount;
  user.tasks_solved = (user.tasks_solved || 0) + 1;
  user.level = Math.floor(user.xp / 1000) + 1;
  user.last_active = new Date().toISOString();
  saveStore(store);
  return user;
}

export function getSolvedTasks(telegramId) {
  const store = getStore();
  if (!store) return [];
  return store.submissions
    .filter(s => s.user_id === telegramId && s.passed)
    .map(s => s.task_id);
}

export function addSubmission(data) {
  const store = getStore();
  if (!store) return null;
  const sub = {
    id: store.submissions.length + 1,
    user_id: data.user_id,
    task_id: data.task_id,
    code: data.code || '',
    language: data.language || 'python',
    passed: data.passed || false,
    xp_earned: data.xp_earned || 0,
    created_at: new Date().toISOString(),
  };
  store.submissions.push(sub);
  saveStore(store);
  return sub;
}

// Leaderboard
export function getLeaderboard(limit = 50) {
  const store = getStore();
  if (!store) return [];
  return store.users
    .filter(u => u.tasks_solved > 0)
    .sort((a, b) => b.xp - a.xp)
    .slice(0, limit)
    .map((u, i) => ({ ...u, rank: i + 1 }));
}

// Olympiad registration
export function registerForOlympiad(userId, olympiadId) {
  const store = getStore();
  if (!store) return;
  if (!store.olympiadRegistrations) store.olympiadRegistrations = [];
  const exists = store.olympiadRegistrations.find(r => r.userId === userId && r.olympiadId === olympiadId);
  if (!exists) {
    store.olympiadRegistrations.push({ userId, olympiadId, joinedAt: new Date().toISOString() });
    saveStore(store);
  }
}

export function getOlympiadParticipants(olympiadId) {
  const store = getStore();
  if (!store || !store.olympiadRegistrations) return 0;
  return store.olympiadRegistrations.filter(r => r.olympiadId === olympiadId).length;
}

// Achievements
export function checkAchievements(userId) {
  const store = getStore();
  if (!store) return [];
  const user = store.users.find(u => u.telegram_id === userId);
  if (!user) return [];
  
  const achievements = [];
  if (user.tasks_solved >= 1 && !user.achievements.includes('first_solve')) {
    achievements.push({ code: 'first_solve', title: 'Первое решение', icon: '🌟', xp: 100 });
  }
  if (user.tasks_solved >= 10 && !user.achievements.includes('solved_10')) {
    achievements.push({ code: 'solved_10', title: 'Десятка', icon: '🎯', xp: 300 });
  }
  if (user.tasks_solved >= 50 && !user.achievements.includes('solved_50')) {
    achievements.push({ code: 'solved_50', title: 'Мастер', icon: '🏅', xp: 1000 });
  }
  if (user.xp >= 5000 && !user.achievements.includes('xp_5000')) {
    achievements.push({ code: 'xp_5000', title: '5000 XP', icon: '💎', xp: 500 });
  }

  for (const a of achievements) {
    if (!user.achievements.includes(a.code)) {
      user.achievements.push(a.code);
      user.xp += a.xp;
      saveStore(store);
    }
  }
  return achievements;
}
