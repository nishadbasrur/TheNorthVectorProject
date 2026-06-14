# ADR-0015: Use Explicit Runtime Schema Validation at All External Boundaries

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
- `10-Implementation/ADRs/ADR-0003-Separate-Reasoning-Approval-Execution-and-Verification.md`
- `10-Implementation/ADRs/ADR-0006-Use-TypeScript-Across-the-Phase-1-Application.md`
- `10-Implementation/ADRs/ADR-0011-Use-Provider-Abstractions-for-Models-and-Integrations.md`
- `10-Implementation/ADRs/ADR-0014-Use-a-Provider-Neutral-Model-Layer.md`

## Context

North Vector uses TypeScript across the Phase 1 application, but TypeScript types disappear at runtime.

The system receives data from many external or untrusted boundaries, including:
- browser requests
- form submissions
- route parameters
- environment variables
- authentication providers
- Google Calendar
- model providers
- embedding providers
- background-job payloads
- database JSON fields
- webhooks
- uploaded files
- imported exports
- future email, document, health, finance, voice, and location providers

Any of these inputs may be:
- malformed
- incomplete
- stale
- provider-version dependent
- malicious
- semantically invalid
- structurally valid but unauthorized
- inconsistent with current domain state

Relying only on TypeScript interfaces, SDK-generated types, or manual casts would create false confidence. A value may compile as a trusted type while containing unexpected or dangerous runtime data.

The architecture therefore needs a consistent rule for converting unknown external input into validated internal data.

## Decision Drivers

- runtime safety
- data integrity
- security
- predictable provider behavior
- model-output safety
- clear error handling
- shared schemas
- testability
- migration reliability
- reduced unsafe casting
- compatibility with TypeScript
- defense against malformed and adversarial input

## Options Considered

### Option A: Explicit Runtime Schema Validation at Every External Boundary

Description:
Treat all external input as `unknown` and validate it against explicit runtime schemas before it enters domain logic, persistence, jobs, or execution.

Advantages:
- catches malformed data early
- aligns runtime behavior with TypeScript types
- centralizes error reporting
- protects provider, model, and API boundaries
- improves testability
- supports versioned payloads and migrations
- reduces unsafe casts
- makes trust boundaries visible in code

Disadvantages:
- additional schema code
- possible duplication between domain types and validation schemas
- validation adds some latency
- schema evolution requires discipline
- overly permissive schemas can still create false safety

Risks:
- developers may bypass validation for convenience
- schema and domain semantics may drift
- validation may check shape but not authorization or business meaning

### Option B: Rely on TypeScript Types and SDK Definitions

Description:
Use compile-time types and provider SDK typings without independent runtime validation.

Advantages:
- less code
- fast development
- strong editor support
- direct use of provider types

Disadvantages:
- no runtime guarantee
- malicious or malformed input can pass through
- provider responses may change
- JSON parsing remains untrusted
- model output can be structurally invalid

Risks:
- corrupted canonical data
- unsafe action payloads
- application crashes
- hidden authorization and integrity failures

### Option C: Validate Only Public API Requests

Description:
Validate browser and external API input but trust provider SDKs, internal jobs, database JSON, and model output.

Advantages:
- protects the most obvious boundary
- lower implementation cost
- simple mental model

Disadvantages:
- many critical untrusted sources remain unchecked
- internal serialized jobs can become stale or malformed
- model output and provider responses remain dangerous
- database migrations may leave invalid JSON

Risks:
- false distinction between external and internal data
- delayed failures deep inside workflows
- difficult recovery after invalid state is persisted

### Option D: Validate Only Before Database Writes

Description:
Allow unvalidated data through application layers and validate only before persistence.

Advantages:
- one central validation point
- protects the database from some malformed records
- less repeated validation

Disadvantages:
- unsafe data can influence planning, authorization, or external actions before persistence
- read-only workflows remain exposed
- provider errors become difficult to classify
- failures occur far from the source

Risks:
- unvalidated payload reaches execution service
- model output changes behavior without being stored
- debugging loses source context

### Option E: Use Manual Validation in Each Feature

Description:
Write ad hoc checks in route handlers, services, and adapters.

Advantages:
- flexible
- little schema-library dependency
- easy for very small inputs

Disadvantages:
- inconsistent behavior
- duplicated logic
- missing fields and edge cases
- poor reuse and testing
- difficult schema versioning

Risks:
- one workflow silently validates less than another
- security assumptions differ by feature

## Decision

North Vector will use explicit runtime schema validation at every external boundary.

All external input must enter the system as `unknown` or an equivalent untrusted representation and become typed only after validation.

Phase 1 should use a runtime schema system such as Zod, JSON Schema, Valibot, or another well-maintained TypeScript-compatible library.

The initial recommendation is Zod because it provides strong TypeScript integration and practical schema reuse, but the exact library may be selected through implementation evaluation.

Validation must occur before data is:
- used by domain logic
- persisted
- queued as a job
- interpreted as model output
- used to authorize or execute an action
- included in canonical state

## External Boundaries Covered

The validation rule applies to:
- HTTP request bodies
- query parameters
- route parameters
- cookies and session claims
- environment variables
- authentication-provider events
- Google Calendar responses
- model structured output
- embedding-provider responses
- job payloads
- webhook payloads
- imported JSON or Markdown metadata
- uploaded-file metadata
- database JSON read from older versions
- cached serialized state
- future connector responses

## Validation Layers

North Vector should distinguish three types of validation.

### Structural Validation

Checks shape, type, format, required fields, and controlled values.

Examples:
- valid timestamp
- allowed enum
- required object ID
- bounded string length
- valid email format

### Domain Validation

Checks business meaning and state transitions.

Examples:
- approval cannot move from Expired to Approved
- task due date is not structurally impossible
- memory candidate cannot be Active without promotion
- relationship type permits the selected source and target

### Authorization Validation

Checks whether the authenticated actor may perform the operation.

Examples:
- user owns the object
- device trust is sufficient
- integration scope allows the operation
- approval is valid for the exact payload

A structurally valid payload is not automatically domain-valid or authorized.

## Schema Ownership

Schemas should be owned by the layer that defines the contract.

Examples:
- API request schema: application boundary
- canonical object schema: domain module
- Google Calendar response schema: Calendar adapter
- model structured output schema: AI workflow module
- job payload schema: job type owner
- environment schema: configuration module

Shared schemas should be imported intentionally rather than copied.

## Type Inference

Where practical, TypeScript types should be inferred from runtime schemas or generated from one authoritative contract.

The project should avoid maintaining separate handwritten type and schema definitions that can drift.

## Unknown Field Policy

Schemas should define whether unknown fields are:
- rejected
- stripped
- preserved in a provider-metadata field

Default guidance:
- reject unexpected fields for security-sensitive action payloads
- strip or ignore harmless unknown API fields only when safe
- preserve provider-specific metadata deliberately when needed for forward compatibility

Unknown-field behavior should not be accidental.

## Coercion Policy

Automatic coercion should be conservative.

Examples:
- a string timestamp may be parsed only through an explicit schema
- booleans should not accept arbitrary truthy values
- numeric IDs should not silently accept malformed strings
- empty strings should not automatically become `null` unless defined

The system should preserve distinctions among:
- missing
- null
- unknown
- withheld
- empty
- invalid

## Model Output Validation

Model output must always be treated as untrusted.

Structured output should:
- target an explicit schema
- be parsed and validated
- reject invented IDs or invalid enums
- preserve uncertainty
- remain a proposal until domain services accept it

Invalid model output must never:
- write directly to canonical storage
- create active memory
- authorize an action
- invoke an external adapter

## Provider Response Validation

Provider SDK typings are not sufficient.

Adapters should validate the fields North Vector depends on and handle:
- missing fields
- changed enum values
- malformed timestamps
- provider nullability
- partial responses
- pagination tokens
- version metadata

The adapter may retain raw provider data for controlled debugging or source preservation, but domain code should receive a validated normalized result.

## Job Payload Validation

Every job type should have:
- payload schema
- payload version
- migration or rejection behavior

A worker should validate the job payload before processing.

Unsupported or malformed payloads should fail safely and enter a reviewable state rather than being cast to the latest type.

## Environment Validation

Application startup should validate:
- required variables
- URL formats
- allowed environment names
- provider keys and identifiers
- public versus server-only variables
- numeric bounds
- feature-flag values

Invalid production configuration should block startup safely.

## Database JSON Validation

JSON fields read from the database should be validated when:
- the field is schema-versioned
- older data may exist
- migrations have changed meaning
- the value influences security, authorization, memory, or execution

Database trust should not replace schema validation for flexible fields.

## File and Import Validation

Imports and uploads should validate:
- size
- content type
- expected encoding
- metadata schema
- archive structure
- object counts and limits
- unsupported version

File parsing should occur in a restricted, non-executing context.

## Error Handling

Validation failures should produce structured errors containing:
- stable error code
- safe user message
- field path when appropriate
- retryability
- request or run ID
- source boundary

Sensitive raw input should not be copied into logs or error messages.

## Logging

Validation logs should include:
- schema name and version
- boundary
- failure category
- sanitized field path
- request or job ID

Do not log full private payloads by default.

## Rationale

North Vector's trust model depends on exact state and action semantics. TypeScript alone cannot provide that guarantee at runtime.

Explicit validation turns trust boundaries into code. It ensures that provider data, model output, browser input, jobs, and imported state must prove their shape before they can influence memory, planning, permissions, or external actions.

This decision also improves long-term migration and debugging. When a provider or payload changes, the system can fail at the boundary with a clear error rather than corrupting state and failing later.

The extra schema work is justified because North Vector handles sensitive data and increasingly consequential workflows.

## Consequences

### Positive Consequences

- earlier failure detection
- stronger data integrity
- safer model and provider handling
- fewer runtime type errors
- clearer trust boundaries
- improved testability
- easier schema versioning
- safer migrations and imports
- more predictable error handling
- reduced unsafe casting

### Negative Consequences

- more schemas to maintain
- some validation duplication or adaptation
- development friction when providers change
- runtime overhead
- schema-library dependence
- risk of confusing structural validation with complete safety

### Operational Consequences

- validation-failure rates should be monitored
- provider schema changes may trigger alerts
- unsupported job versions require operational handling
- configuration errors may block deployment
- migrations may need compatibility schemas

### Security and Privacy Consequences

- malformed and adversarial input is contained earlier
- action payloads receive strict validation
- validation errors must not expose sensitive content
- schemas should enforce field-size limits to reduce abuse
- validation cannot replace authorization, prompt-injection defenses, or malware scanning

### Data and Migration Consequences

- canonical and serialized schemas require versions
- migrations should validate outputs
- imports should reject or quarantine unknown versions
- database JSON may need lazy or batch migration
- schema changes should preserve semantic distinctions

## Implementation Notes

Recommended project structure:

```text
/packages/domain/schemas
/packages/integrations/*/schemas
/packages/ai/schemas
/packages/jobs/schemas
/packages/config/schema.ts
/apps/web/app/api/*
```

Recommended practices:
- export schemas and inferred types together
- name schemas clearly
- include schema version where serialized long-term
- avoid broad `.passthrough()` defaults on sensitive payloads
- use safe parsing where user-facing field errors are needed
- use strict parsing for action and permission records

## Performance Guidance

Validation should occur once at the boundary when possible.

Repeated validation inside trusted internal layers should be used only when:
- data crosses a process or serialization boundary
- state may have changed
- security requires revalidation
- cached or persisted flexible data is loaded

Performance should be measured before weakening validation.

## Testing Requirements

Required tests include:
- malformed API request is rejected
- unexpected action field is rejected
- invalid environment configuration blocks startup
- malformed Calendar response fails in the adapter
- model output with invented ID is rejected
- unsupported job payload version enters a safe failure state
- database JSON from an old version is migrated or rejected
- structural validation does not bypass authorization
- sensitive raw payload is absent from logs
- unknown-field policy behaves as documented
- coercion does not silently change semantic meaning
- oversized input is rejected

## Validation Plan

The decision will be validated through:
- API request schemas
- environment startup validation
- Google Calendar adapter validation
- model structured-output validation
- background job schema validation
- chemistry-exam end-to-end workflow
- adversarial malformed-input tests
- monitoring schema failures during staging

The approach should be considered successful when malformed data fails at its source boundary without corrupting domain state or triggering external action.

## Rollback or Exit Strategy

This is intended to be a durable safety rule.

The specific schema library may be replaced if:
- performance is unacceptable
- maintenance declines
- JSON Schema interoperability becomes more important
- another library materially reduces duplication

A library migration should preserve the boundary-validation requirement and include compatibility tests.

Removing runtime validation broadly would require a superseding ADR and security review.

## Residual Risks

- schemas may validate shape but miss semantic errors
- developers may bypass schemas through casts
- provider responses may contain malicious content inside valid strings
- schema and business logic may drift
- validation-library vulnerabilities
- excessive coercion may alter meaning
- strict schemas may cause avoidable provider breakage

## Assumptions

- TypeScript remains the primary application language
- a mature runtime schema library is available
- external boundaries can be identified clearly
- schema overhead is acceptable for Phase 1 scale
- domain and authorization validation remain separate
- CI and code review can enforce the rule

## Review Triggers

Revisit this ADR when:
- schema maintenance becomes a major delivery bottleneck
- a provider frequently introduces compatible unknown fields
- performance measurement shows meaningful validation cost
- JSON Schema or cross-language services become central
- a security incident involves validation bypass
- multiple languages require a shared schema system
- the selected library becomes unsupported

## Review Date

After the first four implementation sprints or when the first review trigger occurs.

## Outcome

### Expected Outcome

Explicit runtime validation should prevent malformed or untrusted external data from entering North Vector's domain logic, persistence, jobs, or execution paths without proving its structure.

### Actual Outcome

Pending implementation.

### Lessons

Pending implementation and real usage.

### Follow-Up Decision

Select the runtime schema library during repository setup while preserving this boundary-validation rule.

## Change History

| Date | Change | Author |
|---|---|---|
| 2026-06-14 | Initial accepted ADR | Nishad |