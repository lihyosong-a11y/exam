import { ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

export function SetupNotice() {
  return (
    <section className="rounded border border-gold/40 bg-white p-6 shadow-soft">
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-1 text-gold" aria-hidden="true" />
        <div>
          <h2 className="text-lg font-semibold">Supabase 연결이 필요합니다</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            `.env.local`에 `VITE_SUPABASE_URL`과 `VITE_SUPABASE_PUBLISHABLE_KEY`를 설정하면 로그인과 데이터 조회가 활성화됩니다.
            service role key와 AI API key는 프런트엔드가 아니라 Supabase Edge Function Secrets에만 등록하세요.
          </p>
          <Link className="focus-ring mt-4 inline-flex rounded bg-forest px-4 py-2 text-sm font-medium text-white" to="/login">
            데모 로그인으로 둘러보기
          </Link>
        </div>
      </div>
    </section>
  );
}
