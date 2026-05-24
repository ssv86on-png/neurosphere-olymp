-- НейроСфера Олимпиады — Database Schema
-- PostgreSQL 17

-- ===== USERS =====
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    telegram_name VARCHAR(255),
    first_name VARCHAR(255) DEFAULT '',
    last_name VARCHAR(255) DEFAULT '',
    username VARCHAR(255) DEFAULT '',
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak INTEGER DEFAULT 0,
    tasks_solved INTEGER DEFAULT 0,
    last_active TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_xp ON users(xp DESC);
CREATE INDEX IF NOT EXISTS idx_users_streak ON users(streak DESC);

-- ===== TASKS =====
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'algorithms',
    subcategory VARCHAR(100),
    difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
    xp_reward INTEGER DEFAULT 100,
    solution_template TEXT,
    test_cases JSONB,
    hints TEXT[],
    source VARCHAR(50) DEFAULT 'olympic',
    language VARCHAR(20) DEFAULT 'python',
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_difficulty ON tasks(difficulty);
CREATE INDEX IF NOT EXISTS idx_tasks_source ON tasks(source);

-- ===== OLYMPIADS =====
CREATE TABLE IF NOT EXISTS olympiads (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    difficulty VARCHAR(20) DEFAULT 'medium',
    category VARCHAR(100),
    max_participants INTEGER DEFAULT 1000,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS olympiad_tasks (
    olympiad_id INTEGER REFERENCES olympiads(id) ON DELETE CASCADE,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    order_num INTEGER DEFAULT 0,
    score_multiplier DECIMAL(3,2) DEFAULT 1.00,
    PRIMARY KEY (olympiad_id, task_id)
);

-- ===== SUBMISSIONS =====
CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    code TEXT,
    language VARCHAR(20) DEFAULT 'python',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'timeout')),
    passed BOOLEAN DEFAULT FALSE,
    xp_earned INTEGER DEFAULT 0,
    execution_time DECIMAL(10,3),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_submissions_user ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_task ON submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_submissions_created ON submissions(created_at DESC);

-- ===== ACHIEVEMENTS =====
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT '🏆',
    xp_reward INTEGER DEFAULT 500,
    criteria JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_achievements (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    achievement_id INTEGER REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, achievement_id)
);

-- ===== TUTOR CHATS =====
CREATE TABLE IF NOT EXISTS tutor_chats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    answer TEXT,
    mode VARCHAR(20) DEFAULT 'socratic',
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tutor_user ON tutor_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_tutor_created ON tutor_chats(created_at DESC);

-- ===== ACTIVITY LOG =====
CREATE TABLE IF NOT EXISTS activity_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);

-- ===== LEADERBOARD VIEWS =====
CREATE OR REPLACE VIEW mv_alltime_leaderboard AS
SELECT u.id, u.telegram_name, u.first_name, u.xp, u.level, u.tasks_solved,
       ROW_NUMBER() OVER (ORDER BY u.xp DESC) as rank
FROM users u
WHERE u.tasks_solved > 0;

CREATE OR REPLACE VIEW mv_weekly_leaderboard AS
SELECT u.id, u.telegram_name, u.first_name,
       COALESCE(SUM(s.xp_earned), 0) as weekly_xp,
       COUNT(s.id) as tasks_solved,
       ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(s.xp_earned), 0) DESC) as rank
FROM users u
LEFT JOIN submissions s ON u.id = s.user_id
    AND s.passed = TRUE
    AND s.created_at >= NOW() - INTERVAL '7 days'
GROUP BY u.id, u.telegram_name, u.first_name
HAVING COUNT(s.id) > 0;

-- ===== DEFAULT ACHIEVEMENTS =====
INSERT INTO achievements (code, title, description, icon, xp_reward, criteria) VALUES
('first_solve', 'Первое решение', 'Решить первую задачу', '🌟', 100, '{"tasks_solved": 1}'),
('streak_3', 'Новичок', 'Решать задачи 3 дня подряд', '🔥', 200, '{"streak": 3}'),
('streak_7', 'Неделя кода', 'Решать задачи 7 дней подряд', '🔥', 500, '{"streak": 7}'),
('streak_30', 'Месяц кода', 'Решать задачи 30 дней подряд', '💪', 2000, '{"streak": 30}'),
('solved_10', 'Десятка', 'Решить 10 задач', '🎯', 300, '{"tasks_solved": 10}'),
('solved_50', 'Мастер', 'Решить 50 задач', '🏅', 1000, '{"tasks_solved": 50}'),
('solved_100', 'Легенда', 'Решить 100 задач', '👑', 3000, '{"tasks_solved": 100}'),
('expert_solver', 'Эксперт', 'Решить 10 задач уровня Expert', '💎', 1500, '{"expert_solved": 10}'),
('speed_demon', 'Скорость', 'Решить задачу за 5 минут', '⚡', 200, '{"fast_solve": true}'),
('olympiad_first', 'Олимпиец', 'Участвовать в олимпиаде', '🥇', 500, '{"olympiad_participated": 1}'),
('perfectionist', 'Перфекционист', 'Сдать задачу с первой попытки', '✨', 300, '{"first_attempt": true}'),
('helper', 'Помощник', 'Задать 10 вопросов AI-тьютору', '🤖', 200, '{"tutor_questions": 10}'),
('polyglot', 'Полиглот', 'Решить задачи на 3 языках', '🌍', 500, '{"languages": 3}')
ON CONFLICT (code) DO NOTHING;
