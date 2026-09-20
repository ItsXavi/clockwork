#!/usr/bin/env node
/**
 * XFITTV Telegram bot — talk to the fitness marketing agents in chat.
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
process.on("SIGTERM", () => {
  stopping = true;
});

console.log("XFITTV Telegram bot running. Open Telegram and message your bot.");
console.log(`Token loaded (ends with …${TOKEN.slice(-4)}, length ${TOKEN.length}).`);
if (allowed.size) console.log(`Allowlist: ${[...allowed].join(", ")}`);
else console.log("No TELEGRAM_ALLOWED_USERS set — anyone who finds the bot can use it.");

await api("deleteWebhook", { drop_pending_updates: false });
await setCommands([
  { command: "start", description: "Welcome + how to use" },
  { command: "help", description: "Command list" },
  { command: "week", description: "7-day calendar (reviewed)" },
  { command: "post", description: "Draft post: workouts|cooking|humor" },
  { command: "grow", description: "Follower growth playbook" },
  { command: "plan", description: "Weekly strategy summary" },
  { command: "today", description: "Today’s planned posts" },
  { command: "review", description: "What’s working / not working" }
]);
console.log("Webhook cleared. Polling for messages…");

while (!stopping) {
  try {
    const updates = await getUpdates(offset);
    if (updates.length) console.log(`Received ${updates.length} update(s)`);
    for (const update of updates) {
      offset = update.update_id + 1;
      try {
        await handleUpdate(update, {
          api: API,
          allowed,
          sendMessage,
          sendDocument,
          sendChatAction
        });
      } catch (err) {
        console.error("Handler error:", err);
        const chatId = update.message?.chat?.id;
        if (chatId) {
          try {
            await sendMessage(
              chatId,
              `Agent hit an error: ${err.message || "unknown"}. Try /help`
            );
          } catch (_) {
            /* ignore */
          }
        }
      }
    }
  } catch (err) {
    const msg = err.message || String(err);
    console.error("Poll error:", msg);
    if (/conflict/i.test(msg)) {
      console.error("Another getUpdates is running. Waiting 3s…");
      await sleep(3000);
    } else {
      await sleep(2000);
    }
  }
}

async function api(method, body = null, { form = null, timeoutMs = 35000 } = {}) {
  const url = `${API}/${method}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    let res;
    if (form) {
      res = await fetch(url, { method: "POST", body: form, signal: ctrl.signal });
    } else if (body) {
      res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: ctrl.signal
      });
    } else {
      res = await fetch(url, { signal: ctrl.signal });
    }
    const data = await res.json();
    if (!data.ok) {
      const err = new Error(data.description || `${method} failed`);
      err.code = data.error_code;
      throw err;
    }
    return data.result;
  } finally {
    clearTimeout(timer);
  }
}

async function getUpdates(nextOffset) {
  const url = `${API}/getUpdates?timeout=25&offset=${nextOffset}&allowed_updates=${encodeURIComponent('["message"]')}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 35000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    const data = await res.json();
    if (!data.ok) throw new Error(data.description || "getUpdates failed");
    return data.result || [];
  } finally {
    clearTimeout(timer);
  }
}

async function setCommands(commands) {
  try {
    await api("setMyCommands", { commands });
  } catch (err) {
    console.error("setMyCommands:", err.message);
  }
}

async function sendMessage(chatId, text, extra = {}) {
  const chunks = splitTelegram(String(text ?? ""));
  for (const chunk of chunks) {
    try {
      await api("sendMessage", {
        chat_id: chatId,
        text: chunk,
        disable_web_page_preview: true,
        ...extra
      });
      console.log(`Sent message to ${chatId} (${chunk.length} chars)`);
    } catch (err) {
      console.error(`sendMessage failed to ${chatId}:`, err.message);
      throw err;
    }
  }
}

async function sendDocument(chatId, filePath, caption = "") {
  try {
    const form = new FormData();
    form.append("chat_id", String(chatId));
    if (caption) form.append("caption", caption.slice(0, 1024));
    const buf = readFileSync(filePath);
    const name = filePath.split("/").pop() || "file.txt";
    form.append("document", new Blob([buf]), name);
    await api("sendDocument", null, { form, timeoutMs: 60000 });
    console.log(`Sent document to ${chatId}: ${name}`);
  } catch (err) {
    // Don't fail the whole command if the file attach fails — text already sent
    console.error(`sendDocument failed to ${chatId}:`, err.message);
  }
}

async function sendChatAction(chatId, action = "typing") {
  try {
    await api("sendChatAction", { chat_id: chatId, action }, { timeoutMs: 10000 });
  } catch (err) {
    console.error("sendChatAction:", err.message);
  }
}

function splitTelegram(text, max = 3500) {
  if (!text) return ["(empty reply)"];
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
    process.env[key] = val;
  }
}
