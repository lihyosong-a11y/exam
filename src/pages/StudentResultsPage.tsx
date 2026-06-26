import { PageHeader } from "../components/PageHeader";
import { demoResult } from "../data/demo";

export function StudentResultsPage() {
  return (
    <section>
      <PageHeader title="내 결과" description="결과 공개 정책이 허용하는 범위 안에서 내 제출과 피드백만 표시합니다." />
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <article className="rounded border border-line bg-white p-5 shadow-soft">
          <p className="text-sm text-slate-500">{demoResult.title}</p>
          <p className="mt-3 text-3xl font-semibold">
            {demoResult.score}/{demoResult.maxScore}점
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">{demoResult.feedback}</p>
        </article>
        <article className="rounded border border-line bg-white p-5 shadow-soft">
          <h3 className="font-semibold">문항별 피드백</h3>
          <div className="mt-4 space-y-3">
            {demoResult.items.map((item) => (
              <div className="rounded border border-line p-3" key={item.question}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{item.question}</p>
                  <span className="text-sm text-slate-500">
                    {item.status} · {item.points}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.feedback}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
