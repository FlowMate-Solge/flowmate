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
npx prisma migrate dev --name init   # 최초 1회
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

## 환경 변수

- `backend/.env` — `DATABASE_URL`, `PORT`, `ANTHROPIC_API_KEY` (AI 비서용, Phase 5에서 사용)
- `frontend/.env` — `VITE_API_BASE_URL` (기본값 `http://localhost:4000`)

`ANTHROPIC_API_KEY`는 절대 프론트엔드 코드나 `.env`에 노출하지 말고 백엔드에서만 사용합니다.
