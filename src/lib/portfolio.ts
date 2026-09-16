/**
 * AdoptAI's past-projects portfolio.
 *
 * INVENTED DATA. No real client, contract or system is represented here. This is a static
 * file on purpose: v0 has nothing to persist, so a database would add setup cost and no
 * user-visible benefit. See openspec/changes/discovery-brief-core/design.md.
 *
 * The whole list is rendered into the analysis prompt, so keep each card short and factual:
 * the model matches on `problem` and `solution`, and the reviewer reads `name` and `problem`.
 */

export type Effort = "S" | "M" | "L";

export interface PastProject {
  /** Stable id cited by the model. Referenced ids are checked against this list. */
  id: string;
  name: string;
  client: string;
  industry: string;
  /** The operational pain the client had before the project. */
  problem: string;
  /** What AdoptAI actually built. */
  solution: string;
  stack: string[];
  effort: Effort;
  year: number;
}

export const PORTFOLIO: PastProject[] = [
  {
    id: "whatsapp-lead-triage",
    name: "WhatsApp lead triage",
    client: "Inmobiliaria Sur (invented)",
    industry: "Real estate",
    problem:
      "Six agents shared one WhatsApp Business number. Leads were answered twice or not at all, and nobody knew which listing a conversation was about.",
    solution:
      "n8n pulls messages from the WhatsApp Business API, an LLM classifies intent, budget and property type, and writes a scored lead into the CRM with an assigned owner. Agents get a daily triage view.",
    stack: ["n8n", "WhatsApp Business API", "Claude", "Postgres", "Next.js"],
    effort: "M",
    year: 2024,
  },
  {
    id: "lab-quote-builder",
    name: "Lab quote builder",
    client: "Laboratorio Andino (invented)",
    industry: "Clinical laboratory",
    problem:
      "Quotes for corporate health checkups were built by hand in Excel and emailed as PDFs. Prices drifted between sellers and nobody tracked which quotes closed.",
    solution:
      "Internal tool with a versioned price list, quote builder, PDF generation and a status board. Quotes are created from a template in minutes instead of hours.",
    stack: ["Next.js", "Postgres", "Puppeteer", "Self-hosted CRM"],
    effort: "M",
    year: 2024,
  },
  {
    id: "service-dispatch-board",
    name: "Service dispatch board",
    client: "ClimaTec Servicios (invented)",
    industry: "HVAC field service",
    problem:
      "Daily technician routing lived in a spreadsheet plus phone calls. Emergencies reshuffled the day and the office lost track of who was where.",
    solution:
      "Drag-and-drop dispatch board with technician availability, job status and a mobile view for the field. Job completion writes back to the billing sheet.",
    stack: ["Next.js", "Postgres", "Mapbox"],
    effort: "M",
    year: 2023,
  },
  {
    id: "invoice-intake-ocr",
    name: "Supplier invoice intake",
    client: "Transportes Pacífico (invented)",
    industry: "Logistics",
    problem:
      "Around 400 supplier invoices a month arrived as PDFs and photos to a shared mailbox and were typed into the ERP by two people.",
    solution:
      "Mailbox watcher extracts header and line items with an LLM, validates totals and tax arithmetic, and queues anything below a confidence threshold for human review before pushing to the ERP.",
    stack: ["n8n", "Claude", "Postgres", "Next.js"],
    effort: "L",
    year: 2025,
  },
  {
    id: "pharmacy-reorder-alerts",
    name: "Pharmacy reorder alerts",
    client: "Farmacias del Valle (invented)",
    industry: "Retail pharmacy",
    problem:
      "Eleven branches reordered stock by intuition. Fast movers ran out and slow movers expired on the shelf.",
    solution:
      "Nightly job reads point-of-sale exports, computes coverage days per SKU and branch, and sends each branch manager a reorder list with quantities. No forecasting model, just rolling averages and thresholds.",
    stack: ["n8n", "Postgres", "Metabase"],
    effort: "S",
    year: 2023,
  },
  {
    id: "isp-ticket-router",
    name: "Support ticket router",
    client: "RedNorte ISP (invented)",
    industry: "Internet service provider",
    problem:
      "Tier-1 support read every ticket to decide where it went. Routing took longer than most fixes and escalations were inconsistent.",
    solution:
      "LLM classifier assigns category, urgency and queue, and drafts a first reply for the agent to edit. Low-confidence tickets stay in the manual queue.",
    stack: ["Claude", "n8n", "Zammad", "Postgres"],
    effort: "S",
    year: 2025,
  },
  {
    id: "contract-clause-review",
    name: "Contract clause review",
    client: "Estudio Marín & Asociados (invented)",
    industry: "Legal services",
    problem:
      "Junior lawyers read 30-page supplier contracts looking for the same eight risky clauses, and findings depended on who reviewed it.",
    solution:
      "Upload a contract, get a clause-by-clause report against a configurable checklist with the exact quoted text and a risk level. The lawyer signs off; the tool never gives advice on its own.",
    stack: ["Next.js", "Claude", "Postgres", "S3-compatible storage"],
    effort: "M",
    year: 2025,
  },
  {
    id: "insurance-call-scoring",
    name: "Sales call scoring",
    client: "Broker Seguros Lima (invented)",
    industry: "Insurance brokerage",
    problem:
      "The sales manager could listen to maybe five of the 300 monthly calls, so coaching was based on anecdotes.",
    solution:
      "Calls are transcribed, scored against a rubric (discovery, objection handling, next step agreed) and summarized into a weekly coaching digest per rep. Scores are advisory, not compensation-linked.",
    stack: ["Whisper", "Claude", "n8n", "Next.js"],
    effort: "M",
    year: 2025,
  },
  {
    id: "staffing-cv-screening",
    name: "CV screening assistant",
    client: "Talento Andes (invented)",
    industry: "Staffing agency",
    problem:
      "Recruiters received 200+ CVs per opening in mixed formats and screened them by keyword search in the mailbox.",
    solution:
      "CVs are parsed into a structured profile and ranked against the role's must-haves with a stated reason per candidate. Recruiters see the reason and can override the ranking; nothing is auto-rejected.",
    stack: ["Claude", "Next.js", "Postgres"],
    effort: "M",
    year: 2024,
  },
  {
    id: "plant-incident-log",
    name: "Production incident log",
    client: "Alimentos Cordillera (invented)",
    industry: "Food manufacturing",
    problem:
      "Line stoppages were written on paper by shift and typed into a spreadsheet days later, so nobody could tell which machine caused the most downtime.",
    solution:
      "Tablet form on the line captures stoppage reason, duration and machine, plus a Pareto dashboard by week. Supervisors get an alert when one machine crosses a downtime threshold.",
    stack: ["Next.js", "Postgres", "Metabase"],
    effort: "S",
    year: 2023,
  },
];

/** Ids the model is allowed to cite. */
export const PORTFOLIO_IDS = new Set(PORTFOLIO.map((p) => p.id));

export function findProject(id: string): PastProject | undefined {
  return PORTFOLIO.find((p) => p.id === id);
}

/** The portfolio as it is rendered into the analysis prompt. */
export function renderPortfolioForPrompt(): string {
  return PORTFOLIO.map((p) =>
    [
      `- id: ${p.id}`,
      `  name: ${p.name}`,
      `  industry: ${p.industry}`,
      `  problem: ${p.problem}`,
      `  solution: ${p.solution}`,
      `  stack: ${p.stack.join(", ")}`,
      `  effort: ${p.effort} | year: ${p.year}`,
    ].join("\n"),
  ).join("\n\n");
}
