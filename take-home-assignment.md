# AdoptAI — Technical Challenge

Welcome to the technical stage. You've already talked with Bruno and Gianfranco; this challenge is how we'll ground the conversation with me (Leo, CTO) in something real: a thing you built, decisions you made, and how you work with AI.

## What we're actually hiring for

AdoptAI builds and operates AI-powered internal systems for mid-size LatAm companies. The engineer we hire will — with my guidance — **own client projects end-to-end**: backend, frontend, data, integrations with messy third-party systems, deploys, and the AI/LLM layer. You won't be an expert in all of it, and that's fine. What's non-negotiable is ownership: seeing a problem through from ambiguity to something a real user depends on.

We are an **AI-native** engineering team. Using AI tools on this challenge isn't just allowed — it's expected, and *how* you use them is part of what we evaluate. What we care about is that you stay the engineer in charge: you should understand your project well — how it works, why it's built the way it is — and own the decisions behind it.

## The challenge

Pick **ONE** of the three options below and build it.

**Timebox: 5 hours maximum** of focused work, **including the README, AI.md and time log** — budget ~45 minutes for those, so the build itself should fit in 3–4 hours. We mean this — a small thing that works end-to-end and shows judgment beats a big thing that's half-broken. Ruthless scoping is one of the skills we're evaluating. If you finish early and want to go further, go deep (polish, tests, a deploy), not wide.

### Option A — Client-style MVP

Simulate what we do every week. Pick a real operational pain of a small or mid-size business — a process that today lives in someone's head, an Excel, or a WhatsApp thread. (Invent the company, or borrow from a business you know well.) Build the **smallest internal tool that fixes it end-to-end**: data comes in, something useful happens, a non-technical operator can use the result.

Examples of the *shape* (don't copy these): a quote-tracking tool for a lab that emails PDFs around; a lead-triage view for a sales team drowning in chat messages; a scheduling/dispatch board for a service company running on spreadsheets.

We're watching for: product judgment (did you pick the right slice?), a working end-to-end flow, and an interface a real operator wouldn't hate.

### Option B — A tool for AdoptAI

Build something that would help **us**. Context you can build against: we run our clients' systems on our own self-hosted infra; internally we use a self-hosted CRM and n8n for automations; our engineering workflow is built on Claude Code (we maintain our own plugin with skills and agents); we run a marketing site with a lead funnel (adoptai.lat) and are building an education/training line. Growing pains are everywhere: lead handling, project monitoring, onboarding, internal visibility, content production.

Propose the tool (a short "why this" in your README — what problem, why it matters, why this slice first) and then build it. We're watching for: whether you can spot a real problem in a business you've only seen from outside, and pitch + ship a credible v0 of the fix.

### Option C — Open track

Build anything you want. One hard rule beyond the ones below: it must be **working software** someone can run, not a design, notebook, or slide deck. Pick something that shows us your ceiling.

## Rules of the game (all options)

- **New work only.** Whatever option you pick, the project must be created for this challenge — not a reused or recycled side project (we will ask).
- **Nothing confidential.** Don't use confidential code, data, or internal material from a current or former employer. Invent or synthesize whatever data you need.
- **Any stack you want.** Use what makes you fastest. We judge outcomes, not framework choices — though be ready to explain why you chose what you chose.
- **AI usage is expected and evaluated.** See the AI workflow section below.
- **An LLM feature in the product itself is optional**, not required. If you include one, we'll look at how you handle its failure modes (bad outputs, cost, latency), not just the happy path.
- **No fake claims.** If something is mocked, stubbed, or half-done, say so in the README. Honesty about limitations reads as senior; hiding them reads as the opposite.
- **Don't commit secrets.** API keys in a repo — even a private one — is an instant red flag in our line of work.

## Deliverable

A **private GitHub repo**, shared with **`@Leoes98`**, containing:

1. **The working project** — with real, incremental commits as you go (not one giant "final" commit; your commit history is part of the story).
2. **`README.md`** — what it is, who it's for, how to run it locally (this must actually work), key decisions and tradeoffs, what's mocked or unfinished, and what you'd do next with one more week.
3. **`AI.md`** — your AI workflow, honestly told:
   - Which tools you used (Claude Code, Cursor, Copilot, v0, etc.) and how you set them up for this project — any rules/context files, custom skills or agents, plugins, MCP servers. If you configured the tool (e.g. a `CLAUDE.md`, `.cursorrules`, custom commands), **commit those files** — we'd love to see them.
   - 2–3 of your actual prompts that mattered, with a note on why they worked (or how you iterated when they didn't).
   - At least one thing the AI got wrong and how you caught it.
   - A rough honest split: what did AI do vs. what did you do?
4. **Time log** — a few honest lines in the README: when you worked, roughly how long, what each block produced.

**Bonus (never required, never expected — only if you're inside the timebox and want to):** a live deploy on the free tier of anything, tests where they actually protect something, a `/health` endpoint, an eval for any LLM feature.

## Timeline & presentation

- **Deadline:** share the repo with me by **Saturday, 10:00 PM Lima time**.
- **Monday:** a live session (~75 min) where you drive:
  1. **Demo** (~10 min) — show it working.
  2. **Walkthrough** (~15 min) — architecture, key decisions, your AI workflow.
  3. **Deep-dive** (~30 min) — my questions: tradeoffs, what breaks under load or bad input, what you'd change, and a "what if the client now asks for X" discussion.
  4. **How you work + your questions** (~20 min) — past projects, how you'd fit the role, and anything you want to ask me.

## How we'll evaluate (no secrets)

Roughly in this order of weight:

1. **Ownership & judgment** — did you pick a real problem, scope it well, and carry it end-to-end within the timebox?
2. **Engineering quality** — is it correct, structured, runnable, and honest about its limits? Commit hygiene and secrets hygiene count.
3. **AI leverage** — did AI make you meaningfully faster *while you stayed in control*? Sophistication of the workflow counts; blind pasting counts against.
4. **Communication** — README clarity, demo clarity, and how well you can walk me through your key decisions in the deep-dive.

Questions about the challenge? Ask me anything — knowing what to ask before building is also part of the job.

Good luck — have fun with it.

— Leo
