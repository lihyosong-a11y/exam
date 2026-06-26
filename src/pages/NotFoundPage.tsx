import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4">
      <section className="rounded border border-line bg-white p-6 text-center shadow-soft">
        <h1 className="text-xl font-semibold">페이지를 찾을 수 없습니다</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">QR 주소가 바뀌었거나 잘못 입력되었을 수 있습니다. 홈 화면에서 다시 시작해 주세요.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link className="focus-ring rounded bg-forest px-4 py-2 text-sm font-medium text-white" to="/">
            홈으로
          </Link>
          <Link className="focus-ring rounded border border-line bg-white px-4 py-2 text-sm font-medium" to="/login">
            로그인
          </Link>
        </div>
      </section>
    </main>
  );
}
