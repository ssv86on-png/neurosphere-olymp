require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { createClient } = require('redis');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'neurosphere-secret';

// Middleware
app.use(cors());
app.use(express.json());

// Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/neurosphere_olymp',
  max: 20,
  idleTimeoutMillis: 30000,
});

// Redis
let redis = null;
(async () => {
  try {
    redis = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    redis.on('error', () => { redis = null; });
    await redis.connect();
    console.log('📦 Redis connected');
  } catch { redis = null; }
})();

// Auth middleware
function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ===== AUTH ENDPOINTS =====

// POST /api/auth/login — login by telegram_id
app.post('/api/auth/login', async (req, res) => {
  const { telegram_id, telegram_name, first_name, last_name, username } = req.body;
  if (!telegram_id) return res.status(400).json({ error: 'telegram_id required' });

  try {
    let result = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [telegram_id]);
    let user;
    if (result.rows.length === 0) {
      result = await pool.query(
        `INSERT INTO users (telegram_id, telegram_name, first_name, last_name, username, xp, level, streak, last_active)
         VALUES ($1, $2, $3, $4, $5, 0, 1, 0, NOW())
         RETURNING *`,
        [telegram_id, telegram_name || username || `user_${telegram_id}`, first_name || '', last_name || '', username || '']
      );
      user = result.rows[0];
    } else {
      user = result.rows[0];
      await pool.query(
        `UPDATE users SET last_active = NOW(), telegram_name = COALESCE($2, telegram_name),
         first_name = COALESCE($3, first_name), username = COALESCE($4, username)
         WHERE id = $1`,
        [user.id, telegram_name, first_name, username]
      );
    }

    const token = jwt.sign(
      { id: user.id, telegram_id: user.telegram_id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user });
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me — current user
app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal error' });
  }
});

// ===== USER ENDPOINTS =====

// GET /api/users/telegram/:id
app.get('/api/users/telegram/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.json({ xp: 0, level: 1, solved_tasks: 0, streak: 0 });
    const user = result.rows[0];
    res.json({
      ...user,
      solved_tasks: user.tasks_solved || 0,
      rank: 1 // simplified
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal error' });
  }
});

// GET /api/users/:id/profile
app.get('/api/users/:id/profile', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal error' });
  }
});

// ===== TASKS ENDPOINTS =====

// GET /api/tasks — list with filters
app.get('/api/tasks', async (req, res) => {
  const { category, difficulty, limit = 50, offset = 0 } = req.query;
  try {
    let query = 'SELECT id, title, category, difficulty, xp_reward, description, created_at FROM tasks WHERE 1=1';
    const params = [];
    let paramIdx = 1;

    if (category) {
      query += ` AND category = $${paramIdx++}`;
      params.push(category);
    }
    if (difficulty) {
      query += ` AND difficulty = $${paramIdx++}`;
      params.push(difficulty);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Tasks error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// GET /api/tasks/:id
app.get('/api/tasks/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal error' });
  }
});

// ===== OLYMPIADS =====

// GET /api/olympiads
app.get('/api/olympiads', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, COUNT(ot.task_id) as task_count,
       (SELECT COUNT(*) FROM submissions s JOIN olympiad_tasks ot2 ON s.task_id = ot2.task_id WHERE ot2.olympiad_id = o.id) as participants
       FROM olympiads o
       LEFT JOIN olympiad_tasks ot ON o.id = ot.olympiad_id
       GROUP BY o.id
       ORDER BY o.start_date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal error' });
  }
});

// GET /api/olympiads/:id
app.get('/api/olympiads/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, COUNT(ot.task_id) as task_count,
       (SELECT COUNT(*) FROM submissions s JOIN olympiad_tasks ot2 ON s.task_id = ot2.task_id WHERE ot2.olympiad_id = o.id) as participants
       FROM olympiads o
       LEFT JOIN olympiad_tasks ot ON o.id = ot.olympiad_id
       WHERE o.id = $1
       GROUP BY o.id`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal error' });
  }
});

// GET /api/olympiads/:id/tasks
app.get('/api/olympiads/:id/tasks', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.id, t.title, t.category, t.difficulty, t.xp_reward
       FROM tasks t
       JOIN olympiad_tasks ot ON t.id = ot.task_id
       WHERE ot.olympiad_id = $1`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal error' });
  }
});

// ===== SUBMISSIONS =====

// POST /api/submissions — submit a solution
app.post('/api/submissions', auth, async (req, res) => {
  const { task_id, code, language } = req.body;
  if (!task_id || !code) return res.status(400).json({ error: 'task_id and code required' });

  try {
    // Simple check (in production, run in sandbox)
    const task = await pool.query('SELECT * FROM tasks WHERE id = $1', [task_id]);
    if (task.rows.length === 0) return res.status(404).json({ error: 'Task not found' });

    const passed = true; // simplified — real sandbox verification
    const result = await pool.query(
      `INSERT INTO submissions (user_id, task_id, code, language, status, passed, xp_earned, execution_time)
       VALUES ($1, $2, $3, $4, 'completed', $5, $6, 0)
       RETURNING *`,
      [req.user.id, task_id, code, language || 'python', passed, passed ? task.rows[0].xp_reward : 0]
    );

    if (passed) {
      await pool.query('UPDATE users SET xp = xp + $2, tasks_solved = tasks_solved + 1, last_active = NOW() WHERE id = $1',
        [req.user.id, task.rows[0].xp_reward]);
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Submission error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// GET /api/submissions/user — user submissions
app.get('/api/submissions/user', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, t.title as task_title, t.category
       FROM submissions s
       JOIN tasks t ON s.task_id = t.id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal error' });
  }
});

// ===== LEADERBOARD =====

// GET /api/leaderboard
app.get('/api/leaderboard', async (req, res) => {
  const { limit = 50, period } = req.query;

  // Try materialized view first, then fallback
  const viewName = period === 'weekly' ? 'mv_weekly_leaderboard'
    : period === 'monthly' ? 'mv_monthly_leaderboard'
    : 'mv_alltime_leaderboard';

  try {
    const result = await pool.query(
      `SELECT u.id, u.telegram_name, u.telegram_id, u.first_name, u.xp, u.level, u.tasks_solved,
       ROW_NUMBER() OVER (ORDER BY u.xp DESC) as rank
       FROM users u
       WHERE u.tasks_solved > 0
       ORDER BY u.xp DESC
       LIMIT $1`,
      [parseInt(limit)]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal error' });
  }
});

// ===== ACHIEVEMENTS =====

// GET /api/achievements — all achievements
app.get('/api/achievements', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM achievements ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal error' });
  }
});

// GET /api/achievements/user/:userId — user achievements
app.get('/api/achievements/user/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, ua.unlocked_at
       FROM achievements a
       JOIN user_achievements ua ON a.id = ua.achievement_id
       WHERE ua.user_id = $1
       ORDER BY ua.unlocked_at`,
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal error' });
  }
});

// ===== AI TUTOR =====

// POST /api/tutor/ask — ask AI tutor
app.post('/api/tutor/ask', auth, async (req, res) => {
  const { question, task_id, mode = 'socratic' } = req.body;
  if (!question) return res.status(400).json({ error: 'Question required' });

  try {
    // Try OpenRouter/DeepSeek if configured
    let answer = 'Извините, AI-тьютор временно недоступен. Попробуйте позже.';

    if (process.env.OPENROUTER_API_KEY) {
      try {
        const aiResp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://neurosphere-olymp.vercel.app',
          },
          body: JSON.stringify({
            model: 'deepseek/deepseek-chat-v3-0324:free',
            messages: [
              { role: 'system', content: getTutorPrompt(mode) },
              { role: 'user', content: question }
            ],
            max_tokens: 1000,
          })
        });
        const data = await aiResp.json();
        if (data.choices?.[0]?.message?.content) {
          answer = data.choices[0].message.content;
        }
      } catch (aiErr) {
        console.error('AI tutor error:', aiErr);
      }
    }

    // Save to DB
    await pool.query(
      `INSERT INTO tutor_chats (user_id, task_id, question, answer, mode)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, task_id || null, question, answer, mode]
    );

    res.json({ answer, mode });
  } catch (err) {
    res.status(500).json({ error: 'Internal error' });
  }
});

function getTutorPrompt(mode) {
  const prompts = {
    socratic: 'Ты — AI-тьютор. Используй Socratic метод: задавай наводящие вопросы, не давай готовых ответов. Помоги ученику найти решение самому. Дай 3 подсказки, постепенно раскрывая решение.',
    explain: 'Ты — AI-тьютор. Объясни тему подробно, шаг за шагом, с примерами. Используй простой язык.',
    debug: 'Ты — AI-тьютор. Помоги найти ошибку в коде. Объясни почему она возникает и как её исправить.',
    theory: 'Ты — AI-тьютор. Дай теоретическое объяснение: определение, свойства, примеры, применение.',
    practice: 'Ты — AI-тьютор. Предложи практическое задание по теме и дай обратную связь по решению.',
    fast: 'Ты — AI-тьютор. Дай краткий ответ по существу, 2-3 предложения.',
    full: 'Ты — AI-тьютор. Полный разбор: теория, примеры, практика, типичные ошибки, доп. материалы.',
  };
  return prompts[mode] || prompts.socratic;
}

// ===== HEALTH =====

// GET /health
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '2.0.0' });
});

// Start
app.listen(PORT, () => {
  console.log(`🚀 Backend API running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});
