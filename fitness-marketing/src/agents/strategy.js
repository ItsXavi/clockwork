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
        ? "Teach a repeatable skill or session"
        : p.id === "nutrition"
          ? "Simplify one decision"
          : p.id === "mindset"
            ? "Normalize consistency"
            : p.id === "proof"
              ? "Show real progress"
              : "Invite participation"
  }));

  return {
    agent: "strategy",
    weekOf,
    brand: brand.brandName,
    niche: brand.niche,
    goal,
    northStar: selected.northStar,
    weeklyFocus: selected.focus,
    kpis: selected.kpis,
    pillars: pillarPlan,
    cadence: brand.postingCadence,
    audienceReminder: brand.audience.primary,
    messagingGuardrails: {
      tone: brand.voice.tone,
      avoid: brand.voice.avoid,
      phrases: brand.voice.signaturePhrases
    },
    summary: `${brand.brandName} · ${weekOf} · Goal: ${goal.replace(/_/g, " ")}. Lead with ${brand.pillars[0].name.toLowerCase()} content, pair every post with one clear CTA, measure saves/shares over vanity likes.`
  };
}
