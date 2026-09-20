import { pick, seededIndex } from "../lib/io.js";

const HOOKS = {
  workouts: [
    "Push day volume that actually builds your chest",
    "Stop ego lifting — chase this rep range instead",
    "The bodybuilding session I film on busy weeks",
    "Back thickness: 4 moves, no fluff",
    "Leg day structure for hypertrophy (not just sore)"
  ],
  cooking: [
    "High-protein dinner that doesn’t taste like meal prep sadness",
    "Gym bro cooking: 20 minutes, macros on point",
    "The breakfast I eat before heavy upper days",
    "Meal prep that still slaps on day 4",
    "Protein dessert that won’t ruin your cut"
  ],
  humor: [
    "Things you’ll only understand if you live in the gym",
    "POV: someone is curling in the squat rack again",
    "Gym timing olympics — waiting for one bench",
    "The mirror check nobody admits they do",
    "Cardio people vs bodybuilders (friendly fire)"
  ],
  mindset: [
    "Missed a session? Here’s the minimum effective day",
    "Discipline beats motivation when the gym is empty",
    "Progress photos lie weekly — consistency doesn’t",
    "Train for the physique, not the algorithm",
    "Boring sets. Big results."
  ],
  proof: [
    "Same lift, better control — 8 weeks later",
    "What changed when I tracked protein honestly",
    "Physique note: lighting optional, effort required",
    "Form fix that unlocked the pump",
    "Before the highlight reel: the quiet sets"
  ],
  community: [
    "This week’s XFITTV challenge — comment DONE",
    "Ask me anything: bodybuilding & meal prep",
    "Tag your gym buddy who skips legs",
    "Drop your favorite high-protein meal below",
    "Comment RECIPE for the full meal breakdown"
  ],
  // legacy alias if old calendars reference nutrition
  nutrition: [
    "High-protein dinner that doesn’t taste like meal prep sadness",
    "Gym bro cooking: 20 minutes, macros on point",
    "The breakfast I eat before heavy upper days"
  ]
};

const BODIES = {
  workouts: [
    "Warm-up → compound focus (3–4 working sets) → isolation finishers. Chase the pump with controlled eccentrics. Progressive overload weekly.",
    "Push / pull / legs template. Log your top sets. Leave 1–2 reps in the tank. Film the working sets, not just the flex.",
    "Hypertrophy range 6–12 on main lifts, 10–15 on accessories. Rest enough to keep form clean. That’s bodybuilding."
  ],
  cooking: [
    "Protein first, flavor second, aesthetics third. Season properly. Weigh once, cook often. Your cut shouldn’t taste like cardboard.",
    "One skillet, one protein, one carb, one vegetable. 20–25 minutes. Macros you can repeat on training days.",
    "Prep the protein in bulk, sauce it different each night. Same chicken energy, different personality."
  ],
  humor: [
    "If you’ve ever waited 15 minutes for a bench while someone films a set of 3… this one’s for you. Laugh, then go lift.",
    "Gym culture is wild. We roast it lovingly — then we still hit the session. XFITTV humor with a bodybuilding backbone.",
    "Relatable gym moments > fake motivational speeches. If it happened to you this week, share it."
  ],
  mindset: [
    "Shrink the session until it’s non-negotiable. A short hypertrophy day finished beats the perfect week skipped.",
    "Track inputs: sessions, protein, sleep. The physique follows the boring calendar.",
    "Identity line: ‘I’m a bodybuilder who shows up.’ Humor optional. Consistency not optional."
  ],
  proof: [
    "We didn’t chase random intensity — we chased progressive overload and protein. The mirror caught up later.",
    "One metric for 30 days: weekly sessions + daily protein. Physique notes follow.",
    "Cue fixed. Load moved. Pump improved. That’s the real content."
  ],
  community: [
    "This week: 4 training days + 2 cooked meals filmed. Comment DONE. Accountability > hype.",
    "Want the recipe or the full session? Comment the keyword and I’ll send it.",
    "What’s your limiter — recovery, protein, or skipping legs? Reply and I’ll roast you helpfully."
  ],
  nutrition: [
    "Protein first, flavor second. Season properly. Your cut shouldn’t taste like cardboard.",
    "One skillet, one protein, one carb, one vegetable. Macros you can repeat."
  ]
};

const VISUALS = {
  reel: "Talking-head hook (0–2s) → lift/cook demo or joke beat → on-screen text → end card CTA",
  carousel: "Cover hook → 5–7 value slides → final CTA slide with keyword",
  short: "Pattern interrupt first frame → demo/joke → punchy caption VO → follow end",
  story: "Poll or question sticker → quick tip or meme → swipe/DM CTA",
  thread: "Hook → 4–6 value posts → CTA",
  live: "Agenda → Q&A (training + cooking) → offer close"
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
  const resolvedFormat = format || pick(pillar.formats, daySeed);

  return {
    agent: "content",
    pillar: pillar.name,
    pillarId: pillar.id,
    platform,
    format: resolvedFormat,
    hook,
    caption,
    onScreenText: [hook, phrase, cta],
    visualDirection: VISUALS[resolvedFormat] || VISUALS.reel,
    filmingNotes: filmingNotesFor(pillar.id),
    compliance: brand.voice.avoid
  };
}

function filmingNotesFor(pillarId) {
  const base = [
    "Front-facing light; vertical 9:16",
    "Hook in first 1–2 seconds with text overlay",
    "End freeze-frame with CTA"
  ];
  if (pillarId === "cooking") {
    return [...base, "Show the food — sizzle, plate, bite/macros on screen"];
  }
  if (pillarId === "humor") {
    return [...base, "Commit to the bit; cut fast; don’t over-explain the joke"];
  }
  if (pillarId === "workouts") {
    return [...base, "Show working sets / form cues — not just talking"];
  }
  return [...base, "Show the tip, don’t just talk"];
}

function platformHandle(brand, platform) {
  return brand.handles?.[platform] || brand.handle || "";
}

function buildCaption({ brand, platform, hook, body, cta, phrase }) {
  const handle = platformHandle(brand, platform);
  const credit = brand.creator
    ? `${brand.displayName || brand.brandName} · ${brand.creator}`
    : brand.brandName;

  if (platform === "x") {
    return `${hook}\n\n${body}\n\n${phrase}\n\n${cta}`;
  }
  if (platform === "tiktok" || platform === "youtube_shorts") {
    return `${hook} — ${phrase}\n\n${body}\n\n${cta}\n\n${handle}`.trim();
  }
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
  const start = seededIndex(seed, expanded.length);
  return [...expanded.slice(start), ...expanded.slice(0, start)];
}
