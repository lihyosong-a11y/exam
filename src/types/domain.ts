export type UserRole = "admin" | "teacher" | "student";

export type AssessmentType = "diagnostic" | "formative";

export type QuestionType =
  | "multiple_choice"
  | "true_false"
  | "short_answer"
  | "numeric"
  | "short_essay"
  | "extended_essay";

export type ResultReleasePolicy =
  | "immediate"
  | "after_close"
  | "teacher_review"
  | "feedback_only_immediate";

export type QuestionStatus = "draft" | "reviewed" | "approved" | "archived";

export interface Profile {
  id: string;
  role: UserRole;
  display_name: string;
  student_login_id: string | null;
  must_change_password: boolean;
}

export interface DashboardMetric {
  label: string;
  value: string;
  detail: string;
}
