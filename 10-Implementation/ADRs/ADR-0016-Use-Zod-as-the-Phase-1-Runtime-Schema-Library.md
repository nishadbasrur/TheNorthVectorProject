# ADR-0016: Use Zod as the Phase 1 Runtime Schema Library

## Status

Accepted

## Date

2026-06-14

## Decision Owner

Nishad

## Reviewers

- Project Owner
- Technical Lead
- Security Owner
- Data Architecture Owner
- Integration Owner
- AI Platform Owner

## Related Documents

- `10-Implementation/Technical_Stack_and_Environment.md`
- `10-Implementation/Development_Workflow_and_Standards.md`
- `10-Implementation/Testing_Strategy.md`
- `10-Implementation/Phase_1_Backlog.md`
- `10-Implementation/Implementation_Risk_Register.md`
- `10-Implementation/ADRs/ADR-0006-Use-TypeScript-Across-the-Phase-1-Application.md`
- `10-Implementation/ADRs/ADR-0014-Use-a-Provider-Neutral-Model-Layer.md`
- `10-Implementation/ADRs/ADR-0015-Use-Explicit-Runtime-Schema-Validation-at-All-External-Boundaries.md`

## Context

ADR-0015 established that North Vector must perform explicit runtime schema validation at all external boundaries.

Phase 1 now needs a concrete schema library for:
- HTTP request validation
- environment configuration
- model structured output
- Google Calendar normalization
- job payloads
- canonical object input
- settings and permissions
- imported data
- database JSON
- action and approval payloads

The selected library should work naturally with the TypeScript-first application, support clear error reporting, allow shared schemas and inferred types, and remain practical for one developer.

The library should also be strict enough for security-sensitive payloads while flexible enough to support provider normalization and schema evolution.

## Decision Drivers

- strong TypeScript integration
- runtime safety
- schema and type co-location
- readable API
- mature ecosystem
- structured error reporting
- support for refinements and transformations
- compatibility with Next.js
- compatibility with model structured output
- testability
- maintainability by one developer
- reasonable performance for Phase 1 scale

## Options Considered

### Option A: Zod

Description:
Use Zod as the primary runtime schema and validation library.

Advantages:
- strong TypeScript inference
- readable declarative API
- broad adoption and ecosystem support
- good fit for forms, APIs, model output, and configuration
- supports unions, discriminated unions, transforms, refinements, and preprocessing
- integrates well with React Hook Form and common TypeScript tools
- practical for shared schemas across frontend, backend, worker, and tests

Disadvantages:
- runtime overhead can be higher than some alternatives
- transforms can hide semantic changes if overused
- large schemas may become verbose
- JSON Schema generation is not the primary native model

Risks:
- treating successful parsing as complete domain or authorization validation
- overusing coercion and transforms
- coupling application code too tightly to Zod-specific APIs

### Option B: JSON Schema with a Validator Such as Ajv

Description:
Use JSON Schema as the authoritative contract and validate with Ajv or equivalent.

Advantages:
- language-neutral standard
- strong interoperability
- useful for generated APIs and cross-language systems
- high performance
- broad tooling support

Disadvantages:
- TypeScript inference is less direct
- authoring can be more verbose
- domain refinements and transformations are less ergonomic
- more tooling may be needed to keep types and schemas aligned

Risks:
- schema and TypeScript types drift
- developer friction slows Phase 1 work

### Option C: Valibot

Description:
Use Valibot as a lightweight TypeScript-first schema library.

Advantages:
- small bundle size
- TypeScript inference
- modular API
- potentially better client-side performance

Disadvantages:
- smaller ecosystem
- fewer established integration examples
- less team familiarity and historical usage
- migration and long-term support are less proven than Zod

Risks:
- additional debugging and integration work
- library maturity becomes a concern for a security-sensitive foundation

### Option D: TypeBox with Ajv

Description:
Define TypeScript-friendly JSON Schema using TypeBox and validate with Ajv.

Advantages:
- good JSON Schema interoperability
- strong performance
- useful for API-first systems
- types and schemas can remain closely aligned

Disadvantages:
- more moving parts
- less ergonomic for some application-level refinements
- additional conceptual overhead for one developer

Risks:
- framework complexity exceeds Phase 1 need
- domain schemas become shaped around JSON Schema limitations

### Option E: Handwritten Validation Functions

Description:
Use custom TypeScript functions for validation.

Advantages:
- complete control
- no schema-library dependency
- simple for tiny payloads

Disadvantages:
- inconsistent behavior
- duplicated code
- weak error paths
- difficult type inference
- poor schema reuse
- higher maintenance cost

Risks:
- missing edge cases
- security-sensitive payloads receive uneven validation
- schema drift becomes routine

## Decision

North Vector will use Zod as the primary runtime schema validation library for Phase 1.

Zod will be used for:
- API request and response contracts
- environment validation
- canonical object input schemas
- model structured output
- provider normalization
- job payload schemas
- action and approval payloads
- forms where shared validation is useful
- database JSON validation

Zod parsing will establish structural validity only.

Domain rules and authorization checks will remain separate application concerns.

## Rationale

Zod offers the best balance of safety, speed of implementation, readability, and TypeScript integration for the current project.

North Vector benefits from keeping schemas and inferred types close together because one developer will work across the web application, worker, domain services, integrations, and tests.

Zod is sufficiently expressive for the expected Phase 1 contracts and has strong ecosystem support. It also makes model-output validation and discriminated action-state schemas straightforward.

The choice does not imply that Zod must remain permanent. More language-neutral JSON Schema contracts may become useful if North Vector later adds services in Python, Rust, Go, or another language.

## Consequences

### Positive Consequences

- one validation library across Phase 1
- shared schemas and inferred TypeScript types
- readable validation code
- strong support for unions and refinements
- easy model-output validation
- practical form and API integration
- reduced schema and type duplication
- faster implementation for one developer

### Negative Consequences

- Zod becomes a foundational dependency
- validation cost may matter for very large payloads
- transforms and coercion require discipline
- cross-language schema portability is limited
- migration to another library would require refactoring

### Operational Consequences

- validation failures should be monitored by schema name and boundary
- library upgrades should be reviewed and tested
- production startup may fail when environment schemas reject configuration
- provider changes may require schema updates before deployment

### Security and Privacy Consequences

- strict schemas improve boundary safety
- sensitive payloads should use `.strict()` or equivalent explicit unknown-field behavior
- error messages must not reveal raw private input
- Zod validation does not replace authorization or prompt-injection defenses
- transforms must not silently broaden permissions or change action meaning

### Data and Migration Consequences

- serialized payloads should include explicit schema versions
- old database JSON may need compatibility schemas
- migrations should validate outputs with the current or target schema
- Zod schemas should not become the only documentation of canonical meaning

## Schema Design Rules

Schemas should:
- use explicit names
- distinguish input, internal, and output forms where needed
- prefer discriminated unions for stateful records
- use strict unknown-field handling for security-sensitive payloads
- preserve `missing`, `null`, `unknown`, and `withheld` distinctions
- avoid broad coercion
- document transforms
- include schema versions for durable serialized payloads

## Input and Output Separation

The same schema should not automatically be reused for every direction.

Examples:
- create-input schema
- persisted-record schema
- public-view schema
- provider-normalized schema
- export schema

This prevents internal or sensitive fields from leaking merely because one broad type exists.

## Transform Policy

Transforms should be used only when the semantic change is explicit and safe.

Acceptable examples:
- parsing an ISO timestamp into a validated date representation
- trimming a bounded user-entered label
- normalizing a provider enum into a controlled internal value

Avoid:
- silently converting invalid strings into defaults
- turning missing permission fields into broad access
- mapping unknown values to ordinary valid states

## Coercion Policy

Coercion should be opt-in and conservative.

Examples:
- environment numeric strings may use explicit numeric parsing
- user API payloads should generally not coerce arbitrary strings to booleans or numbers
- empty strings should not automatically become null

## Error Mapping

Zod errors should be mapped into North Vector's structured error format.

The response may include:
- error code
- safe user message
- field path
- request ID
- retryability

Raw payload values should not be copied into logs or user-facing errors.

## Model Structured Output

Model workflows should use Zod schemas for:
- memory candidates
- task proposals
- risk and opportunity records
- decision structures
- action proposals
- briefing sections

The provider-neutral model layer should validate all structured results before returning them to domain services.

## Provider Normalization

Provider adapters may use Zod to validate and normalize the specific fields North Vector depends on.

The schema should not attempt to model every field in a provider response when only a stable subset is needed.

Provider-specific raw metadata may be preserved separately when useful.

## Job Payloads

Every job type should have:
- a named Zod schema
- payload version
- inferred TypeScript type
- explicit unsupported-version behavior

The worker should parse before executing.

## Environment Validation

Startup configuration should use Zod schemas that distinguish:
- server-only values
- public client values
- optional development values
- environment-specific requirements

Production should fail closed when required values are missing or invalid.

## Testing Requirements

Required tests include:
- inferred TypeScript type matches expected schema usage
- strict action payload rejects unknown fields
- malformed model output is rejected
- invalid environment configuration blocks startup
- provider nullability is handled explicitly
- job payload version mismatch fails safely
- transform behavior is tested
- coercion does not silently change meaning
- public output schema excludes sensitive internal fields
- Zod errors map to safe structured errors

## Validation Plan

The decision will be validated through:
- environment schema implementation
- canonical object input schemas
- Google Calendar normalization
- model structured-output validation
- job payload parsing
- approval payload validation
- form integration
- CI type checking and tests

The choice should be considered successful when schemas remain readable, reusable, strict, and practical across the first four implementation sprints.

## Rollback or Exit Strategy

If Zod becomes inadequate, North Vector may migrate to:
- JSON Schema with Ajv
- TypeBox and Ajv
- Valibot
- another maintained runtime schema system

Migration should:
1. preserve boundary validation behavior
2. preserve schema versions
3. add compatibility tests
4. migrate security-sensitive schemas first
5. avoid mixing libraries indefinitely without a clear reason

A cross-language architecture may justify moving authoritative contracts toward JSON Schema while continuing to generate or wrap TypeScript validators.

## Residual Risks

- schema and domain rules may drift
- developers may bypass parsing with casts
- transforms may hide semantic changes
- Zod error handling may leak sensitive details if mapped poorly
- performance may degrade on very large imported payloads
- library-specific APIs may spread too broadly

## Assumptions

- TypeScript remains the primary Phase 1 language
- Phase 1 payload sizes are moderate
- one developer benefits from an ergonomic TypeScript-first API
- JSON Schema interoperability is not yet a primary requirement
- domain and authorization validation remain separate
- Zod remains actively maintained

## Review Triggers

Revisit this ADR when:
- a second application language becomes active
- JSON Schema interoperability becomes a core requirement
- validation performance becomes measurable bottleneck
- Zod maintenance or security posture declines
- schema reuse creates excessive client bundle weight
- transforms or coercion repeatedly cause defects
- the project adopts generated API contracts

## Review Date

After the first four implementation sprints or when the first review trigger occurs.

## Outcome

### Expected Outcome

Zod should provide one practical, strongly typed runtime validation system for the Phase 1 application without creating unnecessary contract-tooling complexity.

### Actual Outcome

Pending implementation.

### Lessons

Pending implementation and real usage.

### Follow-Up Decision

Use Zod during repository initialization and evaluate schema ergonomics, performance, and portability after the first four sprints.

## Change History

| Date | Change | Author |
|---|---|---|
| 2026-06-14 | Initial accepted ADR | Nishad |