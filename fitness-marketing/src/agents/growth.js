/**
 * Growth Agent — ethical follower-growth playbook (no spam / fake engagement).
 */
export function buildGrowthPlaybook(brand, options = {}) {
  const intensity = options.intensity || "steady"; // steady | sprint

  const daily = [
    {
      block: "Create (45–75 min)",
      actions: [
        "Batch-film 3 short-form pieces from the weekly calendar",
        "Write captions + first-comment hashtags offline",
        "Prepare 3 Story frames (tip, poll, CTA)"
      ]
    },
    {
      block: "Distribute (20 min)",
      actions: [
        "Post at your peak window (test 7–9am or 5–7pm local)",
        "Native upload per platform — avoid cross-post watermarks when possible",
        "Pin a comment with CTA keyword or question"
      ]
    },
    {
      block: "Engage (25–40 min)",
      actions: [
        "Reply to every comment on your last 3 posts within 60 minutes of posting",
        `Engage thoughtfully on 10–15 accounts in ${brand.niche} (coaches, clients, adjacent creators)`,
        "Leave specific compliments or form cues — not ‘🔥🔥’ spam",
        "Answer DMs; route keyword replies to the lead magnet"
      ]
    },
    {
      block: "Learn (10 min)",
      actions: [
        "Note top 3 hooks by watch % / saves",
        "Log winners/losers with /review so all agents remember",
        "Kill formats under 20% average watch after 5 posts",
        "Double down on bodybuilding demos, humor, or cooking — whichever won"
      ]
    }
  ];

  const weeklyExperiments =
    intensity === "sprint"
      ? [
          "Post 2× Reels/day for 7 days; keep hooks under 8 words",
          "Run a 5-day challenge with daily Story check-ins",
          "Collaborate stitch/duet with 2 creators in your niche",
          "Go Live once for Q&A + plan giveaway"
        ]
      : [
          "A/B test 2 hook styles on the same tip",
          "One carousel deep-dive + four short demos",
          "One collaboration or guest Story takeover",
          "Refresh profile bio CTA and link-in-bio offer"
        ];

  const ig = brand.handles?.instagram || brand.handle;
  const tt = brand.handles?.tiktok || brand.handle;
  const profileOptimization = [
    `Instagram name: ${brand.displayName || brand.brandName}${brand.creator ? ` | ${brand.creator}` : ""}`,
    `Handles: IG/Meta ${ig} · TikTok ${tt}`,
    `Name/niche line: ${brand.brandName} | ${brand.niche}`,
    "Bio line 1: who you help + outcome (bodybuilding / muscle)",
    "Bio line 2: gym humor + high-protein cooking",
    "Bio line 3: CTA (meal pack / DM PROTEIN)",
    "Pinned posts: best training Reel + cooking Reel + humor Reel",
    "Highlight covers: Start Here, Training, Meals, Humor, PRs"
  ];

  const doNot = [
    "Do not buy followers, bots, or engagement pods",
    "Do not mass-follow/unfollow or copy-paste spam comments",
    "Do not scrape competitor follower lists for cold outreach abuse",
    "Do not make medical or guaranteed-result claims",
    "Do not auto-DM strangers at scale without consent/platform compliance"
  ];

  const funnel = brand.offers.map((o) => ({
    offer: o.name,
    type: o.type,
    path:
      o.type === "lead_magnet"
        ? "Content CTA → keyword comment/DM → deliver free plan → nurture sequence → coaching invite"
        : "Proof content → Stories FAQ → application / checkout → onboarding"
  }));

  return {
    agent: "growth",
    brand: brand.brandName,
    intensity,
    principle:
      "Growth compounds from watchable hooks + saveable value + human replies — not from automation spam.",
    dailyRhythm: daily,
    weeklyExperiments,
    profileOptimization,
    funnel,
    doNot,
    thirtyDayTargets: [
      "Ship 20+ short-form videos",
      "Hit 10 save-worthy carousels",
      "Convert profile visits with a clear free offer",
      "Build a reply habit that trains the algorithm you’re a real creator"
    ]
  };
}
