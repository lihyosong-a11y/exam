import type { DashboardMetric } from "../types/domain";

export function MetricCard({ metric }: { metric: DashboardMetric }) {
  return (
    <article className="rounded border border-line bg-white p-4 shadow-soft">
      <p className="text-sm text-slate-500">{metric.label}</p>
      <p className="mt-2 text-2xl font-semibold">{metric.value}</p>
      <p className="mt-1 text-sm text-slate-600">{metric.detail}</p>
    </article>
  );
}
