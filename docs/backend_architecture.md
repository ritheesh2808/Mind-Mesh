# Mind-Mesh Backend Architecture

## Overview
Mind-Mesh backend is a FastAPI application that serves as the collaborative intelligence engine, analytics provider, and API gateway for the collaborative learning platform.

## Architecture Layers
1. **Routers (`backend/routers/`)**: FastAPI endpoints for projects, tasks, discussions, documents, activities, and intelligence metrics adhering to Pydantic schemas.
2. **Services (`backend/services/ai_engine.py`)**: Self-contained deterministic intelligence engine for Gini coefficient calculation, Voice Equity indexing, fragmented discussion detection, activity recommendations, and coherent solution blueprint synthesis.
3. **Repository (`backend/repository.py`)**: Unified data access layer interfacing with Supabase PostgreSQL tables and fallback memory store.
4. **Resilience & Fallback**: Explicit `USE_MEMORY_FALLBACK` configuration allows running against deterministic in-memory datasets without a live DB connection for local development and testing, while surfacing 503 errors when fallback is disabled and the database is unreachable.

## Data Model
- Fully normalized PostgreSQL schema in `backend/supabase_schema.sql` with Row Level Security (RLS) policies.
- Tables: `projects`, `project_members`, `tasks`, `discussions`, `discussion_votes`, `documents`, `activities`, `insights`, `recommendations`.

