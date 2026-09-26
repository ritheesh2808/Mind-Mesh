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
    status text default 'todo' check (status in ('todo', 'in-progress', 'in-review', 'done', 'backlog', 'completed', 'in_progress', 'review')),
    priority text default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
    due_date timestamptz,
    module text,
    tags text[] default '{}',
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
    type text default 'knowledge_transfer' check (type in ('pair_review', 'knowledge_transfer', 'consensus_workshop', 'sprint_sync', 'general', 'pair_programming', 'knowledge_sharing', 'peer_review', 'mini_quiz', 'task_reassignment', 'discussion', 'research_comparison', 'knowledge_sharing_session')),
    status text default 'pending' check (status in ('pending', 'in-progress', 'completed', 'scheduled')),
    participants text[] default '{}',
    agenda text[] default '{}',
    linked_task_id text references public.tasks(id) on delete set null,
    notes text,
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

-- ------------------------------------------------------------------------------
-- 11. SEED DATA (Problem Statement Case Study)
-- ------------------------------------------------------------------------------
/*
insert into public.profiles (id, name, email, avatar, role, skills) values
('u1', 'Ritheesh', 'ritheesh@university.edu', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'Lead Coordinator', array['FastAPI', 'Next.js', 'System Architecture']),
('u2', 'Priya Sharma', 'priya@university.edu', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', 'Data Engineer', array['Python', 'Kafka', 'ETL Pipelines', 'Pandas']),
('u3', 'Karthik Raja', 'karthik@university.edu', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'ML Specialist', array['PyTorch', 'Scikit-Learn', 'Feature Engineering']),
('u4', 'Arun Kumar', 'arun@university.edu', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'Security Researcher', array['Cybersecurity', 'Snort Rules', 'PCAP Analysis']),
('u5', 'Divya Patel', 'divya@university.edu', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', 'Frontend & Visualization', array['React', 'TailwindCSS', 'Recharts', 'UI/UX'])
on conflict (id) do nothing;

insert into public.projects (id, title, name, description, status, progress, deadline, owner_id, skills_required, tags) values
('p1', 'AI-Powered Collaborative Cyber Threat Defense System', 'AI-Powered Collaborative Cyber Threat Defense System', 'A multi-agent learning platform designed to ingest high-throughput network packets, classify adversarial anomaly patterns in real-time, and orchestrate automated mitigation protocols.', 'in-progress', 65, timezone('utc'::text, now() + interval '14 days'), 'u1', array['Python', 'FastAPI', 'PyTorch', 'Kafka', 'React', 'Cybersecurity'], array['AI/ML', 'Distributed Systems', 'Security', 'Capstone']),
('p2', 'Campus Knowledge Graph', 'Campus Knowledge Graph', 'Semantic knowledge graph bridging student research projects and faculty labs.', 'planning', 18, timezone('utc'::text, now() + interval '30 days'), 'u2', array['Python', 'Graph Theory', 'FastAPI'], array['Graph', 'Semantic Web']),
('p3', 'Secure Chat for Student Clubs', 'Secure Chat for Student Clubs', 'Encrypted messaging platform with end-to-end forward secrecy.', 'in-progress', 45, timezone('utc'::text, now() + interval '21 days'), 'u5', array['TypeScript', 'React', 'Cryptography'], array['Privacy', 'Chat'])
on conflict (id) do nothing;

insert into public.project_members (id, project_id, user_id, role) values
('pm1', 'p1', 'u1', 'Owner'),
('pm2', 'p1', 'u2', 'Member'),
('pm3', 'p1', 'u3', 'Member'),
('pm4', 'p1', 'u4', 'Member'),
('pm5', 'p1', 'u5', 'Member'),
('pm6', 'p2', 'u2', 'Owner'),
('pm7', 'p3', 'u5', 'Owner')
on conflict do nothing;

insert into public.tasks (id, project_id, title, description, status, priority, assignee_id, due_date, module) values
('t1', 'p1', 'Kafka Ingestion Buffer for Raw PCAP Streams', 'Set up Kafka topic partitions and test under 100Mbps traffic', 'done', 'high', 'u2', timezone('utc'::text, now() + interval '3 days'), 'Data Ingestion'),
('t2', 'p1', 'Transformer Feature Embeddings Extraction', 'Implement PyTorch attention-based sequence embeddings', 'done', 'high', 'u3', timezone('utc'::text, now() + interval '5 days'), 'Model Pipeline'),
('t3', 'p1', 'Quantize ONNX Model for Sub-25ms SLA', 'Export trained transformer to INT8 ONNX runtime', 'in-progress', 'urgent', 'u3', timezone('utc'::text, now() + interval '2 days'), 'Optimization'),
('t4', 'p1', 'Snort Threat Pattern Heuristic Ruleset', 'Compile Snort signature rule matcher into ingestion flow', 'in-progress', 'medium', 'u4', timezone('utc'::text, now() + interval '7 days'), 'Threat Rules'),
('t5', 'p1', 'Interactive Anomaly Radar & Metrics Dashboard', 'Build React dashboard using Recharts and xyflow', 'in-progress', 'medium', 'u5', timezone('utc'::text, now() + interval '6 days'), 'Frontend'),
('t6', 'p1', 'FastAPI Orchestration & Supabase Auth Bridge', 'Connect FastAPI routers with Supabase row level security', 'done', 'high', 'u1', timezone('utc'::text, now() + interval '1 day'), 'Core Backend')
on conflict (id) do nothing;

insert into public.discussions (id, project_id, author_id, title, content, type, status, resolution, consensus_pro, consensus_con) values
('d1', 'p1', 'u3', 'Model Inference Latency vs Detection Accuracy in Real-Time Traffic', 'We are observing 120ms latency using our deep transformer model on raw packet streams. The real-time SLA is under 25ms. Should we adopt lightweight ONNX quantization or switch to an ensemble XGBoost architecture?', 'architectural_debate', 'divergent', 'Adopt hybrid multi-stage pipeline: XGBoost for 1st-stage wire-speed triage (<5ms) followed by quantized ONNX transformer for ambiguous anomalous sessions.', 4, 0),
('d2', 'p1', 'u4', 'Fragmented PCAP Ingestion Pipeline & Thread Safety', 'The Snort/Suricata PCAP ingestion threads are occasionally dropping 4% of packets during burst intervals. Priya suggested Kafka buffer queues, but we need thread safety guarantees.', 'unresolved_blocker', 'fragmented', 'Pair Priya (Kafka pipelines) and Arun (PCAP engine) in a 45-minute Knowledge Transfer & Bridge activity.', 3, 0)
on conflict (id) do nothing;

insert into public.documents (id, project_id, author_id, title, content_text, file_type, contributors) values
('doc1', 'p1', 'u1', 'Threat Defense System Architecture Specification', 'This document specifies the end-to-end architecture of the multi-agent detection pipeline.', 'markdown', array['u1', 'u2', 'u3']),
('doc2', 'p1', 'u4', 'PCAP Feature Extraction & Network Signatures', 'Specification of network flow heuristics and packet inspection boundaries.', 'markdown', array['u4'])
on conflict (id) do nothing;

insert into public.activities (id, project_id, title, description, type, status, participants, agenda, linked_task_id, takeaways, notes) values
('act-1', 'p1', 'Knowledge Transfer & Bridge: Kafka Ingestion to PCAP Engine', 'Cross-domain pairing session between Priya (data pipeline) and Arun (security rules).', 'knowledge_transfer', 'pending', array['Priya Sharma', 'Arun Kumar'], array['Review Kafka consumer group thread isolation model', 'Profile Snort ring buffer enqueue metrics'], 't4', null, null)
on conflict (id) do nothing;

*/
-- ==============================================================================
-- MIND-MESH UPGRADE: NEW NORMALIZED TABLES (Phases 2 & 20)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- NEW DISCUSSION INTELLIGENCE
-- ------------------------------------------------------------------------------
create table if not exists public.discussion_messages (
    id text primary key default uuid_generate_v4()::text,
    discussion_id text references public.discussions(id) on delete cascade not null,
    author_id text references public.profiles(id) on delete set null,
    content text not null,
    reply_to_id text references public.discussion_messages(id) on delete set null,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

create table if not exists public.discussion_viewpoints (
    id text primary key default uuid_generate_v4()::text,
    discussion_id text references public.discussions(id) on delete cascade not null,
    author_id text references public.profiles(id) on delete cascade not null,
    position text not null,
    argument text not null,
    evidence text[] default '{}',
    sentiment numeric(3,2),
    created_at timestamptz default timezone('utc'::text, now()) not null
);

create table if not exists public.discussion_decisions (
    id text primary key default uuid_generate_v4()::text,
    discussion_id text references public.discussions(id) on delete cascade not null,
    decision text not null,
    rationale text,
    confidence numeric(4,2),
    created_by text references public.profiles(id) on delete set null,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- ------------------------------------------------------------------------------
-- DOCUMENT METADATA
-- ------------------------------------------------------------------------------
-- ------------------------------------------------------------------------------
-- ACTIVITIES LIFECYCLE
-- ------------------------------------------------------------------------------
create table if not exists public.activity_participants (
    id text primary key default uuid_generate_v4()::text,
    activity_id text references public.activities(id) on delete cascade not null,
    user_id text references public.profiles(id) on delete cascade not null,
    role text,
    joined_at timestamptz default timezone('utc'::text, now()) not null,
    left_at timestamptz,
    unique(activity_id, user_id)
);

create table if not exists public.activity_outcomes (
    id text primary key default uuid_generate_v4()::text,
    activity_id text references public.activities(id) on delete cascade not null unique,
    summary text,
    takeaways text,
    knowledge_transferred text,
    action_items text[] default '{}',
    before_snapshot jsonb,
    after_snapshot jsonb,
    created_at timestamptz default timezone('utc'::text, now()) not null
);
alter table public.activity_outcomes add column if not exists before_snapshot jsonb;
alter table public.activity_outcomes add column if not exists after_snapshot jsonb;

-- ------------------------------------------------------------------------------
-- CONTRIBUTION EVENT SYSTEM (Phase 3)
-- ------------------------------------------------------------------------------
create table if not exists public.contributions (
    id text primary key default uuid_generate_v4()::text,
    project_id text references public.projects(id) on delete cascade not null,
    user_id text references public.profiles(id) on delete cascade not null,
    entity_type text not null, -- task, discussion, message, document, activity
    entity_id text not null,
    action_type text not null, -- created, completed, commented, uploaded
    weight integer default 1 not null,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default timezone('utc'::text, now()) not null
);
create index if not exists idx_contributions_project on public.contributions(project_id);
create index if not exists idx_contributions_user on public.contributions(user_id);

-- ------------------------------------------------------------------------------
-- KNOWLEDGE GRAPH BACKEND (Phase 6)
-- ------------------------------------------------------------------------------
create table if not exists public.knowledge_nodes (
    id text primary key default uuid_generate_v4()::text,
    project_id text references public.projects(id) on delete cascade not null,
    node_type text not null, -- person, topic, document, task, discussion, skill, decision
    entity_id text,
    label text not null,
    description text,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null,
    unique(project_id, node_type, label)
);

create table if not exists public.knowledge_edges (
    id text primary key default uuid_generate_v4()::text,
    project_id text references public.projects(id) on delete cascade not null,
    source_node_id text references public.knowledge_nodes(id) on delete cascade not null,
    target_node_id text references public.knowledge_nodes(id) on delete cascade not null,
    edge_type text not null, -- contributed, explained, discussed, referenced, collaborated
    weight integer default 1 not null,
    confidence numeric(4,2) default 1.0,
    evidence_count integer default 1,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null,
    unique(source_node_id, target_node_id, edge_type)
);

-- ------------------------------------------------------------------------------
-- COLLECTIVE INSIGHT ENGINE (Phase 11 & 12)
-- ------------------------------------------------------------------------------
create table if not exists public.insights (
    id text primary key default uuid_generate_v4()::text,
    project_id text references public.projects(id) on delete cascade not null,
    insight_type text not null, -- participation_imbalance, knowledge_silo, etc.
    title text not null,
    summary text not null,
    severity text default 'info',
    confidence numeric(4,2) default 1.0,
    status text default 'active',
    data jsonb default '{}'::jsonb,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

create table if not exists public.insight_evidence (
    id text primary key default uuid_generate_v4()::text,
    insight_id text references public.insights(id) on delete cascade not null,
    source_type text not null,
    source_id text not null,
    description text not null,
    metric text,
    value numeric(10,2),
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- ------------------------------------------------------------------------------
-- RECOMMENDATIONS (Phase 13)
-- ------------------------------------------------------------------------------
create table if not exists public.recommendations (
    id text primary key default uuid_generate_v4()::text,
    project_id text references public.projects(id) on delete cascade not null,
    insight_id text references public.insights(id) on delete set null,
    type text not null,
    title text not null,
    reason text not null,
    goal text,
    priority text default 'medium',
    confidence numeric(4,2) default 1.0,
    status text default 'pending',
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);
alter table public.activities add column if not exists recommended_by text references public.recommendations(id) on delete set null;

create table if not exists public.recommendation_participants (
    id text primary key default uuid_generate_v4()::text,
    recommendation_id text references public.recommendations(id) on delete cascade not null,
    user_id text references public.profiles(id) on delete cascade not null,
    role text,
    unique(recommendation_id, user_id)
);

create table if not exists public.recommendation_sources (
    id text primary key default uuid_generate_v4()::text,
    recommendation_id text references public.recommendations(id) on delete cascade not null,
    source_type text not null,
    source_id text not null,
    reason text
);

-- ------------------------------------------------------------------------------
-- BLUEPRINT PERSISTENCE (Phase 16)
-- ------------------------------------------------------------------------------
create table if not exists public.blueprints (
    id text primary key default uuid_generate_v4()::text,
    project_id text references public.projects(id) on delete cascade not null,
    title text not null,
    summary text not null,
    problem_statement text,
    agreed_consensus jsonb default '[]'::jsonb,
    unresolved_risks jsonb default '[]'::jsonb,
    action_plan jsonb default '[]'::jsonb,
    expected_measurable_changes jsonb default '[]'::jsonb,
    status text default 'draft',
    version integer default 1,
    generated_by text references public.profiles(id) on delete set null,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

create table if not exists public.blueprint_modules (
    id text primary key default uuid_generate_v4()::text,
    blueprint_id text references public.blueprints(id) on delete cascade not null,
    title text not null,
    description text not null,
    owner_id text references public.profiles(id) on delete set null,
    status text default 'in_progress',
    deliverables jsonb default '[]'::jsonb,
    source_type text,
    source_id text,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);
alter table public.blueprints add column if not exists problem_statement text;
alter table public.blueprints add column if not exists agreed_consensus jsonb default '[]'::jsonb;
alter table public.blueprints add column if not exists unresolved_risks jsonb default '[]'::jsonb;
alter table public.blueprints add column if not exists action_plan jsonb default '[]'::jsonb;
alter table public.blueprints add column if not exists expected_measurable_changes jsonb default '[]'::jsonb;
alter table public.blueprint_modules add column if not exists deliverables jsonb default '[]'::jsonb;
alter table public.blueprint_modules add column if not exists source_type text;
alter table public.blueprint_modules add column if not exists source_id text;

create table if not exists public.blueprint_sources (
    id text primary key default uuid_generate_v4()::text,
    blueprint_id text references public.blueprints(id) on delete cascade not null,
    module_id text references public.blueprint_modules(id) on delete cascade,
    source_type text not null,
    source_id text not null,
    relationship text,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- ------------------------------------------------------------------------------
-- IMPACT ANALYSIS (Phase 15)
-- ------------------------------------------------------------------------------
create table if not exists public.analysis_snapshots (
    id text primary key default uuid_generate_v4()::text,
    project_id text references public.projects(id) on delete cascade not null,
    analysis_type text not null,
    data jsonb not null,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- ------------------------------------------------------------------------------
-- NEW RLS POLICIES (Phase 20)
-- ------------------------------------------------------------------------------
alter table public.discussion_messages enable row level security;
alter table public.discussion_viewpoints enable row level security;
alter table public.discussion_decisions enable row level security;
alter table public.activity_participants enable row level security;
alter table public.activity_outcomes enable row level security;
alter table public.contributions enable row level security;
alter table public.knowledge_nodes enable row level security;
alter table public.knowledge_edges enable row level security;
alter table public.insights enable row level security;
alter table public.insight_evidence enable row level security;
alter table public.recommendations enable row level security;
alter table public.recommendation_participants enable row level security;
alter table public.recommendation_sources enable row level security;
alter table public.blueprints enable row level security;
alter table public.blueprint_modules enable row level security;
alter table public.blueprint_sources enable row level security;
alter table public.analysis_snapshots add column if not exists activity_id text references public.activities(id) on delete cascade;
create index if not exists idx_activity_outcomes_activity on public.activity_outcomes(activity_id);

create or replace function public.is_project_member(target_project_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.project_members pm
        where pm.project_id = target_project_id
          and pm.user_id = (select auth.uid()::text)
    ) or exists (
        select 1
        from public.projects p
        where p.id = target_project_id
          and p.owner_id = (select auth.uid()::text)
    );
$$;

do $$
declare
    target_table text;
    target_policy text;
begin
    foreach target_table in array array[
        'profiles', 'projects', 'project_members', 'tasks', 'discussions',
        'discussion_comments', 'discussion_votes', 'documents', 'activities',
        'intelligence_insights', 'discussion_messages', 'discussion_viewpoints',
        'discussion_decisions', 'activity_participants', 'activity_outcomes',
        'contributions', 'knowledge_nodes', 'knowledge_edges', 'insights',
        'insight_evidence', 'recommendations', 'recommendation_participants',
        'recommendation_sources', 'blueprints', 'blueprint_modules',
        'blueprint_sources', 'analysis_snapshots', 'document_chunks'
    ] loop
        if to_regclass(format('public.%I', target_table)) is not null then
            execute format('alter table public.%I enable row level security', target_table);
            for target_policy in
                select policyname from pg_policies
                where schemaname = 'public' and tablename = target_table
            loop
                execute format('drop policy %I on public.%I', target_policy, target_table);
            end loop;
        end if;
    end loop;
end;
$$;

create policy "profile_read_shared_projects" on public.profiles
for select to authenticated
using (
    id = (select auth.uid()::text)
    or exists (
        select 1 from public.project_members pm
        where pm.user_id = profiles.id
          and public.is_project_member(pm.project_id)
    )
);
create policy "profile_insert_self" on public.profiles
for insert to authenticated
with check (id = (select auth.uid()::text));
create policy "profile_update_self" on public.profiles
for update to authenticated
using (id = (select auth.uid()::text))
with check (id = (select auth.uid()::text));

create policy "project_members_read_member" on public.projects
for select to authenticated
using (public.is_project_member(id));
create policy "project_create_as_owner" on public.projects
for insert to authenticated
with check (owner_id = (select auth.uid()::text));
create policy "project_update_as_owner" on public.projects
for update to authenticated
using (owner_id = (select auth.uid()::text))
with check (owner_id = (select auth.uid()::text));
create policy "project_delete_as_owner" on public.projects
for delete to authenticated
using (owner_id = (select auth.uid()::text));

create policy "project_members_read_self_or_member" on public.project_members
for select to authenticated
using (
    user_id = (select auth.uid()::text)
    or public.is_project_member(project_id)
);
create policy "project_members_manage_as_owner" on public.project_members
for all to authenticated
using (
    exists (
        select 1 from public.projects p
        where p.id = project_members.project_id
          and p.owner_id = (select auth.uid()::text)
    )
)
with check (
    exists (
        select 1 from public.projects p
        where p.id = project_members.project_id
          and p.owner_id = (select auth.uid()::text)
    )
);

do $$
declare
    target_table text;
begin
    foreach target_table in array array[
        'tasks', 'discussions', 'documents', 'activities', 'intelligence_insights',
        'contributions', 'knowledge_nodes', 'knowledge_edges', 'insights',
        'recommendations', 'blueprints', 'analysis_snapshots'
    ] loop
        execute format(
            'create policy project_member_access on public.%I for all to authenticated using (public.is_project_member(project_id)) with check (public.is_project_member(project_id))',
            target_table
        );
    end loop;
end;
$$;

create policy "discussion_message_member_access" on public.discussion_messages
for all to authenticated
using (exists (select 1 from public.discussions d where d.id = discussion_id and public.is_project_member(d.project_id)))
with check (exists (select 1 from public.discussions d where d.id = discussion_id and public.is_project_member(d.project_id)));
create policy "discussion_viewpoint_member_access" on public.discussion_viewpoints
for all to authenticated
using (exists (select 1 from public.discussions d where d.id = discussion_id and public.is_project_member(d.project_id)))
with check (exists (select 1 from public.discussions d where d.id = discussion_id and public.is_project_member(d.project_id)));
create policy "discussion_decision_member_access" on public.discussion_decisions
for all to authenticated
using (exists (select 1 from public.discussions d where d.id = discussion_id and public.is_project_member(d.project_id)))
with check (exists (select 1 from public.discussions d where d.id = discussion_id and public.is_project_member(d.project_id)));
create policy "discussion_comment_member_access" on public.discussion_comments
for all to authenticated
using (exists (select 1 from public.discussions d where d.id = discussion_id and public.is_project_member(d.project_id)))
with check (exists (select 1 from public.discussions d where d.id = discussion_id and public.is_project_member(d.project_id)));
create policy "discussion_vote_member_access" on public.discussion_votes
for all to authenticated
using (
    user_id = (select auth.uid()::text)
    and exists (select 1 from public.discussions d where d.id = discussion_id and public.is_project_member(d.project_id))
)
with check (
    user_id = (select auth.uid()::text)
    and exists (select 1 from public.discussions d where d.id = discussion_id and public.is_project_member(d.project_id))
);
create policy "activity_participant_member_access" on public.activity_participants
for all to authenticated
using (exists (select 1 from public.activities a where a.id = activity_id and public.is_project_member(a.project_id)))
with check (exists (select 1 from public.activities a where a.id = activity_id and public.is_project_member(a.project_id)));
create policy "activity_outcome_member_access" on public.activity_outcomes
for all to authenticated
using (exists (select 1 from public.activities a where a.id = activity_id and public.is_project_member(a.project_id)))
with check (exists (select 1 from public.activities a where a.id = activity_id and public.is_project_member(a.project_id)));
create policy "insight_evidence_member_access" on public.insight_evidence
for all to authenticated
using (exists (select 1 from public.insights i where i.id = insight_id and public.is_project_member(i.project_id)))
with check (exists (select 1 from public.insights i where i.id = insight_id and public.is_project_member(i.project_id)));
create policy "recommendation_participant_member_access" on public.recommendation_participants
for all to authenticated
using (exists (select 1 from public.recommendations r where r.id = recommendation_id and public.is_project_member(r.project_id)))
with check (exists (select 1 from public.recommendations r where r.id = recommendation_id and public.is_project_member(r.project_id)));
create policy "recommendation_source_member_access" on public.recommendation_sources
for all to authenticated
using (exists (select 1 from public.recommendations r where r.id = recommendation_id and public.is_project_member(r.project_id)))
with check (exists (select 1 from public.recommendations r where r.id = recommendation_id and public.is_project_member(r.project_id)));
create policy "blueprint_module_member_access" on public.blueprint_modules
for all to authenticated
using (exists (select 1 from public.blueprints b where b.id = blueprint_id and public.is_project_member(b.project_id)))
with check (exists (select 1 from public.blueprints b where b.id = blueprint_id and public.is_project_member(b.project_id)));
create policy "blueprint_source_member_access" on public.blueprint_sources
for all to authenticated
using (exists (select 1 from public.blueprints b where b.id = blueprint_id and public.is_project_member(b.project_id)))
with check (exists (select 1 from public.blueprints b where b.id = blueprint_id and public.is_project_member(b.project_id)));

-- ------------------------------------------------------------------------------
-- PERFORMANCE INDEXES (All Core & Intelligence Tables)
-- ------------------------------------------------------------------------------
create index if not exists idx_discussion_messages_discussion on public.discussion_messages(discussion_id);
create index if not exists idx_discussion_messages_author on public.discussion_messages(author_id);
create index if not exists idx_discussion_viewpoints_discussion on public.discussion_viewpoints(discussion_id);
create index if not exists idx_discussion_viewpoints_author on public.discussion_viewpoints(author_id);
create index if not exists idx_discussion_decisions_discussion on public.discussion_decisions(discussion_id);
create index if not exists idx_discussion_votes_discussion on public.discussion_votes(discussion_id);
create index if not exists idx_discussion_votes_user on public.discussion_votes(user_id);
create index if not exists idx_activity_participants_activity on public.activity_participants(activity_id);
create index if not exists idx_activity_participants_user on public.activity_participants(user_id);
create index if not exists idx_activity_outcomes_activity on public.activity_outcomes(activity_id);
create index if not exists idx_contributions_project on public.contributions(project_id);
create index if not exists idx_contributions_user on public.contributions(user_id);
create index if not exists idx_contributions_entity on public.contributions(entity_type, entity_id);
create index if not exists idx_knowledge_nodes_project on public.knowledge_nodes(project_id);
create index if not exists idx_knowledge_nodes_type_label on public.knowledge_nodes(node_type, label);
create index if not exists idx_knowledge_edges_project on public.knowledge_edges(project_id);
create index if not exists idx_knowledge_edges_source on public.knowledge_edges(source_node_id);
create index if not exists idx_knowledge_edges_target on public.knowledge_edges(target_node_id);
create index if not exists idx_knowledge_edges_type on public.knowledge_edges(edge_type);
create index if not exists idx_insights_project on public.insights(project_id);
create index if not exists idx_insight_evidence_insight on public.insight_evidence(insight_id);
create index if not exists idx_recommendations_project on public.recommendations(project_id);
create index if not exists idx_recommendations_insight on public.recommendations(insight_id);
create index if not exists idx_rec_participants_rec on public.recommendation_participants(recommendation_id);
create index if not exists idx_rec_participants_user on public.recommendation_participants(user_id);
create index if not exists idx_rec_sources_rec on public.recommendation_sources(recommendation_id);
create index if not exists idx_blueprints_project on public.blueprints(project_id);
create index if not exists idx_blueprint_modules_bp on public.blueprint_modules(blueprint_id);
create index if not exists idx_blueprint_modules_owner on public.blueprint_modules(owner_id);
create index if not exists idx_blueprint_sources_bp on public.blueprint_sources(blueprint_id);
create index if not exists idx_blueprint_sources_module on public.blueprint_sources(module_id);
create index if not exists idx_analysis_snapshots_project on public.analysis_snapshots(project_id);

