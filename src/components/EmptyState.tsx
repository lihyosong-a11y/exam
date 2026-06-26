export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded border border-dashed border-line bg-white p-6 text-center">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </div>
  );
}
