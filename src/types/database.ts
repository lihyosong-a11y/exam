import type { UserRole } from "./domain";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          display_name: string;
          student_login_id: string | null;
          must_change_password: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string; role: UserRole; display_name: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      classes: {
        Row: {
          id: string;
          teacher_id: string;
          name: string;
          subject: string;
          grade_level: string;
          school_year: number;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["classes"]["Row"]> & {
          teacher_id: string;
          name: string;
          subject: string;
          grade_level: string;
          school_year: number;
        };
        Update: Partial<Database["public"]["Tables"]["classes"]["Row"]>;
      };
      assessments: {
        Row: {
          id: string;
          class_id: string;
          title: string;
          assessment_type: string;
          starts_at: string;
          closes_at: string;
          status: string;
          result_release_policy: string;
          allow_retake: boolean;
          results_released_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["assessments"]["Row"]> & {
          class_id: string;
          title: string;
          assessment_type: string;
          starts_at: string;
          closes_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["assessments"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
