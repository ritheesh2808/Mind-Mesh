# Mind-Mesh — AI Collaborative Learning Intelligence

**Problem Statement Alignment:**  
Students working in groups often face unequal participation, fragmented discussions, and difficulty combining individual contributions into a coherent solution. Mind-Mesh analyzes authorized group discussions, shared documents, and task contributions to identify knowledge exchange patterns, quantify participation equity, detect debate divergence, summarize collective insights, and synthesize an integrated solution blueprint.

---

## 🚀 Full Stack Architecture

- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4 + Framer Motion
- **State & UI**: Zustand (with local persistence fallback), Recharts, `@xyflow/react` (knowledge graph), Lucide Icons
- **Backend API**: Python FastAPI + Uvicorn + Pydantic
- **Database & Cloud**: Supabase (PostgreSQL 15+, Row Level Security, pgvector ready)

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
2. Execute `backend/supabase_schema.sql` in the Supabase SQL Editor.
3. Configure `.env.local` based on `.env.example`.

---

## 🌟 Key Features

1. **Voice Equity Index (Gini-Coefficient Analysis)**:
   - Evaluates multi-dimensional contributions (tasks, discussions, authored artifacts).
   - Detects overloaded knowledge bottlenecks and under-represented group members.
2. **Fragmented Discussion & Consensus Engine**:
   - Classifies architectural debates and unresolved blockers.
   - Provides live interactive pro/con consensus voting on AI-suggested resolutions.
3. **Coherent Solution Blueprint Synthesis**:
   - Synthesizes separate student modules (Data Ingestion, ML Inference Core, Threat Evasion, UI Analytics, API Security) into a unified deliverable.
   - 1-Click Markdown Blueprint Export with explicit author attributions and consensus records.
4. **Targeted Collaboration Activity Rooms**:
   - Interactive Activity Execution Room with agenda checklists, takeaways scratchpad, and automatic deliverable task completion upon knowledge transfer.
