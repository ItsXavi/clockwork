# XFITTV Telegram bot

Chat with the fitness marketing agents inside Telegram.

## 1. Create the bot (2 minutes)

1. Open Telegram and message [@BotFather](https://t.me/BotFather)
2. Send `/newbot`
3. Name it e.g. `XFITTV Agents`
4. Username e.g. `xfittv_agents_bot`
5. Copy the **HTTP API token**

## 2. Configure

```bash
cd fitness-marketing
cp .env.example .env
```

Edit `.env`:

```
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_ALLOWED_USERS=   # optional lock — use /id in the bot first
```

## 3. Run

```bash
npm run bot
```

Leave that process running. Open Telegram, find your bot, tap **Start**.

## Commands

| Command | What it does |
| --- | --- |
| `/start` | Welcome + handles |
| `/week` | 7-day calendar + `.md` / `.csv` files |
| `/post ig workouts` | One Instagram draft |
| `/post tiktok workouts` | One TikTok draft |
| `/grow` | Growth playbook |
| `/grow sprint` | Aggressive growth mode |
| `/plan` | Strategy summary |
| `/today` | Today’s posts from latest `/week` |
| `/id` | Your Telegram user id (for private mode) |

## Lock it to only you

1. Message the bot: `/id`
2. Put that number in `.env`:
   ```
   TELEGRAM_ALLOWED_USERS=123456789
   ```
3. Restart `npm run bot`

## Keep it online

- Local: leave the terminal open, or use `tmux` / `screen`
- Always-on: Railway, Render, Fly.io, a cheap VPS — run `npm run bot` as the start command and set `TELEGRAM_BOT_TOKEN` in the host env

Do **not** commit `.env` or share your BotFather token.
