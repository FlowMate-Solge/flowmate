# FlowMate (핀넥트)

공간 대여업 소상공인을 위한 AI 기반 자금흐름 관리 서비스.

개발 순서/체크리스트는 [`CHECKLIST.md`](./CHECKLIST.md) 참고.

## 구조

```
frontend/   Vite + React + TypeScript
backend/    Express + TypeScript + Prisma (SQLite)
```

## 실행 방법

### 백엔드

```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev               # 최초 1회 (기존 migrations 적용)
npm run seed                         # 데모 데이터 채우기
npm run dev                          # http://localhost:4000
```

### 프론트엔드

```bash
cd frontend
npm install
cp .env.example .env   # 필요시 VITE_API_BASE_URL 수정
npm run dev             # http://localhost:5173
```

백엔드를 먼저 켜야 프론트엔드 대시보드가 정상적으로 데이터를 불러옵니다.

> **데모 모드:** 랜딩(`/`)에서 "데모 체험하기"를 누르면 백엔드 없이 목업 데이터로 전체 흐름을 둘러볼 수 있습니다. 발표/배포용 경로입니다.

## 환경 변수

- `backend/.env`
  - `DATABASE_URL`, `PORT`
  - `OPENAI_API_KEY` — AI 재무 비서(gpt-4o-mini)용
  - `DEMO_PASSWORD` — 팀 로그인 비밀번호 (미설정 시 `flozy2026`)
  - `BIZINFO_API_KEY` — 기업마당 정책자금 실시간 연동 키 (선택, [data.go.kr](https://www.data.go.kr) 발급). 미설정 시 큐레이션 데이터 사용
- `frontend/.env`
  - `VITE_API_BASE_URL` (기본값 `http://localhost:4000`)
  - `VITE_APP_URL` — 모바일 체험 QR이 가리킬 배포 주소

`OPENAI_API_KEY` 등 비밀 키는 절대 프론트엔드 코드나 `.env`에 노출하지 말고 백엔드에서만 사용합니다.
