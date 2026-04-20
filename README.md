# iCrewForce - Field Force Manager (Developer Handover)

คู่มือนี้เขียนสำหรับ DEV ที่ต้องรับช่วงพัฒนาต่อ ให้เริ่มระบบได้ทันทีและเข้าใจ flow หลักของโปรเจกต์ในเวลาอันสั้น

โปรเจกต์นี้มี 2 แอปหลักในโฟลเดอร์ `apps/`

- `apps/web` - Frontend (Next.js 16 + App Router)
- `apps/api` - Backend (NestJS 10 + Prisma + PostgreSQL)

> แต่ละแอปแยก dependency ของตัวเอง (`package.json`, `node_modules`) ไม่ได้ใช้ workspace manager แบบ monorepo เต็มรูปแบบ

---

## 1) Tech Stack โดยย่อ

- Frontend: Next.js 16, TypeScript, Tailwind CSS, shadcn/ui
- Backend: NestJS 10, TypeScript, Swagger, class-validator
- ORM/DB: Prisma 5 + PostgreSQL 14+
- Auth: JWT access + refresh token
- HTTP Client: Axios + refresh interceptor
- Package manager: Yarn (ติดตั้งแยกแต่ละแอป)

---

## 2) โครงสร้างโปรเจกต์

```text
field-force-manager/
├── apps/
│   ├── api/                  # NestJS + Prisma
│   │   ├── prisma/           # schema, migrations, seed
│   │   └── src/              # modules/controllers/services
│   └── web/                  # Next.js App Router
│       └── src/
│           ├── app/          # routes/pages/layouts
│           ├── components/   # UI + business components
│           ├── lib/          # api client, token storage, helpers
│           └── shared/       # shared types/schemas
├── docker-compose.yml        # postgres + api + web
├── .env.example              # env สำหรับ docker compose
└── package.json              # คำสั่ง helper ที่เรียกไปแต่ละ app
```

---

## 3) Prerequisites

เลือกได้ 2 วิธี:

- Local dev: Node.js 20+, Yarn 1.22+, PostgreSQL 14+
- Docker-only: Docker Desktop 24+ (ไม่ต้องลง Node/Yarn บนเครื่อง)

---

## 4) Quick Start (แนะนำ) - Docker

```powershell
Copy-Item .env.example .env
docker compose up --build
```

บริการที่ใช้งานได้:

- Web: `http://localhost:3000`
- API: `http://localhost:3001/api`
- Swagger: `http://localhost:3001/api/docs`

ค่า user ที่ seed มาเริ่มต้น:

```text
email: admin@ffm.local
password: admin123
```

หยุดระบบ:

```powershell
docker compose down
```

ล้างข้อมูล DB volume:

```powershell
docker compose down -v
```

---

## 5) Local Development (แนะนำตอนพัฒนา feature)

เปิด 2 terminal

### Terminal A - API

```powershell
cd apps/api
Copy-Item .env.example .env
```

แก้ `apps/api/.env` โดยเฉพาะ `DATABASE_URL` ให้ชี้ PostgreSQL ของเครื่องคุณ แล้วรัน:

```powershell
yarn install
yarn prisma:generate
yarn prisma:migrate
yarn prisma:seed
yarn dev
```

API จะรันที่ `http://localhost:3001/api`

### Terminal B - WEB

```powershell
cd apps/web
Copy-Item .env.example .env.local
yarn install
yarn dev
```

Web จะรันที่ `http://localhost:3000`

---

## 6) Root Scripts ที่ใช้บ่อย

```powershell
yarn install:all
yarn dev:api
yarn dev:web
yarn build:api
yarn build:web
yarn lint
yarn typecheck

yarn db:migrate
yarn db:seed
yarn db:studio

yarn docker:up
yarn docker:down
yarn docker:logs
```

---

## 7) Environment Variables ที่สำคัญ

### `apps/api/.env`

```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ffm?schema=public
JWT_SECRET=your_access_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

### `apps/web/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=Field Force Manager
```

### `.env` (root - สำหรับ docker compose)

ใช้ override ค่า env ของ container เช่น JWT secrets, CORS, API URL

---

## 8) Authentication Flow

1. `POST /api/auth/login` เพื่อรับ `access_token` + `refresh_token`
2. ฝั่ง web เก็บ token และแนบ access token ใน request ผ่าน axios interceptor
3. ถ้าเจอ `401` จะยิง `POST /api/auth/refresh` อัตโนมัติ
4. หน้าแรกของแอปเรียก `GET /api/auth/me` เพื่อโหลด session ปัจจุบัน

---

## 9) Business Flow (E2E) สำหรับทีมที่มารับช่วง

Flow นี้อิงจากเอกสารใน `apps/README-TH.md`

1. Create Work Order - สร้างใบงานและกำหนดข้อมูลหน้างาน
2. Dispatch - จ่ายงานให้ทีม/ช่างที่เหมาะสม
3. GIS Monitor - ติดตามงานและตำแหน่งแบบเรียลไทม์
4. Accept - ช่างรับงาน
5. Traveling - ช่างเดินทางไปหน้างาน
6. On Site - ถึงหน้างาน
7. Working - เริ่มปฏิบัติงาน
8. Completed - ปิดงานสำเร็จ

ภาพ flow (ถ้ามีไฟล์):

`docs/demo-e2e-flow.webp`

---

## 10) API Modules หลักที่ควรรู้

ตัวอย่าง resource สำคัญ:

- `/api/work-orders`
- `/api/technicians`
- `/api/teams`
- `/api/projects`
- `/api/customers`
- `/api/sites`
- `/api/materials`
- `/api/notifications`
- `/api/users`

> ส่วนใหญ่เป็น CRUD มาตรฐาน (`GET`, `GET :id`, `POST`, `PATCH :id`, `DELETE :id`)

---

## 11) ข้อควรรู้ก่อนพัฒนาต่อ

- มี legacy โค้ดบางส่วนที่ไม่ใช่เส้นทางหลักของแอปปัจจุบัน (เช่นไฟล์จาก Vite/Base44 ที่ root)
- ในบางช่วง `next build` อาจตั้งค่าให้ข้าม type/lint errors เพื่อให้ pipeline เดินต่อได้ ควรวางแผนเคลียร์ type debt แล้วเปิด strict checks กลับ
- ถ้าจะเปลี่ยน Prisma schema ให้รัน migration + seed ให้ครบ และอัปเดต API contract ให้สอดคล้องหน้าเว็บ

---

## 12) แนวทางส่งต่องาน (Suggested Handover Checklist)

- ยืนยันว่า `docker compose up --build` ผ่านบนเครื่องใหม่
- ยืนยัน login ด้วย `admin@ffm.local` ได้
- ทดสอบ flow งานหลัก: Create -> Dispatch -> Completed
- รัน `yarn lint` และ `yarn typecheck` ทั้ง API/Web ก่อนเปิด PR
- อัปเดตเอกสารนี้ทุกครั้งที่มีการเปลี่ยน env, endpoint, หรือ flow สำคัญ

---

## License

Proprietary - Internal use only.
