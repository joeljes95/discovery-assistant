import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { type Review, buildMarkdown } from "./markdown";
import type { AnalysisCost, Brief } from "./schema";

/**
 * The markdown export is the artifact that leaves the tool. Everything on screen is
 * throwaway; this is what gets pasted into the CRM. If a verdict silently stops appearing,
 * somebody proposes work the reviewer discarded.
 */

const COST: AnalysisCost = {
  model: "claude-opus-5",
  inputTokens: 4647,
  outputTokens: 2863,
  estimatedUsd: 0.09481,
};

const BRIEF: Brief = {
  clientSummary: "A hardware distributor with three warehouses.",
  pains: [{ title: "Manual order entry", detail: "Orders are typed by hand." }],
  proposals: [
    {
      title: "Order capture",
      whatItDoes: "Reads incoming messages and proposes a structured order.",
      effort: "L",
      reuse: { level: "adapt", projectId: "whatsapp-lead-triage", why: "Same ingestion." },
    },
    {
      title: "Invoice intake",
      whatItDoes: "Extracts invoice lines and flags duplicates.",
      effort: "M",
      reuse: { level: "new", projectId: null, why: "Nothing close." },
    },
  ],
  openQuestions: ["Does the ERP have an API?"],
  riskFlags: ["No internal owner named."],
};

const UNREVIEWED: Review[] = [
  { verdict: null, notes: "" },
  { verdict: null, notes: "" },
];

describe("buildMarkdown", () => {
  it("marks an unreviewed proposal as not reviewed rather than omitting the field", () => {
    const md = buildMarkdown(BRIEF, UNREVIEWED, COST);

    assert.equal(md.match(/\*\*Verdict:\*\* not reviewed/g)?.length, 2);
  });

  it("renders the verdict and notes of a reviewed proposal, and only that one", () => {
    const md = buildMarkdown(
      BRIEF,
      [{ verdict: "inspiration", notes: "Start with text only." }, UNREVIEWED[1]],
      COST,
    );

    assert.match(md, /\*\*Verdict:\*\* Inspiration/);
    assert.match(md, /> \*\*Reviewer notes:\*\* Start with text only\./);
    assert.equal(md.match(/\*\*Verdict:\*\* not reviewed/g)?.length, 1);
  });

  it("names the matched past project, and omits the reference for new work", () => {
    const md = buildMarkdown(BRIEF, UNREVIEWED, COST);

    assert.match(md, /\*\*Reuse:\*\* adapt — WhatsApp lead triage \(`whatsapp-lead-triage`\)/);
    assert.match(md, /\*\*Reuse:\*\* new$/m);
  });

  it("omits the notes blockquote when the reviewer wrote only whitespace", () => {
    const md = buildMarkdown(BRIEF, [{ verdict: "worth_it", notes: "   " }, UNREVIEWED[1]], COST);

    assert.ok(!md.includes("Reviewer notes"));
  });

  it("carries every pain, open question and risk flag through", () => {
    const md = buildMarkdown(BRIEF, UNREVIEWED, COST);

    assert.match(md, /Manual order entry/);
    assert.match(md, /Does the ERP have an API\?/);
    assert.match(md, /No internal owner named\./);
  });

  it("records the model and cost so a pasted brief says what produced it", () => {
    const md = buildMarkdown(BRIEF, UNREVIEWED, COST);

    assert.match(md, /claude-opus-5/);
    assert.match(md, /\$0\.0948/);
    assert.match(md, /Reviewed by a human before use/);
  });

  it("includes analysis warnings so a downgraded proposal is not silently clean", () => {
    const md = buildMarkdown(BRIEF, UNREVIEWED, COST, ['"Order capture" cited a past project that does not exist.']);

    assert.match(md, /## Warnings from the analysis/);
    assert.match(md, /does not exist/);
  });
});
