# ADR-0011: Use Provider Abstractions for Models and Integrations

## Status

Accepted

## Date

2026-06-14

## Decision Owner

Nishad

## Reviewers

- Project Owner
- Technical Lead
- Integration Owner
- AI Platform Owner
- Security Owner
- Operations Owner

## Related Documents

- `10-Implementation/Technical_Stack_and_Environment.md`
- `10-Implementation/Development_Workflow_and_Standards.md`
- `10-Implementation/Testing_Strategy.md`
- `10-Implementation/Phase_1_Backlog.md`
- `10-Implementation/Implementation_Risk_Register.md`
- `10-Implementation/Implementation_Decision_Log.md`
- `10-Implementation/ADRs/ADR-0002-Use-a-Modular-Monolith-for-Phase-1.md`
- `10-Implementation/ADRs/ADR-0005-Use-Google-Calendar-as-the-Only-MVP-External-Integration.md`
- `10-Implementation/ADRs/ADR-0006-Use-TypeScript-Across-the-Phase-1-Application.md`

## Context

North Vector depends on external providers for capabilities such as:
- language models
- embeddings
- Google Calendar
- managed authentication
- object storage
- monitoring
- future email, file, academic, health, finance, and location integrations

Each provider exposes different:
- APIs
- authentication mechanisms
- rate limits
- versioning rules
- error formats
- pagination models
- retry semantics
- metadata
- privacy terms
- availability characteristics

If provider-specific code spreads through domain logic, UI components, route handlers, jobs, and tests, the product becomes difficult to understand and expensive to change.

At the same time, abstractions can become harmful when they are designed around imagined future providers rather than real behavior. A generic interface that hides important provider differences may create false portability and weaken correctness.

The architecture needs a disciplined approach that isolates provider-specific behavior without pretending every provider works the same way.

## Decision Drivers

- maintainability
- provider portability
- testability
- clear domain boundaries
- controlled provider-specific metadata
- easier mocking
- reduced vendor lock-in
- security and privacy review
- failure isolation
- explicit capability differences
- future provider replacement
- compatibility with the modular monolith

## Options Considered

### Option A: Provider Abstractions with Capability-Specific Adapters

Description:
Define narrow interfaces for model and integration capabilities, then implement provider-specific adapters behind those interfaces.

Advantages:
- provider code remains isolated
- domain logic uses stable concepts
- tests can use mocks or fakes
- provider replacement is easier
- provider-specific metadata can remain available through typed escape hatches
- security and privacy reviews can focus on adapter boundaries
- multiple providers can coexist intentionally

Disadvantages:
- requires interface design and mapping work
- abstractions may leak when provider behavior differs materially
- some code duplication across adapters is likely
- additional translation layers can complicate debugging

Risks:
- abstraction becomes too broad or generic
- important provider semantics are flattened
- interface design is driven by hypothetical providers

### Option B: Direct Provider SDK Usage Throughout the Application

Description:
Call provider SDKs directly from routes, domain services, UI server code, and jobs.

Advantages:
- fastest initial implementation
- full access to provider features
- fewer wrapper layers
- easier use of provider examples and documentation

Disadvantages:
- tight coupling
- difficult testing
- duplicated error and retry handling
- provider concepts leak into domain models
- migrations become expensive

Risks:
- broad vendor lock-in
- inconsistent authorization and logging
- secrets handled in too many places
- one provider change affects unrelated areas

### Option C: One Universal Integration Interface

Description:
Create one generic interface for all external providers and actions.

Advantages:
- one conceptual model
- uniform tooling
- simple-looking architecture

Disadvantages:
- Calendar, models, authentication, storage, and email do not share meaningful common operations
- lowest-common-denominator design
- provider-specific semantics are hidden
- type safety becomes weak

Risks:
- false abstraction
- runtime branching and generic payloads
- loss of important source-of-truth and verification behavior

### Option D: Adopt a Third-Party Integration Framework

Description:
Use a platform or SDK that normalizes many providers behind one framework.

Advantages:
- fast connector development
- managed authentication and normalization
- broad provider coverage
- less custom adapter code

Disadvantages:
- another provider dependency
- limited control over normalization and privacy
- provider metadata may be lost
- difficult to enforce North Vector-specific approval and provenance rules

Risks:
- integration platform becomes a privileged intermediary
- data portability and deletion become harder
- provider abstraction reflects the platform's model rather than North Vector's needs

## Decision

North Vector will use capability-specific provider abstractions for models and external integrations.

Provider-specific behavior will be implemented behind narrow adapters such as:
- `ModelProvider`
- `EmbeddingProvider`
- `CalendarProvider`
- `AuthenticationProviderAdapter`
- `ObjectStorageProvider`
- future `EmailProvider`, `FileProvider`, or similar interfaces

The application should depend on normalized domain-facing interfaces rather than provider SDKs directly.

Provider-specific metadata may be preserved through typed source records or adapter result fields when required for correctness.

North Vector will not create one universal integration interface across unrelated provider categories.

## Abstraction Design Rules

Provider abstractions should be:
- capability-specific
- based on real Phase 1 use cases
- narrow
- explicit about unsupported operations
- typed
- testable
- honest about provider-specific differences

They should not:
- erase provider versions or external IDs
- hide uncertainty or partial failure
- force every provider into identical semantics
- expose raw credentials to domain code
- become a dumping ground for unrelated functionality

## Model Provider Interface

The model abstraction may support:
- generate response
- stream response
- structured output
- token usage
- timeout
- cancellation
- model selection
- provider metadata

The interface should return normalized results while preserving:
- provider request ID
- model name and version
- usage
- finish reason
- safety or refusal metadata where relevant

## Embedding Provider Interface

The embedding abstraction may support:
- embed text or batch
- model and dimension metadata
- usage
- timeout and retry behavior

The provider should not determine retrieval policy or object eligibility.

## Calendar Provider Interface

The Calendar abstraction may support:
- list approved calendars
- fetch events
- incremental sync where available
- create event
- fetch event for verification
- disconnect or revoke

It should preserve:
- external IDs
- provider versions
- timestamps
- recurrence metadata
- provider error category

## Authentication Provider Adapter

The authentication adapter should normalize:
- provider user identity
- authentication time
- session reference
- assurance information where available
- recovery or security events

Application authorization and device trust remain outside the provider adapter.

## Error Normalization

Adapters should map provider failures into a controlled taxonomy such as:
- Authentication Required
- Permission Denied
- Rate Limited
- Timeout
- Temporary Provider Failure
- Invalid Request
- Conflict
- Not Found
- Unsupported Operation
- Uncertain Result

The original provider code or safe metadata may be retained for debugging, but user-facing and domain logic should use normalized categories.

## Capability Discovery

Interfaces should expose capabilities explicitly where providers differ.

Examples:
- supports streaming
- supports structured output
- supports idempotency
- supports incremental sync
- supports verification fetch
- supports passkeys

The system should not attempt an operation merely because another provider supports it.

## Rationale

Provider abstractions allow North Vector to preserve a stable internal model while external systems evolve.

The purpose is not to make providers interchangeable with one line of configuration. Real providers differ too much for that promise to be honest.

The purpose is to localize those differences so that:
- domain logic remains understandable
- provider changes do not spread across the codebase
- tests can simulate failures and edge cases
- secrets and rate limits are handled consistently
- future provider replacement is possible

Capability-specific interfaces avoid the opposite failure: one universal abstraction that flattens meaningful differences.

This decision also supports the single-developer operating model. A provider adapter gives Nishad one place to learn, debug, secure, and replace each external dependency.

## Consequences

### Positive Consequences

- reduced provider coupling
- easier mocking and contract testing
- centralized token and error handling
- clearer security review
- easier provider replacement
- stable domain-facing interfaces
- provider-specific metadata remains contained
- simpler future multi-provider routing

### Negative Consequences

- additional adapter code
- interface design may need revision
- provider-specific features may require explicit extensions
- debugging spans normalized and raw provider layers
- some duplication across providers is acceptable

### Operational Consequences

- each adapter requires health metrics and runbooks
- provider configuration stays centralized
- switching providers remains a deliberate migration
- adapters must expose request IDs and safe diagnostic metadata
- provider outages should degrade through normalized error behavior

### Security and Privacy Consequences

- credentials remain inside provider adapters or secure infrastructure
- adapter boundaries become key security review points
- provider-specific data transmission can be documented
- privacy routing may choose among model providers
- raw provider payloads should not be logged indiscriminately
- replacing a provider requires a fresh privacy and security review

### Data and Migration Consequences

- canonical objects remain provider-independent
- source references preserve provider and external IDs
- provider metadata may require versioned adapter fields
- migration between providers can preserve internal object identity
- unsupported provider semantics may require explicit data-loss review

## Implementation Notes

Recommended project structure:

```text
/packages/integrations
  /calendar
    /calendar-provider.ts
    /google-calendar-adapter.ts
  /auth
    /auth-provider-adapter.ts
  /storage
    /object-storage-provider.ts
/packages/ai
  /model-provider.ts
  /embedding-provider.ts
  /providers
```

Each adapter should include:
- configuration validation
- credential access
- request mapping
- response normalization
- error mapping
- retry guidance
- capability declaration
- contract tests

## Dependency Injection

Application services should receive provider interfaces through configuration or dependency injection.

They should not import a specific provider SDK directly.

Example:

```text
PlanningService
  -> CalendarProvider

ChiefService
  -> ModelProvider

EmbeddingJob
  -> EmbeddingProvider
```

## Provider Metadata

Provider-specific details may be stored in:
- source references
- integration connection records
- adapter metadata fields
- audit records when safe

They should not be placed into core domain fields unless the domain concept truly depends on them.

## Provider Versioning

Adapters should record:
- API version
- SDK version
- provider model or product version
- request IDs
- behavior-relevant flags

This helps explain changes and regressions.

## Model Routing

A model-provider abstraction may support routing by:
- task type
- privacy requirement
- cost
- latency
- context size
- structured-output support

Routing policy should remain separate from provider implementation.

## Testing Requirements

Required tests include:
- application service works with a fake provider
- provider-specific error maps to normalized error
- unsupported capability fails explicitly
- provider request ID is preserved
- credentials do not escape adapter boundary
- Calendar source IDs and versions remain intact
- model structured output is validated after provider response
- switching fake providers does not change domain behavior
- adapter timeout and rate-limit behavior is tested
- raw provider content cannot bypass authorization or approval

## Contract Testing

Each adapter should maintain contract tests that cover:
- authentication
- request shape
- response normalization
- pagination
- versioning
- rate limits
- timeout
- partial failure
- revocation
- capability support

Real-provider contract tests should use dedicated test accounts and synthetic data.

## Validation Plan

The decision will be validated through:
- model-provider integration
- Google Calendar adapter
- managed-authentication adapter
- fake providers in integration tests
- provider outage simulation
- one provider replacement or mock substitution exercise
- chemistry-exam end-to-end workflow

The abstraction should be judged successful when provider-specific changes remain localized without hiding behavior required for correctness.

## Rollback or Exit Strategy

If an abstraction becomes harmful:
- narrow or revise the interface
- expose provider-specific capability explicitly
- split one interface into multiple capability interfaces
- allow a typed provider extension where justified

The project should not remove all adapter boundaries and spread SDK usage broadly.

A provider may be used directly inside its adapter implementation.

## Residual Risks

- abstractions may be designed prematurely
- provider semantics may still leak
- interfaces may become too large
- normalized errors may lose diagnostic detail
- adapters can create false confidence about provider interchangeability
- a provider SDK change may still require substantial work

## Assumptions

- Phase 1 has one model provider and one Calendar provider initially
- future provider changes are plausible
- domain logic can be expressed independently of provider SDKs
- provider-specific metadata can be preserved safely
- one developer benefits from centralized integration code

## Review Triggers

Revisit this ADR when:
- a second provider is added for the same capability
- an interface grows many provider-specific branches
- provider behavior cannot be represented without losing correctness
- adapter code duplicates substantial domain logic
- a third-party integration platform is proposed
- a provider migration occurs
- security review identifies credential leakage outside adapters

## Review Date

After the second concrete provider integration or one month of MVP production use, whichever occurs first.

## Outcome

### Expected Outcome

Provider abstractions should localize external-system complexity while preserving stable domain behavior, testability, security, and future portability.

### Actual Outcome

Pending implementation.

### Lessons

Pending implementation and real usage.

### Follow-Up Decision

Keep capability-specific abstractions and revise them only with evidence from real providers.

## Change History

| Date | Change | Author |
|---|---|---|
| 2026-06-14 | Initial accepted ADR | Nishad |