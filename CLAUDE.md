# CLAUDE.md — FLORAOS CORE DEVELOPMENT GUIDE

> Behavioral guidelines and operational instructions for Claude Code / Claude CLI on the `floraos-core` repository.

---

## 🚨 MANDATORY COMPLIANCE (SSOT RULES)

All code modifications, refactoring, and implementations **MUST strictly adhere 100%** to the standardized rulebook:
👉 **[`.agents/AGENT_RULES.md`](.agents/AGENT_RULES.md)**

### Core Non-Negotiable Laws:
1. **Default Mode**: `[PROD]` mode — zero scope creep. Never refactor code outside the user's explicit request.
2. **File Size Limit**: Maximum **350 lines per file**. Exceeding files MUST be modularized into sub-components/hooks.
3. **Tenant Security**: `organization_id` MUST be extracted from server-side session (`requireTenantContext`). NEVER accept from client body/query. Return `404` (not `403`) on cross-tenant access.
4. **Clean Architecture**: `domain/` MUST NOT import Prisma or infrastructure code. Prisma access is restricted to `infra/`.
5. **Aegis Resource Protection**: Zero infinite loops. All external AI calls MUST be wrapped in circuit breakers.
6. **Strict Vietnamese UI**: ALL user-facing text (labels, buttons, tooltips, toasts, dialogs) MUST be in natural Vietnamese.

---

## ⚡ ON-DEMAND SKILLS SYSTEM

Before starting any task, you **MUST read the corresponding `SKILL.md`** file in `.agents/skills/`:

| When working on... | Read Skill File |
|---|---|
| API routes, use-cases, repositories, route handlers | `.agents/skills/api-development/SKILL.md` |
| React components, UI layouts, forms, modals, UX | `.agents/skills/ui-development/SKILL.md` |
| AI models, Gateway, Provider adapters, LLM calls | `.agents/skills/ai-integration/SKILL.md` |
| Python workers, background jobs, media processing | `.agents/skills/worker-python/SKILL.md` |
| Prisma schema, database migrations, data modeling | `.agents/skills/database-schema/SKILL.md` |
| Writing tests, running unit/tenant/E2E test suites | `.agents/skills/testing/SKILL.md` |
| Creative Studio or product photo upload features | `.agents/skills/creative-studio/SKILL.md` |

---

## 🛠️ ESSENTIAL WORKFLOW COMMANDS

| Purpose | Shell Command |
|---|---|
| TypeScript Typecheck | `npx tsc --noEmit` |
| Run Unit Tests | `npm test` |
| Tenant Isolation Tests | `npm run test:tenant` *(Must pass before any commit)* |
| Start Web Dev Server | `npm run dev` (Port 3100) |
| Start Python Media Worker | `npm run worker:media` |
| Regenerate Prisma Client | `npx prisma generate` |

---
*For historical architecture context and phase records, refer to: `AGENTS.md`.*
