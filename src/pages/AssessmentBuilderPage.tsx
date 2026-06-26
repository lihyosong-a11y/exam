import { FormEvent, useState } from "react";
import { Bot, CheckCircle2, Save } from "lucide-react";
import { z } from "zod";
import { PageHeader } from "../components/PageHeader";
import type { QuestionStatus, QuestionType, ResultReleasePolicy } from "../types/domain";

const schema = z.object({
  title: z.string().trim().min(2).max(120),
  assessmentType: z.enum(["diagnostic", "formative"]),
  questionCount: z.coerce.number().int().min(1).max(10),
  difficulty: z.enum(["하", "중", "상"]),
  questionType: z.enum(["multiple_choice", "true_false", "short_answer", "numeric", "short_essay", "extended_essay"]),
  releasePolicy: z.enum(["immediate", "after_close", "teacher_review", "feedback_only_immediate"]),
});

const questionTypeLabels: Record<QuestionType, string> = {
  multiple_choice: "객관식",
  true_false: "참·거짓",
  short_answer: "단답형",
  numeric: "수치 계산형",
  short_essay: "짧은 서술형",
  extended_essay: "설명형 서술형",
};

const releaseLabels: Record<ResultReleasePolicy, string> = {
  immediate: "제출 즉시 공개",
  after_close: "평가 마감 후 공개",
  teacher_review: "교사 검토 후 공개",
  feedback_only_immediate: "피드백만 즉시 공개",
};

export function AssessmentBuilderPage() {
  const [status, setStatus] = useState<QuestionStatus>("draft");
  const [message, setMessage] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = schema.safeParse({
      title: form.get("title"),
      assessmentType: form.get("assessmentType"),
      questionCount: form.get("questionCount"),
      difficulty: form.get("difficulty"),
      questionType: form.get("questionType"),
      releasePolicy: form.get("releasePolicy"),
    });
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.");
      return;
    }
    setStatus("reviewed");
    setMessage("평가 초안이 저장되었습니다. 모든 문항을 검토하고 승인해야 공개할 수 있습니다.");
  }

  const canPublish = status === "approved";

  return (
    <section>
      <PageHeader
        title="평가 만들기"
        description="진단평가는 3~5문항, 형성평가는 3~10문항을 빠르게 구성하되 모든 문항은 승인 전까지 학생에게 공개되지 않습니다."
      />
      <form className="grid gap-4 rounded border border-line bg-white p-5 shadow-soft lg:grid-cols-2" onSubmit={onSubmit}>
        <label className="block text-sm font-medium">
          평가 제목
          <input className="focus-ring mt-2 w-full rounded border border-line px-3 py-2" name="title" required maxLength={120} />
        </label>
        <label className="block text-sm font-medium">
          평가 유형
          <select className="focus-ring mt-2 w-full rounded border border-line px-3 py-2" name="assessmentType">
            <option value="diagnostic">진단평가</option>
            <option value="formative">형성평가</option>
          </select>
        </label>
        <label className="block text-sm font-medium">
          문항 수
          <input className="focus-ring mt-2 w-full rounded border border-line px-3 py-2" name="questionCount" type="number" min="1" max="10" defaultValue="5" />
        </label>
        <label className="block text-sm font-medium">
          난이도
          <select className="focus-ring mt-2 w-full rounded border border-line px-3 py-2" name="difficulty">
            <option>하</option>
            <option>중</option>
            <option>상</option>
          </select>
        </label>
        <label className="block text-sm font-medium">
          문항 유형
          <select className="focus-ring mt-2 w-full rounded border border-line px-3 py-2" name="questionType">
            {Object.entries(questionTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          결과 공개 방식
          <select className="focus-ring mt-2 w-full rounded border border-line px-3 py-2" name="releasePolicy">
            {Object.entries(releaseLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium lg:col-span-2">
          수업 맥락과 추가 요구 사항
          <textarea className="focus-ring mt-2 min-h-28 w-full rounded border border-line px-3 py-2" maxLength={1000} />
        </label>
        {message ? <p className="rounded bg-forest/10 p-3 text-sm text-forest lg:col-span-2">{message}</p> : null}
        <div className="flex flex-wrap gap-2 lg:col-span-2">
          <button className="focus-ring inline-flex items-center gap-2 rounded bg-forest px-4 py-2 font-medium text-white" type="submit">
            <Save aria-hidden="true" size={18} />
            초안 저장
          </button>
          <button className="focus-ring inline-flex items-center gap-2 rounded border border-line bg-white px-4 py-2 font-medium" type="button">
            <Bot aria-hidden="true" size={18} />
            AI 문항 초안 요청
          </button>
          <button
            className="focus-ring inline-flex items-center gap-2 rounded border border-line bg-white px-4 py-2 font-medium disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            disabled={!canPublish}
          >
            <CheckCircle2 aria-hidden="true" size={18} />
            평가 공개
          </button>
        </div>
        {!canPublish ? (
          <p className="rounded bg-gold/10 p-3 text-sm text-slate-700 lg:col-span-2">
            승인되지 않은 문항이 있어 평가를 공개할 수 없습니다. 모든 문항의 내용, 정답, 해설, 배점, 성취기준을 검토한 뒤 승인해 주세요.
          </p>
        ) : null}
      </form>
    </section>
  );
}
