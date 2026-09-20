import { loadMemory } from "./review.js";

/**
 * Media Review Agent — reviews uploaded gym/cooking videos against XFITTV brand.
 * Metadata + caption review always runs in Telegram.
 * Full visual watch: Cursor video reviewer on the saved file in output/media/.
 */
export function reviewMedia(
  { type, meta = {}, caption = "", localName = "" },
  brand,
  memory = loadMemory()
) {
  const text = `${caption} ${localName}`.toLowerCase();
  const issues = [];
  const notes = [];
  const strengths = [];
  const ideas = [];

  const isVertical =
    meta.width && meta.height ? meta.height >= meta.width : true;
  if (type === "video" || type === "video_note" || type === "animation") {
    if (!isVertical) {
      notes.push("Not vertical — crop/export 9:16 for Reels/TikTok when you can");
    } else {
      strengths.push("Vertical framing (good for Reels/TikTok)");
    }
    if (meta.duration != null) {
      if (meta.duration < 7) notes.push("Very short — hook must hit in first second");
      else if (meta.duration > 45) {
        notes.push("Long for feed — consider a 15–30s cut for Reels/TikTok");
      } else {
        strengths.push(`Solid length (${meta.duration}s)`);
      }
    }
  }

  const looksCooking = /(cook|meal|protein|recipe|food|kitchen|chef)/i.test(text);
  const looksHumor = /(funny|joke|meme|fail|humor|lol|rack|bench)/i.test(text);
  const looksLifting =
    /(lift|gym|pump|hypertrophy|chest|back|leg|push|pull|set|rep|bodybuild)/i.test(
      text
    );

  let guessedPillar = "workouts";
  if (looksCooking) guessedPillar = "cooking";
  else if (looksHumor) guessedPillar = "humor";
  else if (looksLifting) guessedPillar = "workouts";
  else notes.push("No caption cues — reply with: cooking / humor / workouts");

  if (/\b(wod|metcon|crossfit|amrap|emom)\b/i.test(text)) {
    issues.push("Caption/file leans CrossFit — reframe as bodybuilding language");
  }

  strengths.push(`Brand lane: ${brand.discipline || brand.niche} + humor + cooking`);
  notes.push(`Best-fit pillar guess: ${guessedPillar}`);

  for (const w of memory.working || []) {
    if (w.status === "confirmed") strengths.push(`Memory (working): ${w.insight}`);
  }

  ideas.push("Hook text on screen in first 1–2 seconds");
  if (guessedPillar === "workouts") {
    ideas.push("Show the working set / form cue — not only the flex");
    ideas.push("CTA: Save for next push/pull day");
  } else if (guessedPillar === "cooking") {
    ideas.push("Show the sizzle/plate + macros on screen");
    ideas.push("CTA: Comment RECIPE");
  } else {
    ideas.push("Commit to the bit; cut fast; end on brand");
    ideas.push("CTA: Tag your gym buddy");
  }

  const pass = issues.length === 0;
  return {
    agent: "media_review",
    pass,
    guessedPillar,
    issues,
    notes,
    strengths,
    ideas,
    verdict: pass
      ? "Usable for XFITTV — tighten hook/CTA before posting"
      : "Fix brand issues before posting",
    watchNote:
      "File saved on the agent server. For a full visual watch, tell Cursor: “review my latest Telegram video.”"
  };
}

export function formatMediaReviewMessage(review, saved) {
  return [
    `🎥 Got your ${saved.type} — downloaded + reviewed`,
    saved.meta?.duration != null ? `Length: ${saved.meta.duration}s` : null,
    saved.meta?.width ? `Size: ${saved.meta.width}x${saved.meta.height}` : null,
    `File: ${saved.localName}`,
    "",
    `Verdict: ${review.verdict}`,
    `Pillar guess: ${review.guessedPillar}`,
    "",
    review.strengths?.length
      ? `Strengths:\n${review.strengths.map((s) => `• ${s}`).join("\n")}`
      : null,
    review.notes?.length
      ? `\nNotes:\n${review.notes.map((s) => `• ${s}`).join("\n")}`
      : null,
    review.issues?.length
      ? `\nIssues:\n${review.issues.map((s) => `• ${s}`).join("\n")}`
      : null,
    review.ideas?.length
      ? `\nPost ideas:\n${review.ideas.map((s) => `• ${s}`).join("\n")}`
      : null,
    "",
    "After it goes live:",
    "/review working this video got saves",
    "/review not_working people skipped the hook",
    "",
    review.watchNote
  ]
    .filter(Boolean)
    .join("\n");
}
