# ADR-0036: Use Versioned Schemas for Long-Lived Structured Data

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will use explicit schema versioning for long-lived structured data.

Any structured payload expected to persist across releases must include a schema version that allows the system to interpret, migrate, validate, and evolve the data safely over time.

## Context

North Vector stores structured information including:
- memories
- plans
- goals
- tasks
- approvals
- execution payloads
- synchronization metadata
- retrieval artifacts
- AI-generated structured outputs
- provider mappings

These records may survive for years.

Application code, validation rules, and object models will evolve.

Without schema versioning:
- old records become ambiguous
- migrations become difficult
- parsing becomes fragile
- backward compatibility becomes uncertain
- data corruption risks increase

## Decision Drivers

- long-term maintainability
- backward compatibility
- migration safety
- auditability
- explicit evolution
- validation reliability

## Versioning Principles

Structured payloads should include:

```text
schema_version
```

The version should be stored alongside the payload.

The system must not infer schema versions from timestamps or application releases.

## Applicable Data Types

Examples include:
- JSON documents
- memory payloads
- planning artifacts
- approval payloads
- execution specifications
- retrieval metadata
- AI-generated structured objects

Simple relational fields do not necessarily require independent schema versions.

## Reading Data

When loading structured data:

1. Determine schema version
2. Validate against the correct schema
3. Transform or migrate if required
4. Return a canonical representation

## Writing Data

New writes should use the current schema version.

The application should avoid generating obsolete versions unless explicitly required for migration support.

## Migration Strategy

Supported approaches may include:

### Read-Time Migration

Convert older versions when loaded.

### Batch Migration

Upgrade records through controlled background processes.

### Hybrid Strategy

Use read-time compatibility followed by eventual permanent migration.

The chosen approach may vary by data type.

## Validation Requirements

Each schema version should have:
- explicit validation rules
- documented structure
- test coverage

Validation should fail clearly when encountering unsupported versions.

## Backward Compatibility

The system should explicitly define:
- supported versions
- deprecated versions
- removed versions

Compatibility should never be assumed.

## Audit Requirements

Schema migrations should be auditable.

Where appropriate, audit events should indicate:
- migration execution
- source version
- target version
- outcome

## AI-Generated Data

AI-generated structured outputs require versioning because:
- prompts evolve
- output formats evolve
- validation rules evolve

Generated structures should not be treated as timeless.

## External Providers

Provider payload versions should remain separate from North Vector schema versions.

Example:

```text
provider_version
north_vector_schema_version
```

These concepts should not be merged.

## Operational Benefits

Schema versioning enables:
- safer upgrades
- predictable migrations
- easier debugging
- long-term compatibility
- reduced data ambiguity

## Consequences

### Positive

- safer evolution of data structures
- explicit compatibility management
- easier migrations
- improved reliability
- stronger validation

### Negative

- additional schema maintenance
- migration complexity
- more testing requirements
- version-support overhead

## Implementation Notes

Example payload:

```json
{
  "schema_version": 2,
  "data": {}
}
```

Version identifiers should be simple, explicit, and stable.

## Testing Requirements

Tests should verify:
- current schema validates correctly
- older supported schemas remain readable
- unsupported versions fail safely
- migrations preserve meaning
- transformed objects match canonical expectations
- schema versions are always present where required

## Outcome

North Vector gains a durable foundation for evolving structured data safely across releases without sacrificing validation, compatibility, or long-term maintainability.