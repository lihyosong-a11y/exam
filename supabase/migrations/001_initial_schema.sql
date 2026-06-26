create extension if not exists "pgcrypto";

create type public.user_role as enum ('admin', 'teacher', 'student');
create type public.assessment_type as enum ('diagnostic', 'formative');
create type public.assessment_status as enum ('draft', 'published', 'closed', 'archived');
create type public.question_type as enum ('multiple_choice', 'true_false', 'short_answer', 'numeric', 'short_essay', 'extended_essay');
create type public.question_status as enum ('draft', 'reviewed', 'approved', 'archived');
create type public.result_release_policy as enum ('immediate', 'after_close', 'teacher_review', 'feedback_only_immediate');
create type public.grading_mode as enum ('rule_based', 'ai_rubric', 'teacher_review');
create type public.grading_status as enum ('pending', 'graded', 'needs_teacher_review', 'released');
create type public.activity_release_policy as enum ('before_assessment', 'after_start', 'after_submission', 'manual');
create type public.activity_open_mode as enum ('new_tab', 'same_tab');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null,
  display_name text not null check (char_length(display_name) between 1 and 80),
  student_login_id text unique,
  must_change_password boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (role = 'student' and student_login_id is not null)
    or (role <> 'student')
  )
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete restrict,
  name text not null check (char_length(name) between 1 and 100),
  subject text not null check (char_length(subject) between 1 and 80),
  grade_level text not null check (char_length(grade_level) between 1 and 40),
  school_year integer not null check (school_year between 2000 and 2100),
  description text check (char_length(coalesce(description, '')) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  student_email text,
  note text check (char_length(coalesce(note, '')) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_id, student_id)
);

create table public.curriculum_units (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id) on delete cascade,
  subject text not null,
  grade_level text not null,
  unit_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.achievement_standards (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid references public.curriculum_units(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  subject text not null,
  grade_level text not null,
  unit_name text not null,
  code text not null,
  content text not null,
  key_concepts text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (teacher_id, code)
);

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  assessment_type public.assessment_type not null,
  lesson_date date,
  starts_at timestamptz not null,
  closes_at timestamptz not null,
  status public.assessment_status not null default 'draft',
  result_release_policy public.result_release_policy not null default 'teacher_review',
  allow_retake boolean not null default false,
  allow_edit_after_submit boolean not null default false,
  use_ai_grading boolean not null default false,
  results_released_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (closes_at > starts_at)
);

create table public.assessment_standards (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  achievement_standard_id uuid not null references public.achievement_standards(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assessment_id, achievement_standard_id)
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  achievement_standard_id uuid references public.achievement_standards(id) on delete set null,
  question_text text not null check (char_length(question_text) between 1 and 5000),
  question_type public.question_type not null,
  options jsonb not null default '[]'::jsonb,
  points numeric(6,2) not null default 1 check (points > 0),
  difficulty text not null check (difficulty in ('하', '중', '상')),
  status public.question_status not null default 'draft',
  is_ai_generated boolean not null default false,
  teacher_review_notes text check (char_length(coalesce(teacher_review_notes, '')) <= 1000),
  display_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.question_answer_keys (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null unique references public.questions(id) on delete cascade,
  correct_answer jsonb not null,
  explanation text check (char_length(coalesce(explanation, '')) <= 5000),
  rubric jsonb not null default '{}'::jsonb,
  grading_settings jsonb not null default '{}'::jsonb,
  common_misconceptions text[] not null default '{}',
  model_answer text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  answer text not null check (char_length(answer) <= 5000),
  attempt_number integer not null default 1,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (question_id, student_id, attempt_number)
);

create table public.grading_results (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique references public.submissions(id) on delete cascade,
  mode public.grading_mode not null,
  status public.grading_status not null default 'pending',
  score numeric(6,2) not null default 0,
  max_score numeric(6,2) not null,
  is_correct boolean,
  feedback text check (char_length(coalesce(feedback, '')) <= 5000),
  strengths text[] not null default '{}',
  improvement_points text[] not null default '{}',
  misconception_tags text[] not null default '{}',
  confidence numeric(4,3) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  requires_teacher_review boolean not null default false,
  teacher_override_by uuid references public.profiles(id) on delete set null,
  released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assessment_activity_links (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  provider text not null default 'snorkl' check (provider = 'snorkl'),
  title text not null check (char_length(title) between 1 and 120),
  url text not null check (lower(url) ~ '^https://([a-z0-9-]+\.)*(snorkl\.app|snorkl\.com)([:/]|$)'),
  instructions text check (char_length(coalesce(instructions, '')) <= 500),
  purpose text check (char_length(coalesce(purpose, '')) <= 500),
  achievement_standard_id uuid references public.achievement_standards(id) on delete set null,
  release_policy public.activity_release_policy not null default 'manual',
  is_manually_released boolean not null default false,
  open_mode public.activity_open_mode not null default 'new_tab',
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_generation_logs (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  assessment_id uuid references public.assessments(id) on delete set null,
  provider text not null,
  model text,
  request_summary jsonb not null default '{}'::jsonb,
  generated_count integer not null default 0,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_role public.user_role,
  action text not null,
  target_type text not null,
  target_id uuid,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.classes (teacher_id);
create index on public.enrollments (class_id, student_id);
create index on public.assessments (class_id, status, starts_at, closes_at);
create index on public.questions (assessment_id, status);
create index on public.submissions (student_id, assessment_id);
create index on public.grading_results (status, requires_teacher_review);
create index on public.audit_logs (actor_id, created_at desc);

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger classes_updated_at before update on public.classes for each row execute function public.set_updated_at();
create trigger enrollments_updated_at before update on public.enrollments for each row execute function public.set_updated_at();
create trigger curriculum_units_updated_at before update on public.curriculum_units for each row execute function public.set_updated_at();
create trigger achievement_standards_updated_at before update on public.achievement_standards for each row execute function public.set_updated_at();
create trigger assessments_updated_at before update on public.assessments for each row execute function public.set_updated_at();
create trigger assessment_standards_updated_at before update on public.assessment_standards for each row execute function public.set_updated_at();
create trigger questions_updated_at before update on public.questions for each row execute function public.set_updated_at();
create trigger question_answer_keys_updated_at before update on public.question_answer_keys for each row execute function public.set_updated_at();
create trigger submissions_updated_at before update on public.submissions for each row execute function public.set_updated_at();
create trigger grading_results_updated_at before update on public.grading_results for each row execute function public.set_updated_at();
create trigger assessment_activity_links_updated_at before update on public.assessment_activity_links for each row execute function public.set_updated_at();
create trigger ai_generation_logs_updated_at before update on public.ai_generation_logs for each row execute function public.set_updated_at();
create trigger audit_logs_updated_at before update on public.audit_logs for each row execute function public.set_updated_at();

insert into public.curriculum_units (subject, grade_level, unit_name)
values ('통합과학', '고1', '역학과 에너지'), ('물리학', '고2', '힘과 운동');

insert into public.achievement_standards (subject, grade_level, unit_name, code, content, key_concepts)
values
  ('통합과학', '고1', '역학과 에너지', 'SCI-10-01', '운동과 에너지 전환을 관찰하고 설명할 수 있다.', array['운동', '에너지 전환']),
  ('물리학', '고2', '힘과 운동', 'PHY-11-01', '힘과 운동의 관계를 정성적으로 설명할 수 있다.', array['힘', '가속도', '운동']);
