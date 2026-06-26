import { PageHeader } from "../components/PageHeader";
import { MetricCard } from "../components/MetricCard";
import { demoAssessments, pendingReviews, standards, teacherMetrics } from "../data/demo";

export function TeacherDashboardPage() {
  return (
    <section>
      <PageHeader title="교사 대시보드" description="담당 학급, 평가 공개 상태, 제출 현황, 성취기준별 피드백 흐름을 한곳에서 확인합니다." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {teacherMetrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded border border-line bg-white p-5 shadow-soft">
          <h3 className="font-semibold">재지도가 필요한 성취기준</h3>
          <div className="mt-4 space-y-3">
            {standards.map((standard) => (
              <div className="rounded border border-line p-3" key={standard.code}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{standard.name}</p>
                  <span className="text-sm text-slate-500">{standard.average}점</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {standard.code} · 재지도 필요 {standard.needsSupport}명
                </p>
              </div>
            ))}
          </div>
        </article>
        <article className="rounded border border-line bg-white p-5 shadow-soft">
          <h3 className="font-semibold">최근 AI 채점 검토</h3>
          <div className="mt-4 space-y-3">
            {pendingReviews.map((review) => (
              <div className="rounded border border-line p-3" key={`${review.student}-${review.assessment}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{review.student}</p>
                  <span className="text-sm text-coral">신뢰도 {review.confidence}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {review.assessment} · {review.reason}
                </p>
              </div>
            ))}
          </div>
        </article>
      </div>
      <div className="mt-6 rounded border border-line bg-white p-5 shadow-soft">
        <h3 className="font-semibold">진행 중인 평가</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="py-2 pr-4">평가</th>
                <th className="py-2 pr-4">학급</th>
                <th className="py-2 pr-4">제출</th>
                <th className="py-2 pr-4">평균</th>
                <th className="py-2 pr-4">공개</th>
              </tr>
            </thead>
            <tbody>
              {demoAssessments.map((assessment) => (
                <tr className="border-b border-line" key={assessment.id}>
                  <td className="py-2 pr-4 font-medium">{assessment.title}</td>
                  <td className="py-2 pr-4">{assessment.className}</td>
                  <td className="py-2 pr-4">
                    {assessment.submitted}/{assessment.total}명
                  </td>
                  <td className="py-2 pr-4">{assessment.averageScore}점</td>
                  <td className="py-2 pr-4">{assessment.releasePolicyLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
