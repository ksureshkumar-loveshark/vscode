# Clarity — Product Requirements Document

**Version:** 0.1 (MVP)
**Author:** Kaushik
**Last updated:** March 2026
**Status:** Draft

---

## 1. Problem

Product managers at technical B2B SaaS companies operate across a fragmented stack: roadmaps in Linear or Jira, specs in Notion or Confluence, decision rationale in Slack threads or nowhere, research in Google Docs, and the codebase in Git. The result is a persistent context gap between what was built and why it was built.

Six months after a feature ships, no one can reconstruct the reasoning behind it. Onboarding a new PM takes months because the "why" is scattered across tools or trapped in the heads of people who may have already left. Exec reporting requires manually stitching together context from five different sources every cycle.

Engineers solved this problem for code years ago — everything lives in a repo, changes are tracked, history is searchable, and AI tools like Cursor can reason over the full codebase. Product work has no equivalent.

**Core insight:** Product context should live in the same Git repo as the code it describes, tracked with the same rigour, and indexed by AI that can read both.

---

## 2. Solution

Clarity is a local-first desktop application for technical PMs. It treats product artifacts — PRDs, decision logs, research notes, roadmaps — as first-class files in an engineering repo. An AI layer indexes both the product files and the codebase, enabling PMs to query context, generate artifacts, and maintain a living record of product decisions alongside the code they produced.

Think of it as Cursor, but for the product side of the repo.

---

## 3. Target User

**Primary persona:** Solo PM or PM on a small squad (1–3 PMs) at a technical B2B SaaS company with 20–150 employees.

**Characteristics:**
- Git-literate. Comfortable with markdown, terminal commands, and pull requests. Often an ex-engineer or technical enough to read code.
- Uses or has used Cursor, VS Code, or similar developer tools daily.
- Currently keeps product docs in Notion, Confluence, or scattered markdown files — and is frustrated by the disconnection from the engineering repo.
- Has experienced the pain of lost context: "Why did we build it this way?" goes unanswered regularly.
- Works closely with engineering. Sits in standups. Reads PRs. The boundary between product and engineering is thin.

**Anti-persona:** Enterprise PM at a Fortune 500 company using SAFe, managing a team of 10+ PMs, primarily operating in Jira and PowerPoint. Clarity is not for them — at least not in v1.

---

## 4. Principles

**Git is the source of truth.** Product files live in the repo. Not synced to it, not linked to it — in it. A `git log` on a PRD should show its full history, just like a source file.

**Local-first, not cloud-first.** The app runs on the user's machine and reads from their local repo. No account required to start. No data leaves the machine unless the user explicitly pushes to a remote. Privacy and speed are defaults, not features.

**AI is a collaborator, not an owner.** Clarity's AI reads context and drafts artifacts, but the PM reviews, edits, and commits. The AI never writes directly to the repo without the user's explicit action. Trust is built through transparency — the AI always shows its sources.

**Convention over configuration.** Clarity defines a clear file structure (`/product/decisions/`, `/product/specs/`, etc.) and works out of the box with sensible defaults. Users can customise, but they shouldn't need to.

**Interoperable, not proprietary.** All product artifacts are plain markdown with optional YAML frontmatter. If a user stops using Clarity, they still have a perfectly readable, version-controlled product knowledge base. No lock-in.

---

## 5. Product Structure

### 5.1 File Convention

Clarity initialises a `/product` directory in the root of any Git repo with the following structure:

```
/product
  /specs          # PRDs, feature specs, one-pagers
  /decisions      # Decision logs (ADR-style)
  /research       # User research notes, competitive analysis
  /roadmap        # Roadmap snapshots, quarterly plans
  /reports        # Generated exec summaries, changelog digests
  clarity.yaml    # Project config: team context, product description, conventions
```

Each file uses markdown with YAML frontmatter for structured metadata:

```yaml
---
title: "Implement usage-based billing"
type: spec
status: approved
author: kaushik
created: 2026-03-01
related_issues: ["LIN-342", "LIN-358"]
decision_refs: ["decisions/2026-02-billing-model.md"]
---
```

The frontmatter schema is defined in `clarity.yaml` and is extensible per project.

### 5.2 Core Capabilities (MVP)

Capabilities are listed in priority order. Items 1 and 2 are launch requirements. Items 3 and 4 are included in v1 but can ship in a fast-follow if needed.

---

**Capability 1: Context Engine — "Why did we build it this way?"**

The highest-value feature. Clarity indexes the full repo — code, product files, commit messages, PR descriptions — and lets the PM ask natural-language questions about product and engineering history.

**User flow:**
1. PM opens Clarity and navigates to the query panel (or uses a keyboard shortcut from any view).
2. PM types: "Why did we switch from flat-rate to usage-based billing?"
3. Clarity searches across decision logs, spec files, commit messages, PR descriptions, and code comments.
4. Clarity returns a synthesised answer with inline citations: links to the specific decision log, the relevant commits, and the spec that defined the change.

**Key behaviours:**
- Answers must always cite sources. Every claim links to a file, commit, or PR. If Clarity can't find a source, it says so explicitly rather than fabricating an answer.
- The index updates on file save and on git pull. Re-indexing is incremental, not full-repo.
- The user can scope queries: "Why did we build X?" (full repo) vs "What changed in /product/specs this week?" (scoped).
- Query history is persisted locally and searchable.

**Technical notes:**
- Local vector index (likely SQLite + embeddings via a local model or API-backed with opt-in).
- Chunking strategy: treat each markdown file, each commit message, and each PR description as discrete chunks. Code files chunked by function/class.
- Frontmatter metadata is used to boost relevance: a decision log tagged `billing` ranks higher for billing queries than a random code comment mentioning "bill."

---

**Capability 2: Artifact Generation — "Draft me a PRD for X"**

Clarity generates product artifacts (specs, decision logs, research summaries) from conversational input, using repo context to ground the output.

**User flow — PRD generation:**
1. PM opens a new spec from the command palette or sidebar.
2. Clarity opens a conversational panel: "What are we building? I'll draft a spec."
3. PM describes the feature in natural language, optionally referencing existing files: "We're adding a Slack integration. See the API design in /src/integrations/slack.ts and the research notes in /product/research/slack-user-interviews.md."
4. Clarity drafts a PRD in the project's spec template (defined in `clarity.yaml`), pre-filled with context from the referenced files and any relevant decision logs.
5. PM edits the draft in Clarity's editor (or their preferred editor — the file is just markdown in the repo).
6. PM commits the file via Clarity's Git integration or their terminal.

**User flow — Decision log:**
1. PM selects "New decision" from the command palette.
2. Clarity prompts: "What was decided, what alternatives were considered, and why was this option chosen?"
3. PM provides input (can be brief — Clarity expands it using repo context).
4. Clarity generates a decision log in ADR format with auto-linked references to related specs and code.

**Key behaviours:**
- Generated artifacts always use the project's templates and conventions from `clarity.yaml`.
- The AI pre-fills what it can from repo context but never commits automatically. The PM always has final edit.
- Artifacts are saved as markdown files in the appropriate `/product` subdirectory.
- Generation works offline if using a local model; degrades gracefully if API-backed and offline (saves the conversational input, generates when reconnected).

---

**Capability 3: Codebase Digest — "What shipped this week?"**

Clarity summarises recent engineering activity into product-legible context.

**User flow:**
1. PM opens the digest view and selects a time range (default: last 7 days).
2. Clarity scans commits, merged PRs, and changed files within that range.
3. Clarity produces a structured summary: features shipped, bugs fixed, refactors completed, with links to the relevant commits and any related product specs.
4. PM can edit, annotate, and save the digest as a report in `/product/reports/`.

**Key behaviours:**
- Groups changes by product area, not by developer or file path.
- Filters out noise: dependency updates, formatting changes, CI config tweaks are collapsed or hidden by default.
- Links code changes back to product specs where frontmatter `related_issues` or commit message references allow.
- Can be configured to auto-generate weekly (saved as draft, not committed until reviewed).

---

**Capability 4: Exec Reporting — "Build me this month's product update"**

Clarity compiles a structured product update from repo activity, roadmap status, and decision logs.

**User flow:**
1. PM selects "Generate report" and chooses a reporting period and audience (e.g., "monthly update for leadership").
2. Clarity pulls from: recent digests, roadmap file status fields, decision logs created in the period, and any specs that moved to `status: shipped`.
3. Clarity drafts a report in a configurable template: narrative summary, key decisions made, what shipped, what's next.
4. PM edits and exports as markdown or copies to clipboard for pasting into Slack, email, or slides.

**Key behaviours:**
- Report templates are defined in `clarity.yaml` and can be customised per audience.
- The AI highlights what changed since the last report of the same type, reducing repetition.
- Tone and length adapt to the audience: concise for exec, detailed for the engineering team.

---

### 5.3 Application Shell

**Desktop app built with Tauri** (Rust backend, web frontend). Tauri over Electron for performance, binary size, and native feel.

**Core UI components:**

- **Sidebar (left):** File tree scoped to `/product`, with the rest of the repo accessible but de-emphasised. Quick-access sections for Specs, Decisions, Research, Roadmap, Reports.
- **Editor (centre):** Markdown editor with live preview, YAML frontmatter support, and inline AI suggestions. Not a full IDE — closer to Typora or Obsidian in feel. Supports wiki-style `[[links]]` between product files.
- **AI Panel (right, toggleable):** Conversational interface for queries and artifact generation. Shows sources and citations inline. Persistent per session.
- **Command palette:** `Cmd+K` to access all actions: new spec, new decision, query, generate digest, switch files.
- **Git status bar (bottom):** Shows current branch, uncommitted changes to `/product` files, and a one-click commit + push flow.

**Keyboard-first.** Every action is accessible via keyboard shortcut. The mouse is supported but never required.

---

## 6. Technical Architecture (High-Level)

**Runtime:** Tauri (Rust core + TypeScript/React frontend).

**Local indexing:**
- On first open, Clarity indexes the repo: product files, code files, commit history, PR metadata (if GitHub/GitLab remote is configured).
- Index stored locally in SQLite with vector embeddings for semantic search.
- Incremental re-indexing on file change events (via filesystem watcher) and on `git pull`.

**AI layer:**
- API-backed by default (Anthropic Claude API) for highest quality generation and reasoning.
- Local model option (e.g., Ollama) for air-gapped or privacy-sensitive environments — reduced capability but fully functional for indexing and basic queries.
- All AI calls include repo context retrieved via RAG from the local index. The AI never sees the full repo — only relevant chunks.

**Git integration:**
- Clarity reads and writes to the local Git repo using `libgit2` (via Tauri's Rust backend).
- Commit, push, pull, branch, and diff operations are available within the app.
- Clarity never force-pushes or rebases. It creates simple commits with clear messages: `[clarity] Add decision log: billing-model-change`.

**File format:**
- All artifacts are plain markdown with YAML frontmatter.
- `clarity.yaml` at the project root defines: templates, conventions, team context (product name, description, team members), and AI behaviour preferences.
- No proprietary file formats. No database that can't be reconstructed from the files themselves.

---

## 7. What Is Explicitly Out of Scope for v1

- **Real-time collaboration / multiplayer editing.** Clarity is single-player. Collaboration happens through Git (branches, PRs, reviews) — the same way engineers collaborate on code.
- **Jira / Linear integration.** Tempting but premature. v1 references issue IDs via frontmatter, but does not sync with external trackers. This is a v2 feature once the core workflow is validated.
- **Hosted / cloud version.** Clarity is a desktop app that reads a local repo. A cloud-hosted version introduces auth, multi-tenancy, data residency, and pricing complexity that is not justified before PMF.
- **Mobile.** PMs don't write PRDs on their phones.
- **Custom AI model fine-tuning.** The RAG approach with a strong base model is sufficient for v1. Fine-tuning is an optimisation, not a requirement.
- **Visual roadmap / Gantt chart / timeline views.** Roadmaps in v1 are markdown files with structured frontmatter. Visual rendering is a later enhancement.
- **Plugin or extension system.** The app is opinionated in v1. Extensibility comes after the core workflow is proven.

---

## 8. Success Metrics

**North star metric:** Weekly active PMs who commit at least one AI-assisted artifact to their repo per week.

**Leading indicators (first 90 days post-launch):**
- Number of repos initialised with Clarity's `/product` structure.
- Queries asked per user per week (target: 5+ after onboarding).
- Artifacts generated vs. artifacts committed (measures whether AI output is useful enough to keep).
- Time from install to first committed artifact (target: under 15 minutes).

**Retention signal:**
- Week 4 retention rate (target: 40%+ of users who completed onboarding).
- Ratio of user-initiated artifacts to AI-generated artifacts over time (healthy if both grow; unhealthy if only AI-generated grows — that suggests the AI is being used but the workflow isn't sticking).

**Revenue metrics (post-launch):**
- Conversion from free trial to paid (target: 10–15%).
- Monthly churn rate (target: <5% for paid users).

---

## 9. Pricing (Initial Model)

**Free tier:** Full app functionality for repos with up to 50 product files. Local model only (no API-backed AI). This ensures the free tier is genuinely useful for solo founders and small projects, but the AI quality difference drives upgrades.

**Pro — £25/month (or £200/year):**
- Unlimited product files.
- API-backed AI (Claude) for queries, generation, and digests.
- Priority support via Discord.

**Team — £20/month per seat (minimum 3 seats, or £180/year per seat):**
- Everything in Pro.
- Shared `clarity.yaml` conventions enforced across the team.
- Team-scoped query context (AI understands who authored what).
- Onboarding mode: AI generates a "product context briefing" for new team members from the repo history.

Pricing is positioned to be an easy expense — cheaper than one Notion seat — and justifiable as a productivity tool, not a platform commitment.

---

## 10. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| PMs won't adopt a Git-based workflow | Medium | Critical | Target only Git-literate PMs (ex-engineers, technical PMs). Don't try to convert non-technical PMs in v1. The app must make Git invisible for day-to-day use — commit and push should feel like "save." |
| AI hallucination erodes trust | Medium | High | Every AI response must cite sources. If the AI can't find a source, it says "I don't have enough context to answer this" rather than guessing. Trust is the product — one hallucination that enters a committed artifact damages it. |
| RAG quality insufficient for large repos | Medium | Medium | Start with aggressive chunking and metadata-boosted retrieval. Invest in eval harness early: a set of known questions with known answers from a test repo, measured on every indexing change. |
| Tauri ecosystem maturity | Low | Medium | Tauri 2.0 is stable. Mitigate by keeping the Rust backend thin (file I/O, Git ops, indexing) and the frontend in well-understood React. If Tauri becomes a blocker, the frontend is portable to Electron with moderate effort. |
| Market too niche for venture scale | Low | Low | This is a bootstrapped product. The market doesn't need to be venture-scale — it needs to support a profitable solo or small-team business. 2,000 paying users at £25/month is £600k ARR. |

---

## 11. Open Questions

These need answers before or during early development, not before starting:

1. **Embedding model choice:** Local embeddings (e.g., `all-MiniLM-L6-v2`) vs API-backed embeddings (e.g., Anthropic/OpenAI). Local is faster and private but lower quality. Needs benchmarking against the test repo eval harness.

2. **PR metadata ingestion:** How does Clarity ingest PR descriptions and review comments? If the remote is GitHub, the GitHub API is straightforward. GitLab and Bitbucket add surface area. v1 might scope to GitHub-only and expand later.

3. **Conflict resolution:** When two PMs edit the same product file on different branches, Clarity should surface the conflict clearly. Standard Git merge conflict UX, or something product-specific?

4. **`clarity.yaml` schema:** How prescriptive should the config be? Too rigid and it fights existing team conventions. Too loose and the AI can't rely on consistent structure.

5. **Onboarding for existing repos:** What's the experience for a PM who points Clarity at a repo that already has scattered product docs (in `/docs`, in Notion exports, in random markdown files)? Should Clarity offer to reorganise them into the `/product` structure?

---

## 12. Launch Plan Alignment

Per the 6-month bootstrapping plan, Clarity sits in the "observe and shape" category for months 1–4, with serious building beginning around month 5–6 once the CMS service and Job Search CRM have validated the bootstrapping model.

**Pre-build (months 1–5):**
- Research happens in production: every PM conversation, every community interaction, every observation about tooling workflows feeds into this PRD.
- Target communities identified: Lenny's Slack, r/linear, Obsidian forums, DevTools PM Slack groups.
- Warm-up posts and credibility building in those communities begin during this phase.

**Build decision gate (month 5–6):**
- Proceed if: CMS + Job Search revenue covers living costs, and community research confirms demand (20+ people explicitly asking for a tool like this).
- Defer if: revenue isn't stable, or research reveals the pain is real but the willingness to adopt a new tool is low.

**If proceeding:**
- Month 6–7: Build MVP (Capabilities 1 and 2 only — Context Engine and Artifact Generation).
- Month 7–8: Closed beta with 10–15 PMs from research conversations.
- Month 8–9: Iterate on beta feedback, add Capabilities 3 and 4.
- Month 9: Public launch — Product Hunt, Hacker News, community posts.

---

*This document is a living artifact. It will be updated as research continues and as the build decision approaches.*
