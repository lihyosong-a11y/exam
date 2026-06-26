import { Download } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { MetricCard } from "../components/MetricCard";
import { demoAssessments, standards } from "../data/demo";

const totalStudents = demoAssessments[0]?.total ?? 0;
const submittedStudents = demoAssessments[0]?.submitted ?? 0;
const averageScore = demoAssessments[0]?.averageScore ?? 0;
const supportNeeded = standards.reduce((sum, standard) => sum + standard.needsSupport, 0);

export function AnalyticsPage() {
  return (
    <section>
      <PageHeader
        title="교사 분석"
        description="담당 학급과 평가에 한정해 제출률, 문항별 정답률, 오개념 태그, 성취기준별 평균을 확인합니다."
        actions={
          <button className="focus-ring inline-flex items-center gap-2 rounded border border-line bg-white px-3 py-2 text-sm" type="button">
            <Download aria-hidden="true" size={16} />
            최소 정보 CSV 다운로드
          </button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard metric={{ label: "전체 학생", value: `${totalStudents}명`, detail: "선택한 학급 기준" }} />
        <MetricCard metric={{ label: "제출 완료", value: `${submittedStudents}명`, detail: "평가별 제출 상태" }} />
        <MetricCard metric={{ label: "평균 점수", value: `${averageScore}점`, detail: "최종 채점 결과 기준" }} />
        <MetricCard metric={{ label: "재지도 필요", value: `${supportNeeded}명`, detail: "성취기준 기준선 이하 누적" }} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded border border-line bg-white p-5 shadow-soft">
          <h3 className="font-semibold">성취기준별 평균</h3>
          <div className="mt-4 space-y-4">
            {standards.map((standard) => (
              <div key={standard.code}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span>{standard.name}</span>
                  <span>{standard.average}점</span>
                </div>
                <div className="mt-2 h-2 rounded bg-slate-100">
                  <div className="h-2 rounded bg-forest" style={{ width: `${standard.average}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>
        <article className="rounded border border-line bg-white p-5 shadow-soft">
          <h3 className="font-semibold">학생 간 순위표는 표시하지 않습니다</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            분석 화면은 교사의 피드백과 재지도 결정을 돕는 정보만 제공합니다. CSV 다운로드도 이름, 평가 ID, 점수, 피드백 상태처럼 필요한 최소 항목으로 제한합니다.
          </p>
        </article>
      </div>
    </section>
  );
}
