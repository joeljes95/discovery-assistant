import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { guardPortfolioIds } from "./analyze";
import type { Brief, Proposal } from "./schema";

/**
 * The guard is the one place where a model mistake is turned into something safe and
 * visible. Everything else in the pipeline either fails loudly or is the model's own output;
 * this is logic I wrote, it runs on every analysis, and a silent regression here would show
 * the reviewer a past project that does not exist. That is why it is the thing under test.
 */

const REAL_ID = "lab-quote-builder";

function briefWith(reuse: Proposal["reuse"]): Brief {
  return {
    clientSummary: "A client.",
    pains: [{ title: "A pain", detail: "Some detail." }],
    proposals: [
      { title: "First", whatItDoes: "Does a thing.", effort: "M", reuse },
      {
        title: "Second",
        whatItDoes: "Does another thing.",
        effort: "S",
        reuse: { level: "new", projectId: null, why: "Nothing close." },
      },
    ],
    openQuestions: [],
    riskFlags: [],
  };
}

describe("guardPortfolioIds", () => {
  it("downgrades a proposal citing an id that does not exist and names it in a warning", () => {
    const { brief, warnings } = guardPortfolioIds(
      briefWith({ level: "adapt", projectId: "totally-made-up", why: "Looks similar." }),
    );

    assert.equal(brief.proposals[0].reuse.level, "new");
    assert.equal(brief.proposals[0].reuse.projectId, null);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /totally-made-up/);
    assert.match(warnings[0], /First/);
  });

  it("leaves a proposal citing a real id untouched and silent", () => {
    const { brief, warnings } = guardPortfolioIds(
      briefWith({ level: "reuse", projectId: REAL_ID, why: "Same problem." }),
    );

    assert.equal(brief.proposals[0].reuse.level, "reuse");
    assert.equal(brief.proposals[0].reuse.projectId, REAL_ID);
    assert.deepEqual(warnings, []);
  });

  it("downgrades a reuse claim that names no project at all", () => {
    const { brief, warnings } = guardPortfolioIds(
      briefWith({ level: "adapt", projectId: null, why: "We have done this." }),
    );

    assert.equal(brief.proposals[0].reuse.level, "new");
    assert.equal(warnings.length, 1);
  });

  it("strips a stray reference from a proposal already marked new, without warning", () => {
    // Not the model's fault in a way the user needs to hear about, but the UI would
    // otherwise render a matched-project card under a "New build" badge.
    const { brief, warnings } = guardPortfolioIds(
      briefWith({ level: "new", projectId: REAL_ID, why: "Nothing close." }),
    );

    assert.equal(brief.proposals[0].reuse.projectId, null);
    assert.deepEqual(warnings, []);
  });

  it("does not touch the other proposals in the brief", () => {
    const { brief } = guardPortfolioIds(
      briefWith({ level: "adapt", projectId: "totally-made-up", why: "Looks similar." }),
    );

    assert.deepEqual(brief.proposals[1].reuse, {
      level: "new",
      projectId: null,
      why: "Nothing close.",
    });
  });

  it("collects one warning per bad proposal", () => {
    const base = briefWith({ level: "adapt", projectId: "nope-one", why: "x" });
    const two: Brief = {
      ...base,
      proposals: [
        base.proposals[0],
        {
          ...base.proposals[1],
          reuse: { level: "reuse", projectId: "nope-two", why: "y" },
        },
      ],
    };

    const { brief, warnings } = guardPortfolioIds(two);

    assert.equal(warnings.length, 2);
    assert.ok(brief.proposals.every((p) => p.reuse.level === "new"));
  });
});
