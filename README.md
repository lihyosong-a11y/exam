# 수업 진단·형성평가 및 피드백 관리

교사가 진단평가와 형성평가를 만들고, 학생이 온라인으로 응시하면 자동채점 또는 AI 기반 피드백을 제공하는 React + Supabase 웹앱입니다. 학생 답안, 점수, 피드백을 다루므로 프런트엔드 화면 숨김이 아니라 Supabase RLS와 Edge Function 권한 검증을 기본 보안 경계로 사용합니다.

## 로컬 실행

```bash
npm install
npm run dev
```

Supabase 환경 변수가 없으면 로그인 화면에서 데모 모드로 둘러볼 수 있습니다. 교사·관리자 또는 학생 탭을 선택하고 아이디와 비밀번호에 아무 값을 입력하면 샘플 평가, 응시, 결과, 분석 화면을 확인할 수 있습니다.

빌드 확인:

```bash
npm run build
npm run lint
```

루트에 `.env.local`을 만들고 공개 가능한 Supabase 값만 넣습니다.

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

`VITE_` 환경 변수에는 service role key, AI API key, 학생 비밀번호 같은 비밀 값을 절대로 넣지 않습니다.

## Supabase 프로젝트 생성과 마이그레이션

1. Supabase에서 새 프로젝트를 만듭니다.
2. SQL Editor 또는 Supabase CLI로 `supabase/migrations/001_initial_schema.sql`을 실행합니다.
3. 이어서 `supabase/migrations/002_rls_policies.sql`을 실행합니다.
4. Authentication의 이메일 로그인을 활성화합니다. 학생 계정은 `학생로그인ID@students.local` 내부 이메일 형식으로 생성됩니다.

## 첫 admin 계정

1. Supabase Dashboard에서 관리자 이메일로 Auth 사용자를 만듭니다.
2. 해당 사용자의 `auth.users.id`를 확인합니다.
3. SQL Editor에서 아래처럼 프로필을 직접 추가합니다.

```sql
insert into public.profiles (id, role, display_name)
values ('AUTH_USER_UUID', 'admin', '시스템 관리자');
```

## teacher 계정 생성

admin이 Supabase Dashboard 또는 별도 운영 화면에서 Auth 사용자를 만든 뒤 `profiles`에 `role = 'teacher'`로 추가합니다.

```sql
insert into public.profiles (id, role, display_name)
values ('AUTH_USER_UUID', 'teacher', '교사 이름');
```

## 학생 계정과 임시 비밀번호

학생 계정은 프런트엔드에서 직접 만들지 않습니다. 교사 또는 admin이 `provision-students` Edge Function을 호출하면 서버에서 다음을 처리합니다.

- 교사/admin 권한 확인
- 교사가 소유한 학급인지 확인
- 학생별로 서로 다른 긴 임시 비밀번호 생성
- Supabase Auth 계정 생성
- `profiles`, `enrollments` 생성
- 임시 비밀번호를 응답에서만 1회 반환
- 비밀번호를 DB와 `audit_logs`에 저장하지 않음

학생은 첫 로그인 후 비밀번호를 변경해야 하며, `must_change_password = true` 상태에서는 평가 응시와 결과 조회 화면으로 이동할 수 없습니다.

## Edge Function 배포

```bash
supabase functions deploy provision-students
supabase functions deploy reset-student-password
supabase functions deploy generate-questions
supabase functions deploy grade-submission
supabase functions deploy export-class-results
```

Function Secrets는 Supabase에만 등록합니다.

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
supabase secrets set AI_PROVIDER=openai
supabase secrets set AI_PROVIDER_API_KEY=...
supabase secrets set AI_MODEL=...
```

AI API key와 service role key를 Vercel 환경 변수나 프런트엔드 코드에 넣으면 브라우저 사용자에게 노출될 수 있으므로 금지합니다.

## GitHub와 Vercel 배포

```bash
git init
git add .
git commit -m "Initial secure assessment app"
git remote add origin <repository-url>
git push -u origin main
```

Vercel에서는 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`만 등록합니다. `vercel.json`은 React Router 새로고침 경로가 `/index.html`로 돌아가도록 설정합니다.

## AI 문항 생성과 채점

`generate-questions`는 교사 권한과 평가 소유권을 확인한 뒤 외부 AI를 호출합니다. 생성된 문항은 항상 `draft` 상태로 저장되며, 교사가 검토하고 `approved`로 바꾸기 전에는 평가를 공개할 수 없습니다.

`grade-submission`은 객관식, 참·거짓, 단답형, 수치형을 서버에서 규칙 기반으로 채점합니다. 서술형은 AI API key가 있으면 루브릭 채점을 시도하고, key가 없거나 신뢰도가 낮으면 교사 검토 대기로 처리합니다. 외부 AI에는 학생 이름, 로그인 ID, 이메일, 학급명 같은 개인정보를 보내지 않습니다.

AI API key가 아직 없어도 수동 문항 작성과 규칙 기반 채점, 교사 검토 흐름은 계속 사용할 수 있습니다.

## Snorkl 링크

Snorkl API 연동, 자동채점, 점수 가져오기, 웹 스크래핑, 브라우저 자동화는 구현하지 않았습니다. Snorkl은 `assessment_activity_links`에 저장되는 외부 활동 링크로만 관리합니다. https URL과 허용 도메인만 저장하며, 학생은 교사가 설정한 공개 시점이 되었을 때만 링크를 볼 수 있습니다.

## 개인정보 운영 주의

실제 학생 개인정보와 학습 데이터를 운영하기 전 학교의 개인정보 처리 기준, 내부 승인 절차, 보관 기간, 다운로드 파일 폐기 절차를 확인해야 합니다. 주민등록번호, 주소, 보호자 연락처 등 수업 운영에 불필요한 개인정보는 수집하지 않는 설계입니다.

## 배포 전 보안 점검

`SECURITY_CHECKLIST.md`의 항목을 모두 확인한 뒤 배포하세요. 특히 RLS 활성화, service role key 위치, 학생 간 데이터 격리, 정답·해설 비공개, CSV 다운로드 감사 로그를 반드시 검증합니다.
