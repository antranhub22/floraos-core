# FLORAOS COORDINATOR — DOCUMENTATION MAP

**Purpose:** Master index for AI agents and humans.

---

## 1. Canonical Document Set

| # | File | Role |
|---|---|---|
| 01 | `FLORAOS_COORDINATOR_EXISTING_SYSTEM_INTEGRATION.md` | How to add Coordinator into the existing FloraOS |
| 02 | `FLORAOS_COORDINATOR_OPERATIONS_SYSTEM.md` | Canonical business/process architecture |
| 03 | `FLORAOS_COORDINATOR_WORKFLOW_ORCHESTRATION.md` | Cross-layer workflow synchronization |
| 04 | `FLORAOS_COORDINATOR_DATABASE_ARCHITECTURE.md` | Canonical data architecture |
| 05 | `FLORAOS_COORDINATOR_USER_JOURNEY.md` | Coordinator experience and journey |
| 06 | `FLORAOS_COORDINATOR_TEMPLATE_ARCHITECTURE.md` | Template/communication architecture |
| 07 | `FLORAOS_COORDINATOR_PRD_WIREFRAME.md` | Product requirements and UI |
| 08 | `FLORAOS_COORDINATOR_PLAYBOOK.md` | Human training/execution guide |
| 09 | `FLORAOS_COORDINATOR_AI_AGENT_IMPLEMENTATION_CONTRACT.md` | Coding contract for AI agents |
| 10 | `FLORAOS_COORDINATOR_CONSISTENCY_MATRIX.md` | Cross-document synchronization matrix |

---

# 2. What Each File Answers

```text
EXISTING SYSTEM INTEGRATION
"What already exists and how must we extend it?"

OPERATIONS SYSTEM
"What is the business process?"

WORKFLOW ORCHESTRATION
"How do all process layers connect?"

DATABASE
"Where does the data live?"

USER JOURNEY
"How does the Coordinator experience the work?"

TEMPLATE ARCHITECTURE
"What information is exchanged and how?"

PRD / WIREFRAME
"What product should be built?"

PLAYBOOK
"How does a human Coordinator execute?"

AI AGENT CONTRACT
"How should the coding agent implement all of this?"
```

---

# 3. Dependency

```text
Existing FloraOS
      │
      ▼
Integration Contract
      │
      ▼
Operations System
      │
      ├──────────────┐
      ▼              ▼
User Journey    Workflow Orchestration
      │              │
      └──────┬───────┘
             ▼
        Templates
             │
             ▼
          Database
             │
             ▼
       PRD / UI / API
             │
             ▼
       AI Agent Coding
```

---

# 4. Change Governance

If a workflow changes:

```text
Update Workflow Orchestration
        ↓
Check User Journey
        ↓
Check Templates
        ↓
Check Database
        ↓
Check PRD/UI
        ↓
Check Playbook
        ↓
Update Agent Contract if implementation rule changes
```

If a database field changes:

```text
Database
 ↓
Workflow
 ↓
Template
 ↓
UI
 ↓
AI
```

If a template changes:

```text
Template
 ↓
Workflow
 ↓
User Journey
 ↓
Database/API
```

No document should be changed in isolation when the change affects another layer.

---

# 5. Canonical Synchronization Rule

> **One business change must propagate through every affected layer.**

The minimum dependency check is:

```text
Business Rule
→ Workflow
→ Journey
→ Template
→ Database
→ API
→ UI
→ Automation
→ Tests
```

---

# 6. AI Agent Rule

Before coding any new Coordinator feature:

1. Identify the Workstream.
2. Identify Stage.
3. Identify User Journey step.
4. Identify Workflow definition.
5. Identify Template(s).
6. Identify Database entities.
7. Identify API/service.
8. Identify UI surface.
9. Identify automation.
10. Identify tests.

If any layer is missing, document it before implementation.

---

# 7. Existing-System Boundary

These documents describe the **Coordinator capability**, not a new product.

The AI Agent must never interpret:

```text
Coordinator module
```

as:

```text
new repository
new application
new database
new authentication
new customer system
new partner system
```

unless repository inspection proves that such infrastructure genuinely does not exist and the change is explicitly required.


# 8. Consistency Gate

`FLORAOS_COORDINATOR_CONSISTENCY_MATRIX.md` is the explicit cross-document validation layer. Any change to Workstream, Journey, Template, Status, Database or Workflow must be checked against this matrix before coding.
