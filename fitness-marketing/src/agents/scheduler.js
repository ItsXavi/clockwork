import { addDays, weekdayName, todayISO } from "../lib/io.js";
import { generateDayPack } from "./content.js";
import { enrichPostWithTags } from "./captions.js";
import { reviewPost, loadMemory, logReviewedPost } from "./review.js";

const BEST_TIMES = {
  instagram: "17:30",
  tiktok: "12:00",
  x: "08:30",
  youtube_shorts: "18:00"
};

/**
 * Scheduler Agent — turns strategy + content into a dated calendar + CSV export.
 */
export function buildWeekCalendar(brand, hashtagConfig, options = {}) {
  const start = new Date(options.weekOf || todayISO());
  // normalize to Monday-ish: use provided date as day 0
  const days = [];

  for (let i = 0; i < 7; i++) {
    const date = addDays(start, i);
    const dateStr = todayISO(date);
    const platformsToday = platformsForDay(brand, i);
    const rawPosts = generateDayPack(brand, i + date.getDate(), platformsToday);
    const posts = rawPosts.map((p, idx) => {
      const enriched = enrichPostWithTags(p, brand, hashtagConfig, i * 10 + idx);
      const memory = loadMemory();
      const review = reviewPost(enriched, brand, memory);
      const scheduled = {
        ...enriched,
        date: dateStr,
        weekday: weekdayName(date),
        scheduledTime: BEST_TIMES[p.platform] || "12:00",
        status: review.pass ? "draft" : "needs_revision",
        review
      };
      logReviewedPost(scheduled, memory, {
        outcome: review.pass ? "calendar_approved" : "calendar_rejected"
      });
      return scheduled;
    });

    days.push({
      date: dateStr,
      weekday: weekdayName(date),
      posts,
      stories: i % 1 === 0 ? storyIdeas(brand, i) : []
    });
  }

  return {
    agent: "scheduler",
    weekOf: todayISO(start),
    brand: brand.brandName,
    timezoneNote: "Times are local suggestions — adjust to your analytics peak windows.",
    days,
    totals: summarize(days)
  };
}

function platformsForDay(brand, dayIndex) {
  // Rotate emphasis: more short-form midweek, X daily light touch
  const all = brand.platforms || ["instagram", "tiktok"];
  if (dayIndex === 0 || dayIndex === 3 || dayIndex === 5) {
    return all.filter((p) => p !== "x").concat(all.includes("x") ? ["x"] : []);
  }
  if (dayIndex === 6) {
    return all.filter((p) => ["instagram", "x"].includes(p));
  }
  return all.slice(0, Math.min(3, all.length));
}

function storyIdeas(brand, seed) {
  const ideas = [
    "Poll: push day or pull day?",
    `Quick tip sticker: ${brand.voice.signaturePhrases[seed % brand.voice.signaturePhrases.length]}`,
    "Gym humor story — ‘waiting for the bench’ add yours",
    "FAQ: ‘How much protein per day to start?’",
    `CTA: DM ‘PROTEIN’ for ${brand.offers[0]?.name || "meal ideas"}`,
    "Cooking B-roll: seasoning the chicken + macro sticker"
  ];
  return [ideas[seed % ideas.length], ideas[(seed + 2) % ideas.length]];
}

function summarize(days) {
  const byPlatform = {};
  let total = 0;
  days.forEach((d) => {
    d.posts.forEach((p) => {
      total += 1;
      byPlatform[p.platform] = (byPlatform[p.platform] || 0) + 1;
    });
  });
  return { posts: total, byPlatform };
}

export function calendarToMarkdown(calendar, strategy) {
  const lines = [];
  lines.push(`# ${calendar.brand} — Content Calendar`);
  lines.push(`Week of **${calendar.weekOf}**`);
  lines.push("");
  if (strategy) {
    lines.push(`## Strategy`);
    lines.push(strategy.summary);
    lines.push("");
    lines.push("**Weekly focus**");
    strategy.weeklyFocus.forEach((f) => lines.push(`- ${f}`));
    lines.push("");
    lines.push(`KPIs: ${strategy.kpis.join(", ")}`);
    lines.push("");
  }
  lines.push(`## Schedule (${calendar.totals.posts} posts)`);
  lines.push("");

  calendar.days.forEach((day) => {
    lines.push(`### ${day.weekday} · ${day.date}`);
    day.posts.forEach((p, i) => {
      const stamp = p.review
        ? p.review.pass
          ? `✅ review ${p.review.score}`
          : `❌ review ${p.review.score}`
        : "review pending";
      lines.push(
        `${i + 1}. **${p.platform}** · ${p.format} · ${p.scheduledTime} · _${p.pillar}_ · ${stamp}`
      );
      lines.push(`   - Hook: ${p.hook}`);
      lines.push(`   - Visual: ${p.visualDirection}`);
      if (p.review?.warnings?.length) {
        lines.push(`   - Review notes: ${p.review.warnings.join("; ")}`);
      }
      if (p.review?.issues?.length) {
        lines.push(`   - Review issues: ${p.review.issues.join("; ")}`);
      }
      lines.push("   - Caption:");
      lines.push("");
      lines.push("```");
      lines.push(p.caption);
      lines.push("```");
      lines.push("");
    });
    if (day.stories?.length) {
      lines.push("Stories:");
      day.stories.forEach((s) => lines.push(`- ${s}`));
      lines.push("");
    }
  });

  lines.push("---");
  lines.push(calendar.timezoneNote);
  return lines.join("\n");
}

export function calendarToCsv(calendar) {
  const header = [
    "date",
    "time",
    "platform",
    "format",
    "pillar",
    "hook",
    "caption",
    "hashtags",
    "status"
  ];
  const rows = [header.join(",")];
  calendar.days.forEach((day) => {
    day.posts.forEach((p) => {
      rows.push(
        [
          p.date,
          p.scheduledTime,
          p.platform,
          p.format,
          csvEscape(p.pillar),
          csvEscape(p.hook),
          csvEscape(p.caption),
          csvEscape((p.hashtags || []).join(" ")),
          p.status
        ].join(",")
      );
    });
  });
  return rows.join("\n");
}

function csvEscape(value) {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
