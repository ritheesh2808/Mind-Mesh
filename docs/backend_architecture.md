# Mind-Mesh Backend Architecture

## Overview
Mind-Mesh is a FastAPI service backed by Supabase PostgreSQL. Its ED-03 analysis is deterministic and based on project entities and persisted contribution events; no LLM, embeddings, or vector search are used.

## Architecture Layers
1. **Routers (`backend/routers/`)**: Project, task, discussion, document, activity, and intelligence HTTP APIs.
2. **Services (`backend/services/`)**: Contribution equity, discussion analysis, knowledge graph, silo detection, evidence-backed insights, recommendations, blueprint versioning, activity impact, and orchestration pipeline.
3. **Repository (`backend/repository.py`)**: Supabase data access with an explicit local-only memory fixture mode.
4. **Failure behavior**: `USE_MEMORY_FALLBACK` defaults to `false`. Set it to `true` explicitly only in local development; production database failures return 503. `/health` returns 503 when neither the database nor explicitly enabled local memory is healthy.

## Data Model
- `backend/supabase_schema.sql` is the canonical schema; `backend/supabase_schema_v2.sql` adds activity before/after snapshot columns.
- Core records use text IDs to preserve existing API IDs. Intelligence records include contributions, knowledge nodes/edges, insights/evidence, recommendations/participants/sources, blueprints/modules/sources, and analysis snapshots.
- RLS grants authenticated users access only to their own profile and projects they belong to; project owners manage project membership. Anonymous database access is denied.

## Security Limitation
The FastAPI routes currently do not validate user JWTs. The backend service-role key bypasses RLS, so these database policies do not protect requests made through the public API. Do not expose the service until authentication and request-level project authorization are implemented. Browser code must never receive the service-role key.

## Data Flow
Frontend requests go through `src/lib/api.ts` to FastAPI. FastAPI calls `Repository`, which uses Supabase when configured. Memory fixtures are selected only when `USE_MEMORY_FALLBACK=true`; they are for local development and tests, not deployment data.

## Deterministic Analysis
`AnalysisPipeline.run_project_analysis(project_id)` runs contribution analytics, builds a graph from project members/tasks/discussions/documents, detects silos and gaps, analyzes discussions, persists insights/recommendations/blueprints, and stores a snapshot. Activity impact compares actual metrics captured on creation and completion; it does not infer missing baselines.

