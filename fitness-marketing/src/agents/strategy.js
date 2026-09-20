/**
 * Strategy Agent — turns brand config into a weekly content strategy.
 */
export function buildWeeklyStrategy(brand, options = {}) {
  const weekOf = options.weekOf || new Date().toISOString().slice(0, 10);
  const goal = options.goal || "grow_followers";

  const goals = {
    grow_followers: {
      northStar: "Qualified follower growth from saves, shares, and profile visits",
      focus: [
        "Hook-first Reels/Shorts that stop the scroll",
        "Saveable carousels (programs, checklists, myths)",
        "Clear CTAs that invite follows and comments",
        "Reply to every comment in the first 60 minutes"
      ],
      kpis: ["profile visits", "saves", "shares", "follower net growth", "avg watch %"]
    },
    nurture_leads: {
      northStar: "Move warm audience into the lead magnet / coaching pipeline",
      focus: [
        "Proof + process content",
        "Soft CTAs to free plan",
        "Stories that answer objections",
        "DM keyword automation"
      ],
      kpis: ["DM keyword replies", "link clicks", "lead magnet downloads", "call bookings"]
    },
    launch_offer: {
      northStar: "Fill coaching / challenge spots",
      focus: [
        "Urgency without hype",
        "Daily proof + FAQ Stories",
        "Before/after process posts",
        "Live Q&A"
      ],
      kpis: ["applications", "checkout clicks", "reply rate on offer posts"]
    }
  };

  const selected = goals[goal] || goals.grow_followers;

  const pillarPlan = brand.pillars.map((p) => ({
    pillar: p.name,
    id: p.id,
    weeklyShare: `${Math.round(p.share * 100)}%`,
    formats: p.formats,
    intent:
      p.id === "workouts"
        ? "Teach a hypertrophy session or cue"
        : p.id === "cooking"
          ? "Show a high-protein meal that tastes good"
          : p.id === "humor"
            ? "Relatable gym comedy with brand warmth"
            : p.id === "mindset"
              ? "Normalize discipline over motivation"
              : p.id === "proof"
                ? "Show physique/lift progress honestly"
                : "Invite comments, tags, and keywords"
  }));

  const memoryFocus = [
    "Every post is reviewed against bodybuilding + humor + cooking (never CrossFit/WOD)",
    "Double down on formats in content-memory.json → working",
    "Kill patterns listed in content-memory.json → notWorking",
    ...selected.focus
  ];

  return {
    agent: "strategy",
    weekOf,
    brand: brand.brandName,
    niche: brand.niche,
    discipline: brand.discipline || brand.niche,
    goal,
    northStar: selected.northStar,
    weeklyFocus: memoryFocus,
    kpis: selected.kpis,
    pillars: pillarPlan,
    cadence: brand.postingCadence,
    audienceReminder: brand.audience.primary,
    messagingGuardrails: {
      tone: brand.voice.tone,
      avoid: brand.voice.avoid,
      phrases: brand.voice.signaturePhrases,
      notThis: brand.notThis || []
    },
    summary: `${brand.brandName} · ${weekOf} · Bodybuilding + gym humor + cooking · Goal: ${goal.replace(/_/g, " ")}. Lead with ${brand.pillars[0].name.toLowerCase()}, mix in meals and jokes, review every post before it ships.`
  };
}
