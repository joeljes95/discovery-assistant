# AI workflow

How this was actually built. Honest version, including the parts that went wrong.

## The setup

**Claude Code (CLI), run with two different models on purpose.**

| Phase | Model | What it did |
|---|---|---|
| Planning | Claude Fable 5.1 | Scoping, the OpenSpec proposal, specs, design decisions, the task breakdown, `AGENTS.md` |
| Execution | Claude Opus 5 | All application code, verification, the README |

The switch happened at 18:55, between the last planning commit and the first code commit. It
is visible in `git log`: the `Co-Authored-By` trailer names the model that wrote each commit.
The reasoning was that judgement is expensive and worth the stronger model, while executing
against a closed plan with per-task verification is not. The plan lived in files, so the
handoff cost nothing — the second model read `tasks.md` and continued.

Caveat I would state out loud: those trailers record which model was configured, not proof.
They corroborate this document; they are not a certificate.

**[OpenSpec](https://github.com/Fission-AI/OpenSpec)** for a spec-first workflow. Before any
code, one change was generated with a proposal, three capability specs written as testable
WHEN/THEN scenarios, a design document with alternatives considered, and sixteen tasks each
stating how it would be verified. Everything under `openspec/changes/discovery-brief-core/`
and committed before the first line of application code. The rule I set was: generate once,
do not iterate the artifacts during the build, record divergences at the end. That rule got
tested — see below.

**Browser automation** (Claude in Chrome) to verify the UI for real: load the sample, run an
analysis, click a verdict, read the exported markdown back. Not screenshots for show — the
"not reviewed" line in the export was confirmed by scrolling the textarea.

**A bundled Anthropic API reference skill**, loaded before writing the LLM client. This
mattered: my training-era memory of the structured-outputs API was out of date. The current
shape is `output_config: { format: zodOutputFormat(schema) }`, not the older parameter I
would have reached for. Reading the reference first avoided a debugging session.

### Config files committed

- `AGENTS.md` — the working rules (fixed stack, hard rules on secrets and honesty, how to
  verify). `CLAUDE.md` just points at it, so the same file works for other tools. Next.js 16
  owns the block at the top of that file and rewrites it; my rules sit below it.
- `.claude/skills/commit/SKILL.md` — a commit skill I already carried, **modified during this
  build** (story below).
- `openspec/` — the change artifacts and config.
- **Not mine:** `.claude/commands/opsx/*` and `.claude/skills/openspec-*` are OpenSpec plugin
  scaffolding that came with the tool. They are committed because they shape the workflow,
  but I did not write them and I am not claiming them.

## Three prompts that mattered

**1. Asking for a rating, not approval.**

> "tengo esta idea, ayudame a scopearla bien porque son 6:23pm y quiero tener todo listo para
> 9:30 pm. tambien ratea mi idea del 1 al 10"

My original idea included recording voice and transcribing it. Two things made this prompt
work: a hard wall-clock budget, and asking for a score instead of asking "is this good?".
The answer was 7.5 out of 10 with the reason being that it was three products in one, and the
recommendation was to cut audio entirely and keep the analysis. That cut is the single most
important decision in this project, and I got it because I asked a question that could come
back negative. "Does this sound good?" would have gotten a yes.

**2. Feeding the whole scope, including the non-goals, into the spec generator.**

The prompt that generated the OpenSpec change was one long paragraph naming every failure
mode I wanted handled (schema validation with one retry, hallucinated ids rejected, input
cap, timeout, cost shown) and then, explicitly: *"Non-goals: audio/voice input, file upload,
persistence, auth, embeddings. Timebox: must be done by 20:15 today."*

Writing the non-goals into the artifact is what kept the build from drifting. Twice during
execution the model reached for something adjacent, and the specs were the thing that said
no. The timebox in the document did the same job for scope as a deadline does for a person.

**3. Asking whether my own tooling was being used.**

> "When you do commits, are you using the commit skill that I have in this repo or no?"

The answer was no, and it had been ignoring three of that skill's rules for nine commits. I
would not have caught this by reading diffs — commits are the one artifact you stop looking
at. The general lesson I took: periodically ask the agent what it is *not* doing, not just
what it did.

## What the AI got wrong

**It deleted the spec files it had just written.** During the planning phase it batched a
directory-cleanup command in the same turn as the file writes. The cleanup ran after the
writes and removed all three spec files. Caught immediately by listing the directory before
committing — the files were simply not there. Rewritten and then validated with
`openspec validate discovery-brief-core --strict`, which passed. The real lesson is that the
validator is what made this a two-minute problem instead of a silent one; if I had trusted
"files written successfully" I would have committed an empty `specs/` directory.

**It ignored this repo's own commit skill.** Nine commits carried a `Co-Authored-By` trailer
that the skill explicitly forbids, were pushed when the skill says not to push, and were
staged with `git add -A` when the skill says stage by name. It was following a general
instruction from its harness and never read the repo-local rule. Caught by my question above.

What I did about it is the part I would defend: I did **not** rewrite history. A rewrite
preserves author dates but resets every commit date to the instant of the rewrite, which
shows up in `git log --pretty=fuller` and on GitHub as thirteen commits created in the same
second. That reads as laundered history in a challenge where the history is part of the
evaluation. Instead I changed the skill to *require* the model attribution in this repo,
since the split between models is exactly what the history should show, and added a standing
rule against rewriting to normalize trailers. The three commits in the gap stay as they are.

**It set a timeout on a guess and I let it.** The design said 60 seconds, with a note that
the input cap would keep calls "well under it". The first real analysis took 42 seconds on a
1,958-character sample — a full-length transcript is several times that. Nothing in code
review would have caught this; only running it did. Raised to 120 seconds and the finding is
recorded in `design.md` against the risk it invalidates.

**The plan and the build drifted on the model choice.** `design.md` argued for a mid-tier
model on cost grounds. The implementation defaulted to `claude-opus-5` and nobody flagged it
at the time. I caught it when reconciling artifacts at the end and rewrote that decision to
say what was actually built, why, and what it costs: about 9 cents and 42 seconds per
analysis, which is fine for a consultant's brief and wrong for a high-volume path.

## What AI did vs. what I did

Roughly: **the AI wrote essentially all of the text** — code, specs, README, this file. **I
made every decision that determined what got written.**

Mine:
- Choosing Option B and the specific problem (portfolio memory lives in one person's head).
- Cutting audio from the scope. That was the difference between finishing and not.
- The two-model strategy and when to hand off.
- Using OpenSpec at all, and the constraint of one change generated once rather than
  iterating artifacts mid-build.
- Refusing the history rewrite and deciding to change the skill instead.
- Choosing to stay on Anthropic rather than swap providers when the key was the blocker,
  after asking for the cost of each path.

The AI's:
- All implementation, including the parts I would have written differently and the parts I
  would have gotten wrong (the current structured-outputs API shape, for one).
- The verification work: curl against every error path, four cases against the id guard,
  driving the browser, and injecting a schema failure to exercise both branches of the retry.
- Catching its own timeout mistake, once told to measure instead of assume.

Where I was weakest: I let nine commits go by without checking them against my own tooling.
Where the AI was weakest: it optimized for the task in front of it and did not look for
repo-local rules unless asked.
