import type { DashboardMetric, QuestionType } from "../types/domain";

export interface DemoAssessment {
  id: string;
  title: string;
  subject: string;
  className: string;
  dueLabel: string;
  releasePolicyLabel: string;
  submitted: number;
  total: number;
  averageScore: number;
}

export interface DemoQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[];
  points: number;
  standard: string;
}

export const teacherMetrics: DashboardMetric[] = [
  { label: "오늘 공개된 평가", value: "2건", detail: "진단평가 1건, 형성평가 1건" },
  { label: "제출 완료", value: "48명", detail: "담당 학급 제출 현황 기준" },
  { label: "최근 평균 점수", value: "78점", detail: "채점 완료 평가 평균" },
  { label: "교사 검토 대기", value: "6건", detail: "서술형 AI 채점 검토 필요" },
];

export const studentMetrics: DashboardMetric[] = [
  { label: "응시 가능", value: "2건", detail: "공개 기간 내 평가" },
  { label: "제출 완료", value: "1건", detail: "내 제출만 표시" },
  { label: "공개된 피드백", value: "1건", detail: "교사 설정에 따른 공개" },
];

export const demoAssessments: DemoAssessment[] = [
  {
    id: "ratio-formative-1",
    title: "비례식과 비율 형성평가",
    subject: "수학",
    className: "2학년 3반",
    dueLabel: "오늘 16:00 마감",
    releasePolicyLabel: "피드백 즉시 공개",
    submitted: 25,
    total: 28,
    averageScore: 82,
  },
  {
    id: "reading-diagnostic-1",
    title: "설명문 읽기 진단평가",
    subject: "국어",
    className: "2학년 3반",
    dueLabel: "내일 09:00 시작",
    releasePolicyLabel: "교사 검토 후 공개",
    submitted: 23,
    total: 28,
    averageScore: 74,
  },
];

export const demoQuestions: DemoQuestion[] = [
  {
    id: "q1",
    type: "multiple_choice",
    prompt: "어떤 물건 3개의 가격이 12,000원입니다. 같은 물건 5개의 가격을 구하려면 먼저 무엇을 확인해야 하나요?",
    options: ["물건 1개의 가격", "가장 비싼 물건의 가격", "전체 물건의 무게", "할인 전 가격"],
    points: 4,
    standard: "비례 관계를 이용해 단위량을 구할 수 있다.",
  },
  {
    id: "q2",
    type: "short_answer",
    prompt: "물 2L에 시럽 300mL를 섞었습니다. 같은 맛을 유지하며 물 6L를 사용할 때 필요한 시럽의 양을 쓰세요.",
    points: 4,
    standard: "비율이 일정한 상황에서 대응값을 계산할 수 있다.",
  },
  {
    id: "q3",
    type: "short_essay",
    prompt: "비례식 문제에서 단위량을 먼저 구하면 좋은 이유를 한두 문장으로 설명하세요.",
    points: 6,
    standard: "풀이 과정을 수학적 언어로 설명할 수 있다.",
  },
];

export const standards = [
  { code: "MAT-02-01", name: "단위량 구하기", average: 86, needsSupport: 4 },
  { code: "MAT-02-02", name: "비율 유지 계산", average: 71, needsSupport: 9 },
  { code: "MAT-02-03", name: "풀이 과정 설명", average: 64, needsSupport: 13 },
];

export const pendingReviews = [
  { student: "김서연", assessment: "비례식과 비율 형성평가", reason: "서술형 근거 부족", confidence: "62%" },
  { student: "박도윤", assessment: "설명문 읽기 진단평가", reason: "핵심어 일부 누락", confidence: "58%" },
  { student: "이하준", assessment: "비례식과 비율 형성평가", reason: "계산식은 맞지만 설명 불명확", confidence: "66%" },
];

export const demoResult = {
  title: "비례식과 비율 형성평가",
  score: 11,
  maxScore: 14,
  feedback:
    "단위량을 구하는 전략은 안정적으로 사용했습니다. 서술형에서는 왜 같은 비율이 유지되는지 한 문장 더 설명하면 풀이의 설득력이 높아집니다.",
  items: [
    { question: "단위량 확인", status: "정답", points: "4/4", feedback: "먼저 물건 1개의 가격을 구해야 한다는 점을 정확히 골랐습니다." },
    { question: "비율 유지 계산", status: "정답", points: "4/4", feedback: "2L에서 6L로 3배가 되었으므로 시럽도 900mL가 필요합니다." },
    { question: "풀이 과정 설명", status: "부분 점수", points: "3/6", feedback: "단위량을 언급했지만, 비교가 쉬워지는 이유를 더 구체적으로 쓰면 좋습니다." },
  ],
};
