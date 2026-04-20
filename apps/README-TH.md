# คู่มือการติดตั้งและใช้งานระบบ Field Force Manager
> ระบบ Field Force Manager เป็นระบบจัดการและจัดสรรงานให้ช่างเทคนิคสำหรับการลงพื้นที่ปฏิบัติงาน (Field Service) แบบเรียลไทม์ 

โปรเจกต์นี้แยกโครงสร้างการทำงานออกแบบ 2 ส่วน (Monorepo)
- **`apps/web`** — ระบบจัดการหน้าบ้าน (Frontend) พัฒนาด้วย Next.js 16 (App Router) + TailwindCSS
- **`apps/api`** — ระบบหลังบ้าน (Backend) พัฒนาด้วย NestJS 10 + Prisma ORM (เชื่อมกับฐานข้อมูล PostgreSQL)

---

## 💻 ความต้องการของระบบ (Prerequisites)
ก่อนเริ่มติดตั้ง กรุณาตรวจสอบให้แน่ใจว่าเครื่องของคุณมีโปรแกรมเหล่านี้:
1. **Node.js** (เวอร์ชั่น 20 ขึ้นไป)
2. **Yarn** (ติดตั้งด้วยคำสั่ง `npm i -g yarn`)
3. **PostgreSQL** (เวอร์ชั่น 14 ขึ้นไป)
4. *(ทางเลือก)* **Docker & Docker Compose** (สำหรับการรันแบบคลิกเดียวจบไม่ต้องลง Node.js เอง)

---

## 🚀 วิธีการรันระบบแบบรวดเร็ว (ผ่าน Docker) *แนะนำ*
หากต้องการทดสอบระบบรวดเร็วที่สุด ให้ใช้ Docker:

1. คัดลอกไฟล์ตั้งค่า Environment
```powershell
Copy-Item .env.example .env
```
2. สั่งรันฐานข้อมูล, API, และ Web พร้อมกัน
```powershell
docker compose up --build
```
ระบบจะรันฐานข้อมูล พรอมกับทำการ Migration ให้คุณอัตโนมัติ

**ช่องทางการเข้าถึง:**
- หน้าเว็บ FFM (Web): `http://localhost:3000`
- API (Backend): `http://localhost:3001/api`
- API Docs (Swagger): `http://localhost:3001/api/docs`

> รหัสผ่าน Admin สำหรับเข้าสู่ระบบ (ถูก Seed มาให้แล้ว): 
> **Email:** `admin@ffm.local`
> **Password:** `admin123`

---

## 💻 วิธีการรันระบบแบบ Local (สำหรับนักพัฒนา)

หากคุณต้องการแก้ไขโค้ดและรันแบบ Local ให้ทำตามขั้นตอนการเซ็ตอัปแยกแต่ละฝั่ง (เปิด 2 Terminal)

### ส่วนที่ 1: การรัน Backend (API)
```powershell
cd apps/api
Copy-Item .env.example .env
```
> **สำคัญ:** เข้าไปแก้ไขไฟล์ `apps/api/.env` เพื่อเปลี่ยนค่า `DATABASE_URL` ให้ชี้ไปที่ฐานข้อมูล PostgreSQL ในเครื่องของคุณ

หลังจากนั้นใช้คำสั่ง:
```powershell
yarn install           # ติดตั้ง Dependencies
yarn prisma:generate   # สร้าง Client สำหรับเชื่อมต่อฐานข้อมูล
yarn prisma:migrate    # จำลองตาราง (Migration) ไปยังฐานข้อมูลของคุณ
yarn prisma:seed       # สอดแทรกข้อมูล Default (Admin, Master Data) ไปให้พร้อมใช้งาน
yarn dev               # เริ่มการทำงานของ Server API (รันที่พอร์ต 3001)
```

### ส่วนที่ 2: การรัน Frontend (Web)
(เปิด Terminal ใหม่)
```powershell
cd apps/web
Copy-Item .env.example .env.local
```
> ไฟล์ `.env.local` จะมีตัวแปร `NEXT_PUBLIC_API_URL=http://localhost:3001` เตรียมไว้ให้แล้ว หาก Backend ของคุณไม่ได้รันพอร์ต 3001 ให้ปรับตัวนี้เปลี่ยนตามครับ

หลังจากนั้นใช้คำสั่ง:
```powershell
yarn install           # ติดตั้ง Dependencies
yarn dev               # เริ่มการทำงานของ Frontend (รันที่พอร์ต 3000)
```

หน้าเว็บคุณพร้อมใช้งานที่ `http://localhost:3000`

---

## 🛠 ฟีเจอร์ที่สำคัญในระบบหลังการเข้าสู่ระบบ
- **Dashboard:** ดูสรุปกราฟและสถิติของงานทั้งหมด 
- **Work Orders (ใบสั่งงาน):** การสร้าง แจกจ่าย (Assign) และอัปเดตสเตตัสงานให้แก่ทีมช่าง
- **Dispatch Module:** ฟังก์ชันจ่ายงานแบบ Manual และการโยนงานจากคิวไปยังช่างเทคนิคแต่ละราย
- **GIS Monitor:** การติดตามพิกัดของงานแบบ Real-time บนแผนที่
- **Master Data:** การจัดการข้อมูลคลังอะไหล่, กลุ่มลูกค้า, บริการ, และการตั้งค่าระบบพื้นฐานของแอปทั้งหมด
- **API Swagger Documentation:** คุณสามารถดูและทดสอบระบบฐานข้อมูล 100% Native Prisma ได้ที่ `/api/docs`

---

## 🎬 ตัวอย่างการใช้งาน Flow (End-to-End Demo)

วิดีโอด้านล่างเป็นการจำลองการใช้งานระบบแบบ End-to-End ตั้งแต่สร้างใบสั่งงาน ไปจนถึงปิดงานสำเร็จ:

![E2E Demo: สร้างงาน → Dispatch → GIS → จบงาน](docs/demo-e2e-flow.webp)

### ขั้นตอนการทำงานของระบบ (Workflow)
1. **สร้างใบงาน (Create Work Order)** — กรอกข้อมูลงาน ลูกค้า พื้นที่ วัสดุอุปกรณ์ และกำหนด SLA
2. **จ่ายงาน (Dispatch)** — เลือกช่างเทคนิคที่เหมาะสมและ Assign งานแบบ Manual หรือ Auto
3. **ติดตามงานบนแผนที่ (GIS Monitor)** — ดูตำแหน่งงานและช่างเทคนิคแบบ Real-time
4. **ช่างรับงาน (Accept)** — ช่างเทคนิคกดรับงานจากระบบ
5. **เดินทาง (Traveling)** — อัปเดตสถานะเป็นกำลังเดินทางไปยังหน้างาน
6. **ถึงหน้างาน (On Site)** — ช่างถึงจุดปฏิบัติงานแล้ว
7. **ปฏิบัติงาน (Working)** — เริ่มดำเนินงาน
8. **ปิดงาน (Completed)** — กดจบงานเรียบร้อย งานจะย้ายไปแท็บ Completed
