# AGENT RULES & STANDARDS — FLORAOS CORE

> This document is the **mandatory core rulebook** for all AI coding agents.
> Designed in a **3-Tier Architecture (Global / Project-Enterprise / On-Demand Skills)** to optimize context token efficiency and ensure zero-friction portability to other SaaS projects.

---

# 🌐 PART I: GLOBAL SAAS STANDARDS (Universal Tier)
*100% portable across all Web/SaaS projects — Do NOT modify when copying to other repositories.*

## 1. PRIORITY CONFLICT RESOLUTION
When rules conflict, resolve strictly in this order (lower numbers ALWAYS take precedence):
1. **Safety & Stability** (Never break working features, zero data loss)
2. **System Consistency** (Follow existing patterns, no rogue abstractions)
3. **User Understanding & Accessibility** (Intuitive workflow, correct localization)
4. **Task Efficiency** (Clean, minimal, effective code changes)
5. **Visual Refinement & Polish** (Aesthetics, micro-interactions)

## 2. MODE SELECTION
- **Default `[PROD]` Mode**: ZERO scope creep. Strictly fulfill the user's explicit request. NEVER refactor unrelated code or dependencies unless directly requested.
- **`[EXPLORE]` Mode**: Active ONLY when the user explicitly includes `[EXPLORE]`. Architectural refactoring and open analysis are permitted.

## 3. CODE HYGIENE & SRP (Single Responsibility Principle)
- **1 Unit of Code = 1 Reason to Change**.
- **File Limit: Maximum 350 lines per file**. Exceeding files MUST be split into modules, sub-components, or dedicated hooks.
- **Naming Conventions**:
  - Folders / Files: `kebab-case` (e.g., `mapping-engine.ts`)
  - React Components / Types / Interfaces: `PascalCase` (e.g., `UserProfile.tsx`, `TenantContext`)
  - Variables / Functions / Hooks: `camelCase` (e.g., `calculateTotal()`, `useTenantSession()`)
  - Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRY_LIMIT`, `DEFAULT_TIMEOUT_MS`)

## 4. 12 SAAS ANTI-PATTERNS (Strictly Prohibited)
| # | Anti-Pattern | Critical Risk | Correct Alternative |
|---|---|---|---|
| A1 | `console.log()` in production code | Data leaks, server log spam | Centralized logger (`src/core/observability/`) |
| A2 | Hardcoded URL/Key/Secret | Severe security vulnerability | Environment variables (`.env`) |
| A3 | TypeScript `any` type | Breaks compile-time safety | Explicit types or `unknown` with type guards |
| A4 | Unchecked `as` type assertion | Masks runtime errors | Type guards or Zod `.parse()` validation |
| A5 | Direct data fetch in Client Components | Exposes internal endpoints, N+1 queries, CLS | Server Component or API Route |
| A6 | `useEffect` for data fetching | Race conditions, infinite loops | Server Components, SWR, or React Query |
| A7 | Architectural leaks (e.g., ORM in Domain) | High coupling, impossible unit testing | Port Interfaces & Dependency Inversion |
| A8 | Files exceeding 350 lines | Violates SRP, unmaintainable | Decompose into sub-components/hooks |
| A9 | Direct third-party SDK calls (AI, Payments) | Uncontrolled quota, bypasses circuit breaker | Centralized Gateway abstraction |
| A10 | `SELECT *` or over-fetching columns | DB memory bloat, network latency | Precise column projection (`select`) |
| A11 | Manual SQL string concatenation | SQL Injection vulnerability | Parameterized queries / ORM methods |
| A12 | Tenant ID accepted from client request body | Critical cross-tenant security breach | Verified Server-Side Session ONLY |

## 5. SECURITY BASELINE
- **Zero-Trust Client Input**: ALL client input MUST pass through strict schema validation (e.g., Zod) before processing.
- **Error Obfuscation**: NEVER return raw error stacks or DB exceptions to the client. Return standardized application errors (`AppError`).
- **Server-Side File Validation**: Validate actual MIME type and file size on the server. Never rely solely on client-side validation.
- **Secret Zero-Exposure**: Secrets MUST NEVER be logged, sent to client state, or committed to git.

## 6. PERFORMANCE & WEB VITALS
- **N+1 Prevention**: Fetching relational data MUST use eager batching (`include`/`join`). NEVER execute queries inside loops.
- **Mandatory Pagination**: All list endpoints MUST enforce pagination (`limit` max 100). Cursor-based pagination is preferred over offset.
- **Server Components Default**: Default to React Server Components (RSC). Use `"use client"` ONLY when state, effects, or browser listeners are mandatory.
- **Bundle Optimization**: Use tree-shakable imports. Heavy components (charts, rich editors) MUST be dynamically loaded (`dynamic(() => import(...))`).

## 7. VERIFICATION & ERROR LEARNING PROTOCOL
- **Mandatory Pre-Handoff Checklist**:
  - [ ] Meets 100% of the user's original request?
  - [ ] User-facing strings: 100% Vietnamese verified (§8)?
  - [ ] Zero violations of the 12 Anti-patterns (§4) and SRP limit (§3)?
  - [ ] Passes typecheck, linting, and automated test suites?
- **Learning Protocol**: When fixing a recurring failure, document the root cause and solution in §14 (Known Failure Patterns) to prevent regression.

---

# 🏢 PART II: PROJECT & ENTERPRISE CONSTRAINTS (Project Tier)
*Specific to FloraOS — Customize this section when porting to another repository.*

## 8. STRICT LOCALIZATION REQUIREMENT
- **User-Facing Text MUST BE 100% VIETNAMESE**:
  - Navigation, buttons, labels, placeholders, tooltips, validation messages, empty/loading states, dialogs, and notifications MUST be in natural Vietnamese.
  - Technical terms: Use `Friendly Vietnamese (Original term if necessary)`.
  - Code identifiers (variables, functions, schema, routes) remain in English.

## 9. TECH STACK SPECIFICATIONS
| Layer | Technologies |
|---|---|
| Web & Framework | Next.js 16 (App Router), Port `3100`, React 19 (Server Components default) |
| Language & Styling | TypeScript 5.9 strict (alias `@/*`), Tailwind CSS 4, Radix UI / shadcn/ui |
| Database & ORM | PostgreSQL (Docker), Prisma 7, English `snake_case` schema |
| Background Worker | Python 3.10+ (`workers/`), `psycopg3` (SKIP LOCKED + LISTEN/NOTIFY) |
| AI Integration | OpenAI, Anthropic, ElevenLabs routed via AI Gateway (`src/core/ai/`) |
| Testing Suites | Vitest (Unit/Integration) + Playwright (E2E) |

## 10. CLEAN ARCHITECTURE (4-Layer Module Structure)
```
API Route (src/app/api/v1/) → handle() → requireTenantContext() → requireCapability()
  ├── use-cases/  : Business workflow orchestration
  ├── domain/     : Pure business rules (STRICTLY PROHIBITED from importing Prisma)
  ├── infra/      : Database persistence (Prisma repositories, scopedWhere/scopedData)
  └── adapters/   : External service connectors conforming to Ports (src/core/ports/)
```

## 11. MULTI-TENANT ISOLATION (Enterprise Data Boundary)
- **Session-Derived Tenant ID**: `organization_id` MUST be extracted from the verified server session (`requireTenantContext(req)`). NEVER accept tenant identity from client payload.
- **Zero-Leak Policy**: Cross-tenant unauthorized access MUST return `404 Not Found` or empty results. **NEVER return `403 Forbidden`** (HTTP 403 leaks the existence of another tenant's confidential record).
- **Database Schema**: Every tenant-owned table MUST contain an `organization_id` column with an index `@@index([organization_id])`.

## 13. JOURNEY-FIRST UX ARCHITECTURE (J1–J7 Standards)
- **Journey-First Entry Point**: Entry pages/dashboards start with the user's action goal (`ChoiceGrid` asking "What do you want to do?") rather than raw metrics or module menus.
- **Mandatory Dual-Mode Entry**: Every feature workflow (create, draft, configure) MUST provide 2 initial entry options:
  1. *Automatic AI Fast-Track (`SmartInputDropzone`)*: User inputs raw media/text (Images, Video URL, Notes) ➔ AI analyzes (Vision OCR, Content Engine) and **pre-fills all wizard steps (Human-in-the-loop)**.
  2. *Manually Guided Wizard*: Step-by-step sequential guided progress (Progressive Disclosure J2).
- **7 Core Principles**:
  1. `J1` Journey-First: Action-oriented choice grid over module hierarchy.
  2. `J2` Progressive Disclosure: Show only the relevant steps/inputs for the current stage.
  3. `J3` Next Best Actions: Every result state MUST lead to recommended next actions (`NextActions`).
  4. `J4` Contextual AI: AI embedded directly into workflow stages, not isolated.
  5. `J5` Role UX ≠ Capability: Role UX personalizes the journey, but RBAC / Capability Codes strictly enforce authorization.
  6. `J6` 7-Step Action Contract: `Select` → `Input` → `Preview` → `Execute` → `Processing` → `Result` → `Next Action` (`ActionContractWrapper`).
  7. `J7` "WRAP, not REPLACE" & Expert Mode: Wrap existing dashboards as journey destinations; provide toggleable Expert Mode for power users.
- **Core Modules & UI Kit**: `src/modules/journey/` (domain/catalog) & `src/components/journey/` (`ChoiceGrid`, `ActionCard`, `JourneyShell`, `NextActions`).

## 14. KNOWN FAILURE PATTERNS (FloraOS Battle-Tested Log)
| # | Issue | Root Cause | Standard Remedy |
|---|---|---|---|
| 1 | `server-only` crash in Vitest | Missing `react-server` condition in Vitest | Use stub at `tests/helpers/server-only-stub.ts` |
| 2 | TS error assigning `undefined` | `exactOptionalPropertyTypes: true` active | Omit the key or type as `{ key?: T \| undefined }` |
| 3 | Tenant test failure on new table | Table missing `organization_id` column | Add `organization_id` + verify with `npm run test:tenant` |
| 4 | Python worker idle / missing jobs | Missing PostgreSQL `NOTIFY` trigger after INSERT | Check `LISTEN/NOTIFY` triggers on the `jobs` table |
| 5 | Duplicate images in Creative Studio | Local fallback returned raw unsegmented bytes | Use `StudioLocalImageProvider` with active segmentation |
| 6 | Flaky tests in parallel runs | Shared DB race condition across test files | Keep `fileParallelism: false` in `vitest.config.ts` |

---

# ⚡ PART III: ON-DEMAND SKILLS REGISTRY (Workflow Tier)
*Load specialized domain instructions dynamically from `.agents/skills/`.*

| When working on... | Read Skill File |
|---|---|
| API routes, use-cases, repositories, validation | [`api-development`](skills/api-development/SKILL.md) |
| React components, UI layouts, forms, modals, Vietnamese UX | [`ui-development`](skills/ui-development/SKILL.md) |
| AI gateway, provider adapters, port interfaces, LLM calls | [`ai-integration`](skills/ai-integration/SKILL.md) |
| Python workers, background queues, media processing | [`worker-python`](skills/worker-python/SKILL.md) |
| Prisma schema updates, DB migrations, data modeling | [`database-schema`](skills/database-schema/SKILL.md) |
| Writing tests, debugging Vitest / Playwright, tenant tests | [`testing`](skills/testing/SKILL.md) |
| Creative Studio features, 14-step Product-to-Market Journey | [`creative-studio`](skills/creative-studio/SKILL.md) |
