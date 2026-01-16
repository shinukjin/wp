# Wedding Project

Next.js + React + Zustand + Prisma + Tailwind CSS 프로젝트입니다.

## 기술 스택

- **Next.js 14** - React 프레임워크 (App Router)
- **React 18** - UI 라이브러리
- **TypeScript** - 타입 안정성
- **Zustand** - 상태 관리
- **Prisma** - ORM
- **Tailwind CSS** - CSS 프레임워크
- **Winston** - 로깅 라이브러리
- **Axios** - HTTP 클라이언트

## 시작하기

### 1. 의존성 설치

```bash
npm install
# 또는
yarn install
# 또는
pnpm install
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 다음 환경 변수를 설정하세요:

```bash
# Database (PostgreSQL)
DATABASE_URL="postgresql://postgres@localhost:5432/wedding?schema=public"
# 비밀번호가 있는 경우:
# DATABASE_URL="postgresql://postgres:password@localhost:5432/wedding?schema=public"

# JWT Secret (프로덕션에서는 반드시 강력한 랜덤 문자열로 변경하세요)
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="1h"  # 1시간 만료

# API URL (선택사항)
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
```

### 3. Prisma 설정

데이터베이스 스키마를 생성하고 마이그레이션을 실행하세요:

```bash
# Prisma Client 생성
npm run db:generate

# 데이터베이스에 스키마 적용 (개발용)
npm run db:push

# 또는 마이그레이션 사용 (프로덕션 권장)
npm run db:migrate
```

### 4. 개발 서버 실행

```bash
npm run dev
# 또는
yarn dev
# 또는
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인하세요.

## 프로젝트 구조

```
wedding/
├── app/                      # App Router 디렉토리
│   ├── layout.tsx            # 루트 레이아웃
│   ├── page.tsx              # 홈 페이지
│   └── globals.css           # 전역 스타일 (Tailwind)
├── lib/                      # 유틸리티 및 라이브러리
│   ├── store/                # Zustand 스토어
│   │   └── useWeddingStore.ts
│   ├── api/                  # API 클라이언트
│   │   ├── client.ts         # Axios 기반 API 클라이언트
│   │   └── example.ts        # API 사용 예제
│   ├── logger.ts             # Winston 로거 설정
│   └── prisma.ts             # Prisma Client 인스턴스
├── prisma/                   # Prisma 설정
│   └── schema.prisma         # 데이터베이스 스키마
├── public/                   # 정적 파일
├── next.config.js            # Next.js 설정
├── tailwind.config.js        # Tailwind CSS 설정
├── postcss.config.js         # PostCSS 설정
├── tsconfig.json             # TypeScript 설정
└── package.json              # 프로젝트 의존성
```

## 사용 가능한 스크립트

### 개발
- `npm run dev` - 개발 서버 실행
- `npm run lint` - ESLint 실행

### 빌드
- `npm run build` - 프로덕션 빌드
- `npm run start` - 프로덕션 서버 실행

### 데이터베이스
- `npm run db:generate` - Prisma Client 생성
- `npm run db:push` - 스키마를 데이터베이스에 적용 (개발용)
- `npm run db:migrate` - 마이그레이션 생성 및 적용
- `npm run db:studio` - Prisma Studio 실행 (데이터베이스 GUI)

## 주요 기능

### Zustand 상태 관리

`lib/store/useWeddingStore.ts`에서 Zustand 스토어를 정의하고 사용할 수 있습니다.

```typescript
import { useWeddingStore } from '@/lib/store/useWeddingStore'

const { count, increment, decrement } = useWeddingStore()
```

### Prisma ORM

`lib/prisma.ts`에서 Prisma Client를 import하여 사용할 수 있습니다.

```typescript
import { prisma } from '@/lib/prisma'

const users = await prisma.user.findMany()
```

### Tailwind CSS

모든 컴포넌트에서 Tailwind CSS 클래스를 사용할 수 있습니다.

```tsx
<div className="flex items-center justify-center bg-blue-500">
  <h1 className="text-2xl font-bold">Hello</h1>
</div>
```

### 로깅 (Winston)

`lib/logger.ts`에서 Winston 로거를 사용할 수 있습니다.

```typescript
import logger from '@/lib/logger'

logger.info('정보 메시지')
logger.warn('경고 메시지')
logger.error('에러 메시지', error)
logger.debug('디버그 메시지')
```

로그는 콘솔과 파일(`logs/combined.log`, `logs/error.log`)에 저장됩니다.

### 외부 API 연동 (Axios)

`lib/api/client.ts`에서 API 클라이언트를 사용할 수 있습니다.

```typescript
import apiClient from '@/lib/api/client'

// GET 요청
const data = await apiClient.get('/users')

// POST 요청
const newUser = await apiClient.post('/users', { name: 'John', email: 'john@example.com' })

// PUT 요청
const updated = await apiClient.put('/users/1', { name: 'Jane' })

// DELETE 요청
await apiClient.delete('/users/1')
```

API 클라이언트는 자동으로 요청/응답 로깅, 에러 처리, 토큰 관리 등을 처리합니다.

