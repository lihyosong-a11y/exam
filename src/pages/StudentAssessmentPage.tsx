import { FormEvent, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { demoAssessments, demoQuestions } from "../data/demo";

export function StudentAssessmentPage() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const assessment = useMemo(() => demoAssessments.find((item) => item.id === assessmentId) ?? demoAssessments[0], [assessmentId]);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const unansweredCount = demoQuestions.filter((question) => !answers[question.id]?.trim()).length;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (unansweredCount > 0 && !window.confirm(`미응답 문항이 ${unansweredCount}개 있습니다. 제출할까요?`)) return;
    navigate(`/student/results/${assessment.id}`);
  }

  return (
    <section>
      <PageHeader title={assessment.title} description={`${assessment.subject} · ${assessment.dueLabel} · 최종 제출 전 미응답 문항을 확인합니다.`} />
      <form className="space-y-4" onSubmit={onSubmit}>
        {demoQuestions.map((question, index) => (
          <article className="rounded border border-line bg-white p-5 shadow-soft" key={question.id}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
              <span>문항 {index + 1} / {demoQuestions.length}</span>
              <span>{question.points}점 · {question.standard}</span>
            </div>
            <p className="font-medium leading-7">{question.prompt}</p>
            {question.options ? (
              <div className="mt-4 grid gap-2">
                {question.options.map((option) => (
                  <label className="flex cursor-pointer items-center gap-2 rounded border border-line px-3 py-2 text-sm hover:bg-slate-50" key={option}>
                    <input
                      name={question.id}
                      type="radio"
                      value={option}
                      checked={answers[question.id] === option}
                      onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
                    />
                    {option}
                  </label>
                ))}
              </div>
            ) : (
              <textarea
                className="focus-ring mt-4 min-h-28 w-full rounded border border-line px-3 py-2"
                maxLength={2000}
                value={answers[question.id] ?? ""}
                onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
              />
            )}
          </article>
        ))}
        <div className="rounded border border-line bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-slate-600">미응답 {unansweredCount}개 · 제출 후에는 교사의 공개 설정에 따라 결과가 표시됩니다.</p>
            <button className="focus-ring rounded bg-forest px-4 py-2 font-medium text-white" type="submit">
              최종 제출
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
