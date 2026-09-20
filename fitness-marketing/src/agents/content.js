import { pick, seededIndex } from "../lib/io.js";

const HOOKS = {
  workouts: [
    "The 30-minute session that actually builds muscle",
    "Stop doing random workouts — do this instead",
    "3 lifts that cover 80% of your results",
    "Busy week protocol: full body in 28 minutes",
    "If you only have 4 days, train like this"
  ],
  nutrition: [
    "Protein without meal prep drama",
    "The simplest plate method that works",
    "Cut fat without cutting your social life",
    "Grocery list for busy lifters",
    "Why ‘clean eating’ is slowing you down"
  ],
  mindset: [
    "Motivation is unreliable — build this instead",
    "Missed a workout? Do this in 10 minutes",
    "The identity shift that keeps you consistent",
    "Stop negotiating with yourself at 6am",
    "Progress isn’t linear — here’s the fix"
  ],
  proof: [
    "12 weeks of boring consistency (results)",
    "What changed when we tracked one metric",
    "Client win: stronger without living at the gym",
    "Before the glow-up: the actual program",
    "Form check: small fix, big strength jump"
  ],
  community: [
    "This week’s challenge (join in the comments)",
    "Ask me anything: programming edition",
    "Tag your training partner",
    "Drop your biggest gym obstacle below",
    "Free plan drop — comment START"
  ]
};

const BODIES = {
  workouts: [
    "Warm-up 5 min → A1 squat or hinge → A2 push → A3 pull → finisher 6–8 min. Rest 60–90s. Progressive overload beats novelty.",
    "Pick one main lift. Hit 4 hard sets. Pair accessories that don’t wreck recovery. Leave one rep in the tank.",
    "Day structure: power (3–5) → strength (5–8) → pump (10–15). Same template, swap movements weekly."
  ],
  nutrition: [
    "Anchor every meal with a palm of protein, a fist of carbs around training, and colorful plants. Repeat 80% of days.",
    "Hit protein first. Drink water. Sleep 7+. Fancy supplements are optional; the basics aren’t.",
    "Build a default breakfast + lunch. Decide dinner once. Decision fatigue is what ruins diets."
  ],
  mindset: [
    "Shrink the commitment until it’s non-negotiable. 20 minutes done beats the perfect session skipped.",
    "Track inputs you control: sessions completed, protein days, bedtime. Outcomes follow inputs.",
    "Identity line: ‘I’m someone who trains even on messy weeks.’ Act accordingly."
  ],
  proof: [
    "We didn’t chase intensity — we chased attendance. Strength climbed when the calendar got honest.",
    "One metric for 30 days. Photos optional. Energy and lifts told the story.",
    "Form cue fixed. Numbers moved. That’s the real transformation content."
  ],
  community: [
    "This week: 4 sessions. Comment done after each one. Accountability > hype.",
    "Want the plan? Comment the keyword. I’ll send the template.",
    "What’s one obstacle between you and consistency? I’ll reply with a fix."
  ]
};

const VISUALS = {
  reel: "Talking-head hook (0–2s) → demo or B-roll → on-screen text beats → end card CTA",
  carousel: "Cover hook → 5–7 value slides → final CTA slide with keyword",
  short: "Pattern interrupt first frame → demo → punchy caption VO → subscribe/follow end",
  story: "Poll or question sticker → quick tip → swipe/DM CTA",
  thread: "Hook tweet → 4–6 value posts → CTA reply or bookmark",
  live: "Agenda slide → Q&A → offer/lead magnet close"
};

/**
 * Content Agent — drafts platform-ready posts from strategy + pillars.
 */
export function generatePost(brand, { pillarId, platform, format, daySeed = 0 }) {
  const pillar = brand.pillars.find((p) => p.id === pillarId) || brand.pillars[0];
  const hooks = HOOKS[pillar.id] || HOOKS.workouts;
  const bodies = BODIES[pillar.id] || BODIES.workouts;
  const hook = pick(hooks, seededIndex(`${daySeed}-${pillar.id}-hook`, hooks.length));
  const body = pick(bodies, seededIndex(`${daySeed}-${pillar.id}-body`, bodies.length));
  const cta = pick(brand.ctaLibrary, seededIndex(`${daySeed}-cta`, brand.ctaLibrary.length));
  const phrase = pick(
    brand.voice.signaturePhrases,
    seededIndex(`${daySeed}-phrase`, brand.voice.signaturePhrases.length)
  );

  const caption = buildCaption({ brand, platform, hook, body, cta, phrase });

  return {
    agent: "content",
    pillar: pillar.name,
    pillarId: pillar.id,
    platform,
    format: format || pick(pillar.formats, daySeed),
    hook,
    caption,
    onScreenText: [hook, phrase, cta],
    visualDirection: VISUALS[format] || VISUALS.reel,
    filmingNotes: [
      "Front-facing light; vertical 9:16",
      "Hook in first 1–2 seconds with text overlay",
      "Show the movement or tip, don’t just talk",
      "End freeze-frame with CTA"
    ],
    compliance: brand.voice.avoid
  };
}

function buildCaption({ brand, platform, hook, body, cta, phrase }) {
  if (platform === "x") {
    return `${hook}\n\n${body}\n\n${phrase}\n\n${cta}`;
  }
  if (platform === "tiktok" || platform === "youtube_shorts") {
    return `${hook} — ${phrase}\n\n${body}\n\n${cta}\n\n${brand.handle}`;
  }
  // instagram default
  return `${hook}\n\n${body}\n\n${phrase}\n\n${cta}\n\n.\n.\n.\n${brand.handle} · ${brand.niche}`;
}

/**
 * Build a mixed set of posts for a day.
 */
export function generateDayPack(brand, daySeed, platforms) {
  const posts = [];
  const orderedPillars = weightedPillarOrder(brand.pillars, daySeed);
  const list = platforms || brand.platforms;

  list.forEach((platform, i) => {
    const pillar = orderedPillars[i % orderedPillars.length];
    const format = pick(pillar.formats, daySeed + i);
    posts.push(
      generatePost(brand, {
        pillarId: pillar.id,
        platform,
        format,
        daySeed: daySeed + i * 17
      })
    );
  });

  return posts;
}

function weightedPillarOrder(pillars, seed) {
  const expanded = [];
  pillars.forEach((p) => {
    const n = Math.max(1, Math.round(p.share * 10));
    for (let i = 0; i < n; i++) expanded.push(p);
  });
  // rotate by seed for variety
  const start = seededIndex(seed, expanded.length);
  return [...expanded.slice(start), ...expanded.slice(0, start)];
}
