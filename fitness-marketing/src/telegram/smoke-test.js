#!/usr/bin/env node
/**
 * Smoke-test Telegram handlers without a live Telegram connection.
 */
import { handleUpdate } from "./handlers.js";

const sent = [];
const docs = [];

const ctx = {
  api: "mock",
  allowed: new Set(),
  async sendMessage(chatId, text) {
    sent.push({ chatId, text });
    console.log("\n--- MESSAGE ---\n" + text.slice(0, 500));
  },
  async sendDocument(chatId, filePath, caption) {
    docs.push({ chatId, filePath, caption });
    console.log(`\n--- DOCUMENT --- ${filePath} (${caption})`);
  },
  async sendChatAction() {}
};

async function cmd(text) {
  console.log(`\n======== ${text} ========`);
  await handleUpdate(
    {
      message: {
        chat: { id: 1 },
        from: { id: 42 },
        text
      }
    },
    ctx
  );
}

await cmd("/start");
await cmd("/help");
await cmd("/plan grow_followers");
await cmd("/post tiktok workouts");
await cmd("/grow steady");
await cmd("/week grow_followers");
await cmd("/today");

console.log(`\nOK: ${sent.length} messages, ${docs.length} documents`);
