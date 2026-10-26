# Hackathon Repository Setup & Quality Improvements Guide

Target repository: https://github.com/osamaayub/Hackathon

---

## 1. Repository Structure & Best Practices
Ensure your project adheres to a clean monorepo or dual-directory structure:

```text
Hackathon/
├── backend/                  # NestJS / Node.js / Express Backend
│   ├── src/
│   │   └── auth/             # Auth module / controller (/api/auth)
│   ├── prisma/               # Prisma schema & migrations
│   ├── test/                 # Unit & E2E tests
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # Next.js / React Frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
└── .github/
    └── workflows/
        └── ci.yml            # Automated CI pipeline
```

---

## 2. Backend Setup & Configuration (`backend/`)

### **`backend/.env.example`**
Create a clear environment variable template to prevent configuration errors:
```env
PORT=8080
DATABASE_URL="postgresql://user:password@localhost:5432/hackathon_db?schema=public"
JWT_SECRET="your_super_secret_jwt_key"
NODE_ENV="development"
```

### **`backend/package.json` (Scripts Section)**
Ensure strict build, lint, and test scripts are in place for automated quality gates:
```json
"scripts": {
  "prebuild": "rimraf dist",
  "build": "nest build",
  "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
  "start": "nest start",
  "start:dev": "nest start --watch",
  "start:debug": "nest start --debug --watch",
  "start:prod": "node dist/main",
  "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:cov": "jest --coverage",
  "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
  "test:e2e": "jest --config ./test/jest-e2e.json",
  "db:generate": "prisma generate",
  "db:migrate": "prisma migrate deploy"
}
```

### **Backend Auth Route (`/api/auth`)**
Example controller structure for NestJS mapping auth endpoints under `/api/auth`:

```typescript
import { Controller, Post, Body } from '@nestjs/common';

@Controller('api/auth')
export class AuthController {
  @Post('login')
  async login(@Body() body: any) {
    // Authentication logic
  }

  @Post('register')
  async register(@Body() body: any) {
    // Registration logic
  }
}
```

---

## 3. Frontend Setup & Configuration (`frontend/`)

### **`frontend/.env.example`**
Configure your API base URL to point directly to port `8080`:
```env
NEXT_PUBLIC_API_URL="http://localhost:8080/api"
```

### **`frontend/package.json` (Scripts Section)**
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "format": "prettier --write \"app/**/*.{ts,tsx,js,jsx,json,css}\" \"components/**/*.{ts,tsx,js,jsx,json,css}\""
}
```

---

## 4. Automated GitHub Actions CI/CD Pipeline (`.github/workflows/ci.yml`)

To keep your code quality scores high, static analysis and builds must pass cleanly on every push. Create `.github/workflows/ci.yml`:

```yaml
name: CI Quality Pipeline

on:
  push:
    branches: [ main, master, develop ]
  pull_request:
    branches: [ main, master, develop ]

jobs:
  backend-ci:
    name: Backend Build & Test
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./backend

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install Dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npx prisma generate
        env:
          DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/test_db?schema=public"

      - name: Run Linter
        run: npm run lint

      - name: Run Tests & Coverage
        run: npm run test:cov
        env:
          DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/test_db?schema=public"
          JWT_SECRET: "mock_jwt_secret_for_ci"

      - name: Build Backend
        run: npm run build

  frontend-ci:
    name: Frontend Build & Lint
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./frontend

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install Dependencies
        run: npm ci

      - name: Run Linter
        run: npm run lint

      - name: Build Next.js Application
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: "http://localhost:8080/api"
```

---

## 5. Quick Checklist to Maximize Your Quality Score
1. **Zero Linter Warnings/Errors:** Ensure `npm run lint` passes without any errors in both frontend and backend directories.
2. **Remove Unused Code & Dependencies:** Clean out any dead code imports or unused npm packages to keep complexity low.
3. **Add Basic Unit Tests:** Having at least basic test coverage files (`.spec.ts` or `.test.tsx`) boosts repository scoring algorithms.
4. **Proper `.gitignore`:** Ensure `node_modules`, `.env`, `.next`, `dist`, and coverage reports are ignored so they don't pollute your repository analysis.