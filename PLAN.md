# FlowMate MVP 개선 계획

## 목표
- `/` 발표용 랜딩 (QR 포함) → 데모 체험 → 팀 로그인 → 실데이터
- 데모 모드: mock 데이터, 백엔드 없이도 동작
- 실제 모드: 백엔드 API 연결

## 체크리스트

### [D] 코드 정리 (선행)
- [x] D-0. AuthContext.tsx 생성
- [x] D-0. demoData.ts 생성 (API 형태 데모 데이터)
- [x] D-0. 백엔드 Business 모델 + 마이그레이션 + API 라우트
- [x] D-1. fmtMan/fmtWon → lib/utils.ts 이전, mock.ts import 교체
- [x] D-2. api.ts 에 getBusiness() 추가

### [B] 인증
- [x] B-2. 백엔드 POST /api/auth/login 엔드포인트
- [x] B-1. Login.tsx — 팀용 비밀번호 로그인 폼

### [C] 데모/실제 데이터 분기
- [x] C-1. main.tsx — AuthProvider + 라우팅 정리
- [x] C-2. App.tsx — 데모 배너, 사이드바 실 사업장 데이터, 로그아웃
- [x] C-3. Dashboard.tsx — 데모/실제 분기
- [x] C-4. Forecast.tsx — 데모/실제 분기
- [x] C-5. Actions.tsx — 데모/실제 분기
- [x] C-6. Sales.tsx — 데모/실제 분기

### [A] 발표용 랜딩 페이지
- [x] A-1. Landing.tsx — 좌: 브랜드+기능+QR, 우: 앱 iframe 미리보기
- [x] A-2. "데모 체험하기" → demo 모드 진입
- [x] A-3. "팀 로그인" → /login 이동

## 진행 순서
D-1 → D-2 → B-2 → C-1 → C-3~C-6 → C-2 → A-1~A-3 → B-1

### [E] 환경변수
- [x] VITE_APP_URL=https://gleaming-genie-0cf7f6.netlify.app (QR용)
- [x] DEMO_PASSWORD=flozy2026 (백엔드 .env)
- [x] Connect.tsx demo 분기 추가

## 완료 기준
- 랜딩 → 데모 체험 → 전 페이지 mock 데이터 정상 표시
- 로그인 → 실 API 데이터로 전환
- QR 스캔 → 모바일에서 데모 체험 가능
