import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { ROOT, todayISO } from "../lib/io.js";
import {
  loadBrand,
  runWeek,
  runPost,
  runGrow,
  runStrategy
} from "../pipeline.js";

export async function handleUpdate(update, ctx) {
  const msg = update.message;
  if (!msg?.text) return;

  const chatId = msg.chat.id;
  const userId = String(msg.from?.id || "");
  const text = msg.text.trim();

  if (ctx.allowed.size && !ctx.allowed.has(userId)) {
    await ctx.sendMessage(
      chatId,
      "This XFITTV bot is private. Ask Xavier to add your Telegram user id."
    );
    return;
  }

  if (text === "/id" || text.startsWith("/id@")) {
    await ctx.sendMessage(
      chatId,
      `Your Telegram user id: ${userId}\nChat id: ${chatId}\n\nAdd it to TELEGRAM_ALLOWED_USERS to lock the bot.`
    );
    return;
  }

  const [rawCmd, ...args] = text.split(/\s+/);
  const cmd = rawCmd.split("@")[0].toLowerCase();

  try {
    switch (cmd) {
      case "/start":
        await ctx.sendMessage(chatId, startText());
        break;
      case "/help":
        await ctx.sendMessage(chatId, helpText());
        break;
      case "/plan":
        await ctx.sendChatAction(chatId);
        await replyPlan(ctx, chatId, args);
        break;
      case "/week":
        await ctx.sendChatAction(chatId);
        await replyWeek(ctx, chatId, args);
        break;
      case "/post":
        await ctx.sendChatAction(chatId);
        await replyPost(ctx, chatId, args);
        break;
      case "/grow":
        await ctx.sendChatAction(chatId);
        await replyGrow(ctx, chatId, args);
        break;
      case "/today":
        await ctx.sendChatAction(chatId);
        await replyToday(ctx, chatId);
        break;
      default:
        if (cmd.startsWith("/")) {
          await ctx.sendMessage(chatId, "Unknown command. Try /help");
        } else {
          await ctx.sendMessage(
            chatId,
            "I’m the XFITTV agent bot. Use /week, /post, /grow, or /help."
          );
        }
    }
  } catch (err) {
    console.error(err);
    await ctx.sendMessage(
      chatId,
      `Something went wrong: ${err.message || "unknown error"}`
    );
  }
}

function startText() {
  const brand = loadBrand();
  return [
    `🏋️ ${brand.brandName} agents online`,
    brand.creator ? `Creator: ${brand.creator}` : null,
    `IG ${brand.handles?.instagram || brand.handle} · TikTok ${brand.handles?.tiktok || ""}`,
    "",
    "Talk to the bots with commands:",
    "/week — 7-day content calendar + files",
    "/post ig workouts — draft one Reel/TikTok",
    "/grow — follower growth playbook",
    "/plan — weekly strategy",
    "/today — today’s planned posts",
    "/id — your Telegram user id (for private mode)",
    "",
    "Type /help for details."
  ]
    .filter(Boolean)
    .join("\n");
}

function helpText() {
  return `XFITTV bot commands

/week [goal]
  Goals: grow_followers | nurture_leads | launch_offer
  Example: /week grow_followers

/post [platform] [pillar]
  Platforms: ig | tiktok
  Pillars: workouts | nutrition | mindset | proof | community
  Example: /post tiktok workouts

/grow [steady|sprint]
  Example: /grow sprint

/plan [goal]
/today
/id
/help`;
}

async function replyPlan(ctx, chatId, args) {
  const goal = args[0] || "grow_followers";
  const strategy = runStrategy({ goal });
  const lines = [
    `📋 Strategy · ${strategy.brand}`,
    strategy.summary,
    "",
    "Focus:",
    ...strategy.weeklyFocus.map((f) => `• ${f}`),
    "",
    `KPIs: ${strategy.kpis.join(", ")}`
  ];
  await ctx.sendMessage(chatId, lines.join("\n"));
}

async function replyWeek(ctx, chatId, args) {
  const goal = args[0] || "grow_followers";
  const { strategy, calendar, paths } = runWeek({ goal });
  const preview = [
    `📅 Week of ${calendar.weekOf} · ${calendar.totals.posts} posts`,
    strategy.summary,
    "",
    "By platform:",
    ...Object.entries(calendar.totals.byPlatform).map(
      ([p, n]) => `• ${p}: ${n}`
    ),
    "",
    "Sending markdown + CSV files next…"
  ].join("\n");
  await ctx.sendMessage(chatId, preview);
  await ctx.sendDocument(chatId, paths.mdPath, "Full calendar (markdown)");
  await ctx.sendDocument(chatId, paths.csvPath, "Import into Buffer/Later");
}

async function replyPost(ctx, chatId, args) {
  const platformRaw = (args[0] || "instagram").toLowerCase();
  const platform =
    platformRaw === "ig" || platformRaw === "insta"
      ? "instagram"
      : platformRaw === "tt"
        ? "tiktok"
        : platformRaw;
  const pillar = args[1] || "workouts";
  const format = platform === "tiktok" ? "reel" : args[2] || "reel";

  const { post, path } = runPost({ platform, pillar, format });
  const body = [
    `🎬 ${post.platform} · ${post.format} · ${post.pillar}`,
    "",
    `Hook: ${post.hook}`,
    "",
    post.caption,
    "",
    `Visual: ${post.visualDirection}`
  ].join("\n");
  await ctx.sendMessage(chatId, body);
  await ctx.sendDocument(chatId, path, "Post JSON");
}

async function replyGrow(ctx, chatId, args) {
  const intensity = args[0] || "steady";
  const { playbook, path } = runGrow({ intensity });
  const lines = [
    `📈 Growth · ${playbook.brand} (${playbook.intensity})`,
    "",
    playbook.principle,
    "",
    "Today:",
    ...playbook.dailyRhythm.map(
      (b) => `• ${b.block}: ${b.actions[0]}`
    ),
    "",
    "This week’s experiments:",
    ...playbook.weeklyExperiments.slice(0, 3).map((e) => `• ${e}`),
    "",
    "Full playbook file coming…"
  ];
  await ctx.sendMessage(chatId, lines.join("\n"));
  await ctx.sendDocument(chatId, path, "Growth playbook");
}

async function replyToday(ctx, chatId) {
  const latest = latestCalendarMarkdown();
  if (!latest) {
    await ctx.sendMessage(
      chatId,
      "No calendar yet. Run /week first, then /today."
    );
    return;
  }

  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const todayISODate = todayISO();
  const section = extractDaySection(latest.text, todayName, todayISODate);

  if (!section) {
    await ctx.sendMessage(
      chatId,
      `Couldn’t find ${todayName} in the latest calendar (${latest.name}). Run /week to refresh.`
    );
    return;
  }

  await ctx.sendMessage(chatId, `📌 Today (${todayName})\n\n${section}`);
}

function latestCalendarMarkdown() {
  const dir = join(ROOT, "output");
  let files;
  try {
    files = readdirSync(dir).filter(
      (f) => f.startsWith("calendar-") && f.endsWith(".md")
    );
  } catch {
    return null;
  }
  if (!files.length) return null;
  files.sort((a, b) => {
    return (
      statSync(join(dir, b)).mtimeMs - statSync(join(dir, a)).mtimeMs
    );
  });
  const name = files[0];
  return { name, text: readFileSync(join(dir, name), "utf8") };
}

function extractDaySection(markdown, weekday, isoDate) {
  const lines = markdown.split("\n");
  const start = lines.findIndex(
    (l) =>
      l.startsWith(`### ${weekday}`) ||
      (l.startsWith("### ") && l.includes(isoDate))
  );
  if (start === -1) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith("### ") || lines[i] === "---") {
      end = i;
      break;
    }
  }
  const chunk = lines.slice(start, end).join("\n").trim();
  // Keep Telegram-friendly: trim code fences content length
  return chunk.length > 3500 ? chunk.slice(0, 3500) + "\n…" : chunk;
}
