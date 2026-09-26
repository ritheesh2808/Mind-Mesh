# Mind-Mesh Backend: AI Collaborative Learning Intelligence

This is the high-performance FastAPI and Supabase backend service for **Mind-Mesh**, designed to solve the critical challenges in student group collaborations:

1. **Unequal Participation**: Quantified using Gini-index analysis across tasks, discussions, and document edits.
2. **Fragmented Discussions**: Semantic clustering and divergence tracking on unaligned debates with automated consensus prompts.
3. **Difficulty Combining Individual Contributions**: Automated synthesis of modular deliverables into a coherent solution blueprint.
4. **Targeted Collaboration Activities**: Dynamic recommendations for peer knowledge transfers, pair reviews, and consensus workshops.

---

## 📁 Architecture Overview

```text
backend/
├── main.py                  # FastAPI app with CORS, health check, router registry
├── config.py                # Environment configuration & Supabase settings
├── supabase_client.py       # Supabase Client initialization with graceful fallback
├── supabase_schema.sql      # PostgreSQL schema, indexes, and member-scoped RLS
├── supabase_schema_v2.sql   # Additive activity snapshot migration
├── schemas.py               # Pydantic request/response models & AI schemas
├── repository.py            # Dual-mode data repository (Supabase + Memory fallback)
├── requirements.txt         # Python dependencies
├── services/
│   └── ai_engine.py         # Gini Equity, Debate Fragmentation & Blueprint Synthesis
└── routers/
    ├── projects.py          # Project management & team rosters
    ├── discussions.py       # Discussions, debates & live consensus voting
    ├── tasks.py             # Work breakdown & sprint deliverables
    ├── documents.py         # Shared artifacts & specifications
    ├── activities.py        # Interactive Activity Rooms & takeaway logging
    └── intelligence.py      # Voice equity, fragmentation, and blueprint synthesis
```

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
pip install -r backend/requirements.txt
```

### 2. Configure Supabase

To connect to your Supabase project:

1. Create a project at [supabase.com](https://supabase.com).
2. Run `backend/supabase_schema.sql` and then `backend/supabase_schema_v2.sql` in the Supabase SQL Editor.
3. Set your environment variables in `.env` (or pass to shell):

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
USE_MEMORY_FALLBACK=false
```

Set `USE_MEMORY_FALLBACK=true` only for offline local development. The default is `false`; without a reachable database, API requests fail with 503 rather than returning demo fixtures. Never expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend.

**Production security gate:** The API currently has no user JWT authentication. The server-side service-role client bypasses RLS, so do not publicly deploy this API until authentication and project authorization are implemented and tested.

### 3. Run the Backend Server

```bash
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive API documentation will be available at:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **Health Check**: `http://localhost:8000/health`
