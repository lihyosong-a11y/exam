import { ChangeEvent, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Download, Upload } from "lucide-react";
import { z } from "zod";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";

const studentRowSchema = z.object({
  name: z.string().trim().min(1).max(50),
  student_login_id: z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9._-]+$/),
  email: z.string().email().optional().or(z.literal("")),
  note: z.string().max(200).optional(),
});

type PreviewRow = z.infer<typeof studentRowSchema> & { rowNumber: number; error?: string };

export function ClassesPage() {
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const errors = useMemo(() => rows.filter((row) => row.error), [rows]);

  function downloadTemplate() {
    const sheet = XLSX.utils.json_to_sheet([{ name: "홍길동", student_login_id: "20101", email: "", note: "" }]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "students");
    XLSX.writeFile(workbook, "student-upload-template.xlsx");
  }

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setRows([{ rowNumber: 0, name: "", student_login_id: "", email: "", note: "", error: "파일은 1MB 이하만 업로드할 수 있습니다." }]);
      return;
    }
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" }).slice(0, 200);
    const seen = new Set<string>();
    setRows(
      rawRows.map((raw, index) => {
        const candidate = {
          rowNumber: index + 2,
          name: String(raw.name ?? ""),
          student_login_id: String(raw.student_login_id ?? ""),
          email: String(raw.email ?? ""),
          note: String(raw.note ?? ""),
        };
        const parsed = studentRowSchema.safeParse(candidate);
        const duplicate = seen.has(candidate.student_login_id);
        seen.add(candidate.student_login_id);
        return {
          ...candidate,
          error: !parsed.success ? parsed.error.issues[0]?.message : duplicate ? "중복된 학생 로그인 ID입니다." : undefined,
        };
      }),
    );
  }

  return (
    <section>
      <PageHeader
        title="학급 관리"
        description="담당 학급을 만들고 학생 명단을 검증한 뒤 Edge Function으로 계정을 일괄 생성합니다."
        actions={
          <div className="flex flex-wrap gap-2">
            <button className="focus-ring inline-flex items-center gap-2 rounded border border-line bg-white px-3 py-2 text-sm" type="button" onClick={downloadTemplate}>
              <Download aria-hidden="true" size={16} />
              CSV·Excel 양식
            </button>
            <label className="focus-ring inline-flex cursor-pointer items-center gap-2 rounded bg-forest px-3 py-2 text-sm font-medium text-white">
              <Upload aria-hidden="true" size={16} />
              명단 미리보기
              <input className="sr-only" type="file" accept=".csv,.xlsx,.xls" onChange={onFileChange} />
            </label>
          </div>
        }
      />
      <div className="rounded border border-line bg-white p-5 shadow-soft">
        <h3 className="font-semibold">학생 계정 생성 전 확인</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          임시 비밀번호는 서버에서 학생별로 생성되며, DB나 감사 로그에 저장되지 않습니다. 다운로드 직전에 보안 경고를 표시해야 합니다.
        </p>
        {rows.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="업로드된 명단이 없습니다" description="양식을 내려받아 작성한 뒤 미리보기로 필수 열과 중복 ID를 확인하세요." />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            {errors.length > 0 ? <p className="mb-3 rounded bg-coral/10 p-3 text-sm text-coral">{errors.length}개 행에 오류가 있습니다.</p> : null}
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="py-2 pr-4">행</th>
                  <th className="py-2 pr-4">이름</th>
                  <th className="py-2 pr-4">로그인 ID</th>
                  <th className="py-2 pr-4">이메일</th>
                  <th className="py-2 pr-4">검증</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr className="border-b border-line" key={`${row.rowNumber}-${row.student_login_id}`}>
                    <td className="py-2 pr-4">{row.rowNumber}</td>
                    <td className="py-2 pr-4">{row.name}</td>
                    <td className="py-2 pr-4">{row.student_login_id}</td>
                    <td className="py-2 pr-4">{row.email || "-"}</td>
                    <td className={`py-2 pr-4 ${row.error ? "text-coral" : "text-forest"}`}>{row.error ?? "정상"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
