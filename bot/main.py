     1|"""
     2|@aistudyolimp_bot — НейроСфера Олимпиады
     3|Telegram Mini App бот: задачи, рейтинг, геймификация, AI-тьютор
     4|"""
     5|import os
     6|import json
     7|import logging
     8|import hashlib
     9|import hmac
    10|from datetime import datetime
    11|from dotenv import load_dotenv
    12|import requests
    13|from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
    14|from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes
    15|
    16|load_dotenv()
    17|
    18|# Config
    19|BOT_TOKEN = os.getenv("BOT_TOKEN", "8681279092:***")
    20|BOT_USERNAME = os.getenv("BOT_USERNAME", "aistudyolimp_bot")
    21|WEBAPP_URL = os.getenv("WEBAPP_URL", "https://neurosphere-olymp-gohrb5uyr-ssv86on-pngs-projects.vercel.app")
    22|API_URL = os.getenv("API_URL", "http://backend:3001")
    23|
    24|# Logging
    25|logging.basicConfig(
    26|    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    27|    level=logging.INFO
    28|)
    29|logger = logging.getLogger(__name__)
    30|
    31|# Mini App secret for WebAppData verification
    32|BOT_TOKEN_SECRET = hashlib.sha256(BOT_TOKEN.encode()).digest()
    33|
    34|def verify_webapp_data(init_data: str) -> dict:
    35|    """Verify Telegram WebApp init data"""
    36|    try:
    37|        parsed = dict(param.split("=", 1) for param in init_data.split("&"))
    38|        hash_received = parsed.pop("hash", "")
    39|        data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(parsed.items()))
    40|        computed_hash = hmac.new(
    41|            BOT_TOKEN_SECRET,
    42|            data_check_string.encode(),
    43|            hashlib.sha256
    44|        ).hexdigest()
    45|        if computed_hash != hash_received:
    46|            return None
    47|        return parsed
    48|    except Exception as e:
    49|        logger.error(f"WebApp verify error: {e}")
    50|        return None
    51|
    52|async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    53|    """Handle /start command"""
    54|    user = update.effective_user
    55|    args = context.args
    56|
    57|    # Deep link: /start olymp_N where N = olympiad ID
    58|    if args and args[0].startswith("olymp_"):
    59|        olymp_id = args[0].replace("olymp_", "")
    60|        return await show_olympiad(update, context, olymp_id)
    61|
    62|    text = (
    63|        f"🏆 *НейроСфера — Олимпиады*\n\n"
    64|        f"Привет, {user.first_name}! Добро пожаловать на платформу "
    65|        f"AI-олимпиад с задачами, рейтингом и AI-тьютором.\n\n"
    66|        f"📚 *926 задач* по 34 направлениям\n"
    67|        f"🤖 *AI-тьютор* — 7 режимов обучения\n"
    68|        f"🏅 *Рейтинг и достижения*\n"
    69|        f"🎯 *Олимпиады* — соревнуйся с другими\n\n"
    70|        f"Нажми кнопку ниже, чтобы открыть Mini App:"
    71|    )
    72|
    73|    keyboard = [[
    74|        InlineKeyboardButton("🚀 Открыть Mini App", web_app=WebAppInfo(url=WEBAPP_URL))
    75|    ]]
    76|    reply_markup = InlineKeyboardMarkup(keyboard)
    77|    await update.message.reply_text(text, reply_markup=reply_markup, parse_mode="Markdown")
    78|
    79|async def olymp(update: Update, context: ContextTypes.DEFAULT_TYPE):
    80|    """Show all available olympiads"""
    81|    keyboard = [
    82|        [InlineKeyboardButton("🏆 Все олимпиады", web_app=WebAppInfo(url=f"{WEBAPP_URL}/olympiads"))],
    83|        [InlineKeyboardButton("📚 Задачи", web_app=WebAppInfo(url=f"{WEBAPP_URL}/tasks"))],
    84|        [InlineKeyboardButton("📊 Рейтинг", web_app=WebAppInfo(url=f"{WEBAPP_URL}/leaderboard"))],
    85|    ]
    86|    reply_markup = InlineKeyboardMarkup(keyboard)
    87|    await update.message.reply_text(
    88|        "🏆 *Олимпиады НейроСферы*\n\nВыбери раздел:",
    89|        reply_markup=reply_markup,
    90|        parse_mode="Markdown"
    91|    )
    92|
    93|async def stats(update: Update, context: ContextTypes.DEFAULT_TYPE):
    94|    """Show user stats"""
    95|    user = update.effective_user
    96|    try:
    97|        resp = requests.get(f"{API_URL}/api/users/telegram/{user.id}", timeout=5)
    98|        if resp.status_code == 200:
    99|            data = resp.json()
   100|            text = (
   101|                f"📊 *Твоя статистика*\n\n"
   102|                f"⭐ XP: {data.get('xp', 0)}\n"
   103|                f"🏆 Уровень: {data.get('level', 1)}\n"
   104|                f"✅ Решено задач: {data.get('solved_tasks', 0)}\n"
   105|                f"🔥 Серия: {data.get('streak', 0)} дней\n"
   106|                f"🥇 Рейтинг: #{data.get('rank', '—')}"
   107|            )
   108|        else:
   109|            text = "📊 *Статистика*\n\nРешай задачи, чтобы появилась статистика!"
   110|    except Exception:
   111|        text = "📊 *Статистика*\n\nПока нет данных. Начни решать задачи!"
   112|
   113|    keyboard = [[InlineKeyboardButton("📊 Профиль", web_app=WebAppInfo(url=f"{WEBAPP_URL}/profile"))]]
   114|    reply_markup = InlineKeyboardMarkup(keyboard)
   115|    await update.message.reply_text(text, reply_markup=reply_markup, parse_mode="Markdown")
   116|
   117|async def top(update: Update, context: ContextTypes.DEFAULT_TYPE):
   118|    """Show leaderboard"""
   119|    try:
   120|        resp = requests.get(f"{API_URL}/api/leaderboard?limit=10", timeout=5)
   121|        if resp.status_code == 200:
   122|            users = resp.json()
   123|            lines = ["🏆 *Топ-10 рейтинга*\n"]
   124|            for i, u in enumerate(users[:10], 1):
   125|                medal = {1:"🥇", 2:"🥈", 3:"🥉"}.get(i, f"{i}.")
   126|                name = u.get('username', u.get('telegram_name', 'Аноним'))
   127|                lines.append(f"{medal} *{name}* — {u.get('xp', 0)} XP")
   128|            text = "\n".join(lines)
   129|        else:
   130|            text = "🏆 *Рейтинг*\n\nПока пусто. Будь первым!"
   131|    except Exception:
   132|        text = "🏆 *Рейтинг*\n\nСервер недоступен. Попробуй позже."
   133|
   134|    keyboard = [[InlineKeyboardButton("🥇 Полный рейтинг", web_app=WebAppInfo(url=f"{WEBAPP_URL}/leaderboard"))]]
   135|    reply_markup = InlineKeyboardMarkup(keyboard)
   136|    await update.message.reply_text(text, reply_markup=reply_markup, parse_mode="Markdown")
   137|
   138|async def show_olympiad(update, context, olymp_id):
   139|    """Show specific olympiad detail"""
   140|    try:
   141|        resp = requests.get(f"{API_URL}/api/olympiads/{olympiad_id}", timeout=5)
   142|        if resp.status_code == 200:
   143|            ol = resp.json()
   144|            text = (
   145|                f"🏆 *{ol.get('title', 'Олимпиада')}*\n\n"
   146|                f"{ol.get('description', '')}\n\n"
   147|                f"📝 Задач: {ol.get('task_count', 0)}\n"
   148|                f"👥 Участников: {ol.get('participants', 0)}\n"
   149|                f"⏳ Статус: {ol.get('status', 'активна')}"
   150|            )
   151|        else:
   152|            text = "Олимпиада не найдена"
   153|    except Exception:
   154|        text = "Ошибка загрузки олимпиады"
   155|
   156|    keyboard = [[InlineKeyboardButton("📚 К задачам", web_app=WebAppInfo(url=f"{WEBAPP_URL}/tasks?olympiad={olympiad_id}"))]]
   157|    reply_markup = InlineKeyboardMarkup(keyboard)
   158|    await update.message.reply_text(text, reply_markup=reply_markup, parse_mode="Markdown")
   159|
   160|async def tutor(update: Update, context: ContextTypes.DEFAULT_TYPE):
   161|    """Open AI-tutor"""
   162|    keyboard = [[InlineKeyboardButton("🤖 AI-тьютор", web_app=WebAppInfo(url=f"{WEBAPP_URL}/tutor"))]]
   163|    reply_markup = InlineKeyboardMarkup(keyboard)
   164|    await update.message.reply_text(
   165|        "🤖 *AI-тьютор*\n\n7 режимов обучения. Socratic метод. "
   166|        "Задай вопрос или отправь фото задачи — тьютор поможет!",
   167|        reply_markup=reply_markup,
   168|        parse_mode="Markdown"
   169|    )
   170|
   171|async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
   172|    """Handle button callbacks"""
   173|    query = update.callback_query
   174|    await query.answer()
   175|    data = query.data.split("_")
   176|
   177|    if data[0] == "olymp":
   178|        await show_olympiad(query, context, data[1] if len(data) > 1 else None)
   179|
   180|async def webapp_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
   181|    """Handle WebApp data (Mini App → Bot)"""
   182|    if not update.effective_message or not update.effective_message.web_app_data:
   183|        return
   184|
   185|    data = update.effective_message.web_app_data
   186|    user = update.effective_user
   187|
   188|    try:
   189|        payload = json.loads(data.data)
   190|        action = payload.get("action", "")
   191|
   192|        if action == "share_result":
   193|            text = (
   194|                f"🎯 *{user.first_name}* решил задачу!\n"
   195|                f"Задача: {payload.get('task_title', '—')}\n"
   196|                f"⭐ +{payload.get('xp', 0)} XP"
   197|            )
   198|            await update.effective_message.reply_text(text, parse_mode="Markdown")
   199|
   200|    except json.JSONDecodeError:
   201|        pass
   202|
   203|async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
   204|    """Show help"""
   205|    text = (
   206|        "🤖 *НейроСфера — Помощь*\n\n"
   207|        "*/start* — приветствие и Mini App\n"
   208|        "*/olymp* — все олимпиады\n"
   209|        "*/stats* — твоя статистика\n"
   210|        "*/top* — рейтинг\n"
   211|        "*/tutor* — AI-тьютор\n"
   212|        "*/help* — эта справка\n\n"
   213|        "Открой Mini App для полного функционала:"
   214|    )
   215|    keyboard = [[InlineKeyboardButton("🚀 Mini App", web_app=WebAppInfo(url=WEBAPP_URL))]]
   216|    reply_markup = InlineKeyboardMarkup(keyboard)
   217|    await update.message.reply_text(text, reply_markup=reply_markup, parse_mode="Markdown")
   218|
   219|def main():
   220|    """Start the bot"""
   221|    app = Application.builder().token(BOT_TOKEN).build()
   222|
   223|    # Commands
   224|    app.add_handler(CommandHandler("start", start))
   225|    app.add_handler(CommandHandler("olymp", olymp))
   226|    app.add_handler(CommandHandler("stats", stats))
   227|    app.add_handler(CommandHandler("top", top))
   228|    app.add_handler(CommandHandler("tutor", tutor))
   229|    app.add_handler(CommandHandler("help", help_command))
   230|
   231|    # Callbacks & WebApp
   232|    app.add_handler(CallbackQueryHandler(button_callback))
   233|    app.add_handler(CallbackQueryHandler(webapp_data, pattern="^webapp_"))
   234|
   235|    logger.info(f"🤖 Bot @{BOT_USERNAME} started! WebApp: {WEBAPP_URL}")
   236|    print(f"🤖 @{BOT_USERNAME} запущен! Press Ctrl+C to stop.")
   237|    app.run_polling(allowed_updates=Update.ALL_TYPES)
   238|
   239|if __name__ == "__main__":
   240|    main()
   241|