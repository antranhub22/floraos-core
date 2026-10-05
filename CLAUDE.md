# CLAUDE.md — FloraOS Core Agent Operating Guide

> **Scope:** Every AI coding agent session (Claude Code CLI / Web / IDE) on `floraos-core`.
> **Status:** `CANONICAL` · **Owner:** Product Owner (PO) · **Change control:** edits to this file require PO approval and must not contradict the documents in §1.
> This file is loaded into every session — keep it short, factual and verifiable. Detail lives in the documents it points to.

---

## 0. TL;DR — the 10 rules you must never break

| # | Rule | How it is verified |
|---|---|---|
| R1 | **`[PROD]` mode by default** — do exactly what was asked; no unrequested refactors, renames, dependency bumps or "drive-by" fixes. `[EXPLORE]` only when the user writes it. | Diff review |
| R2 | **Tenant identity is server-side only.** `organization_id` comes from `requireTenantContext()`; never from body/query/headers. Cross-tenant access returns **404, never 403**. | `npm run test:tenant` |
| R3 | **Every tenant-owned table has `organization_id` + `@@index([organization_id])`.** Documented exceptions only (`ai_capabilities`, `ai_models`, system roles). | `npm run test:tenant` |
| R4 | **Authorization by capability code** (`requireCapability()`), never by UI role / `roleKey`. | `npm run test:platform`, unit tests |
| R5 | **Clean Architecture:** `domain/` imports no Prisma/infra; Prisma only in `infra/`; provider SDKs only in `adapters/`. | `npx tsc --noEmit`, review |
| R6 | **All AI calls go through the AI Gateway** (`callCapability` in `src/core/ai/gateway.ts`) — routing/fallback, privacy floor, license filter and request logging live there. No direct provider calls; every retry/loop must be bounded (Aegis). | Review, unit tests |
| R7 | **User-facing text is 100% natural Vietnamese**; no technical codes (`M01a`, `SSOT`, `P2`…) in UI; semantic color/typography tokens only. | `npm run lint:ux -- --check` |
| R8 | **Max 350 lines per file.** Split into sub-modules/components/hooks. | Review |
| R9 | **No secrets, customer data or `.env` content** in code, logs, commits or chat output. | Review, secret scanning |
| R10 | **Never mark work done with a red gate.** Report failures verbatim; never skip, disable, `.skip` or `continue-on-error` a test. | §5 gates |

---

## 1. Authority hierarchy (conflict resolution)

When sources disagree, the higher one wins. If a conflict cannot be resolved by this order, **stop and ask the PO**.

1. **The user's explicit instruction in the current session** (within safety limits — it can narrow scope, not waive R2/R3/R9/R10).
2. **[`.agents/AGENT_RULES.md`](.agents/AGENT_RULES.md)** — mandatory engineering rulebook (anti-patterns A1–A12, security, performance, architecture, tenancy, Journey-First UX).
3. **[`docs/00-DOCUMENTATION-CONSTITUTION.md`](docs/00-DOCUMENTATION-CONSTITUTION.md)** + **[`docs/00-DOCUMENTATION-REGISTRY.yaml`](docs/00-DOCUMENTATION-REGISTRY.yaml)** — which document is the SSOT for each topic.
4. **Level-1 architecture & status:** `docs/kien-truc/FLORAOS_SAAS_TARGET_ARCHITECTURE_V2.md`, `docs/kien-truc/TRANG_THAI.md`.
5. **Domain skill** in `.agents/skills/<skill>/SKILL.md` (§3).
6. **[`AGENTS.md`](AGENTS.md)** — project conventions, phase gates, code map, known traps (Vietnamese).
7. **Existing code patterns** in the module you are touching.

Priority of concerns inside any rule set: **Safety & data integrity → System consistency → User understanding → Task efficiency → Visual polish.**

---

## 2. Session start protocol

Before writing or changing code:

1. **Classify the task** and load the matching skill file(s) from §3. Load only what the task needs.
2. **Locate the SSOT** for the area in `docs/00-DOCUMENTATION-REGISTRY.yaml`; check `docs/kien-truc/TRANG_THAI.md` for current phase/state.
3. **Read the actual code** you will change and its tests. Never rely on a checklist tick, a doc or memory — open the file it refers to.
4. **Answer the pre-coding questions** in `AGENTS.md` → "Chín câu hỏi trước khi viết mã" (harvest rank, tenant column, job vs. sync, usage, approval, capability, AI capability/model license, Role UX / Screen Contract).
5. **Check §4** — if any stop-and-ask trigger applies, ask before coding.

---

## 3. On-demand skills registry

| When working on… | Read |
|---|---|
| API routes, use-cases, repositories, validation, route handlers | `.agents/skills/api-development/SKILL.md` |
| React components, layouts, forms, modals, Vietnamese UX | `.agents/skills/ui-development/SKILL.md` |
| AI gateway, provider adapters, ports, LLM calls | `.agents/skills/ai-integration/SKILL.md` |
| Python workers, job queue, media processing | `.agents/skills/worker-python/SKILL.md` |
| Prisma schema, migrations, data modeling | `.agents/skills/database-schema/SKILL.md` |
| Unit / tenant / platform / E2E tests | `.agents/skills/testing/SKILL.md` |
| Creative Studio, product photo upload, 14-step Product-to-Market journey | `.agents/skills/creative-studio/SKILL.md` |

Cross-cutting tasks load every relevant skill (e.g. new API + new table → `api-development` + `database-schema` + `testing`).

---

## 4. Stop-and-ask triggers (mandatory human approval)

Stop, explain the decision needed in one short message, and wait for the PO/user when the task would:

- **Touch any feature where the user uploads photos** — confirm which of the 14 Product-to-Market stages run before writing code (`AGENTS.md`, Creative Studio rule).
- **Change the Prisma schema** in a way that drops/renames columns or tables, alters `organization_id`, or needs a data migration.
- **Weaken a security boundary**: tenancy, RBAC capability ceilings, AI privacy floor (`SENSITIVE` data), the 4-field model license filter (D18), auth/session/SSO.
- **Change the structure, colors or placement** of `<FeatureGuidanceCard />`, the Tab Action Header, or any PO-locked UX standard.
- **Add a dependency, external service, provider or paid API**, or change `render.yaml` / CI / deploy config.
- **Run anything destructive** on a non-test database, delete data/files outside the task, or force-push / rewrite shared history.
- **Conflict between sources** in §1 that the order does not settle, or a requirement that is ambiguous in a way that changes the implementation.

Do **not** ask for things with an obvious conventional default — decide, state the choice, proceed.

---

## 5. Definition of Done — quality gates

Mirror of `.github/workflows/ci.yml`. Run the gates relevant to your change; **tenant & platform isolation are mandatory for any change touching data access, routes, schema or auth.**

| Gate | Command | Required when |
|---|---|---|
| Typecheck | `npm run typecheck` | Always (TS changes) |
| Lint | `npm run lint` | Always (TS changes) |
| UX lint ratchet (no new violations) | `npm run lint:ux -- --check` | Any `.tsx` in `src/app/` or `src/components/` |
| Unit tests | `npm test` | Always |
| Tenant isolation | `npm run test:tenant` | Data access, routes, schema, auth — **blocking** |
| Platform console isolation | `npm run test:platform` | Platform/RBAC/console changes — **blocking** |
| Template SSOT sync | `npm run check:template-ssot` | Any change under `src/components/templates/` |
| Contract schemas | `npm run check:schemas:creative` (and `:coordinator`, `:content-engine`) | Changes to zod contracts |
| Docs registry | `npm run check:docs` | Doc additions/renames |
| Worker tests | `cd workers && python -m pytest tests -q` | Any change under `workers/` |
| Build | `npm run build` | Routing, config, or before release |
| E2E UX / a11y | `npm run test:e2e:ux` | New/re-laid-out screens |

Handoff checklist (in addition to green gates):

- [ ] 100% of the request is done — nothing more (R1).
- [ ] Zero violations of AGENT_RULES §4 anti-patterns (A1–A12) and R8.
- [ ] New business rule ⇒ a test that locks it. Bug fix ⇒ a regression test.
- [ ] SSOT docs updated **in the same commit** when behavior, contracts, templates or screens change (Screen Contract in `docs/dac-ta/screen-contracts/` for new/re-laid-out screens).
- [ ] A recurring failure fixed ⇒ add a row to AGENT_RULES §14 or `AGENTS.md` → "Bẫy".
- [ ] Final report states what changed, which gates ran and their results, and anything not verified.

If a gate cannot run in your environment (e.g. no Postgres, `prisma generate` blocked by network), say so explicitly — never claim it passed.

---

## 6. Operational safety

- **Databases:** `test:tenant` / `test:platform` **TRUNCATE every table**. They are guarded to run only on a database whose name ends in `_test`; set it up once with `npm run db:test:setup`. Before any Prisma CLI command, confirm `DATABASE_URL` points where you expect (`echo "[$DATABASE_URL]"` and read the `Datasource "db"` line).
- **Never run** `npx vitest run` directly (pulls tenant suites in) — use `npm test` and `npm run test:tenant`.
- **Prisma 7:** connection string lives in `prisma.config.ts`, not `schema.prisma`; `db push --skip-generate` no longer exists. After editing `schema.prisma`, run `npx prisma generate` before trusting `tsc` errors.
- **Customer data & secrets:** read operational data folders selectively; never copy `.env`, `he_thong.json` or similar into tracked paths; never print secret values. Use placeholders in examples.
- **Next.js 16** differs from training data — read `node_modules/next/dist/docs/` before using unfamiliar APIs. `next dev` re-inserts an agent-rules block into `AGENTS.md`; commit it rather than fighting it.
- **Displayed numbers must be measured** — never hard-code plausible-looking metrics in UI.
- More traps: `AGENTS.md` → "Bẫy", AGENT_RULES §14.

---

## 7. Git & change management

- Work on the assigned feature branch; never commit directly to `main`. Push only when asked or when the session workflow requires it.
- **Conventional Commits**, matching history: `feat(scope): …`, `fix(scope): …`, `chore(scope): …`, `docs(scope): …`, `test(scope): …`. One logical change per commit; code + tests + SSOT doc updates together.
- Never commit secrets, generated artifacts not already tracked, local data, or debug output.
- Never rewrite shared history (no force-push / rebase of branches others use). No `--no-verify`.
- Ported code from `FloraOS` / `LocalBudd` / `SocialFlow` must have a REUSE / EXTEND / ADAPTER rank in `docs/archive/historical/HARVEST_MANIFEST.md` (AGENTS.md "Luật thu hoạch").

---

## 8. Communication

- Reply to the user in **Vietnamese** unless they write otherwise; code identifiers, schema and commit messages stay in English.
- Report outcomes faithfully: what changed (with `file:line`), gates run + results, open risks, and what was **not** verified. No unverifiable claims.
- Out-of-scope issues found while working: mention them briefly (or file a follow-up) — do not fix them under `[PROD]`.

---

## 9. Command reference

| Purpose | Command |
|---|---|
| First-time setup | `docker compose up -d && npm i && npx prisma generate && npx prisma db push && npm run db:seed` |
| Test DB (once) | `npm run db:test:setup` |
| Web dev server (port 3100) | `npm run dev` |
| Web + core workers | `npm run dev:core` · everything: `npm run dev:all` |
| Media / vision / video worker | `npm run worker:media` · `worker:vision` · `worker:video` |
| Regenerate Prisma client | `npx prisma generate` |
| Gates | see §5 |

---

*Historical architecture context, phase records and the full code map: [`AGENTS.md`](AGENTS.md). This file intentionally contains no status snapshots — current state lives in `docs/kien-truc/TRANG_THAI.md`.*
