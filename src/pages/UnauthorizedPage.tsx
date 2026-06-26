export function UnauthorizedPage() {
  return (
    <section className="rounded border border-line bg-white p-6 shadow-soft">
      <h2 className="text-xl font-semibold">접근 권한이 없습니다</h2>
      <p className="mt-2 text-sm text-slate-600">현재 계정으로 사용할 수 없는 화면입니다.</p>
    </section>
  );
}
