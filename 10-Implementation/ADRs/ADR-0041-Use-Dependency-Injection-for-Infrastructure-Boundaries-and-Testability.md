# ADR-0041: Use Dependency Injection for Infrastructure Boundaries and Testability

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will use dependency injection for infrastructure-bound components.

Application and domain logic should depend on interfaces, contracts, or abstractions rather than directly constructing infrastructure implementations.

Infrastructure dependencies should be supplied at composition boundaries.

**Note (2026-07-03):** not followed in practice, for the same reason noted in `10-Implementation/ADRs/ADR-0028-Use-Repository-and-Service-Layers-to-Separate-Domain-Logic-from-Infrastructure.md` — the actual Firestore store modules (`lib/task-store.ts` and siblings) are imported and called directly wherever needed, with no interface/abstraction layer or injected dependencies. This is a real architectural gap from this ADR's decision, independent of the database technology change.

## Context

North Vector depends on:
- a primary database (originally PostgreSQL; actually Firestore, see `10-Implementation/ADRs/ADR-0101-Use-Firestore-as-the-Primary-Database.md`)
- model providers (not implemented)
- Google Calendar (not implemented)
- authentication systems
- storage providers (not implemented)
- notification systems
- monitoring tools (not implemented)
- background job systems (one scheduled Cloud Function, not a general job system — see `10-Implementation/ADRs/ADR-0103-Use-Firebase-Cloud-Functions-for-Scheduled-Execution.md`)

If business logic directly creates infrastructure clients:
- testing becomes difficult
- provider replacement becomes expensive
- coupling increases
- architectural boundaries erode

The system should allow infrastructure components to be substituted without modifying domain logic.

## Decision Drivers

- testability
- maintainability
- provider independence
- separation of concerns
- architecture consistency
- easier refactoring

## Dependency Injection Principles

Application logic should depend on:
- interfaces
- contracts
- abstractions

Application logic should not depend directly on:
- SDK constructors
- framework globals
- provider-specific clients

## Example

Preferred:

```text
PlanningService
  -> CalendarProvider Interface
```

Not:

```text
PlanningService
  -> Google Calendar SDK Directly
```

## Infrastructure Boundaries

Dependency injection should apply to:
- repositories
- provider adapters
- notification services
- storage systems
- monitoring integrations
- authentication services

## Composition Root

Infrastructure implementations should be assembled in a small number of composition locations.

Examples:
- application startup
- worker startup
- dependency container
- service registration module

Most business code should remain unaware of implementation details.

## Testing Benefits

Dependency injection enables:
- fake providers
- test doubles
- deterministic testing
- isolated unit tests

Without requiring real:
- databases
- provider accounts
- network calls

## Provider Replacement

Provider abstraction combined with dependency injection allows:

```text
Google Calendar Provider
```

to be replaced by:

```text
Future Calendar Provider
```

without changing workflow logic.

## Relationship to Repositories

Services should depend on repository interfaces. (No repository interfaces or services exist in the actual implementation — see the note under Decision above.)

Repository implementations may depend on:
- Drizzle (superseded — no ORM in use; direct Firestore SDK calls instead, see ADR-0101)
- PostgreSQL (superseded — Firestore)
- future persistence systems

The service should not need to know which implementation is active.

## Relationship to Contract Testing

Contract testing validates implementations.

Dependency injection allows implementations to be substituted.

The two approaches reinforce each other.

## Operational Benefits

Dependency injection enables:
- cleaner architecture
- easier testing
- reduced coupling
- safer migrations
- more maintainable code

## Consequences

### Positive

- improved testability
- stronger architectural boundaries
- easier provider replacement
- reduced infrastructure coupling
- cleaner code organization

### Negative

- additional abstraction layers
- more setup during composition
- possible over-engineering if applied excessively

## Implementation Notes

Preferred dependency direction:

```text
Domain
  <- Service
  <- Interface
  <- Infrastructure Implementation
```

Dependencies should point inward toward abstractions.

## Anti-Patterns

Avoid:

```text
new ProviderClient()
```

inside:
- domain logic
- services
- workflow state machines

Construction should occur at composition boundaries.

## Testing Requirements

Tests should verify:
- services operate with fake dependencies
- providers can be swapped without service changes
- repository implementations satisfy contracts
- business logic remains infrastructure-independent
- composition configuration supplies correct implementations

## Outcome

North Vector gains cleaner architectural boundaries, improved testability, and long-term flexibility by separating business logic from infrastructure implementations through dependency injection.