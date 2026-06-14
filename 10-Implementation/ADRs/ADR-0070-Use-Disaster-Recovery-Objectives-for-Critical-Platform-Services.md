# ADR-0070: Use Disaster Recovery Objectives for Critical Platform Services

## Status

Accepted

## Date

2026-06-14

## Decision

North Vector will define disaster recovery objectives for critical platform services and data stores.

The system should identify recovery time objectives and recovery point objectives for major components.

## Context

A serious outage, data loss event, provider failure, or infrastructure incident could disrupt the platform. Recovery expectations must be explicit rather than improvised during a crisis.

## Recovery Objectives

Critical components should define:
- recovery time objective
- recovery point objective
- backup dependency
- restoration owner
- validation procedure

## Prioritization

Not every component requires the same recovery target.

Core data stores, audit records, authentication, and execution infrastructure require stronger recovery expectations than temporary caches or disposable projections.

## Consequences

### Positive

- clearer incident response
- better resilience planning
- reduced recovery uncertainty
- stronger operational maturity

### Negative

- requires planning effort
- may increase infrastructure cost
- recovery procedures require testing

## Testing Requirements

Tests should verify:
- recovery procedures are documented
- backups satisfy recovery-point expectations
- restore drills validate recovery-time expectations
- critical services are prioritized correctly

## Outcome

North Vector gains explicit disaster recovery expectations for critical services, improving resilience and reducing uncertainty during severe incidents.