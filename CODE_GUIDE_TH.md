# CinemaGo — คู่มืออ่านโค้ดและเตรียมพรีเซนต์

คู่มือนี้อ้างอิงโค้ดในเครื่องที่ปรับปรุงแล้ว โค้ดหลักมีคอมเมนต์ `CHECK 01` ถึง `CHECK 07` ให้ค้นหาได้ทันที
ข้อมูลตัวอย่างหนัง/รอบฉายมาจาก mock แต่สมาชิก session และการจองบันทึกใน SQLite จริง
ยังไม่มี payment gateway, การส่งอีเมล หรือ QR สำหรับเข้าโรงจริง

## 1. ตรวจข้อกำหนดทีละข้อ

| ข้อกำหนด | หลักฐาน | สถานะ |
| --- | --- | --- |
| Next.js App Router อย่างน้อย 4 routes | มี 8 routes ในตารางด้านล่าง | มีในโค้ด |
| Server + Client พร้อมเหตุผล | ตารางขอบเขตและคอมเมนต์ในไฟล์หลัก | มีในโค้ด |
| SSR/SSG/ISR แบบตั้งใจ | Home ใช้ `revalidate = 3600`; หน้ารายละเอียด/เลือกที่นั่งใช้ `getCatalogue()` + `connection()` | ISR + SSR |
| Mutation ผ่าน Server Action/Route Handler | สมัครสมาชิก เข้าสู่ระบบ ออกจากระบบ ยืนยันการจอง | มีในโค้ด |
| Global state ฝั่ง client | Context แชร์ booking draft ระหว่างเลือกที่นั่งกับ checkout | มีในโค้ด |
| react-hook-form + Zod | ฟอร์ม Register และ Checkout | มีในโค้ด |
| Responsive | หน้าแรก/เลือกที่นั่ง/checkout/ตั๋ว ใช้ grid และ breakpoint; ผังเลื่อนภายในได้ | มีในโค้ดและตรวจบนมือถือ |
| Deploy ขึ้น Vercel พร้อม URL ของเวอร์ชันล่าสุด | [CinemaGo](https://cinemago-final-project.vercel.app/) + Supabase แยกใน Sandwich ORG | **เชื่อมฐานข้อมูลออนไลน์แล้ว** |

**เวอร์ชันออนไลน์:** ใช้ Supabase Postgres project `yehxktdbumrifffobyii` ใน Sandwich ORG; สมัครบัญชีใหม่บนเว็บเพื่อเดโมได้ บัญชี SQLite เดิมยังอยู่ในเครื่อง ไม่มี payment gateway หรือการเรียกเก็บเงินจริง

### CHECK 08 — ฐานข้อมูลออนไลน์

เปิด [backend.ts](src/lib/backend.ts) และ [schema.sql](supabase/schema.sql)

Server Actions ใช้ adapter เดียว: เมื่อมี Supabase environment จะเรียก Postgres RPC; ในเครื่องที่ไม่มี credentials ยังใช้ SQLite เดิม Public catalogue เท่านั้นที่ fallback เป็น mock เมื่อฐานข้อมูลไม่พร้อม ส่วน auth/booking ต้องบันทึกจริงจึงจะสำเร็จ

RPC จองล็อกแถวรอบฉาย ตรวจจำนวน/สถานะที่นั่ง คิดราคาจากข้อมูลในฐานข้อมูล และบันทึก booking กับ seats ใน transaction เดียว มี unique constraint กันจองซ้ำ ทุกตารางเปิด RLS และไม่อนุญาต anon/authenticated role; server secret อยู่ใน Vercel environment เท่านั้น การ login ยังเป็น bcrypt + session cookie เดิม ไม่ใช่ Supabase Auth

Home ใช้ fetch cache และ revalidate 3600 วินาที ส่วนข้อมูลสมาชิก/ที่นั่ง/การจองใช้ no-store

## 2. Route map

| Route | หน้าที่ | ไฟล์ |
| --- | --- | --- |
| `/` | หนังที่กำลังฉายและรอบฉาย | [Home](src/app/page.tsx) |
| `/movies/[id]` | รายละเอียดหนังและรอบฉาย | [Movie detail](src/app/movies/[id]/page.tsx) |
| `/booking/[showtimeId]` | ตรวจสิทธิ์ โหลดที่นั่ง แล้วแสดงตัวเลือก | [Booking](src/app/booking/[showtimeId]/page.tsx) |
| `/checkout` | ตรวจสิทธิ์ แล้วเปิดฟอร์มยืนยัน | [Checkout page](src/app/checkout/page.tsx) |
| `/confirmation/[bookingId]` | แสดงการจองเฉพาะของเจ้าของบัญชี | [Confirmation](src/app/confirmation/[bookingId]/page.tsx) |
| `/my-ticket` | ประวัติการจองของบัญชีปัจจุบัน | [My tickets](src/app/my-ticket/page.tsx) |
| `/login` | เข้าสู่ระบบ | [Login](src/app/login/page.tsx) |
| `/register` | สมัครสมาชิกพร้อมตรวจฟอร์ม | [Register](src/app/register/page.tsx) |

`[id]` เป็น dynamic segment: โครงหน้าเดียวกันใช้แสดงหนังคนละเรื่องจาก ID
เส้นทางหลัก: หน้าแรก → หนัง → ที่นั่ง → checkout → confirmation → ตั๋วของฉัน

## 3. Key code blocks — อ่านตามลำดับนี้

### CHECK 01 — Server Component และจุดเริ่มอ่านข้อมูล

เปิด [HomePage](src/app/page.tsx#L6) และ [RootLayout](src/app/layout.tsx#L27)

`HomePage` เป็น Server Component ไม่มี `"use client"` และเรียก `readPublicCatalogue()` พร้อม `revalidate = 3600` เพื่อทำ ISR ทุกชั่วโมง ตามแนวทางของ commit `e9c82b6` ของเพื่อน
`RootLayout` ไม่อ่าน cookie เพื่อไม่บังคับ Home เป็น dynamic; `AuthProvider` ฝั่ง Client อ่านเฉพาะชื่อ/อีเมลจาก `/api/me` ซึ่งตอบ `Cache-Control: private, no-store` ไม่ส่ง password hash หรือ token ให้ browser
การครอบ `children` ด้วย Client Provider ไม่ได้เปลี่ยน Server Components ที่ส่งเข้ามาให้กลายเป็น Client ทั้งหมด

ลองตรวจเอง: เปิด source แล้วตามการ import จากหน้าแรกไป `lib/data.ts` และ `lib/database.ts`

### CHECK 02 — ทำไมเลือก ISR และ SSR

เปิด [getCatalogue](src/lib/data.ts#L7)

```ts
await connection();
return readPublicCatalogue();
```

`connection()` ทำให้รอ request ก่อนอ่าน SQLite จึงไม่ยึดสถานะที่นั่งจากตอน build
หน้า Home ใช้ ISR เพราะรายการหนังเปลี่ยนไม่บ่อย ส่วนหน้ารายละเอียดและเลือกที่นั่งใช้ SSR เพราะที่นั่งเปลี่ยนเมื่อมีการจอง React `cache()` ลดการอ่านซ้ำภายใน request เดียว ไม่ใช่ cache ถาวร และ Server Action ตรวจที่นั่งอีกครั้งตอนยืนยัน

เมื่ออ่านฐานข้อมูลไม่ได้ จะส่ง mock catalogue พร้อม `mode: "demo"` และ Layout แสดงแถบแจ้งเตือน
fallback นี้ใช้กับการอ่านข้อมูลสาธารณะเท่านั้น เขียนสมาชิกหรือจองไม่ได้แล้วจะรายงาน error ไม่สร้างความสำเร็จปลอม

ลองตรวจเอง: จองหนึ่งที่นั่งแล้วเปิดรอบฉายใหม่ ที่นั่งนั้นต้องกดไม่ได้
นี่เป็นข้อมูลล่าสุดเมื่อ request เข้ามา **ไม่ใช่ WebSocket แบบ push realtime**

### CHECK 03 — Global client state

เปิด [BookingProvider](src/components/BookingContext.tsx#L48) และ [proceed](src/components/SeatSelector.tsx#L36)

`setCheckout()` เก็บ draft ลง session storage และแจ้ง store ว่าข้อมูลเปลี่ยน
`BookingProvider` ใช้ `useSyncExternalStore` อ่าน snapshot แล้วส่ง `data / ready / setCheckout` ผ่าน Context
`SeatSelector` เป็นผู้เขียน draft และ `CheckoutForm` เป็นผู้อ่าน เมื่อจองสำเร็จจะล้าง draft

ใช้ snapshot เป็น string เพื่อให้ค่าคงที่ระหว่างข้อมูลไม่เปลี่ยน; server snapshot เป็น null เพื่อให้ hydration ตรงกัน
`readCheckoutDraft()` ตรวจข้อมูลจาก storage ด้วย Zod ป้องกัน JSON พัง/ข้อมูลเก่า/รูปแบบที่ไม่ถูกต้อง

ลองตรวจเอง: เลือก H-1 → ดำเนินการต่อ → รีเฟรช checkout → H-1 ยังอยู่
เปิด checkout โดยไม่มี draft ต้องเห็น “ยังไม่ได้เลือกที่นั่ง” ไม่เห็นตั๋วตัวอย่างปลอม

### CHECK 04 — ฟอร์มตรวจข้อมูลจริง

เปิด [Register schema](src/app/register/page.tsx#L13), [Checkout form](src/components/CheckoutForm.tsx#L28) และ [Shared booking validation](src/lib/booking-validation.ts)

```ts
useForm<BookingContact>({
  resolver: zodResolver(bookingContactSchema),
  defaultValues: { /* เริ่มจากข้อมูลว่าง */ },
});
```

React Hook Form จัดการ input, errors และสถานะกำลังส่ง; Zod กำหนดกติกา
Register ตรวจชื่อ อีเมล และรหัสผ่านอย่างน้อย 6 ตัวอักษร/ไม่เกิน 72 ไบต์ตาม bcrypt
Checkout ตรวจชื่อ อีเมล เบอร์โทร และตัวเลือกช่องทางชำระเงิน
Server ตรวจซ้ำเสมอ แม้ผู้ใช้ข้าม validation ใน browser

ลองตรวจเอง: ส่งฟอร์มว่าง → เห็น error แต่ละช่อง; กรอกอีเมลผิด/เบอร์สั้น → ส่งไม่ได้
เมื่อแก้ถูกต้องจึงเรียก Server Action ช่อง payment เป็นตัวเลือกสาธิต ไม่มีการกรอกบัตรจริง

### CHECK 05 — Mutation

เปิด [Checkout submit](src/components/CheckoutForm.tsx#L48) และ [createBookingAction](src/actions/booking.ts#L24)

```text
handleSubmit → createBookingAction → getCurrentUser
             → reserveSeats → revalidatePath → confirmation
```

Client ส่งข้อมูลติดต่อ showtimeId และ seat IDs; เซิร์ฟเวอร์เป็นผู้ตัดสินราคา หนัง รอบฉาย และสิทธิ์
Server Action ยืนยันผู้ใช้ก่อนเขียน แล้ว revalidate หน้าที่เกี่ยวข้องเพื่อให้ข้อมูลการจองเปลี่ยนตาม
การส่งฟอร์มไม่ได้เท่ากับการชำระเงินจริง: paymentStatus ยังคงเป็น pending

ลองตรวจเอง: จอง 2 ที่นั่ง Standard = 480 บาท ใช้ CINEMA50 = 430 บาท
หน้าสำเร็จและตั๋วของฉันต้องแสดงราคาเดียวกัน

### CHECK 06 — ป้องกันจองซ้ำและแก้ราคา

เปิด [reserveSeats](src/lib/database.ts#L147) และ [Schema constraints](src/lib/database.ts#L10)

```sql
PRIMARY KEY(showtime_id, seat_id)
BEGIN IMMEDIATE;
-- ตรวจที่นั่ง คำนวณราคา บันทึก booking และ seats
COMMIT;
```

ธุรกรรมทำให้การตรวจและบันทึกเป็นชุดเดียว ถ้ามีข้อผิดพลาดใช้ ROLLBACK
unique key ป้องกันที่นั่งเดียวในรอบเดียวถูกบันทึกซ้ำ
ราคาถูกคำนวณจาก inventory ฝั่งเซิร์ฟเวอร์ ไม่เชื่อราคาที่ browser ส่งมา
ทั้ง UI และ server จำกัด 8 ที่นั่งต่อรายการ

ลองตรวจเอง: `npm test` ครอบคลุมราคา ความเป็นเจ้าของ ที่นั่งซ้ำ การ rollback และข้อจำกัดจำนวนที่นั่ง

### CHECK 07 — Session และความเป็นเจ้าของ

เปิด [getCurrentUser](src/lib/auth.ts#L15), [Session functions](src/lib/database.ts#L111), [readBooking](src/lib/database.ts#L221) และ [Auth actions](src/lib/actions/auth.ts#L23)

รหัสผ่านเก็บเป็น bcrypt hash; cookie เก็บ random session token และฐานข้อมูลเก็บ SHA-256 hash ของ token
session มีอายุและ logout ลบ session ในฐานข้อมูล
อ่าน booking ด้วย `id AND user_id` จึงไม่สามารถเดารหัสแล้วอ่านของคนอื่นได้
การตรวจ cookie ใน middleware เป็นแค่ redirect เบื้องต้น หน้าฝั่ง server และ actions ตรวจ session จริงอีกชั้น

ลองตรวจเอง: logout แล้วเปิด confirmation เดิม → ไม่แสดงข้อมูลการจอง
บัญชีอื่นต้องไม่เห็นรายการใน My Tickets และอ่าน confirmation ของเจ้าของเดิมไม่ได้

## 4. Server / Client ของแต่ละส่วน

| ส่วน | Boundary | เหตุผล |
| --- | --- | --- |
| Layout, Home, Movie detail | Server | อ่าน session/ฐานข้อมูลก่อนส่งข้อมูลแสดงผล |
| Booking / Checkout page | Server | ตรวจสิทธิ์ก่อนส่ง props ให้ interactive components |
| Confirmation / My tickets / TicketCard | Server | อ่านเฉพาะข้อมูลเจ้าของ แล้วแสดงผล ไม่มี browser state |
| NotFound | Server | แสดงผลเมื่อไม่พบข้อมูลหรือไม่มีสิทธิ์ |
| Navbar | Client | ใช้ usePathname เพื่อแสดงเมนูปัจจุบัน |
| SeatSelector | Client | รับ click และเก็บ selected seats |
| BookingContext | Client | แชร์ draft และเข้าถึง session storage |
| CheckoutForm | Client | ควบคุมฟอร์ม โค้ดส่วนลด และสถานะ submit |
| Login / Register | Client | จัดการ form state, action feedback และ validation |

Client Components ยังอาจถูก prerender HTML ฝั่ง server ก่อน hydration
`"use client"` กำหนดขอบเขต JavaScript ฝั่ง browser ไม่ได้หมายความว่าไม่มี HTML ตอนแรก

## 5. วิธีตรวจและเดโมด้วยตัวเอง

```powershell
npm ci
npm run db:init
npm test
npm run lint
npm run build
npm start
```

1. เปิด http://localhost:3000 ดูหน้าแรกและรายละเอียดหนัง
2. สมัครสมาชิกใหม่ ลองข้อมูลผิดก่อน แล้วสมัครด้วยข้อมูลถูกต้อง
3. เข้าสู่ระบบ เลือกรอบฉาย ลองเลือก/ยกเลิกที่นั่งและกดที่นั่งที่จองแล้ว
4. ไป checkout แล้วรีเฟรช ตรวจว่าที่นั่งยังอยู่
5. ส่งฟอร์มว่าง ดู errors จาก RHF + Zod
6. กรอกข้อมูล ใช้ CINEMA50 แล้วกดยืนยัน
7. ดู confirmation และ My Tickets ตรวจ seat IDs และยอดรวม
8. กลับไปผัง ตรวจว่าที่นั่งที่จองแล้วกดไม่ได้
9. ออกจากระบบ แล้วตรวจ protected routes
10. ลองหน้าจอ 320/390px และ desktop; ผังที่นั่งเลื่อนในกรอบได้โดยไม่ทำให้ทั้งหน้าเลื่อนแนวนอน

ทดสอบ fallback โดยหยุด server ก่อน:
```powershell
$env:CINEMAGO_DATA_MODE='mock'
npm start
# หลังหยุด server:
Remove-Item Env:CINEMAGO_DATA_MODE
```
ต้องมี banner แสดงโหมดตัวอย่าง หนังยังแสดง แต่สมัคร/จองต้องไม่สำเร็จปลอม

## 6. ใช้พูดพรีเซนต์ตามเกณฑ์ 4 คะแนน

- **แอป/ผู้ใช้/ปัญหา:** “CinemaGo เป็นเว็บสำหรับคนที่ต้องการเลือกรอบฉาย เลือกที่นั่ง และติดตามการจองในบัญชีเดียว”
- **ผังหน้า:** ใช้ตาราง route และเดโมเส้นทางตั้งแต่หน้าแรกถึง My Tickets
- **Server/Client:** เปิด Home/data แล้วเทียบกับ SeatSelector/Context/CheckoutForm บอกเหตุผลว่าทำไมข้อมูลอยู่ server และ click/form อยู่ client
- **แหล่งข้อมูล/Mutation:** เปิด database.ts และ createBookingAction อธิบาย SQLite, transaction, server pricing และ mock fallback
- **แบ่งงานสองคน:** ใส่ชื่อและงานที่แต่ละคนทำจริง ตัวอย่างแบ่งหัวข้อพูด: คนหนึ่งอธิบาย UI/routes/Client อีกคนอธิบาย SSR/database/auth/mutation ไม่ควรอ้างว่าเป็นผู้ทำโค้ดโดยไม่มีข้อเท็จจริง

## 7. สถานะออนไลน์และข้อจำกัด

- Deploy แล้วใน project ใหม่ `cinemago-final-project`: https://cinemago-final-project.vercel.app/ โดยใช้ source ล่าสุดในเครื่อง ไม่ได้ push GitHub หรือเชื่อม automatic deployment
- ใช้ Supabase แยกใน Sandwich ORG แล้ว; SQLite ยังเป็นทางเลือกสำหรับรันในเครื่อง
- Server-only environment ถูกตั้งใน Vercel ไม่ได้ใส่ secret ใน browser หรือ repository
- ระบบรับจองตั๋วเพื่อสาธิต ไม่มีการเรียกเก็บเงินจริงหรือส่งอีเมล
- อย่าใช้ `data/cinemago.sqlite` ใน filesystem ของ Vercel Functions เป็นที่เก็บข้อมูลถาวร: [คำอธิบายจาก Vercel](https://vercel.com/kb/guide/is-sqlite-supported-in-vercel)
- ไม่ได้นำฐานข้อมูลหรือบัญชี test ขึ้น Vercel แชร์ source ใน branch `feat/local-sqlite-backend` และไม่ได้ใช้ Windsurf organisation

ขอบเขตระบบสาธิต: ไม่มี payment gateway/email service/การยกเลิกหรือคืนเงิน/seat hold ระหว่างเลือก
dependency audit ที่รายงานก่อนหน้านี้มี 5 high findings ใน ESLint toolchain; ไม่ได้ใช้ force downgrade เพื่อแก้

## ผลตรวจเวอร์ชันนี้ (10 ตุลาคม 2026)

- Production build ผ่าน: `/` เป็น Static พร้อม Revalidate 1h; `/movies/[id]` และเส้นทางจองเป็น Dynamic/server-rendered on demand
- ESLint ผ่าน ไม่มี error หรือ warning
- Automated tests ผ่าน 3 tests ครอบคลุม validation, storage และ database invariants หลายกรณี
- Browser: signup/login, checkout ว่าง, เลือกที่นั่ง, refresh, form errors, promo, จองสำเร็จ, ticket history, inventory หลังจอง, logout/privacy และ mock write failure ผ่าน
- Responsive: ตรวจ 320px/390px และ desktop 1280px; หน้าที่ตรวจไม่มี document overflow แนวนอน
- Browser tests ใช้ฐานข้อมูลแยกใน work/; ฐานข้อมูลหลักยังมี users=0 และ bookings=0
- Build ยังเตือนชื่อ middleware ที่เลิกแนะนำใน Next 16 และ Node 22 เตือนสถานะ experimental ของ SQLite; ไม่ใช่ build failure
- Vercel production deployment READY (`dpl_DRsWDXYGwrzTtinYpf2k5oanxoCo`), Next.js / Node 22, build ประมาณ 40 วินาที; audit tooling findings ที่กล่าวไว้ก่อนหน้ายังไม่ได้แก้
- Build/runtime logs API ของ connector ตอบ 403 จึงไม่ได้ยืนยันว่า logs ไม่มี error; ตรวจ public HTTP แยกจากสถานะ READY
