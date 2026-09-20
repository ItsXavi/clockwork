import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT, todayISO, loadJson } from "../lib/io.js";

const MEMORY_PATH = "config/content-memory.json";

const CROSSFIT_LEAKS = [
  /\bwod\b/i,
  /\bmetcon\b/i,
  /\bcrossfit\b/i,
  /\bemom\b/i,
  /\bamrap\b/i,
  /\bbox life\b/i,
  /\bengine builder\b/i,
  /\bscale it\. finish it/i
];

/**
 * Review Agent — every post must pass brand + memory checks.
 * Understands XFITTV is bodybuilding + gym humor + cooking (not CrossFit).
 */
export function loadMemory() {
  return loadJson(MEMORY_PATH);
}

export function saveMemory(memory) {
  memory.updatedAt = new Date().toISOString();
  writeFileSync(join(ROOT, MEMORY_PATH), JSON.stringify(memory, null, 2) + "\n", "utf8");
}

export function reviewPost(post, brand, memory = loadMemory()) {
  const text = `${post.hook || ""}\n${post.caption || ""}\n${post.pillar || ""}\n${post.visualDirection || ""}`;
  const issues = [];
  const warnings = [];
  const strengths = [];

  // Hard brand leaks
  for (const re of CROSSFIT_LEAKS) {
    if (re.test(text)) {
      issues.push(`CrossFit/WOD language leak matched ${re}`);
    }
  }

  if (brand.notThis?.length) {
    for (const phrase of brand.notThis) {
      if (text.toLowerCase().includes(String(phrase).toLowerCase())) {
        issues.push(`Conflicts with brand "not this": ${phrase}`);
      }
    }
  }

  // Pillar alignment
  const pillarId = post.pillarId || "";
  if (pillarId === "workouts" && !/(lift|set|rep|hypertrophy|push|pull|leg|chest|back|shoulder|muscle|bodybuild)/i.test(text)) {
    warnings.push("Training post is light on bodybuilding cues");
  }
  if (pillarId === "cooking" && !/(protein|meal|cook|recipe|macros|food|skillet|prep)/i.test(text)) {
    warnings.push("Cooking post is light on food/protein cues");
  }
  if (pillarId === "humor" && !/(gym|bench|squat|mirror|cardio|buddy|roast|pov|wait)/i.test(text)) {
    warnings.push("Humor post may not read as gym-relatable");
  }

  // CTA presence for feed formats
  if (["reel", "carousel", "short"].includes(post.format) && !/(follow|comment|save|tag|dm|share)/i.test(post.caption || "")) {
    warnings.push("Missing a clear CTA");
  }

  // Memory: reinforce what works / avoid what doesn't
  for (const item of memory.notWorking || []) {
    if (item.status === "confirmed" && /crossfit|wod|metcon/i.test(item.insight) && CROSSFIT_LEAKS.some((re) => re.test(text))) {
      issues.push(`Violates confirmed not-working insight: ${item.insight}`);
    }
  }

  for (const item of memory.working || []) {
    if (item.status === "confirmed" || item.status === "hypothesis") {
      // soft signal — note alignment
      if (/humor/i.test(item.insight) && pillarId === "humor") {
        strengths.push(`Aligns with working hypothesis: ${item.insight}`);
      }
      if (/cook|meal|protein/i.test(item.insight) && pillarId === "cooking") {
        strengths.push(`Aligns with working hypothesis: ${item.insight}`);
      }
      if (/bodybuild|demo|cue|save/i.test(item.insight) && pillarId === "workouts") {
        strengths.push(`Aligns with working hypothesis: ${item.insight}`);
      }
    }
  }

  if (brand.discipline === "bodybuilding" || brand.niche === "bodybuilding") {
    strengths.push("Brand discipline: bodybuilding");
  }

  const pass = issues.length === 0;
  const score = Math.max(0, 100 - issues.length * 35 - warnings.length * 10);

  return {
    agent: "review",
    pass,
    score,
    issues,
    warnings,
    strengths,
    memorySummary: {
      positioning: memory.positioning,
      workingCount: (memory.working || []).length,
      notWorkingCount: (memory.notWorking || []).length,
      loggedPosts: (memory.postLog || []).length
    },
    verdict: pass
      ? warnings.length
        ? "APPROVED WITH NOTES — on brand, tighten warnings before posting"
        : "APPROVED — on brand for XFITTV bodybuilding / humor / cooking"
      : "REJECTED — fix issues before this post goes out"
  };
}

export function reviewAndAttach(post, brand, memory = loadMemory()) {
  const review = reviewPost(post, brand, memory);
  const reviewed = { ...post, review };
  // Always log drafts into memory for agent continuity
  logReviewedPost(reviewed, memory, { outcome: review.pass ? "draft_approved" : "draft_rejected" });
  return reviewed;
}

export function logReviewedPost(post, memory = loadMemory(), { outcome = "draft", metrics = null } = {}) {
  const entry = {
    at: new Date().toISOString(),
    platform: post.platform,
    pillarId: post.pillarId,
    hook: post.hook,
    pass: post.review?.pass ?? null,
    score: post.review?.score ?? null,
    outcome,
    metrics
  };
  memory.postLog = [entry, ...(memory.postLog || [])].slice(0, 100);
  saveMemory(memory);
  return memory;
}

/**
 * Learn from creator-provided performance notes.
 * example: recordPerformance({ hook: "...", result: "working", note: "high saves", metrics: { saves: 120 } })
 */
export function recordPerformance({ result, note, hook = "", metrics = null }) {
  const memory = loadMemory();
  const bucket = result === "working" ? "working" : "notWorking";
  memory[bucket] = memory[bucket] || [];
  memory[bucket].unshift({
    insight: note,
    evidence: hook ? `hook: ${hook}` : "creator report",
    status: "confirmed",
    metrics: metrics || undefined,
    at: todayISO()
  });
  memory[bucket] = memory[bucket].slice(0, 30);
  saveMemory(memory);
  return memory;
}

export function memoryBrief(memory = loadMemory()) {
  const lines = [
    `XFITTV memory · ${memory.positioning?.is || "bodybuilding"}`,
    `Not: ${memory.positioning?.isNot || "CrossFit"}`,
    "",
    "What's working:"
  ];
  (memory.working || []).slice(0, 5).forEach((w) => {
    lines.push(`• (${w.status}) ${w.insight}`);
  });
  lines.push("", "What's not working:");
  (memory.notWorking || []).slice(0, 5).forEach((w) => {
    lines.push(`• (${w.status}) ${w.insight}`);
  });
  lines.push("", `Logged posts: ${(memory.postLog || []).length}`);
  return lines.join("\n");
}

export function reviewCalendar(calendar, brand, memory = loadMemory()) {
  const reviewedDays = calendar.days.map((day) => ({
    ...day,
    posts: day.posts.map((p) => {
      const review = reviewPost(p, brand, memory);
      return { ...p, review };
    })
  }));

  const all = reviewedDays.flatMap((d) => d.posts);
  const rejected = all.filter((p) => !p.review.pass);
  const flagged = all.filter((p) => p.review.warnings?.length);

  // Log each post into memory
  all.forEach((p) =>
    logReviewedPost(p, memory, {
      outcome: p.review.pass ? "calendar_approved" : "calendar_rejected"
    })
  );

  return {
    ...calendar,
    days: reviewedDays,
    reviewSummary: {
      total: all.length,
      approved: all.length - rejected.length,
      rejected: rejected.length,
      warnings: flagged.length,
      verdict:
        rejected.length === 0
          ? "All posts passed brand review (bodybuilding / humor / cooking)."
          : `${rejected.length} post(s) rejected — regenerate or edit before publishing.`
    }
  };
}

export function stripCrossfitAndRetry(generateFn) {
  // helper reserved for future rewrite loops
  return generateFn;
}

export function ensureMemoryFile() {
  const full = join(ROOT, MEMORY_PATH);
  if (!existsSync(full)) {
    saveMemory({
      brand: "XFITTV",
      positioning: {
        is: "bodybuilding + gym humor + cooking",
        isNot: "CrossFit / WOD / metcon brand"
      },
      working: [],
      notWorking: [],
      postLog: []
    });
  }
}
