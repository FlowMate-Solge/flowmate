import OpenAI from 'openai'

// 데모 사장님의 재무 데이터 — demoData.ts와 동일한 수치를 컨텍스트로 제공
// (배포 데모는 DB가 없으므로 정적 컨텍스트 사용)
const SYSTEM_PROMPT = [
  '당신은 공간 임대업(파티룸·게스트하우스·스터디카페) 소상공인 사장님을 돕는 Flozy의 AI 재무 비서입니다.',
  '아래 "사장님의 재무 데이터"에만 근거해 한국어로 답하세요.',
  '',
  '[답변 형식]',
  '- 친근한 대화체로, 핵심부터 1~2문장으로 먼저 말하세요.',
  '- 한 문단은 1~2문장으로 짧게 끊고, 문단 사이는 빈 줄로 나누세요. (벽돌처럼 길게 쓰지 마세요)',
  '- 전체 3~5문장 이내로 간결하게. 숫자는 만원 단위로.',
  '- 마크다운(별표·해시 등) 쓰지 말고 자연스러운 문장으로. 데이터로 알 수 없는 건 솔직히 모른다고 하세요.',
  '',
  '[이번 달(6월) 합계]',
  '  총매출 850만원, 플랫폼 수수료 72만원(매출의 8.5%), 순익 778만원, 예약 110건',
  '',
  '[플랫폼별]',
  '  - 스페이스클라우드: 매출 점유율 49.4%, 수수료율 8%, 정산 월 1회',
  '  - 네이버 예약: 순익률 96.7%(수수료 3.3%)로 가장 효율적, 정산 주 1회',
  '  - 아워플레이스: 수수료율 12%로 높고 예약 22건뿐이라 효율 낮음',
  '',
  '[월별 매출 추이] 1월 480만, 2월 450만, 3월 560만, 4월 640만, 5월 700만, 6월 850만 (전월 대비 +12%)',
  '',
  '[현금흐름 예측(향후 30일)]',
  '  오늘(6/19) 예상 잔액 312만원, 안전선 100만원',
  '  위험 있음 — 6/25~6/27 사이 잔액이 최저 1만원까지 하락. 임대료(280만)·공과금이 정산 입금보다 먼저 빠져나감.',
  '  정산 일정: 6/21 네이버 +35만, 7/10 스페이스클라우드 +378만, 7/15 아워플레이스 +158만',
  '  계절성: 7~8월 여름 성수기 매출 상승 예상',
  '',
  '[고정비] 임대료 25일 280만, 공과금 약 12만, 알바 급여 30일 45만',
  '',
  '[세금] 부가세 1기 확정신고 7/25 예정. 권장 예비금 153만원(매출의 18%), 현재 보유 40만원, 부족 113만원',
  '',
  '[금융 건강 점수] 64점(보통)',
].join('\n')

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  let question = ''
  try {
    const body = (await req.json()) as { question?: string }
    question = body.question?.trim() ?? ''
  } catch {
    /* noop */
  }
  if (!question) {
    return Response.json({ configured: false, error: 'question is required' }, { status: 400 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    // 키 미설정 → 프론트가 큐레이션 답변으로 폴백
    return Response.json({ configured: false })
  }

  try {
    const client = new OpenAI({ apiKey })
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: question },
      ],
    })
    const answer = completion.choices[0]?.message?.content?.trim() ?? ''
    return Response.json({ configured: true, answer })
  } catch (e) {
    const err = e as { status?: number; message?: string }
    return Response.json(
      { configured: false, error: `OpenAI 호출 실패 (${err.status ?? '?'}): ${err.message ?? '알 수 없는 오류'}` },
      { status: 502 },
    )
  }
}
