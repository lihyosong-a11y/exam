import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { MetricCard } from "../components/MetricCard";
import { demoAssessments, studentMetrics } from "../data/demo";

export function StudentDashboardPage() {
  return (
    <section>
      <PageHeader title="내 학습" description="응시 가능한 평가, 제출 완료 상태, 공개된 피드백만 확인합니다. 다른 학생 정보는 표시하지 않습니다." />
      <div className="grid gap-4 md:grid-cols-3">
        {studentMetrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>
      <div className="mt-6 rounded border border-line bg-white p-5 shadow-soft">
        <h3 className="font-semibold">응시 가능한 평가</h3>
        <div className="mt-4 grid gap-3">
          {demoAssessments.map((assessment) => (
            <article className="rounded border border-line p-4" key={assessment.id}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    {assessment.subject} · {assessment.className}
                  </p>
                  <h4 className="mt-1 font-semibold">{assessment.title}</h4>
                  <p className="mt-1 text-sm text-slate-600">
                    {assessment.dueLabel} · {assessment.releasePolicyLabel}
                  </p>
                </div>
                <Link className="focus-ring inline-flex items-center gap-2 rounded bg-forest px-4 py-2 text-sm font-medium text-white" to={`/student/assessments/${assessment.id}`}>
                  응시하기
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="mt-6 rounded border border-line bg-white p-5 shadow-soft">
        <h3 className="font-semibold">공개된 Snorkl 활동</h3>
        <p className="mt-2 text-sm text-slate-600">교사가 공개 시점을 설정한 외부 활동 링크만 표시됩니다.</p>
        <a className="focus-ring mt-4 inline-flex items-center gap-2 rounded border border-line bg-white px-4 py-2 text-sm font-medium" href="https://snorkl.app" rel="noreferrer" target="_blank">
          활동 열기
          <ExternalLink aria-hidden="true" size={16} />
        </a>
      </div>
    </section>
  );
}
