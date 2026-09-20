#!/usr/bin/env node
import {
  runStrategy,
  runWeek,
  runPost,
  runGrow,
  runExportBuffer,
  runReview
} from "./pipeline.js";

const [cmd, ...rest] = process.argv.slice(2);

function flag(name, fallback) {
  const i = rest.indexOf(`--${name}`);
  if (i === -1) return fallback;
  return rest[i + 1] ?? fallback;
}

function printHelp() {
  console.log(`
XFITTV Fitness Marketing Agents (bodybuilding · gym humor · cooking)

Usage:
  npm start -- <command> [options]

Commands:
  plan                 Weekly strategy (JSON to stdout)
  week                 Full 7-day calendar + CSV (every post reviewed)
  post                 Single post draft (auto brand review)
  grow                 Follower growth playbook
  review               Show memory / log what worked or didn't
  export               Alias for week (Buffer/Later CSV)

Options:
  --weekOf YYYY-MM-DD  Calendar start date
  --goal               grow_followers | nurture_leads | launch_offer
  --platform           instagram | tiktok
  --pillar             workouts | cooking | humor | mindset | proof | community
  --format             reel | carousel | short | story
  --intensity          steady | sprint
  --result             working | not_working  (with review)
  --note               "what you learned"     (with review)
  --hook               optional hook text     (with review)

Examples:
  npm run week -- --goal grow_followers
  npm run post -- --platform tiktok --pillar cooking
  npm run post -- --platform ig --pillar humor
  node src/cli.js review
  node src/cli.js review --result working --note "cooking reels got saves" --hook "High-protein dinner..."
`);
}

async function main() {
  switch (cmd) {
    case "plan": {
      const strategy = runStrategy({
        weekOf: flag("weekOf"),
        goal: flag("goal", "grow_followers")
      });
      console.log(JSON.stringify(strategy, null, 2));
      break;
    }
    case "week":
    case "export": {
      const result = (cmd === "export" ? runExportBuffer : runWeek)({
        weekOf: flag("weekOf"),
        goal: flag("goal", "grow_followers")
      });
      console.log(result.strategy.summary);
      console.log(`Posts planned: ${result.calendar.totals.posts}`);
      if (result.review) {
        console.log(`Review: ${result.review.approved}/${result.review.total} approved`);
      }
      console.log(`Markdown: ${result.paths.mdPath}`);
      console.log(`CSV:      ${result.paths.csvPath}`);
      console.log(`Strategy: ${result.paths.strategyPath}`);
      break;
    }
    case "post": {
      const platformRaw = flag("platform", "instagram");
      const platform =
        platformRaw === "ig" || platformRaw === "insta"
          ? "instagram"
          : platformRaw;
      const { post, path } = runPost({
        platform,
        pillar: flag("pillar", "workouts"),
        format: flag("format", "reel"),
        seed: Number(flag("seed", String(Date.now() % 1000)))
      });
      console.log(`\n${post.hook}\n`);
      console.log(post.caption);
      console.log(`\nReview: ${post.review?.verdict}`);
      if (post.review?.warnings?.length) {
        console.log("Warnings:", post.review.warnings.join("; "));
      }
      if (post.review?.issues?.length) {
        console.log("Issues:", post.review.issues.join("; "));
      }
      console.log(`\nSaved: ${path}`);
      break;
    }
    case "grow": {
      const { path, playbook } = runGrow({
        intensity: flag("intensity", "steady")
      });
      console.log(playbook.principle);
      console.log(`Saved: ${path}`);
      break;
    }
    case "review": {
      const result = runReview({
        result: flag("result"),
        note: flag("note"),
        hook: flag("hook")
      });
      console.log(result.brief);
      if (result.saved) console.log("\nSaved to content-memory.json");
      break;
    }
    case "help":
    case undefined:
      printHelp();
      break;
    default:
      console.error(`Unknown command: ${cmd}`);
      printHelp();
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
