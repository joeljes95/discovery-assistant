"use client";

import { useEffect, useMemo, useState } from "react";
import { MAX_NOTES_CHARS, MIN_NOTES_CHARS } from "@/lib/limits";
import { type Review, type Verdict, VERDICT_LABEL, buildMarkdown } from "@/lib/markdown";
import { PORTFOLIO, findProject } from "@/lib/portfolio";
import { SAMPLE_NOTES } from "@/lib/sample";
import type {
  AnalyzeFailure,
  AnalyzeSuccess,
  ErrorCategory,
  Proposal,
} from "@/lib/schema";

type Status = "idle" | "loading" | "error" | "done";

const ERROR_STYLE: Record<ErrorCategory, string> = {
  configuration: "border-violet-500/40 bg-violet-500/10 text-violet-200",
  transient: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  validation: "border-rose-500/40 bg-rose-500/10 text-rose-200",
};

const ERROR_TITLE: Record<ErrorCategory, string> = {
  configuration: "Not configured",
  transient: "Temporary problem",
  validation: "Check the input",
};

const REUSE_STYLE = {
  reuse: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  adapt: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  new: "border-slate-600 bg-slate-800 text-slate-300",
};

const REUSE_LABEL = {
  reuse: "Reuse a past project",
  adapt: "Adapt a past project",
  new: "New build",
};

const VERDICT_STYLE: Record<Verdict, string> = {
  worth_it: "border-emerald-500 bg-emerald-500/15 text-emerald-300",
  inspiration: "border-amber-500 bg-amber-500/15 text-amber-300",
  discard: "border-slate-500 bg-slate-700/40 text-slate-300",
};

const VERDICTS: Verdict[] = ["worth_it", "inspiration", "discard"];

/** The subset of GET /api/health this screen reads. Never includes any secret value. */
interface Health {
  llmConfigured: boolean;
  portfolioProjects: number;
}

const STEPS = [
  {
    label: "Step 1",
    title: "Paste the notes",
    detail: `Raw and messy is fine. ${MIN_NOTES_CHARS} to ${MAX_NOTES_CHARS.toLocaleString("en-US")} characters.`,
  },
  {
    label: "Step 2",
    title: "Read the brief",
    detail: "Pains, proposals and risks, each grounded in what was actually said.",
  },
  {
    label: "Step 3",
    title: "Decide and export",
    detail: "Mark every proposal, then copy the reviewed brief as markdown.",
  },
];

const BRIEF_CONTENTS = [
  ["The client", "Who they are and what they do, from the notes only"],
  ["Pains detected", "Up to six, each tied to something that was said"],
  ["Proposals · your call", "Two or three systems, matched against past projects"],
  ["Questions and risks", "What to ask next, and what could sink the engagement"],
];

export default function Home() {
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<AnalyzeSuccess | null>(null);
  const [failure, setFailure] = useState<AnalyzeFailure["error"] | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [copied, setCopied] = useState(false);
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [health, setHealth] = useState<Health | null>(null);

  // A missing key is worth knowing before pasting a transcript and waiting on a request that
  // was never going to work. If health itself is unreachable the indicator simply stays out.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/health")
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => {
        if (!cancelled && body) setHealth(body as Health);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const trimmedLength = notes.trim().length;
  const tooLong = trimmedLength > MAX_NOTES_CHARS;
  const tooShort = trimmedLength < MIN_NOTES_CHARS;

  const markdown = useMemo(
    () =>
      result ? buildMarkdown(result.brief, reviews, result.cost, result.warnings) : "",
    [result, reviews],
  );

  async function analyze() {
    setStatus("loading");
    setFailure(null);
    setResult(null);
    setCopied(false);
    setShowMarkdown(false);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ notes: notes.trim() }),
      });
      const body = (await response.json()) as AnalyzeSuccess | AnalyzeFailure;
      if ("error" in body) {
        setFailure(body.error);
        setStatus("error");
        return;
      }
      setResult(body);
      setReviews(body.brief.proposals.map(() => ({ verdict: null, notes: "" })));
      setStatus("done");
    } catch {
      setFailure({
        category: "transient",
        message: "Could not reach the server. Check that it is running and try again.",
        retryable: true,
      });
      setStatus("error");
    }
  }

  function setReview(index: number, patch: Partial<Review>) {
    setReviews((current) =>
      current.map((review, i) => (i === index ? { ...review, ...patch } : review)),
    );
    setCopied(false);
  }

  async function copyMarkdown() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
    } catch {
      // Clipboard needs a secure context and permission; the textarea below is the fallback.
      setShowMarkdown(true);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <span className="grid size-5 shrink-0 place-items-center rounded bg-slate-100 text-[11px] font-bold text-slate-950">
            D
          </span>
          <span className="text-[13px] font-semibold tracking-tight text-slate-100">
            Discovery Assistant
          </span>
          {health && (
            <span className="ml-auto flex items-center gap-2 font-mono text-[11px] text-slate-500">
              <span
                aria-hidden="true"
                className={`size-1.5 rounded-full ${
                  health.llmConfigured
                    ? "bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.15)]"
                    : "bg-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.15)]"
                }`}
              />
              {health.llmConfigured
                ? `ready · ${health.portfolioProjects} past projects`
                : "not configured · ANTHROPIC_API_KEY missing"}
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        {!result && (
          <section className="mb-6">
            <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-slate-50">
              Turn call notes into a reviewable brief
            </h1>
            <p className="mt-2 max-w-[56ch] text-sm leading-relaxed text-slate-400">
              Paste what you wrote during the discovery call. You get the pains, two or three
              things AdoptAI could build, and whether each one is close to something we have
              already delivered. You decide what is worth proposing.
            </p>

            <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
              {STEPS.map((step) => (
                <div
                  key={step.label}
                  className="rounded-lg border border-slate-800 bg-slate-900/40 p-3"
                >
                  <p className="font-mono text-[10px] uppercase tracking-wider text-slate-600">
                    {step.label}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-200">{step.title}</p>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-500">
                    {step.detail}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/60 px-3.5 py-2.5">
            <label htmlFor="notes" className="text-xs font-semibold text-slate-300">
              Call notes
            </label>
            <button
              type="button"
              onClick={() => setNotes(SAMPLE_NOTES)}
              className="rounded-md border border-slate-700 px-2.5 py-1 text-[11px] text-slate-400 transition hover:border-slate-500 hover:text-slate-200"
            >
              Load sample call
            </button>
          </div>

          <textarea
            id="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            aria-describedby="notes-count"
            placeholder="Cliente: distribuidora ferretera, 60 personas. Los pedidos entran por WhatsApp y se tipean a mano en el ERP..."
            rows={10}
            className="max-h-[420px] min-h-[200px] w-full resize-y border-0 bg-transparent p-3.5 font-mono text-[13px] leading-relaxed text-slate-200 outline-none transition placeholder:text-slate-600 focus:bg-slate-950/40"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 bg-slate-950/40 px-3.5 py-2.5">
            <span
              id="notes-count"
              className={`font-mono text-[11px] tabular-nums ${tooLong ? "text-rose-400" : "text-slate-500"}`}
            >
              {trimmedLength.toLocaleString("en-US")} /{" "}
              {MAX_NOTES_CHARS.toLocaleString("en-US")} characters
              {tooShort && trimmedLength > 0 ? ` · ${MIN_NOTES_CHARS} minimum` : ""}
            </span>
            <button
              type="button"
              onClick={analyze}
              disabled={status === "loading" || tooShort || tooLong}
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-white disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
            >
              {status === "loading" ? "Analyzing…" : "Analyze call"}
            </button>
          </div>
        </section>

        {!result && status !== "loading" && (
          <section className="mt-6 rounded-xl border border-dashed border-slate-800 p-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-slate-600">
              What comes back
            </p>
            <dl className="mt-2.5 grid gap-2">
              {BRIEF_CONTENTS.map(([term, detail]) => (
                <div key={term} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <dt className="min-w-[160px] text-xs font-semibold text-slate-300">
                    {term}
                  </dt>
                  <dd className="text-xs text-slate-500">{detail}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

      <div aria-live="polite">
        {status === "loading" && (
          <p className="mt-6 animate-pulse text-sm text-slate-400">
            Reading the notes and comparing them against{" "}
            {health?.portfolioProjects ?? PORTFOLIO.length} past projects. This usually takes
            40 to 60 seconds.
          </p>
        )}
      </div>

      {status === "error" && failure && (
        <div
          role="alert"
          className={`mt-6 rounded-xl border p-4 ${ERROR_STYLE[failure.category]}`}
        >
          <p className="text-sm font-semibold">{ERROR_TITLE[failure.category]}</p>
          <p className="mt-1 text-sm opacity-90">{failure.message}</p>
          {failure.retryable && (
            <button
              type="button"
              onClick={analyze}
              className="mt-3 rounded-md border border-current px-3 py-1.5 text-xs font-medium transition hover:bg-white/10"
            >
              Try again
            </button>
          )}
        </div>
      )}

      {status === "done" && result && (
        <div className="mt-8 space-y-6">
          {result.warnings.length > 0 && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
              <p className="text-sm font-semibold text-amber-200">
                The analysis was corrected before you saw it
              </p>
              <ul className="mt-2 space-y-1 text-sm text-amber-100/90">
                {result.warnings.map((warning) => (
                  <li key={warning}>· {warning}</li>
                ))}
              </ul>
            </div>
          )}

          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              The client
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-200">
              {result.brief.clientSummary}
            </p>

            <h3 className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pains detected
            </h3>
            <ul className="mt-2 space-y-2">
              {result.brief.pains.map((pain) => (
                <li key={pain.title} className="text-sm leading-relaxed text-slate-300">
                  <span className="font-medium text-slate-100">{pain.title}</span> —{" "}
                  {pain.detail}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Proposals · your call
            </h2>
            <div className="space-y-4">
              {result.brief.proposals.map((proposal, index) => (
                <ProposalCard
                  key={proposal.title}
                  proposal={proposal}
                  review={reviews[index] ?? { verdict: null, notes: "" }}
                  onChange={(patch) => setReview(index, patch)}
                />
              ))}
            </div>
          </section>

          {result.brief.openQuestions.length > 0 && (
            <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Ask on the next call
              </h2>
              <ul className="mt-2 space-y-1.5">
                {result.brief.openQuestions.map((question) => (
                  <li key={question} className="text-sm leading-relaxed text-slate-300">
                    · {question}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {result.brief.riskFlags.length > 0 && (
            <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Risk flags
              </h2>
              <ul className="mt-2 space-y-1.5">
                {result.brief.riskFlags.map((risk) => (
                  <li key={risk} className="text-sm leading-relaxed text-slate-300">
                    · {risk}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <p className="text-xs text-slate-500">
              {result.cost.model} ·{" "}
              {result.cost.inputTokens.toLocaleString("en-US")} in /{" "}
              {result.cost.outputTokens.toLocaleString("en-US")} out tokens · about{" "}
              <span className="text-slate-300">${result.cost.estimatedUsd.toFixed(4)}</span>{" "}
              (estimate)
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowMarkdown((value) => !value)}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-500"
              >
                {showMarkdown ? "Hide markdown" : "Show markdown"}
              </button>
              <button
                type="button"
                onClick={copyMarkdown}
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-900 transition hover:bg-white"
              >
                {copied ? "Copied ✓" : "Copy as markdown"}
              </button>
            </div>
          </section>

          {showMarkdown && (
            <textarea
              readOnly
              value={markdown}
              rows={16}
              className="max-h-[480px] w-full resize-y rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs leading-relaxed text-slate-400"
            />
          )}
        </div>
      )}
      </main>
    </>
  );
}

function ProposalCard({
  proposal,
  review,
  onChange,
}: {
  proposal: Proposal;
  review: Review;
  onChange: (patch: Partial<Review>) => void;
}) {
  const matched = proposal.reuse.projectId ? findProject(proposal.reuse.projectId) : undefined;

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-50">{proposal.title}</h3>
        <span className="shrink-0 rounded-md border border-slate-700 px-2 py-0.5 text-xs text-slate-400">
          Effort {proposal.effort}
        </span>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-slate-300">{proposal.whatItDoes}</p>

      <div className={`mt-4 rounded-lg border p-3 ${REUSE_STYLE[proposal.reuse.level]}`}>
        <p className="text-xs font-semibold uppercase tracking-wide">
          {REUSE_LABEL[proposal.reuse.level]}
          {matched && (
            <>
              {" · "}
              <span className="font-mono normal-case">{matched.name}</span>
            </>
          )}
        </p>
        <p className="mt-1 text-sm leading-relaxed opacity-90">{proposal.reuse.why}</p>
        {matched && (
          <p className="mt-1.5 text-xs opacity-70">
            {matched.client} · {matched.year} · {matched.problem}
          </p>
        )}
      </div>

      <div className="mt-4 border-t border-slate-800 pt-4">
        <div className="flex flex-wrap gap-2">
          {VERDICTS.map((verdict) => {
            const active = review.verdict === verdict;
            return (
              <button
                key={verdict}
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ verdict: active ? null : verdict })}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? VERDICT_STYLE[verdict]
                    : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                }`}
              >
                {VERDICT_LABEL[verdict]}
              </button>
            );
          })}
        </div>
        <textarea
          value={review.notes}
          onChange={(event) => onChange({ notes: event.target.value })}
          placeholder="Your notes on this proposal…"
          rows={2}
          className="mt-3 max-h-40 w-full resize-y rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-slate-600"
        />
      </div>
    </article>
  );
}
