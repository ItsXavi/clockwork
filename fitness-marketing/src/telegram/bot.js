#!/usr/bin/env node
/**
 * XFITTV Telegram bot — talk to the fitness marketing agents in chat.
 *
 * Setup:
 *   1. Message @BotFather → /newbot → copy token
 *   2. cp .env.example .env  (or export TELEGRAM_BOT_TOKEN=...)
 *   3. npm run bot
 *
 * Optional: TELEGRAM_ALLOWED_USERS=123456789,987654321 (your numeric user id)
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "../lib/io.js";
import { handleUpdate } from "./handlers.js";

loadDotEnv();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) {
  console.error(
    "Missing TELEGRAM_BOT_TOKEN.\nCreate a bot with @BotFather, then:\n  export TELEGRAM_BOT_TOKEN=your_token\n  npm run bot"
  );
  process.exit(1);
}

const API = `https://api.telegram.org/bot${TOKEN}`;
const allowed = new Set(
  (process.env.TELEGRAM_ALLOWED_USERS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
);

let offset = 0;
let stopping = false;

process.on("SIGINT", () => {
  stopping = true;
  console.log("\nStopping bot…");
});

console.log("XFITTV Telegram bot running. Open Telegram and message your bot.");
if (allowed.size) console.log(`Allowlist: ${[...allowed].join(", ")}`);
else console.log("No TELEGRAM_ALLOWED_USERS set — anyone who finds the bot can use it.");

await setCommands([
  { command: "start", description: "Welcome + how to use" },
  { command: "help", description: "Command list" },
  { command: "week", description: "Generate 7-day content calendar" },
  { command: "post", description: "Draft one post (IG or TikTok)" },
  { command: "grow", description: "Follower growth playbook" },
  { command: "plan", description: "Weekly strategy summary" },
  { command: "today", description: "Today’s posts from latest week plan" }
]);

while (!stopping) {
  try {
    const updates = await getUpdates(offset);
    for (const update of updates) {
      offset = update.update_id + 1;
      await handleUpdate(update, {
        api: API,
        allowed,
        sendMessage,
        sendDocument,
        sendChatAction
      });
    }
  } catch (err) {
    console.error("Poll error:", err.message || err);
    await sleep(2000);
  }
}

async function getUpdates(nextOffset) {
  const url = `${API}/getUpdates?timeout=30&offset=${nextOffset}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.ok) throw new Error(data.description || "getUpdates failed");
  return data.result || [];
}

async function setCommands(commands) {
  await fetch(`${API}/setMyCommands`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ commands })
  });
}

async function sendMessage(chatId, text, extra = {}) {
  for (const chunk of splitTelegram(text)) {
    const res = await fetch(`${API}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: chunk,
        disable_web_page_preview: true,
        ...extra
      })
    });
    const data = await res.json();
    if (!data.ok) console.error("sendMessage:", data.description);
  }
}

async function sendDocument(chatId, filePath, caption = "") {
  const form = new FormData();
  form.append("chat_id", String(chatId));
  if (caption) form.append("caption", caption.slice(0, 1024));
  const blob = new Blob([readFileSync(filePath)]);
  const name = filePath.split("/").pop() || "file.txt";
  form.append("document", blob, name);
  const res = await fetch(`${API}/sendDocument`, { method: "POST", body: form });
  const data = await res.json();
  if (!data.ok) console.error("sendDocument:", data.description);
}

async function sendChatAction(chatId, action = "typing") {
  await fetch(`${API}/sendChatAction`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action })
  });
}

function splitTelegram(text, max = 4000) {
  if (text.length <= max) return [text];
  const parts = [];
  let rest = text;
  while (rest.length > max) {
    let cut = rest.lastIndexOf("\n", max);
    if (cut < max * 0.5) cut = max;
    parts.push(rest.slice(0, cut));
    rest = rest.slice(cut).replace(/^\n+/, "");
  }
  if (rest) parts.push(rest);
  return parts;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadDotEnv() {
  const path = join(ROOT, ".env");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}
