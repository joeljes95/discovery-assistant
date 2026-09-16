"use client";

import { useMemo, useState } from "react";
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
  new: "border-zinc-600 bg-zinc-800 text-zinc-300",
};

const REUSE_LABEL = {
  reuse: "Reuse a past project",
  adapt: "Adapt a past project",
  new: "New build",
};

const VERDICT_STYLE: Record<Verdict, string> = {
  worth_it: "border-emerald-500 bg-emerald-500/15 text-emerald-300",
  inspiration: "border-amber-500 bg-amber-500/15 text-amber-300",
  discard: "border-zinc-500 bg-zinc-700/40 text-zinc-300",
};

const VERDICTS: Verdict[] = ["worth_it", "inspiration", "discard"];

export default function Home() {
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<AnalyzeSuccess | null>(null);
  const [failure, setFailure] = useState<AnalyzeFailure["error"] | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [copied, setCopied] = useState(false);
  const [showMarkdown, setShowMarkdown] = useState(false);

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
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Discovery Assistant
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
          Paste the notes or transcript of a discovery call. You get the pains, two or three
          things AdoptAI could build, and whether each one is close to something we have
          already delivered. You decide what is worth proposing.
        </p>
      </header>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <label htmlFor="notes" className="text-sm font-medium text-zinc-300">
            Call notes
          </label>
          <button
            type="button"
            onClick={() => setNotes(SAMPLE_NOTES)}
            className="text-xs text-zinc-400 underline underline-offset-4 transition hover:text-zinc-200"
          >
            Load sample call
          </button>
        </div>

        <textarea
          id="notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Cliente: distribuidora ferretera, 60 personas. Los pedidos entran por WhatsApp y se tipean a mano en el ERP..."
          rows={10}
          className="max-h-[420px] min-h-[220px] w-full resize-y rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-[13px] leading-relaxed text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-zinc-600"
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span
            className={`text-xs tabular-nums ${tooLong ? "text-rose-400" : "text-zinc-500"}`}
          >
            {trimmedLength.toLocaleString("en-US")} /{" "}
            {MAX_NOTES_CHARS.toLocaleString("en-US")} characters
            {tooShort && trimmedLength > 0 ? ` · ${MIN_NOTES_CHARS} minimum` : ""}
          </span>
          <button
            type="button"
            onClick={analyze}
            disabled={status === "loading" || tooShort || tooLong}
            className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
          >
            {status === "loading" ? "Analyzing…" : "Analyze call"}
          </button>
        </div>
      </section>

      {status === "loading" && (
        <p className="mt-6 animate-pulse text-sm text-zinc-400">
          Reading the notes and comparing them against {PORTFOLIO.length} past projects. This usually takes
          20 to 40 seconds.
        </p>
      )}

      {status === "error" && failure && (
        <div className={`mt-6 rounded-xl border p-4 ${ERROR_STYLE[failure.category]}`}>
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

          <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              The client
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-zinc-200">
              {result.brief.clientSummary}
            </p>

            <h3 className="mt-5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Pains detected
            </h3>
            <ul className="mt-2 space-y-2">
              {result.brief.pains.map((pain) => (
                <li key={pain.title} className="text-sm leading-relaxed text-zinc-300">
                  <span className="font-medium text-zinc-100">{pain.title}</span> —{" "}
                  {pain.detail}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
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
            <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Ask on the next call
              </h2>
              <ul className="mt-2 space-y-1.5">
                {result.brief.openQuestions.map((question) => (
                  <li key={question} className="text-sm leading-relaxed text-zinc-300">
                    · {question}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {result.brief.riskFlags.length > 0 && (
            <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Risk flags
              </h2>
              <ul className="mt-2 space-y-1.5">
                {result.brief.riskFlags.map((risk) => (
                  <li key={risk} className="text-sm leading-relaxed text-zinc-300">
                    · {risk}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-xs text-zinc-500">
              {result.cost.model} ·{" "}
              {result.cost.inputTokens.toLocaleString("en-US")} in /{" "}
              {result.cost.outputTokens.toLocaleString("en-US")} out tokens · about{" "}
              <span className="text-zinc-300">${result.cost.estimatedUsd.toFixed(4)}</span>{" "}
              (estimate)
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowMarkdown((value) => !value)}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-500"
              >
                {showMarkdown ? "Hide markdown" : "Show markdown"}
              </button>
              <button
                type="button"
                onClick={copyMarkdown}
                className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-900 transition hover:bg-white"
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
              className="max-h-[480px] w-full resize-y rounded-xl border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs leading-relaxed text-zinc-400"
            />
          )}
        </div>
      )}
    </main>
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
    <article className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-zinc-50">{proposal.title}</h3>
        <span className="shrink-0 rounded-md border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400">
          Effort {proposal.effort}
        </span>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-zinc-300">{proposal.whatItDoes}</p>

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

      <div className="mt-4 border-t border-zinc-800 pt-4">
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
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
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
          className="mt-3 max-h-40 w-full resize-y rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-zinc-600"
        />
      </div>
    </article>
  );
}
