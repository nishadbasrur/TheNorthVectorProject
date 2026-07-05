# ADR-0002: Use a Modular Monolith for Phase 1

## Status

Accepted

## Date

2026-06-14

## Decision Owner

Nishad

## Reviewers

- Project Owner
- Technical Lead
- Operations Owner
- Security Owner

## Related Documents

- `10-Implementation/Implementation_Roadmap.md`
- `10-Implementation/Technical_Stack_and_Environment.md`
- `10-Implementation/Development_Workflow_and_Standards.md`
- `10-Implementation/Deployment_and_Operations_Plan.md`
- `10-Implementation/Phase_1_Backlog.md`
- `10-Implementation/Implementation_Risk_Register.md`
- `10-Implementation/Implementation_Decision_Log.md`
- `10-Implementation/ADRs/ADR-0001-Use-PostgreSQL-as-Primary-Database.md` (superseded — see `10-Implementation/ADRs/ADR-0101-Use-Firestore-as-the-Primary-Database.md`)

## Context

North Vector contains many logical domains, including:
- identity and sessions
- canonical objects
- relationships
- memory
- retrieval
- planning
- reviews
- integrations
- approval and execution
- automation
- notifications
- audit
- privacy and deletion
- operations

The full product vision may eventually justify independently deployed services or specialized infrastructure. However, Phase 1 is:
- single-user
- desktop-first
- operated by one developer
- dependent on one primary external integration
- focused on proving a narrow MVP
- highly sensitive to execution delay and operational complexity

The largest near-term implementation risks are not service scale or organizational ownership. They are:
- continuing architecture work instead of coding
- allowing the MVP scope to expand
- building integrations before the core data and approval model works
- making deletion, audit, and recovery too complex to verify
- introducing infrastructure that one developer cannot operate confidently

The implementation still needs strong internal boundaries. Memory logic should not be mixed into route handlers, integration code should not leak into domain models, and model output should not execute actions directly.

The architectural question is whether those boundaries should be represented as independent deployed services in Phase 1 or as modules inside one deployable application architecture.

## Decision Drivers

- low operational overhead
- fast local development
- easy debugging
- transactional consistency
- simple deployment and rollback
- one-developer maintainability
- clear domain boundaries
- testability
- lower credential and network surface
- ability to evolve later
- support for one web process and one worker process
- alignment with the MVP critical path

## Options Considered

### Option A: Modular Monolith

Description:
Build one primary application codebase with explicit domain modules, one primary web deployment, one worker deployment, and one primary database (originally PostgreSQL; actually Firestore as of 2026-07-03, see ADR-0101).

Advantages:
- straightforward local setup
- simpler deployment and observability
- easy in-process calls between domains
- strong transactional consistency
- fewer network and credential boundaries
- easier refactoring while domain boundaries are still evolving
- lower operational cost
- practical for one developer
- future service extraction remains possible if module interfaces remain disciplined

Disadvantages:
- weak module discipline could collapse into a tangled codebase
- all application domains share a deployment lifecycle
- heavy background work may compete with interactive workloads if poorly separated
- one application failure may affect several capabilities
- later service extraction may require refactoring

Risks:
- business logic may leak across modules
- developers may treat `monolith` as permission to ignore boundaries
- shared database access may bypass domain ownership

### Option B: Microservices by Domain

Description:
Deploy separate services for identity, memory, retrieval, planning, integrations, execution, audit, and other domains.

Advantages:
- explicit deployment and ownership boundaries
- independent scaling
- fault isolation when designed well
- technology choices may vary by service

Disadvantages:
- much greater deployment and observability complexity
- distributed transactions and eventual consistency
- more secrets and network paths
- harder local development
- slower iteration for one developer
- difficult end-to-end debugging
- more complex deletion and audit propagation

Risks:
- architecture work overwhelms product implementation
- service contracts become premature and unstable
- cross-service failures undermine the MVP workflow
- operational burden exceeds project capacity

### Option C: Serverless Functions for Each Capability

Description:
Implement most backend behavior as separate serverless functions or provider-specific actions.

Advantages:
- low idle cost
- simple deployment for isolated functions
- automatic scaling
- natural event-driven execution for some workflows

Disadvantages:
- fragmented business logic
- provider coupling
- cold starts and runtime limits
- difficult local integration testing
- harder transactional behavior
- background job orchestration becomes scattered

Risks:
- permissions and audit behavior differ across functions
- model, integration, and database logic becomes difficult to reason about
- debugging full workflows becomes painful

### Option D: Single Unstructured Application

Description:
Build one application without formal internal domain boundaries.

Advantages:
- fastest possible initial setup
- minimal architectural overhead

Disadvantages:
- business rules spread across UI, routes, and database code
- difficult testing
- difficult future extraction
- authorization and privacy controls become inconsistent
- high long-term maintenance risk

Risks:
- rapid codebase decay
- unsafe shortcuts around execution and audit
- inability to explain ownership of domain behavior

## Decision

North Vector will use a modular monolith for Phase 1.

The Phase 1 deployment will consist of:
- one primary web application
- one background worker process
- one primary database (originally PostgreSQL; actually Firestore, see ADR-0101 — and note the "worker process" became one scheduled Cloud Function rather than an always-running process, see ADR-0103)
- one shared codebase or monorepo with explicit domain modules

The worker may be deployed separately for operational isolation, but it will share the same domain packages, database, authorization rules, and release process.

Phase 1 will not introduce independently versioned microservices for identity, memory, retrieval, planning, integrations, execution, audit, or notifications.

## Required Module Boundaries

The modular monolith should maintain explicit modules for:
- identity
- devices and sessions
- canonical objects
- relationships
- memory
- retrieval and context assembly
- Chief sessions
- goals and planning
- reviews
- integrations
- approvals
- execution and verification
- automations and jobs
- notifications
- audit
- export and deletion
- security and privacy

Each module should expose intentional service interfaces rather than allowing arbitrary internal imports.

## Required Layering

Recommended flow:

Interface
↓
Application Service
↓
Authorization
↓
Domain Logic
↓
Repository or Integration Adapter
↓
Audit and Verification

Route handlers and UI components should not own domain logic.

Model-provider output should not call repositories or external adapters directly.

## Rationale

The modular-monolith approach gives North Vector the strongest chance of becoming a working product quickly while preserving enough structure to remain maintainable.

Phase 1 needs tight consistency across memory, canonical objects, relationships, approvals, execution, and audit. Keeping these systems inside one application boundary avoids premature network contracts and distributed failure modes.

The architecture also aligns with the project's human constraint: one developer must be able to understand the entire system. A microservice architecture would create more deployment, security, observability, and recovery work before the product has proven value.

The decision does not reject modularity. It rejects premature distribution.

North Vector should first prove clean logical boundaries. Physical service extraction may follow later when a real operational or scaling need appears.

## Consequences

### Positive Consequences

- faster implementation
- simpler local development
- fewer deployment targets
- easier end-to-end debugging
- strong transaction support
- simpler authorization and audit consistency
- fewer credentials and network boundaries
- easier backup and restore
- lower hosting cost
- easier refactoring while requirements evolve

### Negative Consequences

- all modules share a release cadence
- poorly enforced boundaries could create tight coupling
- one application outage may affect multiple capabilities
- worker and web workloads require careful operational separation
- later extraction may require additional refactoring

### Operational Consequences

- production needs one web deployment and one worker deployment
- one release should normally version both processes together
- health checks must distinguish web and worker state
- the worker must be independently pausable
- the database remains a shared operational dependency
- feature flags should isolate risky capabilities without requiring service separation

### Security and Privacy Consequences

- fewer inter-service tokens and credentials reduce attack surface
- server-side authorization remains centralized and consistent
- modules must still respect least privilege internally
- shared database access should not allow bypassing domain controls
- observability must avoid collecting private context across the entire application

### Data and Migration Consequences

- all modules share one canonical schema and migration sequence
- cross-domain transactions are easier
- service extraction later will require careful data ownership decisions
- database access should be wrapped through repositories or services rather than scattered SQL

## Implementation Notes

Suggested project structure:

```text
/apps
  /web
  /worker
/packages
  /domain
  /database
  /integrations
  /ai
  /security
  /ui
  /config
/docs
```

A simpler initial structure is acceptable if logical boundaries remain clear.

Required engineering practices:
- no domain logic in UI components
- no provider-specific behavior in canonical domain models
- no model output directly writing or executing
- no direct cross-module database mutation without domain service ownership
- shared authorization and audit utilities
- module-level tests
- integration tests across critical boundaries

## Module Interface Rules

A module should expose:
- commands or application services
- queries
- validated input and output schemas
- domain errors
- events where useful

A module should not expose:
- mutable internal state
- raw provider credentials
- unrestricted table access
- implementation-specific model prompts

## Background Worker Rules

The worker should:
- process database-backed jobs
- use idempotent handlers
- revalidate permission and approval before consequential work
- preserve audit events
- expose health and queue status
- support pause and safe restart

The worker should not become a separate business-logic implementation.

## Validation Plan

The decision will be validated through:
- one-command local startup
- chemistry-exam vertical slice
- transactional object and audit tests
- web and worker deployment
- end-to-end debugging during Calendar integration
- release and rollback exercises
- architecture-boundary review after MVP

Module quality will be evaluated by:
- whether domain logic can be tested without the UI
- whether provider adapters can be mocked cleanly
- whether changes remain localized
- whether authorization and audit behavior stay consistent
- whether a module could plausibly be extracted later without rewriting its meaning

## Rollback or Exit Strategy

If the modular monolith becomes inadequate, North Vector may extract a module into a service when:
- its workload scales independently
- it requires a different runtime
- fault isolation becomes operationally necessary
- security isolation demands a separate boundary
- deployment cadence meaningfully differs
- ownership expands beyond one small team

A future extraction should:
1. identify data ownership
2. define a stable contract
3. create asynchronous or synchronous integration deliberately
4. preserve audit and authorization semantics
5. migrate gradually
6. use a new ADR

The first likely extraction candidates may include:
- background automation worker
- model-processing workloads
- search or embedding services
- notification delivery

No extraction should occur solely because microservices appear more sophisticated.

## Residual Risks

- internal boundaries may erode
- shared database access may create hidden coupling
- deployment of one module may affect unrelated areas
- worker load may affect database performance
- future extraction cost may grow if interfaces are neglected

## Assumptions

- Phase 1 remains single-user
- one developer or small team owns the codebase
- one primary database remains sufficient
- background work can run in one worker process
- the system does not require independent regional scaling
- provider integrations remain limited during MVP
- module boundaries are enforced through review and tests

## Review Triggers

Revisit this ADR when:
- one module requires independent scaling
- deployments become risky because unrelated modules are coupled
- worker load materially affects interactive performance
- security requirements call for stronger isolation
- multiple teams require independent ownership
- a specialized runtime becomes necessary
- production incidents reveal unacceptable blast radius
- the system adds multi-user tenancy

## Review Date

After one month of MVP production use or when the first review trigger occurs.

## Outcome

### Expected Outcome

The modular monolith should allow North Vector to ship the MVP faster, preserve transactional integrity, and remain understandable to one developer while keeping future service extraction possible.

### Actual Outcome

Pending implementation.

### Lessons

Pending implementation and real usage.

### Follow-Up Decision

Keep for Phase 1 unless measured evidence supports a superseding ADR.

## Change History

| Date | Change | Author |
|---|---|---|
| 2026-06-14 | Initial accepted ADR | Nishad |