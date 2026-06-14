# ADR-0008: Use Next.js for the Phase 1 Web Application

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
- Operations Owner

## Related Documents

- `10-Implementation/Technical_Stack_and_Environment.md`
- `10-Implementation/Development_Workflow_and_Standards.md`
- `10-Implementation/Testing_Strategy.md`
- `10-Implementation/Deployment_and_Operations_Plan.md`
- `10-Implementation/Phase_1_Backlog.md`
- `10-Implementation/Implementation_Risk_Register.md`
- `10-Implementation/ADRs/ADR-0002-Use-a-Modular-Monolith-for-Phase-1.md`
- `10-Implementation/ADRs/ADR-0006-Use-TypeScript-Across-the-Phase-1-Application.md`

## Context

North Vector Phase 1 requires a desktop-first application that supports:
- secure authentication and session-aware pages
- Chief conversation
- streaming responses
- Memory Inspector
- goals, projects, tasks, and commitments
- Today view
- daily briefing
- weekly review
- settings and permission management
- Google Calendar connection and sync status
- approval and action interfaces
- audit history
- export and deletion flows

The project is being built initially by one developer using TypeScript across the application and a modular-monolith architecture.

The web framework should support both interactive client behavior and server-side application concerns without requiring the project to build and operate separate frontend and API repositories before that separation is justified.

The framework should also provide a clear path to:
- server-rendered authenticated views
- API endpoints
- streaming model output
- form handling
- responsive design
- deployment to managed infrastructure
- future extraction of backend services if needed

The project should avoid selecting a framework solely because it is popular. The choice should reduce Phase 1 friction while preserving domain boundaries and provider portability.

## Decision Drivers

- TypeScript and React support
- full-stack development in one project
- streaming response support
- server-side authentication and data loading
- mature deployment options
- strong ecosystem
- accessibility and responsive UI support
- simple local development
- compatibility with a modular monolith
- ability to keep domain logic outside framework-specific files
- future backend extraction path

## Options Considered

### Option A: Next.js

Description:
Use Next.js with React and TypeScript for the Phase 1 web application, including the App Router, server-rendered views, interactive client components, and a limited server API boundary.

Advantages:
- strong React and TypeScript ecosystem
- server and client capabilities in one application
- supports streamed responses
- mature routing and rendering
- straightforward authenticated layouts
- broad hosting support
- good developer tooling
- route handlers and server actions can support early backend needs
- compatible with later extraction into a dedicated API service

Disadvantages:
- framework behavior can be complex
- server and client boundaries require discipline
- caching and rendering semantics can be confusing
- deployment may become coupled to framework conventions
- route handlers can become overloaded with business logic if not controlled

Risks:
- framework-specific architecture leaks into domain logic
- accidental client exposure of server-only data
- confusing cache behavior presents stale personal data
- the project relies too heavily on one hosting platform

### Option B: React SPA with Separate Node.js API

Description:
Use a client-rendered React application with a separately deployed Node.js API from the beginning.

Advantages:
- explicit frontend and backend separation
- framework independence on the backend
- clear API contracts
- independent deployment possible

Disadvantages:
- more repositories or deployment units
- duplicate setup and configuration
- more authentication and CORS complexity
- slower iteration for one developer
- additional operational overhead

Risks:
- premature physical separation
- frontend and backend schema drift
- the product takes longer to become usable

### Option C: Remix

Description:
Use Remix as a full-stack React framework with route-based data loading and actions.

Advantages:
- strong web-platform fundamentals
- clear server interaction model
- good form and mutation handling
- React and TypeScript support

Disadvantages:
- smaller ecosystem and hosting mindshare than Next.js
- fewer team-familiarity assumptions
- less direct alignment with some AI streaming examples and provider tooling

Risks:
- future integrations may require more custom adaptation
- smaller ecosystem may increase debugging time for one developer

### Option D: Vite React Frontend with Serverless Functions

Description:
Use Vite for the client and deploy backend behavior as separate serverless functions.

Advantages:
- lightweight frontend tooling
- fast local development
- flexible hosting
- clear client build

Disadvantages:
- fragmented server logic
- authentication and shared session behavior require more setup
- serverless boundaries may encourage scattered domain logic
- background jobs still require separate infrastructure

Risks:
- inconsistent authorization and audit behavior
- provider-specific serverless coupling
- difficult end-to-end debugging

### Option E: Native Desktop Application First

Description:
Build the initial application in Electron, Tauri, or a native macOS framework.

Advantages:
- stronger desktop integration
- potential offline and local-security capabilities
- native notifications and device access

Disadvantages:
- larger packaging and update burden
- mobile and browser access remain unavailable
- desktop-specific implementation distracts from core product logic
- deployment and testing become more complex

Risks:
- desktop shell work delays the Chief workflow
- later web access requires a second interface architecture

## Decision

North Vector will use Next.js with React and TypeScript for the Phase 1 web application.

The initial implementation should use:
- the Next.js App Router
- server-rendered or server-loaded authenticated views where useful
- client components only for interactive behavior
- route handlers or server actions as thin application boundaries
- shared domain and service packages outside framework-specific route files
- streamed Chief responses
- accessible responsive components

Next.js will host the primary web interface and initial authenticated API boundary.

The background worker will remain a separate process, even if it shares packages with the Next.js application.

## Required Architectural Boundaries

Next.js should own:
- routing
- page and layout rendering
- request and session integration
- form and interaction boundaries
- streaming response transport
- presentation-layer loading and error states

Next.js should not own:
- memory lifecycle rules
- approval authorization
- planning algorithms
- provider synchronization semantics
- canonical object behavior
- audit policy
- deletion propagation logic

Those behaviors should live in shared domain and application-service modules.

## Server and Client Boundary Rules

Server-only code should include:
- secrets
- database access
- integration tokens
- model-provider credentials
- authorization
- audit writes
- external action execution

Client code may receive only the minimum authorized representation needed for display or interaction.

The build should fail or tests should catch accidental server-secret exposure.

## Rationale

Next.js gives North Vector a practical path to building the entire Phase 1 interface and server boundary without creating separate frontend and API systems too early.

The product requires a rich interactive interface, but it also benefits from server-side authentication, protected data loading, and streaming model responses. Next.js supports those requirements while fitting the TypeScript and modular-monolith decisions already accepted.

The framework also allows the project to keep the first vertical slice in one coherent application. The chemistry-exam workflow can move from conversation to canonical data, planning, approval, and Calendar interaction without unnecessary network boundaries between frontend and backend services.

The decision accepts that framework conventions can become invasive. That risk should be controlled by keeping domain logic and provider behavior outside route files and components.

## Consequences

### Positive Consequences

- one web framework for interface and early server boundaries
- fast development of authenticated product views
- strong React and TypeScript support
- streamed model responses
- mature routing and layout system
- broad deployment support
- easier end-to-end testing
- responsive browser access
- natural fit with the modular monolith

### Negative Consequences

- caching and rendering semantics require careful handling
- framework upgrades may create maintenance work
- server and client code can become mixed if boundaries are weak
- route handlers may grow into an accidental backend architecture
- some deployment features may favor specific providers

### Operational Consequences

- production needs one Next.js web deployment
- runtime configuration must distinguish server and client values
- health checks and release versions should be exposed
- long-running background work must not run in ordinary request handlers
- deployment platform limits must be understood
- worker and web releases should remain compatible

### Security and Privacy Consequences

- server components and route handlers must enforce authorization before returning data
- sensitive data should not be serialized into client bundles unnecessarily
- framework caches must not leak one session's data into another
- static generation should not be used for private user-specific pages
- error boundaries and telemetry must redact private data
- CSRF and session-cookie protections must be configured appropriately

### Data and Migration Consequences

- Next.js should not define the canonical schema
- database migrations remain framework-independent
- data-fetching helpers should use application services and repositories
- future API extraction should preserve existing domain contracts

## Implementation Notes

Recommended initial structure:

```text
/apps/web
  /app
  /components
  /lib
/apps/worker
/packages/domain
/packages/database
/packages/integrations
/packages/ai
/packages/security
/packages/ui
/packages/config
```

A simpler structure is acceptable initially if the same logical boundaries are preserved.

Recommended Next.js usage:
- protected root layout for authenticated areas
- server loading for initial current-state views
- client components for editing, streaming, drag-and-drop, and interactive approval
- route handlers for stable HTTP endpoints
- server actions only when they remain thin and testable
- no direct database logic inside page components

## Data Fetching Rules

Private data fetching should:
- occur server-side where practical
- authenticate and authorize each request
- avoid public caching
- preserve current source timestamps
- label stale provider data

Client-side refetching may be used for:
- live job status
- streaming Chief responses
- approval updates
- sync-health refresh

## Caching Rules

User-specific and sensitive data should default to dynamic or explicitly private behavior.

The application should not rely on implicit framework caching for:
- active memory
- Calendar events
- pending approvals
- permissions
- security settings
- audit history

Any cache should define:
- owner scope
- sensitivity
- invalidation rule
- maximum age

## Streaming Rules

Chief responses may stream to the client, but:
- structured action proposals should be validated before persistence
- partial text must not trigger tool execution
- failed streams should preserve session consistency
- sensitive context should not appear in logs

## Authentication Integration

Authentication should integrate with Next.js while remaining provider-abstracted where possible.

Requirements:
- secure HTTP-only cookies
- server-side session lookup
- route protection
- session revocation
- reauthentication for sensitive operations
- no reliance on client state as proof of authority

## Error Handling

The web application should distinguish:
- user input error
- authorization denial
- provider degradation
- stale data
- partial failure
- internal error

Error pages and boundaries should explain impact without exposing stack traces or private context.

## Accessibility Requirements

The Next.js interface should support:
- keyboard navigation
- visible focus
- semantic headings
- screen-reader labels
- reduced motion
- responsive text scaling
- non-color status indicators

## Testing Requirements

Required tests include:
- authenticated routes reject anonymous access
- server-only configuration does not enter the client bundle
- private pages are not statically cached across users or sessions
- route handlers enforce authorization
- streaming response interruption fails safely
- action proposal remains separate from execution
- Memory Inspector works with keyboard navigation
- approval tray displays exact payload
- stale Calendar state is visible
- error boundaries redact sensitive details
- primary workflow passes in Playwright

## Validation Plan

The decision will be validated through:
- initial repository setup
- authenticated application shell
- Chief streaming conversation
- Memory Inspector
- Today view
- approval tray
- chemistry-exam end-to-end test
- staging deployment
- production smoke tests
- evaluation of framework-specific friction during the first four sprints

The choice should be considered successful if one developer can build and operate the Phase 1 product without framework behavior obscuring domain rules or private-data handling.

## Rollback or Exit Strategy

If Next.js becomes a material limitation, North Vector may:
- extract backend services into a dedicated Node.js API
- retain React components in a separate client application
- migrate route handlers gradually
- preserve domain packages and database code
- move to another React framework or desktop shell

The framework should remain an interface and transport choice rather than the owner of domain semantics.

A broad replacement should use a superseding ADR and preserve:
- canonical data
- domain services
- provider adapters
- authorization logic
- tests

## Residual Risks

- accidental caching of private data
- framework-specific deployment constraints
- server and client boundary mistakes
- route handlers accumulating business logic
- upgrade churn
- hosting-provider coupling
- bundle growth and client performance

## Assumptions

- Phase 1 remains browser-based and desktop-first
- React is suitable for the required interactive views
- Node.js supports the required server workloads
- background jobs remain outside the request lifecycle
- one developer benefits from full-stack framework integration
- future native applications can reuse domain and API layers

## Review Triggers

Revisit this ADR when:
- framework caching causes privacy or freshness problems
- backend complexity requires independent deployment
- hosting limits block worker or streaming behavior
- native desktop or mobile becomes the primary interface
- Next.js upgrade cost becomes disproportionate
- route and server-action code cannot maintain clean boundaries
- performance measurements show unacceptable client or server overhead

## Review Date

After the first four implementation sprints or when the first review trigger occurs.

## Outcome

### Expected Outcome

Next.js should let North Vector build the Phase 1 interface and server boundary quickly while preserving shared TypeScript domain logic and a clear path to future service extraction.

### Actual Outcome

Pending implementation.

### Lessons

Pending implementation and real usage.

### Follow-Up Decision

Keep Next.js for Phase 1 unless measured implementation or privacy constraints support a superseding ADR.

## Change History

| Date | Change | Author |
|---|---|---|
| 2026-06-14 | Initial accepted ADR | Nishad |