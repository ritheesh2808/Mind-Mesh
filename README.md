# Mind-Mesh — AI Collaborative Learning Intelligence

**Problem Statement Alignment:**  
Students working in groups often face unequal participation, fragmented discussions, and difficulty combining individual contributions into a coherent solution. Mind-Mesh analyzes authorized group discussions, shared documents, and task contributions to identify knowledge exchange patterns, quantify participation equity, detect debate divergence, summarize collective insights, and synthesize an integrated solution blueprint.

---

## 🚀 Full Stack Architecture

- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4 + Framer Motion
- **State & UI**: Zustand, Recharts, `@xyflow/react`, Lucide Icons
- **Backend API**: Python FastAPI + Uvicorn + Pydantic
- **Database & Cloud**: Supabase PostgreSQL with member-scoped Row Level Security

---

## 🏃 Run Locally

### 1. Frontend (Next.js)
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

### 2. Backend (FastAPI + Supabase)
```bash
pip install -r backend/requirements.txt
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
- Interactive API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health & Supabase Status: [http://localhost:8000/health](http://localhost:8000/health)

### 3. Supabase Setup
1. Create a project at [supabase.com](https://supabase.com).
2. Execute `backend/supabase_schema.sql`, then `backend/supabase_schema_v2.sql` in the Supabase SQL Editor.
3. Configure backend `.env` from `.env.example`; set `USE_MEMORY_FALLBACK=true` only when intentionally running offline with development fixtures.

---

## 🚢 Production Deployment

Deployment steps and current release gates are documented in [`docs/deployment.md`](docs/deployment.md).

- **Backend (Render)**: Deploy using the included [`render.yaml`](render.yaml) Blueprint or as a Python Web Service (`uvicorn backend.main:app --host 0.0.0.0 --port $PORT`).
- **Frontend (Vercel)**: Import repository into Vercel with framework preset `Next.js` and set `NEXT_PUBLIC_API_URL` to the Render backend URL.
- **Database (Supabase)**: Apply both schema scripts for the deterministic application tables, indexes, and member-scoped RLS.
- **Automated Smoke Testing**:
  ```bash
  python3 backend/smoke_test.py --url https://<your-render-app>.onrender.com
  ```
- **Real Supabase integration testing** (after both schema scripts are applied):
   ```bash
   RUN_SUPABASE_INTEGRATION=true SUPABASE_URL="https://<project-ref>.supabase.co" \
   SUPABASE_SERVICE_ROLE_KEY="<server-only-key>" pytest -q backend/test_supabase_integration.py
   ```

**Deployment status:** Do not expose the FastAPI service publicly yet. The current API does not validate Supabase user JWTs, while its server-side service-role key bypasses RLS. Production deployment is blocked until API authentication and user-to-project authorization are implemented and verified.

---

## 🌟 Key Features

1. **Voice Equity Index (Gini-Coefficient Analysis)**:
   - Evaluates multi-dimensional contributions (tasks, discussions, authored artifacts).
   - Detects overloaded knowledge bottlenecks and under-represented group members.
2. **Deterministic Knowledge Graph Engine**:
   - Multi-relational graph connecting people, skills, topics, tasks, documents, discussions, and decisions.
3. **Knowledge Silo & Gap Detection**:
   - Single-owner module silos, unreviewed document silos, isolated members, missing required skills, and undocumented systems with explainable evidence.
4. **Fragmented Discussion & Consensus Engine**:
   - Analyzes debate divergence, vote distribution, and unresolved questions.
   - Interactive viewpoints and pro/con consensus voting.
5. **Collective Insights with Evidence**:
   - Persistent insights answering "Why did Mind-Mesh generate this insight?" with structured metric and source citations.
6. **Actionable Recommendations**:
   - Pair programming, knowledge transfer, and consensus alignment with explicit participants, agendas, and outcomes.
7. **Coherent Solution Blueprint Synthesis**:
   - Versioned architecture blueprints synthesizing deliverables, consensus, unresolved risks, and action plans.
8. **Activity Impact Before/After Analysis**:
   - Measures Voice Equity and sprint velocity deltas before and after collaborative activity sessions.
