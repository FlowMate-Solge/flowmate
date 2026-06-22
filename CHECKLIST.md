# FlowMate 개발 체크리스트 (릴레이 코딩용)

> 4명이 순서대로 이어받는 "릴레이" 방식 기준. 각 Phase는 이전 Phase가 끝나야 시작할 수 있음.
> Phase 안의 항목들은 순서 안 지켜도 되지만, Phase 자체는 순서를 지켜야 함 (다음 사람이 이전 결과물 위에서 작업).

## 협업 툴

- **GitHub Projects (칸반 보드)** 사용 추천 — 이미 GitHub에 코드가 있으니 추가 가입 없이 Issue ↔ PR ↔ 보드가 자동 연동됨.
  - repo → `Projects` 탭 → 새 보드 생성 → 컬럼: `Todo / In Progress / Review / Done`
  - 아래 체크리스트의 각 `- [ ]` 항목을 Issue로 만들어서 보드에 올리기
- **브랜치/커밋 규칙**
  - 브랜치명: `feature/phase2-sales-api` 처럼 `phase 번호 + 내용`
  - 커밋 전 `npm run dev`로 로컬 확인 필수
  - 본인 차례 끝나면: PR 생성 → 1명 이상 리뷰(또는 본인 merge) → **다음 사람에게 Slack/카톡으로 "Phase N 끝, M번부터 이어가면 됨" 한 줄 공유**

## 폴더 구조 (목표)

```
flowmate/
  frontend/   ← 기존 Vite+React+TS 앱 (이번에 이 폴더로 이동)
  backend/    ← 새로 만드는 Express+TS+Prisma 앱
  CHECKLIST.md
  README.md
```

---

## Phase 0 — 저장소 세팅 (담당: 1명, 완료 시 전원에게 공유)

- [ ] 기존 프론트엔드 파일을 `frontend/`로 이동
- [ ] `backend/` Express + TypeScript + Prisma(SQLite) 스캐폴딩
- [ ] 루트 `README.md`에 실행 방법 정리 (`npm install && npm run dev` 등)
- [ ] `.env.example` 작성 (`DATABASE_URL`, `ANTHROPIC_API_KEY`, `PORT`)
- [ ] GitHub Projects 보드 생성 + 이 체크리스트 Issue로 옮기기

## Phase 1 — 백엔드 기초 (DB 스키마 + 서버 골격)

- [ ] Prisma 스키마 작성: `Platform`, `Sale`, `FixedCost`, `TaxReserve`, `RoiInput`
- [ ] `mock.ts` 데이터를 그대로 옮기는 시드(seed) 스크립트 작성
- [ ] Express 서버 골격: CORS, JSON 미들웨어, 에러 핸들러, `/health` 체크
- [ ] 라우터 폴더 구조 정리 (`routes/platforms.ts`, `routes/sales.ts` ...)

## Phase 2 — Aggregate 기능 (데이터 입력 + 대시보드)

> 화면: `Connect.tsx`, `Sales.tsx`

- [ ] `GET /api/platforms` — 플랫폼별 매출/수수료/순익 (mock의 `platformDerived` 형태)
- [ ] `POST /api/platforms/:key/connect` — 소스 연결 토글
- [ ] `POST /api/sales` — 매출 수동 입력 (날짜, 플랫폼, 금액, 예약건수)
- [ ] `POST /api/sales/upload` — CSV 업로드 (multer + csv-parse)
- [ ] `POST /api/fixed-costs`, `GET /api/fixed-costs` — 고정비 등록/조회
- [ ] `GET /api/dashboard/summary` — 월별 추이 + 플랫폼 비교 (mock의 `monthlyTrend`, `platformMonthlyTotals`)
- [ ] 프론트 `Connect.tsx`, `Sales.tsx`에서 mock import 제거하고 위 API로 교체

## Phase 3 — Predict 기능 (현금흐름 예측)

> 화면: `Forecast.tsx`

- [ ] `GET /api/forecast/daily-balance` — 시작 잔액 + 고정비 일정 + 플랫폼 정산일 기반 룰 계산 (mock의 `dailyForecast` 로직화)
- [ ] 위 결과에서 잔액이 임계값 이하인 날 자동 추출 → 위험일 알림 (`riskAlert`)
- [ ] `POST /api/roi/calculate` — 투자금/고정비/순수익 입력 → 회수 기간(개월) 계산
- [ ] `GET /api/tax-reserve`, `POST /api/tax-reserve` — 매출의 15~20% 권장 예비금 vs 현재 보유액
- [ ] 프론트 `Forecast.tsx`에서 mock 제거하고 API 연결

## Phase 4 — Act 기능 (행동 추천)

> 화면: `Actions.tsx`

- [ ] `GET /api/platform-strategy` — 수수료율 vs 순익률 vs 예약수 비교해서 추천 문구 룰 기반 생성
- [ ] `GET /api/price-benchmark` — 시세 구간 (MVP는 정적 데이터, v2에서 크롤링)
- [ ] `GET /api/policy-funds` — 정책자금 안내 (정적 데이터)
- [ ] 프론트 `Actions.tsx`에서 mock 제거하고 API 연결

## Phase 5 — AI 금융비서 + 오늘의 브리핑 (Claude API)

> 화면: `AiAssistant.tsx`, Dashboard 상단 브리핑 카드
> `AiAssistant.tsx` 6번 줄 주석에 이미 연동 방향이 적혀있음: 재무 데이터를 system 프롬프트로 넣고 `messages.create()` 호출

- [ ] `ANTHROPIC_API_KEY`는 **백엔드 서버에서만** 사용 (프론트에 노출 금지)
- [ ] `POST /api/ai/ask` — `{ question }` 받아서 Phase 2~4 API 데이터를 모아 system 프롬프트로 구성 → Claude API 호출 → 답변 반환
- [ ] `GET /api/briefing/today` — 오늘 예상 잔액 / 이번 주 정산 / 임박 세금·고정비 / 공실 위험 (mock의 `briefing`)
- [ ] 프론트 `AiAssistant.tsx`의 `getAnswer()` 프리셋 함수를 실제 API 호출로 교체
- [ ] Dashboard에 오늘의 브리핑 카드 연결

## Phase 6 — 통합 마무리

- [ ] 전체 플로우 점검: 데이터 입력 → 대시보드 → 예측 → 추천 → AI비서 → 브리핑
- [ ] 로딩/에러 상태 프론트 UI 처리 (현재는 mock이라 항상 즉시 응답이었음)
- [ ] README에 데모 시나리오(피칭용) 정리
- [ ] (선택) 배포: 프론트 Vercel, 백엔드 Render/Railway

---

## 담당 나누는 법 (4명 릴레이 기준)

릴레이 방식이므로 "역할 고정"보다 "다음 차례에 누가 이어받을지"가 중요합니다. 권장 순서:

1. **1번 주자**: Phase 0 + Phase 1 (세팅, 다음 사람이 바로 API 짤 수 있게)
2. **2번 주자**: Phase 2 (Aggregate)
3. **3번 주자**: Phase 3 (Predict)
4. **4번 주자**: Phase 4 (Act)
5. 이후 한 바퀴 더 돌면서 **Phase 5(AI비서) → Phase 6(마무리)**를 분담

각자 차례 끝나면 GitHub Projects 보드 업데이트 + 다음 사람 호출이 필수입니다.
