# ADR-0014: Use a Provider-Neutral Model Layer

## Status

Accepted

## Date

2026-06-14

## Decision Owner

Nishad

## Reviewers

- Project Owner
- AI Platform Owner
- Technical Lead
- Security Owner
- Privacy Owner
- Operations Owner

## Related Documents

- `10-Implementation/Technical_Stack_and_Environment.md`
- `10-Implementation/Testing_Strategy.md`
- `10-Implementation/Phase_1_Backlog.md`
- `10-Implementation/Implementation_Risk_Register.md`
- `10-Implementation/Implementation_Decision_Log.md`
- `10-Implementation/ADRs/ADR-0003-Separate-Reasoning-Approval-Execution-and-Verification.md`
- `10-Implementation/ADRs/ADR-0006-Use-TypeScript-Across-the-Phase-1-Application.md`
- `10-Implementation/ADRs/ADR-0010-Use-pgvector-for-Initial-Semantic-Retrieval.md` (deprecated, no replacement decided — see `10-Implementation/System-Blueprint/North-Vector-Database-Schema-v1.md`)
- `10-Implementation/ADRs/ADR-0011-Use-Provider-Abstractions-for-Models-and-Integrations.md`

## Context

North Vector depends on language models for capabilities such as:
- Chief conversation
- structured extraction
- memory candidate generation
- planning assistance
- risk and opportunity analysis
- daily briefings
- weekly reviews
- decision support
- future voice and document workflows

Different model providers and models vary in:
- reasoning quality
- latency
- cost
- context length
- structured-output support
- tool-calling behavior
- streaming
- privacy terms
- data retention
- availability
- safety and refusal behavior

If provider-specific request and response logic is embedded throughout the application, the project becomes tightly coupled to one vendor and one model generation.

At the same time, a provider-neutral layer can become misleading if it pretends every model has identical capabilities. North Vector needs an abstraction that preserves meaningful differences while preventing provider SDKs from shaping domain logic.

The model layer also sits inside a critical trust boundary. Model output is untrusted and must never bypass schema validation, domain rules, authorization, approval, execution, or verification.

## Decision Drivers

- provider portability
- model routing
- structured-output validation
- streaming support
- cost and latency control
- privacy routing
- testability
- failure handling
- provider capability differences
- observability
- separation from domain and execution logic
- ability to adopt local models later

## Options Considered

### Option A: Provider-Neutral Model Layer

Description:
Define a normalized model interface and route all model calls through one application-owned layer that handles provider selection, request construction, streaming, structured output, retries, cost, and metadata.

Advantages:
- provider SDKs remain isolated
- model replacement is easier
- routing by cost, latency, privacy, or task becomes possible
- structured output and validation are centralized
- logging and observability are consistent
- tests can use deterministic fake models
- local and cloud models can coexist later
- domain code does not depend on one provider's message format

Disadvantages:
- adds adapter and routing complexity
- provider-specific capabilities require explicit representation
- normalized interfaces may need revision
- debugging requires access to both normalized and raw metadata

Risks:
- lowest-common-denominator abstraction
- important provider behavior may be hidden
- routing logic may become overly complex
- false confidence that models are interchangeable

### Option B: Use One Provider SDK Directly Throughout the Application

Description:
Call one provider's API from Chief, memory, planning, review, and automation modules directly.

Advantages:
- fastest initial implementation
- direct access to provider features
- simpler examples and debugging
- less wrapper code

Disadvantages:
- deep vendor coupling
- duplicated error and retry logic
- prompts and response handling spread across modules
- provider migration becomes expensive
- cost and privacy policy become inconsistent

Risks:
- one provider outage affects every workflow
- model changes require broad code changes
- provider-specific tool calling leaks into action authorization

### Option C: Use a Third-Party Multi-Provider SDK as the Primary Abstraction

Description:
Use an external library or gateway that normalizes several model providers.

Advantages:
- faster multi-provider support
- common streaming and message APIs
- less custom adapter code
- potential built-in observability and fallback

Disadvantages:
- another dependency or intermediary
- abstraction follows the third party's design
- privacy and data routing may become less direct
- provider-specific features may be delayed or flattened
- gateway outage may affect all models

Risks:
- new vendor lock-in replaces old vendor lock-in
- sensitive prompts pass through another processor
- breaking changes in the abstraction layer

### Option D: Separate Model Integration Per Feature

Description:
Allow each domain module to choose and integrate its own model provider independently.

Advantages:
- each workflow can use the best model
- no central bottleneck
- feature teams can move independently

Disadvantages:
- duplicated prompts, logging, validation, and credentials
- inconsistent privacy behavior
- difficult cost control
- difficult testing
- provider SDKs leak everywhere

Risks:
- model behavior and safety differ unpredictably across the product
- one feature bypasses shared controls
- prompt-injection defenses become inconsistent

### Option E: Local Models Only

Description:
Run all language and embedding models locally.

Advantages:
- strong data control
- no external model-provider dependency
- predictable marginal cost
- offline potential

Disadvantages:
- hardware, memory, latency, and maintenance burden
- weaker model quality for some tasks
- local serving complexity
- difficult mobile and hosted access
- model updates and safety remain North Vector's responsibility

Risks:
- the MVP stalls on infrastructure
- insufficient reasoning quality
- poor user experience on limited hardware

## Decision

North Vector will use an application-owned provider-neutral model layer for Phase 1.

All language-model and embedding calls will pass through this layer.

The model layer will normalize:
- request structure
- streaming
- structured output
- cancellation
- timeouts
- usage
- latency
- provider and model metadata
- normalized error categories

The layer will preserve explicit capability differences and raw provider references where required for debugging and audit.

No domain module may call a model-provider SDK directly outside an approved adapter implementation.

## Model Layer Responsibilities

The model layer should own:
- provider adapters
- model registry
- capability metadata
- routing policy
- prompt version references
- request assembly
- timeout and cancellation
- retry guidance
- streaming transport abstraction
- structured-output parsing
- usage and cost metadata
- safe provider request IDs
- privacy-routing decisions

The model layer should not own:
- domain authorization
- approval
- external tool execution
- canonical object persistence
- memory promotion
- final planning policy
- user permission decisions

## Required Interfaces

A language-model interface may include:
- `generateText`
- `streamText`
- `generateStructured`
- `cancel`
- `getCapabilities`

An embedding interface may include:
- `embedText`
- `embedBatch`
- `getEmbeddingMetadata`

The exact TypeScript interfaces should remain narrow and based on real workflows.

## Capability Model

Each registered model should declare capabilities such as:
- streaming
- structured output
- tool calling
- vision
- audio input
- long context
- deterministic seed support
- data-retention mode
- regional routing
- maximum context and output

Routing should fail explicitly when a required capability is unavailable.

## Model Registry

The registry should assign internal model aliases such as:
- `chief-general`
- `chief-complex-reasoning`
- `structured-extraction`
- `memory-classification`
- `embedding-default`

Domain code should request a capability or internal alias rather than a permanent provider model name.

The registry maps aliases to provider and model configuration per environment.

## Routing Policy

Routing may consider:
- task type
- privacy classification
- sensitivity
- required capability
- context size
- latency target
- cost budget
- model health
- environment

Deterministic application logic should remain preferred when a model is unnecessary.

## Privacy Routing

The model layer should decide whether content may be sent to:
- a standard cloud model
- a stricter-retention provider mode
- a local model
- no model at all

Restricted data should not be sent to a provider merely because that provider is the default.

Privacy routing should be explicit, testable, and based on system policy rather than model preference.

## Structured Output

Structured model results should:
- use a declared schema
- be parsed as untrusted input
- be validated before use
- reject or repair invalid output safely
- preserve provider metadata and prompt version

The model layer may return validated candidate data, but domain services remain responsible for lifecycle and persistence decisions.

## Streaming

Streaming should support:
- partial text delivery
- cancellation
- timeout
- final usage metadata
- final structured sections where needed
- error state without corrupting session history

Partial streamed content must not trigger external actions or durable writes by itself.

## Prompt Management

Prompt templates should be:
- versioned
- named
- linked to the workflow
- tested through regression suites
- separated from untrusted retrieved content
- configured without embedding secrets

The model layer should record prompt-template version, not necessarily the full sensitive prompt in ordinary logs.

## Error Normalization

Model-provider errors should map into categories such as:
- Authentication Required
- Permission Denied
- Rate Limited
- Timeout
- Temporary Provider Failure
- Invalid Request
- Context Limit Exceeded
- Structured Output Invalid
- Safety Refusal
- Unsupported Capability
- Canceled

Retry behavior should depend on the normalized category and workflow.

## Fallback Behavior

Fallback may be used when:
- a provider is unavailable
- the selected model is rate limited
- a capability-compatible alternative exists
- privacy policy permits the alternate route

Fallback should not occur when:
- it would send data to a less trusted provider
- the alternate model lacks required capability
- cost or behavior changes would be consequential without disclosure
- a refusal is policy-relevant rather than a provider outage

Fallback events should be observable.

## Cost Controls

The model layer should track:
- input tokens
- output tokens
- embedding volume
- provider cost estimate
- model alias
- workflow
- latency
- cache or reuse status where applicable

Budgets may be applied by:
- session
- workflow
- automation
- day or month

## Observability

Record safe metadata including:
- request ID
- provider
- model
- internal alias
- prompt version
- latency
- usage
- finish reason
- normalized error
- fallback occurrence

Do not log full private prompts or responses by default.

## Provider Metadata

The layer should preserve:
- provider request ID
- exact model identifier
- model version where available
- response finish reason
- safety metadata
- usage data

This information supports debugging, cost analysis, and behavior review.

## Rationale

A provider-neutral model layer allows North Vector to use language models as replaceable reasoning infrastructure rather than allowing one provider to define the product's architecture.

The system's distinctive logic lies in:
- canonical data
- memory lifecycle
- context assembly
- planning
- approval
- execution
- privacy and security policy

Those systems should not depend on one provider's request format, tool syntax, or model naming.

The abstraction also creates one place to enforce structured-output validation, privacy routing, cost monitoring, and provider failure behavior.

The decision does not claim that all models are equivalent. Capability declarations and provider metadata preserve the differences that matter.

## Consequences

### Positive Consequences

- easier model and provider replacement
- centralized validation and error handling
- consistent cost and latency tracking
- safer privacy routing
- deterministic fake models for tests
- future local-model support
- domain code remains provider-neutral
- reduced provider SDK spread
- controlled fallback behavior

### Negative Consequences

- more implementation complexity
- interface evolution as provider capabilities change
- provider-specific features require deliberate extensions
- routing policy can become difficult to reason about
- debugging includes an additional abstraction layer

### Operational Consequences

- model-provider health and cost must be monitored centrally
- provider credentials remain inside adapters
- routing configuration becomes production configuration
- fallback and model changes should be auditable
- model aliases and prompt versions require change control

### Security and Privacy Consequences

- one layer can enforce provider data-routing policy
- adapter credentials remain isolated
- prompt and response logging must be minimized
- local and cloud routing decisions become security-sensitive
- model output remains untrusted even after normalization
- model layer must not gain action authority

### Data and Migration Consequences

- model and prompt metadata may be stored with generated records
- embeddings must record provider, model, and dimensions
- changing embedding models may require reindexing
- model-generated memories and objects must preserve source and version
- domain records should not depend on provider-specific response IDs as their primary identity

## Implementation Notes

Suggested structure:

```text
/packages/ai
  /model-provider.ts
  /embedding-provider.ts
  /model-registry.ts
  /model-router.ts
  /prompt-registry.ts
  /schemas
  /providers
    /provider-a.ts
    /provider-b.ts
  /testing
    /fake-model-provider.ts
```

Phase 1 should begin with one cloud model provider and one embedding provider if practical, while preserving the interface for later alternatives.

## Testing Requirements

Required tests include:
- domain service works with a fake model provider
- provider SDK is not imported by domain modules
- unsupported capability fails explicitly
- invalid structured output is rejected
- timeout maps to normalized error
- provider request ID and model metadata are preserved
- privacy policy blocks an unauthorized provider route
- fallback does not cross privacy boundaries
- partial stream cannot create an action
- model refusal is not retried as a provider outage
- usage and cost metadata are recorded
- prompt version is traceable
- client cannot select an unrestricted provider or model directly

## Validation Plan

The decision will be validated through:
- Chief conversation streaming
- memory candidate extraction
- structured task proposal
- embedding generation
- fake-provider integration tests
- provider timeout and rate-limit simulation
- one model-alias reassignment in staging without domain-code changes
- cost and latency review after one month of use

The layer should be considered successful when provider changes remain localized and domain workflows behave consistently across a fake and real provider.

## Rollback or Exit Strategy

If the abstraction becomes too broad or misleading:
- narrow interfaces by capability
- split language and embedding concerns further
- expose typed provider extensions
- remove unused generic fields

The project should not revert to broad direct provider SDK usage across domain modules.

A third-party multi-provider SDK may be used inside the model layer if it passes privacy, security, and portability review.

## Residual Risks

- lowest-common-denominator interface
- provider-specific semantics still leak
- routing bugs send data to the wrong provider
- model aliases hide behavior changes
- fallback creates inconsistent output quality
- cost estimates differ from billing
- local models may require a substantially different serving model

## Assumptions

- Phase 1 begins with a small number of model workflows
- one provider is sufficient initially
- provider changes are plausible over the product lifetime
- structured output is available or can be validated after generation
- North Vector can maintain its own prompt and routing registry
- model output remains advisory and untrusted

## Review Triggers

Revisit this ADR when:
- a second language-model provider is added
- local inference becomes active
- multimodal input enters production
- provider capabilities cannot fit the current interfaces
- routing policy becomes difficult to audit
- model costs or outages materially affect reliability
- a privacy incident involves provider routing
- a third-party gateway is proposed

## Review Date

After the second model provider or local model is introduced, or after one month of MVP production use, whichever occurs first.

## Outcome

### Expected Outcome

A provider-neutral model layer should let North Vector use and change models without allowing provider-specific APIs to shape domain logic, privacy policy, or action authority.

### Actual Outcome

Pending implementation.

### Lessons

Pending implementation and real usage.

### Follow-Up Decision

Keep the model layer provider-neutral and capability-aware, revising interfaces only from evidence gathered through real model integrations.

## Change History

| Date | Change | Author |
|---|---|---|
| 2026-06-14 | Initial accepted ADR | Nishad |