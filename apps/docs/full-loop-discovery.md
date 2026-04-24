# Full Loop Discovery — Web ↔ API

Prefix ทั้งหมด: `NEXT_PUBLIC_API_URL` + `/api` (เช่น `http://localhost:3001/api`).

## ตารางจับคู่หลัก

| Feature | Web call | API | Status |
|---------|----------|-----|--------|
| Auth | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/refresh` (axios ตรง base) | `auth.controller` | exists |
| Users CRUD | entity `GET/PATCH/DELETE /users`, `GET /users/:id` | `users.controller` | exists |
| Users invite | `POST /users/invite` | [`users.controller.ts`](../api/src/modules/users/users.controller.ts) + service | **fixed** (เดิม missing) |
| File upload | `POST /uploads` (multipart `file`), `GET /uploads/file/:name` | [`uploads` module](../api/src/modules/uploads/) | **fixed** (เดิม missing) |
| AI invoke | `POST /ai/invoke` (JSON) | [`ai` module](../api/src/modules/ai/) | **fixed** (เดิม missing) |
| Project import upload | เคย `POST /ai/invoke` + FormData | ใช้ `POST /uploads` แล้ว invoke แบบ JSON | **fixed** (web) |
| Axios `.data` | บางที่ destructure ผิดจาก `AxiosResponse` | `SkillCertPanel`, `WorkOrderStepForm`, `BulkSkillImport` | **fixed** |
| Entities | `GET/POST/PATCH/DELETE` ตาม `entity-client` | CRUD controllers ตามชื่อ resource | exists |
| Geo (external) | `fetch` Nominatim, OSRM | ไม่ใช่ API โปรเจกต์ | external |

## Resources จาก `entity-client` → controller base path

customers, sites, zones, projects, skills, priorities, stuck-reasons, material-categories, materials, service-types, workflows, teams, team-roles, technicians, member-skill-certs, technician-attendance, work-orders, work-order-materials, work-order-step-data, notifications, agents, users — ตรงกับ `@Controller(...)` ในแต่ละโมดูล

## Guards

- Global `JwtAuthGuard` ยกเว้น `@Public()` ที่ `/auth/register`, `/auth/login`, `/auth/refresh`

---

## Full Loop Test Report (รอบนี้)

**รันอัตโนมัติ:** `yarn typecheck` + `yarn build` ที่ `apps/api` ผ่านหลังเพิ่มโมดูล `uploads` / `ai` และ `@types/multer`  
**รัน HTTP จริง:** ยิงกับ `http://localhost:3001/api` แล้ว (หลังสตาร์ท API) และตรวจสถานะสำคัญผ่าน

### PASSED

- Auth / CRUD resources: โครงสร้าง route ตรงกับ `entity-client` และ controllers เดิม
- Build API หลังแก้ไข
- Auth flow ผ่าน: `login`, `me`, `refresh`, `logout(204)`
- Invite user ผ่าน: สร้างผู้ใช้ใหม่สำเร็จ
- Upload + AI extract ผ่าน: `POST /uploads` -> `POST /ai/invoke (ExtractDataFromUploadedFile)` ได้ `status=success`, `rows=1`

### FIXED

- `POST /api/users/invite` — สร้าง user ชั่วคราว (รหัสสุ่มใน DB), จำกัดสิทธิ์เชิญเฉพาะ `admin` / `supervisor` (role ฝั่ง DB)
- `POST /api/uploads` + `GET /api/uploads/file/:name` — เก็บไฟล์ใต้ `apps/api/storage/uploads`, `file_url` ใช้ `API_PUBLIC_URL` หรือ `http://localhost:PORT`
- `POST /api/ai/invoke` — รองรับ `ExtractDataFromUploadedFile` (CSV เป็น text), `executeAIAgent` (dry-run), `prompt`+`file_urls` (stub หรือ OpenAI ถ้ามี `OPENAI_API_KEY`)
- Web: แก้การอ่าน `file_url` จาก axios + import โปรเจกต์ใช้ `/uploads`

### FAILED / ต้องทดสอบด้วยมือ

- UI click-through รายหน้าบน browser (เช่น Users/Team/Work Orders/Agents) ยังต้องให้ QA manual ยืนยัน
- `apps/web` `yarn typecheck` ยังมี type debt เดิมหลายไฟล์ (ไม่เกี่ยวกับ patch รอบนี้)

**สรุป:** ผ่านการตรวจโค้ด + build API + HTTP smoke E2E ของจุดหลัก (Auth, Users invite, Uploads, AI invoke); คงเหลือ UI manual regression และ web type debt เดิม
