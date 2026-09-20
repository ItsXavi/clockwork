import { loadJson, writeOutput, todayISO } from "./lib/io.js";
import { buildWeeklyStrategy } from "./agents/strategy.js";
import { generatePost } from "./agents/content.js";
import { enrichPostWithTags } from "./agents/captions.js";
import { buildGrowthPlaybook } from "./agents/growth.js";
import {
  buildWeekCalendar,
  calendarToMarkdown,
  calendarToCsv
} from "./agents/scheduler.js";
import {
  reviewAndAttach,
  loadMemory,
  memoryBrief,
  recordPerformance,
  ensureMemoryFile
} from "./agents/review.js";

export function loadBrand() {
  return loadJson("config/brand.json");
}

export function loadHashtags() {
  return loadJson("config/hashtags.json");
}

export function runStrategy(opts = {}) {
  ensureMemoryFile();
  const brand = loadBrand();
  const strategy = buildWeeklyStrategy(brand, opts);
  return { ...strategy, memoryBrief: memoryBrief(loadMemory()) };
}

export function runWeek(opts = {}) {
  ensureMemoryFile();
  const brand = loadBrand();
  const hashtags = loadHashtags();
  const strategy = buildWeeklyStrategy(brand, opts);
  const calendar = buildWeekCalendar(brand, hashtags, opts);
  const markdown = calendarToMarkdown(calendar, strategy);
  const csv = calendarToCsv(calendar);
  const stamp = opts.weekOf || todayISO();
  const mdPath = writeOutput(`calendar-${stamp}.md`, markdown);
  const csvPath = writeOutput(`calendar-${stamp}.csv`, csv);
  const strategyPath = writeOutput(
    `strategy-${stamp}.json`,
    JSON.stringify({ ...strategy, memoryBrief: memoryBrief() }, null, 2)
  );
  const approved = calendar.days
    .flatMap((d) => d.posts)
    .filter((p) => p.review?.pass !== false).length;
  const total = calendar.totals.posts;
  return {
    strategy,
    calendar,
    review: { approved, total, memoryBrief: memoryBrief() },
    paths: { mdPath, csvPath, strategyPath }
  };
}

export function runPost(opts = {}) {
  ensureMemoryFile();
  const brand = loadBrand();
  const hashtags = loadHashtags();
  let post = enrichPostWithTags(
    generatePost(brand, {
      pillarId: opts.pillar || "workouts",
      platform: opts.platform || "instagram",
      format: opts.format || "reel",
      daySeed: opts.seed ?? Date.now() % 1000
    }),
    brand,
    hashtags,
    opts.seed ?? 1
  );
  post = reviewAndAttach(post, brand);
  const path = writeOutput(
    `post-${post.platform}-${todayISO()}.json`,
    JSON.stringify(post, null, 2)
  );
  return { post, path };
}

export function runGrow(opts = {}) {
  ensureMemoryFile();
  const brand = loadBrand();
  const playbook = buildGrowthPlaybook(brand, opts);
  const path = writeOutput(
    `growth-playbook-${todayISO()}.md`,
    growthToMarkdown(playbook) + "\n\n## Content memory\n\n" + memoryBrief()
  );
  return { playbook, path, memoryBrief: memoryBrief() };
}

export function runReview(opts = {}) {
  ensureMemoryFile();
  if (opts.note && opts.result) {
    const memory = recordPerformance({
      result: opts.result,
      note: opts.note,
      hook: opts.hook || "",
      metrics: opts.metrics || null
    });
    return { memory, brief: memoryBrief(memory), saved: true };
  }
  return { memory: loadMemory(), brief: memoryBrief(), saved: false };
}

export function runExportBuffer(opts = {}) {
  const { calendar, paths } = runWeek(opts);
  return { calendar, paths };
}

function growthToMarkdown(p) {
  const lines = [
    `# Growth Playbook — ${p.brand}`,
    "",
    `>${p.principle}`,
    "",
    `Intensity: **${p.intensity}**`,
    "",
    "## Daily rhythm"
  ];
  p.dailyRhythm.forEach((b) => {
    lines.push(`### ${b.block}`);
    b.actions.forEach((a) => lines.push(`- ${a}`));
    lines.push("");
  });
  lines.push("## Weekly experiments");
  p.weeklyExperiments.forEach((e) => lines.push(`- ${e}`));
  lines.push("");
  lines.push("## Profile optimization");
  p.profileOptimization.forEach((e) => lines.push(`- ${e}`));
  lines.push("");
  lines.push("## Funnel");
  p.funnel.forEach((f) => {
    lines.push(`- **${f.offer}** (${f.type}): ${f.path}`);
  });
  lines.push("");
  lines.push("## Do not");
  p.doNot.forEach((e) => lines.push(`- ${e}`));
  lines.push("");
  lines.push("## 30-day targets");
  p.thirtyDayTargets.forEach((e) => lines.push(`- ${e}`));
  lines.push("");
  return lines.join("\n");
}
