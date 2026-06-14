# ADR-0006: Use TypeScript Across the Phase 1 Application

## Status

Accepted

## Date

2026-06-14

## Decision Owner

Nishad

## Reviewers

- Project Owner
- Technical Lead
- Frontend Owner
- Backend Owner
- Security Owner

## Related Documents

- `10-Implementation/Technical_Stack_and_Environment.md`
- `10-Implementation/Development_Workflow_and_Standards.md`
- `10-Implementation/Testing_Strategy.md`
- `10-Implementation/Phase_1_Backlog.md`
- `10-Implementation/Implementation_Risk_Register.md`
- `10-Implementation/Implementation_Decision_Log.md`
- `10-Implementation/ADRs/ADR-0002-Use-a-Modular-Monolith-for-Phase-1.md`

## Context

Phase 1 requires a desktop-first web application, a background worker, domain logic, database access, provider integrations, model orchestration, authorization, validation, and shared schemas.

The project is being built initially by one developer and needs to minimize context switching and duplicated type definitions across the frontend and backend.

The language choice should support:
- a modern web interface
- server-side application logic
- background jobs
- strong API and model-output validation
- shared canonical object schemas
- provider integrations
- mature test tooling
- clear deployment paths
- strict static analysis

North Vector may later include specialized workloads such as local inference, data science, computer vision, speech processing, or hardware prototyping. Those future needs do not necessarily require the Phase 1 application to use multiple primary languages from the beginning.

## Decision Drivers

- one language across frontend and backend
- strong type safety
- shared schemas
- rapid iteration
- mature web ecosystem
- broad provider SDK support
- good testing tools
- deployability
- developer learning curve
- maintainability by one developer
- compatibility with a modular monolith
- ability to add Python later where justified

## Options Considered

### Option A: TypeScript Across Web, Backend, and Worker

Description:
Use TypeScript as the primary language for the Phase 1 web application, server logic, domain modules, integrations, and background worker.

Advantages:
- one language across the application
- shared types and validation schemas
- strong React and Next.js ecosystem
- broad support for Google APIs and model providers
- mature linting, formatting, testing, and build tools
- easier code reuse between web and worker
- good fit for JSON-heavy provider and model workflows
- reduced context switching for one developer

Disadvantages:
- runtime type safety still requires explicit validation
- some data science and machine-learning libraries are stronger in Python
- asynchronous code and package ecosystem quality vary
- TypeScript can create false confidence if external data is cast unsafely
- certain background or compute-intensive tasks may fit other runtimes better

Risks:
- overusing `any` or unchecked assertions
- coupling domain schemas too closely to frontend representations
- forcing future specialized workloads into TypeScript when another language is better

### Option B: TypeScript Frontend and Python Backend

Description:
Use TypeScript for the interface and Python for APIs, domain logic, integrations, AI orchestration, and background jobs.

Advantages:
- strong Python AI and data ecosystem
- mature backend frameworks
- natural path to local models and data processing
- clear frontend and backend separation

Disadvantages:
- duplicate schemas and types across languages
- more local-development complexity
- more deployment targets and tooling
- greater context switching
- increased risk of API drift
- slower iteration for one developer

Risks:
- frontend and backend validation diverge
- business rules are duplicated
- infrastructure complexity appears before specialized Python needs exist

### Option C: Python Across the Entire Application

Description:
Use Python for backend and server-rendered UI or a Python-oriented web framework.

Advantages:
- one language
- strong AI and data ecosystem
- straightforward scripting and automation

Disadvantages:
- weaker fit for a highly interactive React-style interface
- smaller ecosystem for modern frontend component work
- likely eventual introduction of JavaScript or TypeScript anyway
- shared client-side logic remains limited

Risks:
- frontend experience becomes constrained
- the project later adopts two languages without planning for it

### Option D: JavaScript Without TypeScript

Description:
Use plain JavaScript across frontend and backend.

Advantages:
- lower initial syntax and configuration burden
- fast experimentation
- broad ecosystem

Disadvantages:
- weaker compile-time guarantees
- harder canonical-schema refactors
- less safe provider and model-output handling
- more runtime errors
- difficult maintenance as object types and action states grow

Risks:
- silent payload and status mismatches
- fragile migrations and integrations
- errors around authorization and action lifecycle fields

### Option E: Multiple Languages by Domain from the Start

Description:
Choose TypeScript for the web, Python for AI, Go or Rust for workers, and other languages for specialized services.

Advantages:
- each workload can use its ideal ecosystem
- future performance and specialization flexibility

Disadvantages:
- extreme operational and cognitive overhead
- inconsistent tooling and standards
- difficult local development
- premature service boundaries
- slower delivery

Risks:
- implementation never reaches a coherent MVP
- duplicated authorization and data logic
- one developer cannot maintain the whole system confidently

## Decision

North Vector will use TypeScript as the primary language across the Phase 1 application.

TypeScript will be used for:
- the web interface
- server-side application services
- domain modules
- database access
- provider integrations
- model-provider abstraction
- background worker logic
- shared schemas
- tests
- configuration validation

Python or another language may be introduced later for a clearly bounded specialized workload when evidence shows it is the better tool.

No additional primary application language should be introduced during Phase 1 without a new implementation decision or ADR.

## Required TypeScript Standards

Phase 1 should use:
- strict compiler settings
- `unknown` for unvalidated external input
- schema validation at every external boundary
- explicit domain unions or enums for controlled values
- typed service interfaces
- no ignored production type errors
- minimal use of non-null assertions
- documented boundaries when `any` is unavoidable

TypeScript types must not be treated as runtime validation.

## Rationale

TypeScript offers the best balance of speed, consistency, ecosystem support, and maintainability for the current product.

North Vector's Phase 1 work is primarily web application engineering, domain modeling, external API integration, data validation, and background orchestration. TypeScript is strong in each of those areas and allows one developer to work across the entire stack without maintaining duplicated models in multiple languages.

Shared schemas are especially valuable because the product depends on exact canonical object types, approval states, provider payloads, and model-produced structured output. A single language reduces drift between the interface, server, worker, and tests.

The decision does not claim TypeScript is ideal for every future North Vector workload. It simply avoids paying the cost of a multi-language system before a specialized requirement exists.

## Consequences

### Positive Consequences

- one primary application language
- easier code sharing
- consistent tooling
- strong React and Node.js ecosystem
- simpler onboarding and local development
- shared canonical object and validation schemas
- reduced API drift between application layers
- broad integration SDK support
- straightforward web and worker deployment

### Negative Consequences

- future AI, data science, or hardware work may require another language
- runtime validation remains mandatory
- Node.js may not suit every compute-heavy workload
- package quality and supply-chain risk require active review
- TypeScript complexity may grow if types become overly abstract

### Operational Consequences

- one runtime family can support web and worker deployments
- build, lint, test, and dependency tooling can be shared
- runtime and package-manager versions must be pinned
- production monitoring should distinguish web and worker processes despite shared language

### Security and Privacy Consequences

- shared validation and permission types can reduce inconsistent enforcement
- external data must still be validated at runtime
- dependency scanning is important because of the large npm ecosystem
- server-only configuration must remain separated from client bundles
- generated types must not expose Restricted fields to inappropriate interfaces

### Data and Migration Consequences

- canonical schema types can align with migration and repository code
- ORM-generated types should not become the sole domain model
- serialized data requires versioned schemas
- migration scripts should use the same validation and domain vocabulary where practical

## Implementation Notes

Recommended tooling:
- TypeScript with strict mode
- Next.js and React
- Node.js runtime
- Zod or JSON Schema for runtime validation
- Prisma, Drizzle, or typed SQL for database access
- Vitest or Jest
- Playwright
- ESLint
- Prettier or equivalent
- pnpm

Suggested configuration should enable or strongly consider:
- `strict`
- `noUncheckedIndexedAccess`
- `exactOptionalPropertyTypes`
- `noImplicitOverride`
- `useUnknownInCatchVariables`
- consistent module resolution

The final compiler configuration should balance safety with practical library compatibility.

## Boundary Validation Rules

Validate input from:
- API requests
- environment variables
- database JSON fields
- Google Calendar
- model providers
- file uploads
- webhooks
- job payloads
- serialized session state

External values should enter the system as `unknown` and become typed only after validation.

## Shared Schema Rules

Shared schemas may be reused across:
- API validation
- model structured output
- form validation
- job payloads
- tests

However, public API schemas should not expose internal or sensitive fields merely because they share a TypeScript type.

Separate representations should exist when privacy or authorization requires them.

## Domain Modeling Rules

Domain code should use meaningful types for:
- object status
- sensitivity
- confidence
- approval state
- execution state
- verification state
- synchronization state
- risk level

Avoid broad primitive values when controlled vocabularies exist.

## Error Handling Rules

Use structured domain and application errors.

Errors should preserve:
- stable error code
- safe user message
- retryability
- cause where appropriate
- request or run reference

Do not expose raw internal stack traces to the user.

## Testing Requirements

Required tests include:
- external invalid input is rejected at runtime
- compile-time type checks catch invalid domain states
- server-only values do not enter client bundles
- model output fails safely when schema-invalid
- provider response changes do not silently pass through unsafe casts
- action status transitions use controlled values
- migration fixtures validate against current schemas

## Validation Plan

The decision will be validated through:
- repository setup
- shared canonical schema implementation
- web and worker build
- Google Calendar adapter
- model structured-output validation
- chemistry-exam end-to-end workflow
- strict type checking in CI
- assessment of development speed and type friction during the first four sprints

The choice should be considered successful if one developer can move across the stack efficiently while preserving clear runtime boundaries and domain correctness.

## Rollback or Exit Strategy

If a future workload is poorly served by TypeScript, North Vector may introduce another language behind a narrow interface.

Likely candidates include:
- local speech or vision processing
- specialized machine-learning pipelines
- high-performance hardware services
- scientific or statistical analysis

A new language should have:
- one clear owner
- a stable interface
- independent tests
- deployment and monitoring plan
- data and privacy review
- reason that outweighs multi-language cost

TypeScript should remain the primary application language unless a superseding ADR changes the broader architecture.

## Residual Risks

- unsafe casts may undermine type safety
- npm dependencies may introduce vulnerabilities
- shared types may create accidental coupling
- type complexity may reduce readability
- compute-heavy work may perform poorly in Node.js
- framework changes may affect long-term maintenance

## Assumptions

- Phase 1 remains primarily a web and API application
- Node.js hosting is readily available
- one developer benefits materially from one-language development
- specialized machine-learning workloads are not MVP requirements
- runtime schema validation is implemented consistently
- strict TypeScript remains compatible with selected libraries

## Review Triggers

Revisit this ADR when:
- a required workload has poor Node.js or TypeScript support
- Python-only AI or data tooling becomes essential
- performance measurements show a runtime bottleneck
- hardware or wearable services enter active development
- multi-team ownership makes language specialization beneficial
- TypeScript type complexity materially slows delivery
- a security incident reveals systemic unsafe-casting practices

## Review Date

After the first four implementation sprints or when the first review trigger occurs.

## Outcome

### Expected Outcome

TypeScript should let North Vector implement the Phase 1 web application, worker, domain logic, integrations, and tests with one consistent toolchain and minimal language-boundary overhead.

### Actual Outcome

Pending implementation.

### Lessons

Pending implementation and real usage.

### Follow-Up Decision

Keep TypeScript as the primary application language through Phase 1 unless measured evidence supports a bounded exception or superseding ADR.

## Change History

| Date | Change | Author |
|---|---|---|
| 2026-06-14 | Initial accepted ADR | Nishad |