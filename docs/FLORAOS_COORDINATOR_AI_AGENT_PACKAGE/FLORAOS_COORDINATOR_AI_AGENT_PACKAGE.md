# FLORAOS COORDINATOR — AI AGENT PACKAGE

This package is the documentation contract for implementing Coordinator Operations as a **feature/module added to the existing FloraOS system**.

## Required reading order

1. `FLORAOS_COORDINATOR_EXISTING_SYSTEM_INTEGRATION.md`
2. `FLORAOS_COORDINATOR_OPERATIONS_SYSTEM.md`
3. `FLORAOS_COORDINATOR_WORKFLOW_ORCHESTRATION.md`
4. `FLORAOS_COORDINATOR_DATABASE_ARCHITECTURE.md`
5. `FLORAOS_COORDINATOR_USER_JOURNEY.md`
6. `FLORAOS_COORDINATOR_TEMPLATE_ARCHITECTURE.md`
7. `FLORAOS_COORDINATOR_PRD_WIREFRAME.md`
8. `FLORAOS_COORDINATOR_PLAYBOOK.md`
9. `FLORAOS_COORDINATOR_AI_AGENT_IMPLEMENTATION_CONTRACT.md`
10. `FLORAOS_COORDINATOR_CONSISTENCY_MATRIX.md`

## Core architecture

```text
Existing FloraOS
      ↓
Coordinator Module
      ↓
Business Process
      ↓
User Journey
      ↓
Workflow Orchestration
      ↓
Templates
      ↓
Database
      ↓
API / UI / Automation / AI
```

## Golden rule

> **Do not build a new system. Extend the existing system without creating duplicate sources of truth.**

The repository itself must be inspected first. These documents define the intended Coordinator capability and the cross-layer contract; they do not authorize replacing existing infrastructure.
