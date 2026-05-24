# НейроСфера — Олимпиады 🏆

Telegram Mini App для AI-олимпиад: задачи, рейтинг, геймификация, AI-тьютор.

## 🚀 Быстрый старт

```bash
# 1. Установить зависимости
cd backend && npm install
cd ../frontend && npm install

# 2. Настроить .env
cp .env.example .env

# 3. Запустить
docker-compose up -d
```

## 🧩 Технологии
- **Frontend:** React 19, Next.js, TypeScript, Tailwind CSS
- **Backend:** Node.js 24, Express
- **Database:** PostgreSQL 17
- **Cache:** Redis 7
- **Bot:** python-telegram-bot v21
- **Sandbox:** Docker + gVisor
- **AI:** DeepSeek через OpenRouter

## 📱 Команды бота
- `/start` — приветствие
- `/olymp` — открыть Mini App
- `/stats` — статистика
- `/top` — рейтинг
