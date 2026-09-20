#!/usr/bin/env node
import {
  runStrategy,
  runWeek,
  runPost,
  runGrow,
  runExportBuffer
} from "./pipeline.js";

const [cmd, ...rest] = process.argv.slice(2);

function flag(name, fallback) {
  const i = rest.indexOf(`--${name}`);
  if (i === -1) return fallback;
  return rest[i + 1] ?? fallback;
}

function printHelp() {
  console.log(`
Fitness Marketing Agents

Usage:
  npm start -- <command> [options]

Commands:
  plan                 Weekly strategy (JSON to stdout)
  week                 Full 7-day calendar + CSV export
  post                 Single post draft
  grow                 Follower growth playbook
  export               Alias for week (Buffer/Later CSV)

Options:
  --weekOf YYYY-MM-DD  Calendar start date
  --goal               grow_followers | nurture_leads | launch_offer
  --platform           instagram | tiktok | x | youtube_shorts
  --pillar             workouts | nutrition | mindset | proof | community
  --format             reel | carousel | short | story | thread
  --intensity          steady | sprint

Examples:
  npm run week -- --weekOf 2026-09-21 --goal grow_followers
  npm run post -- --platform tiktok --pillar workouts
  npm run grow -- --intensity sprint

Edit brand voice in config/brand.json before generating.
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
      console.log(`Markdown: ${result.paths.mdPath}`);
      console.log(`CSV:      ${result.paths.csvPath}`);
      console.log(`Strategy: ${result.paths.strategyPath}`);
      break;
    }
    case "post": {
      const { post, path } = runPost({
        platform: flag("platform", "instagram"),
        pillar: flag("pillar", "workouts"),
        format: flag("format", "reel"),
        seed: Number(flag("seed", String(Date.now() % 1000)))
      });
      console.log(`\n${post.hook}\n`);
      console.log(post.caption);
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
