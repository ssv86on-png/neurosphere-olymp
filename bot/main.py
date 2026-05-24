"""
@aistudyolimp_bot — НейроСфера Олимпиады
Telegram Mini App бот: задачи, рейтинг, геймификация, AI-тьютор
"""
import os
import json
import logging
import hashlib
import hmac
from datetime import datetime
from dotenv import load_dotenv
import requests
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes

load_dotenv()

# Config
BOT_TOKEN = os.getenv("BOT_TOKEN", "8681279092:AAHFPi2kWOG7yNVYJdT0dOxAfOIMMvlioNc")
BOT_USERNAME = os.getenv("BOT_USERNAME", "aistudyolimp_bot")
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://neurosphere-olymp.vercel.app")
API_URL = os.getenv("API_URL", "http://backend:3001")

# Logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Mini App secret for WebAppData verification
BOT_TOKEN_SECRET = hashlib.sha256(BOT_TOKEN.encode()).digest()

def verify_webapp_data(init_data: str) -> dict:
    """Verify Telegram WebApp init data"""
    try:
        parsed = dict(param.split("=", 1) for param in init_data.split("&"))
        hash_received = parsed.pop("hash", "")
        data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(parsed.items()))
        computed_hash = hmac.new(
            BOT_TOKEN_SECRET,
            data_check_string.encode(),
            hashlib.sha256
        ).hexdigest()
        if computed_hash != hash_received:
            return None
        return parsed
    except Exception as e:
        logger.error(f"WebApp verify error: {e}")
        return None

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command"""
    user = update.effective_user
    args = context.args

    # Deep link: /start olymp_N where N = olympiad ID
    if args and args[0].startswith("olymp_"):
        olymp_id = args[0].replace("olymp_", "")
        return await show_olympiad(update, context, olymp_id)

    text = (
        f"🏆 *НейроСфера — Олимпиады*\n\n"
        f"Привет, {user.first_name}! Добро пожаловать на платформу "
        f"AI-олимпиад с задачами, рейтингом и AI-тьютором.\n\n"
        f"📚 *926 задач* по 34 направлениям\n"
        f"🤖 *AI-тьютор* — 7 режимов обучения\n"
        f"🏅 *Рейтинг и достижения*\n"
        f"🎯 *Олимпиады* — соревнуйся с другими\n\n"
        f"Нажми кнопку ниже, чтобы открыть Mini App:"
    )

    keyboard = [[
        InlineKeyboardButton("🚀 Открыть Mini App", web_app=WebAppInfo(url=WEBAPP_URL))
    ]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(text, reply_markup=reply_markup, parse_mode="Markdown")

async def olymp(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show all available olympiads"""
    keyboard = [
        [InlineKeyboardButton("🏆 Все олимпиады", web_app=WebAppInfo(url=f"{WEBAPP_URL}/olympiads"))],
        [InlineKeyboardButton("📚 Задачи", web_app=WebAppInfo(url=f"{WEBAPP_URL}/tasks"))],
        [InlineKeyboardButton("📊 Рейтинг", web_app=WebAppInfo(url=f"{WEBAPP_URL}/leaderboard"))],
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(
        "🏆 *Олимпиады НейроСферы*\n\nВыбери раздел:",
        reply_markup=reply_markup,
        parse_mode="Markdown"
    )

async def stats(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show user stats"""
    user = update.effective_user
    try:
        resp = requests.get(f"{API_URL}/api/users/telegram/{user.id}", timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            text = (
                f"📊 *Твоя статистика*\n\n"
                f"⭐ XP: {data.get('xp', 0)}\n"
                f"🏆 Уровень: {data.get('level', 1)}\n"
                f"✅ Решено задач: {data.get('solved_tasks', 0)}\n"
                f"🔥 Серия: {data.get('streak', 0)} дней\n"
                f"🥇 Рейтинг: #{data.get('rank', '—')}"
            )
        else:
            text = "📊 *Статистика*\n\nРешай задачи, чтобы появилась статистика!"
    except Exception:
        text = "📊 *Статистика*\n\nПока нет данных. Начни решать задачи!"

    keyboard = [[InlineKeyboardButton("📊 Профиль", web_app=WebAppInfo(url=f"{WEBAPP_URL}/profile"))]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(text, reply_markup=reply_markup, parse_mode="Markdown")

async def top(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show leaderboard"""
    try:
        resp = requests.get(f"{API_URL}/api/leaderboard?limit=10", timeout=5)
        if resp.status_code == 200:
            users = resp.json()
            lines = ["🏆 *Топ-10 рейтинга*\n"]
            for i, u in enumerate(users[:10], 1):
                medal = {1:"🥇", 2:"🥈", 3:"🥉"}.get(i, f"{i}.")
                name = u.get('username', u.get('telegram_name', 'Аноним'))
                lines.append(f"{medal} *{name}* — {u.get('xp', 0)} XP")
            text = "\n".join(lines)
        else:
            text = "🏆 *Рейтинг*\n\nПока пусто. Будь первым!"
    except Exception:
        text = "🏆 *Рейтинг*\n\nСервер недоступен. Попробуй позже."

    keyboard = [[InlineKeyboardButton("🥇 Полный рейтинг", web_app=WebAppInfo(url=f"{WEBAPP_URL}/leaderboard"))]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(text, reply_markup=reply_markup, parse_mode="Markdown")

async def show_olympiad(update, context, olymp_id):
    """Show specific olympiad detail"""
    try:
        resp = requests.get(f"{API_URL}/api/olympiads/{olympiad_id}", timeout=5)
        if resp.status_code == 200:
            ol = resp.json()
            text = (
                f"🏆 *{ol.get('title', 'Олимпиада')}*\n\n"
                f"{ol.get('description', '')}\n\n"
                f"📝 Задач: {ol.get('task_count', 0)}\n"
                f"👥 Участников: {ol.get('participants', 0)}\n"
                f"⏳ Статус: {ol.get('status', 'активна')}"
            )
        else:
            text = "Олимпиада не найдена"
    except Exception:
        text = "Ошибка загрузки олимпиады"

    keyboard = [[InlineKeyboardButton("📚 К задачам", web_app=WebAppInfo(url=f"{WEBAPP_URL}/tasks?olympiad={olympiad_id}"))]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(text, reply_markup=reply_markup, parse_mode="Markdown")

async def tutor(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Open AI-tutor"""
    keyboard = [[InlineKeyboardButton("🤖 AI-тьютор", web_app=WebAppInfo(url=f"{WEBAPP_URL}/tutor"))]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(
        "🤖 *AI-тьютор*\n\n7 режимов обучения. Socratic метод. "
        "Задай вопрос или отправь фото задачи — тьютор поможет!",
        reply_markup=reply_markup,
        parse_mode="Markdown"
    )

async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle button callbacks"""
    query = update.callback_query
    await query.answer()
    data = query.data.split("_")

    if data[0] == "olymp":
        await show_olympiad(query, context, data[1] if len(data) > 1 else None)

async def webapp_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle WebApp data (Mini App → Bot)"""
    if not update.effective_message or not update.effective_message.web_app_data:
        return

    data = update.effective_message.web_app_data
    user = update.effective_user

    try:
        payload = json.loads(data.data)
        action = payload.get("action", "")

        if action == "share_result":
            text = (
                f"🎯 *{user.first_name}* решил задачу!\n"
                f"Задача: {payload.get('task_title', '—')}\n"
                f"⭐ +{payload.get('xp', 0)} XP"
            )
            await update.effective_message.reply_text(text, parse_mode="Markdown")

    except json.JSONDecodeError:
        pass

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show help"""
    text = (
        "🤖 *НейроСфера — Помощь*\n\n"
        "*/start* — приветствие и Mini App\n"
        "*/olymp* — все олимпиады\n"
        "*/stats* — твоя статистика\n"
        "*/top* — рейтинг\n"
        "*/tutor* — AI-тьютор\n"
        "*/help* — эта справка\n\n"
        "Открой Mini App для полного функционала:"
    )
    keyboard = [[InlineKeyboardButton("🚀 Mini App", web_app=WebAppInfo(url=WEBAPP_URL))]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(text, reply_markup=reply_markup, parse_mode="Markdown")

def main():
    """Start the bot"""
    app = Application.builder().token(BOT_TOKEN).build()

    # Commands
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("olymp", olymp))
    app.add_handler(CommandHandler("stats", stats))
    app.add_handler(CommandHandler("top", top))
    app.add_handler(CommandHandler("tutor", tutor))
    app.add_handler(CommandHandler("help", help_command))

    # Callbacks & WebApp
    app.add_handler(CallbackQueryHandler(button_callback))
    app.add_handler(CallbackQueryHandler(webapp_data, pattern="^webapp_"))

    logger.info(f"🤖 Bot @{BOT_USERNAME} started! WebApp: {WEBAPP_URL}")
    print(f"🤖 @{BOT_USERNAME} запущен! Press Ctrl+C to stop.")
    app.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main()
