# Fitness Marketing Agents

Multi-agent toolkit for **fitness social media** content planning, captions, scheduling exports, and ethical follower-growth strategy.

Built as a practical automation layer you can run locally, wire to Buffer/Later, or drive with Cursor Cloud Agents on a schedule.

## Agents

| Agent | Job |
| --- | --- |
| **Strategy** | Weekly positioning, pillars, KPIs, messaging guardrails |
| **Content** | Hooks, captions, visual direction, filming notes |
| **Captions** | Platform-aware hashtags + alt hooks |
| **Scheduler** | 7-day calendar + CSV for Buffer / Later / Meta schedulers |
| **Growth** | Daily rhythm, experiments, profile/funnel, anti-spam rules |

## Talk in Telegram

See **[TELEGRAM.md](./TELEGRAM.md)** — create a bot with @BotFather, set `TELEGRAM_BOT_TOKEN`, then:

```bash
npm run bot
```

Commands in chat: `/week` · `/post` · `/grow` · `/today` · `/plan`

## Brand: XFITTV

Configured for **XFitTV (Xavier Castro)**:

| Platform | Handle |
| --- | --- |
| Instagram / Meta | `@xfittv` |
| TikTok | `@xfittvx` |

**Positioning:** bodybuilding · gym humor · high-protein cooking (not CrossFit/WOD).

Every `/post` and `/week` run is checked by the **Review** agent against `config/content-memory.json` (what’s working / not working). Log results with `/review` in Telegram or `npm run review`.

Edit `config/brand.json` anytime to tweak voice, pillars, CTAs, and offers.

## Quick start

```bash
cd fitness-marketing
node src/cli.js week --weekOf 2026-09-21 --goal grow_followers
node src/cli.js post --platform tiktok --pillar workouts
node src/cli.js grow --intensity steady
```

Outputs land in `output/`:

- `calendar-YYYY-MM-DD.md` — human-readable weekly plan
- `calendar-YYYY-MM-DD.csv` — import into a scheduler
- `growth-playbook-*.md` — engagement + growth playbook
- `strategy-*.json` — machine-readable strategy

## Customize further

`config/brand.json` is already set to XFITTV. Tweak as needed:

- audience pain points / desires
- signature phrases and CTA library
- content pillars + posting cadence
- offers (WOD pack, coaching)

Edit `config/hashtags.json` for niche tag pools.

## Goals

```bash
node src/cli.js plan --goal grow_followers
node src/cli.js plan --goal nurture_leads
node src/cli.js plan --goal launch_offer
```

## Automating with Cursor Agents

Use the prompts in `agents/cursor/`:

1. **weekly-calendar.md** — generate next week’s content pack
2. **daily-engage.md** — daily engagement checklist + reply angles
3. **growth-review.md** — weekly performance review + next experiments

Suggested cadence:

- Sunday: run `week` + Strategy agent
- Daily: film from calendar, post, run engagement block
- Friday: Growth review agent + adjust next week’s pillars

### Connecting real posting APIs

This toolkit generates **drafts and schedules**. Actual publishing needs your own credentials:

- Meta Instagram Graph API / Facebook Page
- TikTok Content Posting API
- X API
- YouTube Data API
- or a scheduler (Buffer, Later, Publer) via CSV / Zapier

Do **not** buy followers, run engagement pods, or mass-spam comments — those tactics get accounts restricted and are blocked by the Growth agent’s `doNot` list.

## Project layout

```
fitness-marketing/
  config/           brand + hashtags
  src/agents/       strategy, content, captions, growth, scheduler
  src/cli.js        CLI entry
  agents/cursor/    prompts for Cursor Cloud / chat agents
  templates/        bio + content pillar templates
  output/           generated calendars (gitignored)
```
