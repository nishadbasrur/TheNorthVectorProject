# ADR-0010: Use pgvector for Initial Semantic Retrieval

## Status

Deprecated. pgvector required PostgreSQL, which was deleted from the codebase (2026-07-03). Unlike ADR-0001/ADR-0018, this is marked Deprecated rather than Superseded because no replacement semantic-retrieval architecture has been decided yet for Firestore — see `10-Implementation/Architecture_Decision_Record_Template.md` for when Deprecated vs. Superseded applies. A new ADR should be written when that decision is made. Preserved here unmodified for historical context.

## Date

2026-06-14

## Decision Owner

Nishad

## Reviewers

- Project Owner
- Data Architecture Owner
- Retrieval Owner
- Security Owner
- Operations Owner

## Related Documents

- `09-Data-and-Memory/Memory_Retrieval_and_Context_Assembly.md`
- `09-Data-and-Memory/Data_Quality_and_Provenance_Model.md`
- `09-Data-and-Memory/Data_Migration_and_Backup_Model.md`
- `10-Implementation/Technical_Stack_and_Environment.md`
- `10-Implementation/Testing_Strategy.md`
- `10-Implementation/Phase_1_Backlog.md`
- `10-Implementation/Implementation_Risk_Register.md`
- `10-Implementation/ADRs/ADR-0001-Use-PostgreSQL-as-Primary-Database.md`
- `10-Implementation/ADRs/ADR-0002-Use-a-Modular-Monolith-for-Phase-1.md`

## Context

North Vector needs semantic retrieval to find relevant memories, goals, tasks, decisions, files, and other canonical objects when exact identifiers or structured filters are insufficient.

The retrieval system must preserve more than vector similarity. It must also enforce:
- ownership
- sensitivity
- lifecycle status
- deletion state
- confidence
- source provenance
- current object version
- privacy mode
- context budget

Phase 1 uses PostgreSQL as the primary database and a modular monolith operated by one developer.

The anticipated Phase 1 dataset is modest. The system does not yet require:
- billions of vectors
- multi-region vector replication
- extremely high query throughput
- independent vector-store scaling
- a separate retrieval operations team

A dedicated vector database may eventually provide stronger large-scale retrieval, filtering, hybrid search, or operational isolation. However, it would add another stateful system whose contents must stay synchronized with canonical data, permissions, deletion, backup, and restore behavior.

The architectural question is whether Phase 1 should use PostgreSQL with pgvector or introduce a dedicated vector database immediately.

## Decision Drivers

- simple architecture
- transactional association with canonical objects
- reliable deletion propagation
- sensitivity and permission filtering
- low operational overhead
- manageable Phase 1 scale
- backup and restore simplicity
- provider portability
- hybrid structured and semantic retrieval
- model-version tracking
- future migration path

## Options Considered

### Option A: pgvector in PostgreSQL

Description:
Store embeddings in PostgreSQL using pgvector, linked to canonical object IDs, object versions, sensitivity, lifecycle state, and embedding model metadata.

Advantages:
- one database and backup system
- easy joins with canonical objects and permissions
- simpler deletion propagation
- transactional embedding metadata updates
- low operational overhead
- portable across many PostgreSQL providers
- sufficient for expected Phase 1 scale
- straightforward local and test setup

Disadvantages:
- vector indexing and query features may be less specialized
- large-scale performance may eventually be weaker than dedicated systems
- vector workloads share resources with transactional workloads
- some advanced hybrid-search features require custom SQL or application logic

Risks:
- query performance may degrade as the dataset grows
- poorly designed filtering may reduce index effectiveness
- embedding generation and storage may increase database size

### Option B: Dedicated Managed Vector Database

Description:
Use a specialized service such as Pinecone, Weaviate Cloud, Qdrant Cloud, or another managed vector platform.

Advantages:
- specialized vector indexing
- strong scaling and retrieval features
- managed operations
- potentially better metadata filtering and hybrid search
- independent workload scaling

Disadvantages:
- another provider and credential
- another copy of personal data
- more complex deletion and synchronization
- separate backup and recovery behavior
- provider cost and lock-in
- harder local testing

Risks:
- stale or deleted data remains retrievable
- metadata and permission drift
- restore resurrects records inconsistently
- increased privacy surface

### Option C: Self-Hosted Vector Database

Description:
Run a dedicated vector database such as Qdrant, Weaviate, or Milvus alongside PostgreSQL.

Advantages:
- specialized retrieval
- more infrastructure control
- less managed-provider dependence

Disadvantages:
- additional deployment, monitoring, backup, and upgrade burden
- more complex local and staging environments
- separate security boundary
- unnecessary for expected Phase 1 volume

Risks:
- operational fragility
- infrastructure distraction
- cross-store inconsistency

### Option D: No Semantic Retrieval in MVP

Description:
Use exact lookup, structured filters, full-text search, and graph relationships only.

Advantages:
- simplest implementation
- no embeddings or model cost
- highly explainable retrieval
- fewer privacy and deletion concerns

Disadvantages:
- weaker natural-language recall
- user must know exact object names or fields
- memory and document retrieval may feel brittle
- a core Chief capability remains unproven

Risks:
- MVP feels less intelligent
- relevant context is missed when wording differs

### Option E: In-Memory or Local File Vector Index

Description:
Generate embeddings and store the index locally in the application filesystem or memory.

Advantages:
- low infrastructure cost
- simple experiments
- fast local prototyping

Disadvantages:
- poor durability and deployment behavior
- difficult multi-process synchronization
- weak backup and restore
- deletion and versioning are harder to verify

Risks:
- inconsistent retrieval between web and worker
- index loss on restart or deployment
- stale records remain active

## Decision

North Vector will use pgvector in PostgreSQL for initial semantic retrieval during Phase 1.

Embeddings will be stored as derived records linked to:
- canonical object ID
- canonical object version
- embedding model and version
- source text hash
- sensitivity
- lifecycle status
- created timestamp
- invalidated or deleted timestamp

Semantic retrieval will be one candidate-generation mechanism, not the final authority for context inclusion.

All semantic results must pass through:
- ownership checks
- permission checks
- sensitivity filters
- lifecycle filters
- deletion filters
- recency and confidence ranking
- context-budget logic

## Rationale

pgvector offers enough semantic-retrieval capability for the expected Phase 1 scale while keeping canonical state, retrieval metadata, permissions, and deletion behavior in one data platform.

The hardest Phase 1 retrieval risks are not raw vector throughput. They are:
- retrieving deleted memory
- including Restricted data without enough relevance
- mistaking semantic similarity for factual relevance
- losing provenance
- allowing stale embeddings to represent newer objects

Keeping embeddings in PostgreSQL makes those risks easier to control. The system can join vector candidates directly with canonical object status, ownership, sensitivity, source, and version.

A dedicated vector database may become appropriate later, but adding one before performance evidence exists would increase privacy and synchronization complexity without improving the primary MVP workflow enough to justify the cost.

## Consequences

### Positive Consequences

- one primary data and backup system
- easier permission and sensitivity filtering
- simpler deletion propagation
- direct joins with canonical objects
- lower infrastructure cost
- easier local and integration testing
- straightforward embedding-version tracking
- reduced provider lock-in
- simpler restore and reconciliation

### Negative Consequences

- vector workload shares PostgreSQL resources
- advanced retrieval features may require more custom work
- large datasets may need different index strategies
- embedding storage may increase database cost
- future migration to a specialized store may require dual-write or reindexing work

### Operational Consequences

- pgvector extension must be available in all environments
- vector indexes require monitoring and maintenance
- embedding generation runs through background jobs
- query latency and index size should be measured
- database backups include embeddings unless they are regenerated instead
- retrieval can degrade to exact, structured, or text search if vector queries fail

### Security and Privacy Consequences

- embeddings remain personal derived data
- embeddings inherit the sensitivity of their source object
- Restricted embeddings require the same access controls as Restricted canonical data
- deletion must invalidate embeddings immediately for retrieval, even if physical cleanup is asynchronous
- embedding text and vectors should not be logged unnecessarily
- third-party embedding providers should receive only approved content

### Data and Migration Consequences

- embedding rows must reference stable canonical IDs and versions
- object changes may invalidate prior embeddings
- embedding model changes require re-embedding or version-aware coexistence
- migrations should not activate embeddings for archived, rejected, or deleted objects
- semantic indexes should be rebuildable from canonical data

## Embedding Record Model

Each embedding record should contain:
- embedding_id
- object_id
- object_version
- object_type
- chunk_id when applicable
- embedding_model
- embedding_model_version
- vector_dimension
- source_text_hash
- sensitivity
- created_at
- invalidated_at
- deleted_at
- metadata

The embedding record should not become an independent source of truth.

## Embedding Generation Rules

Generate or regenerate an embedding when:
- an eligible object is created
- retrievable content changes materially
- the object version changes
- the embedding model changes
- chunking strategy changes

Do not generate embeddings for:
- deleted records
- rejected memory candidates unless used only in an isolated review workflow
- raw secrets
- unnecessary ephemeral state
- content prohibited by privacy mode

## Candidate Retrieval Rules

Semantic search should:
- produce candidates
- preserve similarity score
- preserve source and object ID
- use structured filters before or during vector search where possible
- never override explicit object references
- never treat similarity as proof

Exact identifiers and current structured state should outrank semantic similarity.

## Hybrid Retrieval

Phase 1 may combine:
- exact lookup
- structured filters
- PostgreSQL full-text search
- trigram similarity
- vector similarity
- shallow graph traversal

The context assembler should merge and rerank these candidates.

## Index Strategy

Initial index choice should depend on actual dataset size and provider support.

Phase 1 may begin with:
- exact vector search for very small datasets
- HNSW or IVFFlat after measurement justifies indexing

Index configuration should be benchmarked rather than copied blindly.

## Embedding Model Abstraction

Embedding generation should use a provider abstraction that records:
- provider
- model
- version
- dimensions
- cost and latency
- privacy route

The database schema should not assume one permanent embedding provider.

## Invalidation and Deletion

When an object is updated:
- old embeddings should be marked invalid or associated only with the old version
- new retrieval should use the current version

When an object is deleted:
- retrieval must exclude its embeddings immediately
- cleanup should remove or tombstone embedding records
- caches must be invalidated
- deletion tests must verify semantic absence

## Backup and Restore

Embeddings may be:
- included in database backups
- regenerated after restore

If included, deletion and revocation replay must still occur.

If regenerated, the system should preserve enough canonical text and model metadata to rebuild them.

## Failure Behavior

If vector retrieval is unavailable:
- exact and structured retrieval should remain available
- the interface may disclose reduced semantic recall
- external actions should not fail solely because semantic retrieval is degraded unless required context is missing

If embedding generation fails:
- canonical object creation should generally remain valid
- a retryable job should be created
- the object should remain retrievable through exact and structured methods

## Testing Requirements

Required tests include:
- embedding links to the correct object version
- deleted object never appears in semantic retrieval
- archived or expired memory is excluded
- sensitivity filtering occurs before context assembly
- explicit ID lookup outranks vector similarity
- stale embedding does not represent the current object version
- model-version change supports safe re-embedding
- duplicate embeddings are suppressed
- vector failure degrades to other retrieval methods
- restore or rebuild preserves deletion rules
- candidate memory is excluded from ordinary semantic retrieval

## Validation Plan

The decision will be validated through:
- local pgvector setup
- semantic retrieval over the synthetic seed dataset
- memory retrieval tests
- deletion propagation end-to-end test
- context relevance evaluation
- latency measurement as the dataset grows
- one month of MVP usage
- database size and query monitoring

The decision should be reconsidered only if measured retrieval quality, latency, cost, or operational impact becomes unacceptable.

## Rollback or Exit Strategy

If pgvector becomes insufficient, North Vector may move semantic retrieval to a dedicated vector system while keeping PostgreSQL authoritative.

Migration should:
1. define a stable retrieval adapter
2. export only eligible current embeddings or regenerate them
3. preserve object IDs, versions, sensitivity, and deletion state
4. dual-read or shadow-test before cutover
5. verify deletion and permission behavior
6. maintain PostgreSQL as canonical source
7. use a superseding ADR

The dedicated vector store should remain a derived retrieval index unless a later ADR explicitly changes data ownership.

## Residual Risks

- PostgreSQL performance may degrade under vector load
- index tuning may be misunderstood
- embedding-model changes may cause ranking inconsistency
- vectors may reveal information if access controls fail
- semantic results may remain contextually irrelevant
- reindexing may become expensive
- a shared database creates one operational dependency

## Assumptions

- Phase 1 dataset remains modest
- semantic retrieval volume is moderate
- PostgreSQL provider supports pgvector
- shallow context retrieval is sufficient
- canonical object metadata can be joined efficiently
- embeddings are derived and rebuildable
- one developer benefits from one data platform

## Review Triggers

Revisit this ADR when:
- vector query latency exceeds accepted targets
- the embedding table materially affects transactional workload
- the dataset reaches a size where index maintenance becomes burdensome
- advanced hybrid retrieval is difficult to implement
- independent retrieval scaling becomes necessary
- a privacy review recommends stronger isolation
- another store materially reduces total complexity
- semantic-retrieval quality cannot meet product needs despite reranking improvements

## Review Date

After one month of MVP production use or when the first review trigger occurs.

## Outcome

### Expected Outcome

pgvector should provide enough semantic retrieval for the MVP while preserving simple deletion, provenance, permission, backup, and operational behavior.

### Actual Outcome

Pending implementation.

### Lessons

Pending implementation and real usage.

### Follow-Up Decision

Keep pgvector as the initial semantic index unless measured constraints justify a specialized derived store.

## Change History

| Date | Change | Author |
|---|---|---|
| 2026-06-14 | Initial accepted ADR | Nishad |