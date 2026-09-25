-- ==============================================================================
-- MIND-MESH: AI Collaborative Learning Intelligence Database Schema
-- Supabase (PostgreSQL 15+)
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES / USERS
-- ------------------------------------------------------------------------------
create table if not exists public.profiles (
    id text primary key,
    name text not null,
    email text unique not null,
    avatar text,
    department text default 'Computer Science',
    role text default 'Student',
    skills text[] default '{}',
    bio text,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- ------------------------------------------------------------------------------
-- 2. PROJECTS
-- ------------------------------------------------------------------------------
create table if not exists public.projects (
    id text primary key,
    title text not null,
    name text not null,
    description text not null,
    status text default 'in-progress' check (status in ('planning', 'in-progress', 'review', 'completed')),
    progress integer default 0 check (progress >= 0 and progress <= 100),
    deadline timestamptz,
    owner_id text references public.profiles(id) on delete set null,
    skills_required text[] default '{}',
    tags text[] default '{}',
    solution_blueprint jsonb default '{}'::jsonb,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- ------------------------------------------------------------------------------
-- 3. PROJECT MEMBERS
-- ------------------------------------------------------------------------------
create table if not exists public.project_members (
    id text primary key default uuid_generate_v4()::text,
    project_id text references public.projects(id) on delete cascade not null,
    user_id text references public.profiles(id) on delete cascade not null,
    role text default 'Member' check (role in ('Owner', 'Admin', 'Member', 'Observer')),
    joined_at timestamptz default timezone('utc'::text, now()) not null,
    unique(project_id, user_id)
);

-- ------------------------------------------------------------------------------
-- 4. TASKS & SPRINT CONTRIBUTIONS
-- ------------------------------------------------------------------------------
create table if not exists public.tasks (
    id text primary key,
    project_id text references public.projects(id) on delete cascade not null,
    title text not null,
    description text,
    assignee_id text references public.profiles(id) on delete set null,
    status text default 'todo' check (status in ('todo', 'in-progress', 'in-review', 'done')),
    priority text default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
    due_date timestamptz,
    module text,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- ------------------------------------------------------------------------------
-- 5. DISCUSSIONS & DEBATE FRAGMENTS
-- ------------------------------------------------------------------------------
create table if not exists public.discussions (
    id text primary key,
    project_id text references public.projects(id) on delete cascade not null,
    author_id text references public.profiles(id) on delete set null,
    title text not null,
    content text not null,
    type text default 'general' check (type in ('general', 'architectural_debate', 'unresolved_blocker', 'consensus_decision')),
    status text default 'open' check (status in ('open', 'resolved', 'divergent', 'fragmented')),
    resolution text,
    sentiment text default 'constructive',
    consensus_pro integer default 0,
    consensus_con integer default 0,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Comments on discussions
create table if not exists public.discussion_comments (
    id text primary key default uuid_generate_v4()::text,
    discussion_id text references public.discussions(id) on delete cascade not null,
    author_id text references public.profiles(id) on delete set null,
    content text not null,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Live consensus votes on resolutions
create table if not exists public.discussion_votes (
    id text primary key default uuid_generate_v4()::text,
    discussion_id text references public.discussions(id) on delete cascade not null,
    user_id text references public.profiles(id) on delete cascade not null,
    vote text check (vote in ('pro', 'con')),
    created_at timestamptz default timezone('utc'::text, now()) not null,
    unique(discussion_id, user_id)
);

-- ------------------------------------------------------------------------------
-- 6. SHARED DOCUMENTS & ARTIFACTS
-- ------------------------------------------------------------------------------
create table if not exists public.documents (
    id text primary key,
    project_id text references public.projects(id) on delete cascade not null,
    author_id text references public.profiles(id) on delete set null,
    title text not null,
    content_text text,
    file_type text default 'markdown',
    file_url text,
    contributors text[] default '{}',
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- ------------------------------------------------------------------------------
-- 7. COLLABORATION ACTIVITIES & INTERACTIVE ROOMS
-- ------------------------------------------------------------------------------
create table if not exists public.activities (
    id text primary key,
    project_id text references public.projects(id) on delete cascade not null,
    title text not null,
    description text not null,
    type text default 'knowledge_transfer' check (type in ('pair_review', 'knowledge_transfer', 'consensus_workshop', 'sprint_sync', 'general')),
    status text default 'pending' check (status in ('pending', 'in-progress', 'completed')),
    participants text[] default '{}',
    agenda text[] default '{}',
    linked_task_id text references public.tasks(id) on delete set null,
    takeaways text,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    completed_at timestamptz
);

-- ------------------------------------------------------------------------------
-- 8. AI INTELLIGENCE & EQUITY METRICS
-- ------------------------------------------------------------------------------
create table if not exists public.intelligence_insights (
    id text primary key default uuid_generate_v4()::text,
    project_id text references public.projects(id) on delete cascade not null,
    gini_coefficient numeric(4,3) not null default 0.000,
    equity_score numeric(5,2) not null default 100.00,
    voice_equity_breakdown jsonb default '[]'::jsonb,
    bottleneck_members text[] default '{}',
    isolated_members text[] default '{}',
    fragmented_debates jsonb default '[]'::jsonb,
    collective_insights jsonb default '[]'::jsonb,
    recommended_activities jsonb default '[]'::jsonb,
    coherent_blueprint jsonb default '{}'::jsonb,
    generated_at timestamptz default timezone('utc'::text, now()) not null
);

-- ------------------------------------------------------------------------------
-- 9. INDEXES FOR PERFORMANCE
-- ------------------------------------------------------------------------------
create index if not exists idx_project_members_project on public.project_members(project_id);
create index if not exists idx_project_members_user on public.project_members(user_id);
create index if not exists idx_tasks_project on public.tasks(project_id);
create index if not exists idx_tasks_assignee on public.tasks(assignee_id);
create index if not exists idx_discussions_project on public.discussions(project_id);
create index if not exists idx_documents_project on public.documents(project_id);
create index if not exists idx_activities_project on public.activities(project_id);
create index if not exists idx_intelligence_project on public.intelligence_insights(project_id);

-- ------------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.tasks enable row level security;
alter table public.discussions enable row level security;
alter table public.discussion_comments enable row level security;
alter table public.discussion_votes enable row level security;
alter table public.documents enable row level security;
alter table public.activities enable row level security;
alter table public.intelligence_insights enable row level security;

-- Open policies for demo and collaboration (can be scoped to auth.uid() in production)
create policy "Allow all read profiles" on public.profiles for select using (true);
create policy "Allow all write profiles" on public.profiles for all using (true);

create policy "Allow all read projects" on public.projects for select using (true);
create policy "Allow all write projects" on public.projects for all using (true);

create policy "Allow all read project_members" on public.project_members for select using (true);
create policy "Allow all write project_members" on public.project_members for all using (true);

create policy "Allow all read tasks" on public.tasks for select using (true);
create policy "Allow all write tasks" on public.tasks for all using (true);

create policy "Allow all read discussions" on public.discussions for select using (true);
create policy "Allow all write discussions" on public.discussions for all using (true);

create policy "Allow all read discussion_comments" on public.discussion_comments for select using (true);
create policy "Allow all write discussion_comments" on public.discussion_comments for all using (true);

create policy "Allow all read discussion_votes" on public.discussion_votes for select using (true);
create policy "Allow all write discussion_votes" on public.discussion_votes for all using (true);

create policy "Allow all read documents" on public.documents for select using (true);
create policy "Allow all write documents" on public.documents for all using (true);

create policy "Allow all read activities" on public.activities for select using (true);
create policy "Allow all write activities" on public.activities for all using (true);

create policy "Allow all read intelligence_insights" on public.intelligence_insights for select using (true);
create policy "Allow all write intelligence_insights" on public.intelligence_insights for all using (true);

-- ------------------------------------------------------------------------------
-- 11. SEED DATA (Problem Statement Case Study)
-- ------------------------------------------------------------------------------
insert into public.profiles (id, name, email, avatar, role, skills) values
('u1', 'Ritheesh', 'ritheesh@university.edu', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'Lead Coordinator', array['FastAPI', 'Next.js', 'System Architecture']),
('u2', 'Priya Sharma', 'priya@university.edu', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', 'Data Engineer', array['Python', 'Kafka', 'ETL Pipelines', 'Pandas']),
('u3', 'Karthik Raja', 'karthik@university.edu', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'ML Specialist', array['PyTorch', 'Scikit-Learn', 'Feature Engineering']),
('u4', 'Arun Kumar', 'arun@university.edu', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'Security Researcher', array['Cybersecurity', 'Snort Rules', 'PCAP Analysis']),
('u5', 'Divya Patel', 'divya@university.edu', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', 'Frontend & Visualization', array['React', 'TailwindCSS', 'Recharts', 'UI/UX'])
on conflict (id) do nothing;

insert into public.projects (id, title, name, description, status, progress, deadline, owner_id, skills_required, tags) values
('p1', 'AI-Powered Collaborative Cyber Threat Defense System', 'AI-Powered Collaborative Cyber Threat Defense System', 'A multi-agent learning platform designed to ingest high-throughput network packets, classify adversarial anomaly patterns in real-time, and orchestrate automated mitigation protocols.', 'in-progress', 65, timezone('utc'::text, now() + interval '14 days'), 'u1', array['Python', 'FastAPI', 'PyTorch', 'Kafka', 'React', 'Cybersecurity'], array['AI/ML', 'Distributed Systems', 'Security', 'Capstone'])
on conflict (id) do nothing;

insert into public.project_members (id, project_id, user_id, role) values
('pm1', 'p1', 'u1', 'Owner'),
('pm2', 'p1', 'u2', 'Member'),
('pm3', 'p1', 'u3', 'Member'),
('pm4', 'p1', 'u4', 'Member'),
('pm5', 'p1', 'u5', 'Member')
on conflict do nothing;

insert into public.discussions (id, project_id, author_id, title, content, type, status, resolution, consensus_pro, consensus_con) values
('d1', 'p1', 'u3', 'Model Inference Latency vs Detection Accuracy in Real-Time Traffic', 'We are observing 120ms latency using our deep transformer model on raw packet streams. The real-time SLA is under 25ms. Should we adopt lightweight ONNX quantization or switch to an ensemble XGBoost architecture?', 'architectural_debate', 'divergent', 'Recommended by AI: Adopt hybrid multi-stage pipeline: XGBoost for 1st-stage wire-speed triage (<5ms) followed by quantized ONNX transformer for ambiguous anomalous sessions.', 4, 0),
('d2', 'p1', 'u4', 'Fragmented PCAP Ingestion Pipeline & Thread Safety', 'The Snort/Suricata PCAP ingestion threads are occasionally dropping 4% of packets during burst intervals. Priya suggested Kafka buffer queues, but we need thread safety guarantees.', 'unresolved_blocker', 'fragmented', 'Recommended by AI: Pair Priya (Kafka pipelines) and Arun (PCAP engine) in a 45-minute Knowledge Transfer & Bridge activity.', 3, 0)
on conflict (id) do nothing;
