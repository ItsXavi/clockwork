import { pick, seededIndex } from "../lib/io.js";

const HOOKS = {
  workouts: [
    "Today’s XFITTV WOD — scale it and send it",
    "12-minute engine builder you can film anywhere",
    "Stop random metcons — run this session instead",
    "3 movements. One clock. Full-send conditioning",
    "Busy day protocol: strength + sweat in 30"
  ],
  nutrition: [
    "Pre-WOD fuel without the crash",
    "Protein targets for high-volume training",
    "Recovery plate after a brutal metcon",
    "Hydration rule before you hit the clock",
    "Simple grocery list for CrossFit weeks"
  ],
  mindset: [
    "Scale smart. Ego stays outside the box",
    "Missed a day? Here’s the 15-minute rescue session",
    "Intensity with intention — not chaos",
    "The identity shift: show up on the hard days",
    "Consistency beats one heroic WOD"
  ],
  proof: [
    "PR breakdown: what actually changed",
    "Same WOD, better splits — 8 weeks later",
    "Form fix that unlocked the lift",
    "Engine progress you can feel on the clock",
    "Before the highlight reel: the boring reps"
  ],
  community: [
    "This week’s XFITTV challenge — comment DONE",
    "Ask me anything: scaling & pacing",
    "Tag your partner and race this WOD",
    "Drop your biggest limiter below",
    "Comment WOD for the full session breakdown"
  ]
};

const BODIES = {
  workouts: [
    "Warm-up 5 → strength focus 12 → metcon 10–14. Scale loads so your form survives the clock. Film the work. Post the finish.",
    "EMOM or AMRAP structure. Pick movements you can repeat under fatigue. Leave one rep in the tank on the strength piece.",
    "Day template: power → strength → sweat. Same skeleton, swap movements. That’s how XFITTV stays progressive."
  ],
  nutrition: [
    "Protein at every meal. Carbs around training. Water before caffeine. Recovery starts on the plate.",
    "Pre-session: easy carbs + a little protein. Post-session: protein + carbs within the hour when you can.",
    "Keep a default breakfast and lunch. Decide dinner once. High training volume hates decision fatigue."
  ],
  mindset: [
    "Shrink the session until it’s non-negotiable. A scaled WOD finished beats a hero WOD skipped.",
    "Track inputs: sessions done, sleep, protein days. The clock times follow the habits.",
    "Identity line: ‘I train with intention.’ Scale when needed. Still finish."
  ],
  proof: [
    "We didn’t chase random intensity — we chased repeatable sessions. Splits dropped when attendance got honest.",
    "One metric for 30 days: weekly sessions completed. Capacity followed consistency.",
    "Cue fixed. Load moved. That’s the real transformation content."
  ],
  community: [
    "This week: 4 sessions. Comment DONE after each. Accountability > hype.",
    "Want the full WOD? Comment the keyword. I’ll send the breakdown.",
    "What’s your limiter — engine, strength, or recovery? Reply and I’ll give a fix."
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

function platformHandle(brand, platform) {
  return brand.handles?.[platform] || brand.handle || "";
}

function buildCaption({ brand, platform, hook, body, cta, phrase }) {
  const handle = platformHandle(brand, platform);
  const credit = brand.creator ? `${brand.displayName || brand.brandName} · ${brand.creator}` : brand.brandName;

  if (platform === "x") {
    return `${hook}\n\n${body}\n\n${phrase}\n\n${cta}`;
  }
  if (platform === "tiktok" || platform === "youtube_shorts") {
    return `${hook} — ${phrase}\n\n${body}\n\n${cta}\n\n${handle}`.trim();
  }
  // instagram / meta default
  return `${hook}\n\n${body}\n\n${phrase}\n\n${cta}\n\n.\n.\n.\n${handle} · ${credit} · ${brand.niche}`;
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
