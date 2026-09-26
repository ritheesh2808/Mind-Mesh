# Mind-Mesh Production Deployment Guide

This guide describes the intended Supabase, Render, and Vercel topology. The current application is not ready for public production deployment: FastAPI does not validate user JWTs, and its server-side service-role key bypasses database RLS. Complete and verify authentication and project authorization before exposing the API.

---

## 1. System Architecture

```
[ Browser / Client ]
        │
        ├─────────────────────────────┐
        ▼                             ▼
[ Next.js Frontend ]         [ FastAPI Backend ]
  (Hosted on Vercel)           (Hosted on Render)
        │                             │
        │                             ▼
        └───────────────────► [ Supabase PostgreSQL ]
                               (PostgreSQL + member-scoped RLS)
```

- **Frontend**: Next.js 14+ (App Router, Tailwind CSS, Lucide icons, ReactFlow) hosted on Vercel.
- **Backend**: FastAPI (Python 3.11+, Uvicorn, Pydantic v2) hosted as a Web Service on Render.
- **Database**: Supabase PostgreSQL with relational tables, performance indexes, and member-scoped Row Level Security (RLS).
- **Intelligence Model**: Purely deterministic ED-03 analytics (Voice Equity Gini Index, Multi-Relational Knowledge Graph, Silo/Gap Detection, Fragmented Debate Divergence, Collective Evidence Insights, Actionable Pair Recommendations, Versioned Architecture Blueprints).

---

## 2. Phase 1: Database Setup (Supabase PostgreSQL)

1. **Create Supabase Project**:
   - Go to [database.new](https://database.new) and create a project in your preferred region.
   - Note the **Project URL** (`https://<project-ref>.supabase.co`) and the **API Keys** (`anon` public key and `service_role` secret key).

2. **Execute Schema Migration**:
   - Open the Supabase **SQL Editor**.
    - Apply [`backend/supabase_schema.sql`](../backend/supabase_schema.sql), then [`backend/supabase_schema_v2.sql`](../backend/supabase_schema_v2.sql), in order.
    - The schema scripts do not seed demo projects. RLS policies are scoped to authenticated project members and owners; never add permissive `USING (true)` policies for project data.

3. **Verify Tables**:
   - Verify the tables and confirm RLS is enabled. Test access with two authenticated users in different projects.

---

## 3. Phase 2: Backend Deployment (Render)

### Option A: Deploy via Render Blueprint (`render.yaml`)

1. Connect your GitHub repository to Render at [dashboard.render.com](https://dashboard.render.com).
2. Choose **New > Blueprint**.
3. Select this repository. Render detects [`render.yaml`](../render.yaml) automatically.
4. Fill in the non-synced environment variables when prompted:
   - `SUPABASE_URL`: `https://<project-ref>.supabase.co`
   - `SUPABASE_ANON_KEY`: `<your-supabase-anon-key>`
   - `SUPABASE_SERVICE_ROLE_KEY`: `<your-supabase-service-role-key>`
   - `CORS_ORIGINS`: `["https://<your-vercel-domain>.vercel.app"]`
   - `USE_MEMORY_FALLBACK`: `"false"` (enforces strict 503 behavior on db failure, preventing silent data discrepancies).

### Option B: Manual Web Service Setup

- **Environment**: Python 3.11+
- **Region**: Oregon (or matching your Supabase region)
- **Branch**: `main`
- **Build Command**: `pip install -r backend/requirements.txt`
- **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- **Health Check Path**: `/health`

### Backend Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `PORT` | Auto (Render) | Port assigned by Render ($PORT) |
| `SUPABASE_URL` | Yes | Supabase project REST URL |
| `SUPABASE_KEY` or `SUPABASE_ANON_KEY` | Optional | Public key; not sufficient for the current backend's server-side writes under member RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` | Required for current server-side repository | Server-only secret. It bypasses RLS and is unsafe to use behind unauthenticated routes. |
| `USE_MEMORY_FALLBACK` | Yes | Set to `"false"` in production. Returns 503 if DB is unreachable. |
| `CORS_ORIGINS` | Yes | JSON array or comma-separated list of allowed origins. |

---

## 4. Phase 3: Frontend Deployment (Vercel)

1. After API authentication is implemented, log into [vercel.com](https://vercel.com) and import the GitHub repository.
2. Configure Project Settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (repository root)
   - **Build Command**: `next build`
   - **Output Directory**: `.next`
3. Configure Environment Variables:
   - `NEXT_PUBLIC_API_URL`: `https://<your-render-service>.onrender.com/api/v1` (Backend API URL)
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are optional public values; never configure a service-role key in Vercel.
4. Deploy:
   - Click **Deploy**. Vercel will run typecheck, linting, and Next.js static asset compilation.
5. Update CORS in Render:
   - Add the assigned Vercel URL (e.g. `https://mind-mesh.vercel.app`) to `CORS_ORIGINS` on Render.

---

## 5. Automated Verification & Smoke Testing

We provide an automated smoke test suite in [`backend/smoke_test.py`](../backend/smoke_test.py) that executes end-to-end verification against any local or deployed environment:

```bash
# Verify local running server
python3 backend/smoke_test.py --url http://127.0.0.1:8000

# Verify production Render deployment
python3 backend/smoke_test.py --url https://mind-mesh-backend.onrender.com
```

The smoke test verifies:
1. `GET /health` returns HTTP 200 only when Supabase is reachable (or explicit local memory mode is active); production database failure returns 503.
2. `GET /api/v1/projects` lists active projects.
3. `POST /api/v1/projects` creates an isolated verification project.
4. `POST /api/v1/tasks` and `POST /api/v1/discussions` create sprint items.
5. `POST /api/v1/discussions/{id}/vote` casts consensus votes.
6. `GET /api/v1/intelligence/contributions/{project_id}` verifies Gini & equity calculation.
7. `GET /api/v1/intelligence/knowledge/{project_id}` verifies multi-relational knowledge graph.
8. `GET /api/v1/intelligence/silos/{project_id}` verifies single-owner silo and knowledge gap detection.
9. `POST /api/v1/intelligence/analyze/{project_id}` triggers deterministic full re-analysis and creates snapshot.

### Real Supabase Integration Test

Apply both SQL schema scripts first. Run the gated integration suite only against a dedicated Supabase project; it creates temporary records and attempts cleanup:

```bash
RUN_SUPABASE_INTEGRATION=true \
SUPABASE_URL="https://<project-ref>.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="<server-only-key>" \
pytest -q backend/test_supabase_integration.py
```

The suite verifies API CRUD, voting, activity before/after metrics, and persistence after reinitializing the Supabase client. To verify process-restart persistence, keep the generated project ID from a dedicated run, restart the backend, then query `GET /api/v1/projects/{project_id}` before deleting the temporary project.

---

## 6. Troubleshooting & Operational Runbook

### Health Check Degradation (`status: degraded`)
- Inspect `database` and `supabase_connected` in `/health`; check `SUPABASE_URL` and server-side key configuration in Render.
- With `USE_MEMORY_FALLBACK=false`, a database outage returns 503; the service never switches to demo memory data.

### CORS Errors in Browser
- Ensure `CORS_ORIGINS` in Render contains only the exact deployed frontend origin, without a trailing slash.

### Rollback Strategy
- **Render**: Render supports instant one-click rollback to any prior successful deploy commit via Dashboard > Deploys.
- **Vercel**: Instant instantaneous rollback to any previous deployment via Vercel Dashboard > Deployments > Promote to Production.
- **Supabase**: Take a database backup before schema changes. The v2 activity snapshot migration is additive and rerunnable; restore from backup if a migration must be rolled back.
