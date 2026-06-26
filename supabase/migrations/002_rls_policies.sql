create or replace function public.current_role()
returns public.user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_role() = 'admin', false)
$$;

create or replace function public.is_teacher()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_role() = 'teacher', false)
$$;

create or replace function public.teacher_owns_class(target_class_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.classes c
    where c.id = target_class_id and c.teacher_id = auth.uid()
  )
$$;

create or replace function public.teacher_owns_assessment(target_assessment_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.assessments a
    join public.classes c on c.id = a.class_id
    where a.id = target_assessment_id and c.teacher_id = auth.uid()
  )
$$;

create or replace function public.student_in_class(target_class_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.enrollments e
    where e.class_id = target_class_id and e.student_id = auth.uid()
  )
$$;

create or replace function public.student_can_view_result(target_assessment_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.assessments a
    where a.id = target_assessment_id
      and (
        a.result_release_policy = 'immediate'
        or (a.result_release_policy = 'after_close' and now() >= a.closes_at)
        or (a.result_release_policy = 'teacher_review' and a.results_released_at is not null)
      )
  )
$$;

create or replace function public.get_my_assessment_results(target_assessment_id uuid)
returns table (
  grading_result_id uuid,
  submission_id uuid,
  question_id uuid,
  feedback text,
  strengths text[],
  improvement_points text[],
  misconception_tags text[],
  score numeric,
  max_score numeric,
  is_correct boolean,
  released_kind text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    gr.id,
    s.id,
    s.question_id,
    gr.feedback,
    gr.strengths,
    gr.improvement_points,
    gr.misconception_tags,
    case when a.result_release_policy = 'feedback_only_immediate' then null else gr.score end,
    case when a.result_release_policy = 'feedback_only_immediate' then null else gr.max_score end,
    case when a.result_release_policy = 'feedback_only_immediate' then null else gr.is_correct end,
    case when a.result_release_policy = 'feedback_only_immediate' then 'feedback_only' else 'full' end
  from public.grading_results gr
  join public.submissions s on s.id = gr.submission_id
  join public.assessments a on a.id = s.assessment_id
  where s.student_id = auth.uid()
    and s.assessment_id = target_assessment_id
    and (
      a.result_release_policy = 'feedback_only_immediate'
      or public.student_can_view_result(a.id)
    );
$$;

create or replace function public.can_view_activity_link(link_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.assessment_activity_links l
    join public.assessments a on a.id = l.assessment_id
    left join public.submissions s on s.assessment_id = a.id and s.student_id = auth.uid()
    where l.id = link_id
      and public.student_in_class(a.class_id)
      and a.status = 'published'
      and (
        l.release_policy = 'before_assessment'
        or (l.release_policy = 'after_start' and now() >= a.starts_at)
        or (l.release_policy = 'after_submission' and s.id is not null)
        or (l.release_policy = 'manual' and l.is_manually_released)
      )
  )
$$;

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.enrollments enable row level security;
alter table public.curriculum_units enable row level security;
alter table public.achievement_standards enable row level security;
alter table public.assessments enable row level security;
alter table public.assessment_standards enable row level security;
alter table public.questions enable row level security;
alter table public.question_answer_keys enable row level security;
alter table public.submissions enable row level security;
alter table public.grading_results enable row level security;
alter table public.assessment_activity_links enable row level security;
alter table public.ai_generation_logs enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles self admin or class teacher read" on public.profiles for select using (
  id = auth.uid()
  or public.is_admin()
  or exists (
    select 1
    from public.enrollments e
    join public.classes c on c.id = e.class_id
    where e.student_id = profiles.id and c.teacher_id = auth.uid()
  )
);
create policy "profiles self update limited" on public.profiles for update using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
create policy "profiles admin all" on public.profiles for all using (public.is_admin()) with check (public.is_admin());

create policy "classes teacher own read" on public.classes for select using (teacher_id = auth.uid() or public.is_admin() or public.student_in_class(id));
create policy "classes teacher manage own" on public.classes for all using (teacher_id = auth.uid() or public.is_admin()) with check (teacher_id = auth.uid() or public.is_admin());

create policy "enrollments scoped read" on public.enrollments for select using (
  student_id = auth.uid() or public.teacher_owns_class(class_id) or public.is_admin()
);
create policy "enrollments teacher manage" on public.enrollments for all using (
  public.teacher_owns_class(class_id) or public.is_admin()
) with check (
  public.teacher_owns_class(class_id) or public.is_admin()
);

create policy "curriculum teacher read" on public.curriculum_units for select using (teacher_id is null or teacher_id = auth.uid() or public.is_admin());
create policy "curriculum teacher manage" on public.curriculum_units for all using (teacher_id = auth.uid() or public.is_admin()) with check (teacher_id = auth.uid() or public.is_admin());

create policy "standards teacher read" on public.achievement_standards for select using (teacher_id is null or teacher_id = auth.uid() or public.is_admin());
create policy "standards teacher manage" on public.achievement_standards for all using (teacher_id = auth.uid() or public.is_admin()) with check (teacher_id = auth.uid() or public.is_admin());

create policy "assessments scoped read" on public.assessments for select using (
  public.is_admin()
  or public.teacher_owns_class(class_id)
  or (public.student_in_class(class_id) and status = 'published' and now() between starts_at and closes_at)
);
create policy "assessments teacher manage" on public.assessments for all using (
  public.teacher_owns_class(class_id) or public.is_admin()
) with check (
  public.teacher_owns_class(class_id) or public.is_admin()
);

create policy "assessment standards scoped read" on public.assessment_standards for select using (
  public.is_admin() or public.teacher_owns_assessment(assessment_id) or exists (
    select 1 from public.assessments a
    where a.id = assessment_id and public.student_in_class(a.class_id) and a.status = 'published'
  )
);
create policy "assessment standards teacher manage" on public.assessment_standards for all using (
  public.teacher_owns_assessment(assessment_id) or public.is_admin()
) with check (
  public.teacher_owns_assessment(assessment_id) or public.is_admin()
);

create policy "questions scoped read" on public.questions for select using (
  public.is_admin()
  or public.teacher_owns_assessment(assessment_id)
  or exists (
    select 1 from public.assessments a
    where a.id = assessment_id
      and public.student_in_class(a.class_id)
      and a.status = 'published'
      and questions.status = 'approved'
      and now() between a.starts_at and a.closes_at
  )
);
create policy "questions teacher manage" on public.questions for all using (
  public.teacher_owns_assessment(assessment_id) or public.is_admin()
) with check (
  public.teacher_owns_assessment(assessment_id) or public.is_admin()
);

create policy "answer keys teacher server only" on public.question_answer_keys for all using (
  public.is_admin() or exists (
    select 1 from public.questions q
    where q.id = question_id and public.teacher_owns_assessment(q.assessment_id)
  )
) with check (
  public.is_admin() or exists (
    select 1 from public.questions q
    where q.id = question_id and public.teacher_owns_assessment(q.assessment_id)
  )
);

create policy "submissions self or teacher read" on public.submissions for select using (
  student_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1 from public.assessments a
    where a.id = assessment_id and public.teacher_owns_class(a.class_id)
  )
);
create policy "submissions student insert own" on public.submissions for insert with check (
  student_id = auth.uid()
  and exists (
    select 1 from public.assessments a
    where a.id = assessment_id and public.student_in_class(a.class_id) and a.status = 'published' and now() between a.starts_at and a.closes_at
  )
);
create policy "submissions teacher update" on public.submissions for update using (
  public.is_admin() or exists (
    select 1 from public.assessments a
    where a.id = assessment_id and public.teacher_owns_class(a.class_id)
  )
);

create policy "grading scoped read" on public.grading_results for select using (
  public.is_admin()
  or exists (
    select 1 from public.submissions s
    join public.assessments a on a.id = s.assessment_id
    where s.id = submission_id and public.teacher_owns_class(a.class_id)
  )
  or exists (
    select 1 from public.submissions s
    where s.id = submission_id and s.student_id = auth.uid() and public.student_can_view_result(s.assessment_id)
  )
);
create policy "grading teacher manage" on public.grading_results for all using (
  public.is_admin() or exists (
    select 1 from public.submissions s
    join public.assessments a on a.id = s.assessment_id
    where s.id = submission_id and public.teacher_owns_class(a.class_id)
  )
) with check (
  public.is_admin() or exists (
    select 1 from public.submissions s
    join public.assessments a on a.id = s.assessment_id
    where s.id = submission_id and public.teacher_owns_class(a.class_id)
  )
);

create policy "activity scoped read" on public.assessment_activity_links for select using (
  public.is_admin()
  or public.teacher_owns_assessment(assessment_id)
  or public.can_view_activity_link(id)
);
create policy "activity teacher manage" on public.assessment_activity_links for all using (
  public.teacher_owns_assessment(assessment_id) or public.is_admin()
) with check (
  public.teacher_owns_assessment(assessment_id) or public.is_admin()
);

create policy "ai logs teacher read" on public.ai_generation_logs for select using (teacher_id = auth.uid() or public.is_admin());
create policy "ai logs teacher insert" on public.ai_generation_logs for insert with check (teacher_id = auth.uid() or public.is_admin());

create policy "audit admin teacher scoped read" on public.audit_logs for select using (
  public.is_admin() or actor_id = auth.uid()
);
create policy "audit insert authenticated" on public.audit_logs for insert with check (auth.uid() is not null);
