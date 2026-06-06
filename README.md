# 🍕 مستر بيتزا | Mr Pizza

موقع مطعم عصري كامل (Full-Stack) للبيتزا والأكلات السريعة، عربي RTL بالكامل، مع لوحة إدارة شاملة.
نظام طلبات + منيو + سلة + تتبّع + فاتورة + لوحة تحكم.

A complete, production-ready restaurant ordering platform built with **Next.js App Router**, **TypeScript**, **Tailwind CSS**, and **Supabase**.

---

## ✨ المميزات

- 🎨 تصميم عصري فخم بالعربية (RTL) — ألوان أحمر/أصفر/أسود/أبيض، حركات ناعمة، تجربة موبايل ممتازة.
- 🛒 منيو كامل بأقسام، تخصيص الحجم والإضافات، سلة، كوبونات خصم.
- 📦 إتمام الطلب مع توصيل **داخل المدينة/القضاء فقط** (لا محافظات)، تحديد GPS اختياري، دفع كاش/بطاقة.
- 🔎 تتبّع الطلب عبر الكود أو رقم الهاتف، مع مخطط حالات (٧ حالات).
- 🧾 فاتورة عربية قابلة للطباعة (A4 + حراري 80mm) وحفظ PDF.
- 🛠️ لوحة إدارة كاملة: إحصائيات، منيو، أقسام، طلبات، كوبونات، بانرات، إعدادات المطعم.
- 🔐 أمان: Supabase RLS، حماية API، Validation بـ Zod، حماية لوحة الإدارة.
- 📱 PWA + SEO + Open Graph + Sitemap + Robots + Skeletons + Toasts.

## 🆕 مميزات التحديث الأخير

- 🔔 **إشعار صوتي + عدّاد** للطلبات الجديدة في لوحة الإدارة (فحص كل 5 ثوانٍ، صوت عبر Web Audio بدون مكتبات، زر تفعيل/إيقاف).
- 📋 **تحسين صفحة الطلبات:** فلاتر سريعة، بحث، تمييز الطلبات الجديدة، نسخ الكود، فتح موقع الزبون، طباعة الفاتورة، **تصدير CSV/JSON** بفلترة التاريخ والحالة.
- 🧾 **فاتورة حرارية 80mm محسّنة** مع `@page` للطباعة و**QR للتتبّع** (تصميم A4 لم يتغيّر).
- 💳 **دفع QR (ماستر كارد):** رفع صورة QR من الإعدادات، عرضها في الدفع، وحالة «بانتظار تأكيد الدفع».
- 📊 **إحصائيات متقدمة:** مبيعات اليوم/الأسبوع/الشهر، متوسط الطلب، الملغية، أكثر 5 منتجات/أقسام، رسم 7 أيام (بدون مكتبات).
- 🖼️ **عدة صور للمنتج** (رئيسية/حذف/ترتيب) + معرض في صفحة المنتج (`object-contain`).
- ⭐ **تقييم العملاء بعد التسليم** من صفحة التتبّع، اعتماد/إخفاء من الإدارة، وعرض المعتمدة في الرئيسية.
- 🔕 **إشعارات الطلب للزبون** من صفحة التتبّع (Web Notifications؛ بديل Toast). لتفعيل Push الخادمي أضف `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (اختياري).

> التوصيل بقي **داخل المدينة / القضاء فقط** بلا محافظات، مع رسالة الرفض خارج النطاق. التصميم لم يتغيّر — كل الإضافات تستخدم نفس الـ tokens.

## 🧱 التقنيات

`Next.js 15 (App Router)` · `React 19` · `TypeScript` · `Tailwind CSS` · `Supabase (DB/Auth/Storage)` ·
`Zod` · `React Hook Form` · `Zustand` · `PWA` · `Vercel Ready`

---

## 🚀 التشغيل المحلي

```bash
npm install
cp .env.example .env.local   # ثم املأ المفاتيح
npm run dev                  # http://localhost:3000
```

> **وضع المعاينة:** يعمل الموقع فوراً ببيانات تجريبية حتى قبل ربط Supabase، لتتمكّن من رؤية التصميم.
> ربط Supabase يفعّل التخزين الحقيقي ولوحة الإدارة.

## 🗄️ إعداد Supabase

1. أنشئ مشروعاً على [supabase.com](https://supabase.com).
2. من **Project Settings → API** انسخ القيم إلى `.env.local`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...        # سرّي — للخادم فقط
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_WHATSAPP_NUMBER=9647700000000
   ```

3. افتح **SQL Editor** ونفّذ كامل ملف [`supabase/schema.sql`](supabase/schema.sql).
   ينشئ كل الجداول، الأنواع، المحفّزات، سياسات RLS، حاوية التخزين، وبيانات أولية.

   **⚠️ لقاعدة بيانات قائمة مسبقاً (ترقية المميزات):** نفّذ ملف الترحيل الآمن
   [`supabase/migrations/0001_features.sql`](supabase/migrations/0001_features.sql) **مرة واحدة**.
   يضيف (بدون حذف أي بيانات): `product_images`, `reviews`, `push_subscriptions`,
   حالة الدفع «بانتظار تأكيد الدفع»، وأعمدة الإعدادات الجديدة
   (`closed_message`, `map_url`, `qr_payment_image_url`, `sound_alerts`) و`orders.reviewed_at`.
   يستخدم `add column if not exists` و`create table if not exists` و`drop policy if exists` — آمن للتكرار.

4. أنشئ مستخدم المدير:
   - من **Authentication → Users → Add user** (بريد + كلمة مرور).
   - ثم في SQL Editor امنحه صلاحية الإدارة:
     ```sql
     insert into public.users (id, email, role)
     select id, email, 'admin' from auth.users where email = 'admin@example.com';
     ```

5. ادخل لوحة الإدارة على `/admin/login`.

## 🔐 الأمان (RLS)

| الجداول | القراءة | الكتابة |
|---|---|---|
| الأقسام/المنتجات/الأحجام/الإضافات/الإعدادات/البانرات/الكوبونات | عامة (للزوار) | المدير فقط |
| الطلبات/عناصر الطلب/الفواتير | المدير فقط | إنشاء عبر `service_role` في API |
| users | المستخدم لسجلّه + المدير | المدير فقط |

إنشاء الطلبات يمر عبر `POST /api/orders` الذي يعيد حساب كل المبالغ على الخادم (لا يثق بأرقام العميل)
ويتحقق من الكوبون والحد الأدنى وحالة المطعم.

## 🗂️ بنية المشروع

```
src/
├── app/
│   ├── (site)/            # واجهة الزبائن: الرئيسية، المنيو، المنتج، السلة، الدفع، التتبّع، العروض، من نحن
│   ├── admin/            # لوحة الإدارة (login + لوحة محمية)
│   ├── api/              # orders, orders/track, coupon
│   ├── invoice/[id]/     # الفاتورة القابلة للطباعة
│   ├── robots.ts · sitemap.ts · layout.tsx · globals.css
├── components/           # layout, home, menu, product, cart, checkout, track, offers, invoice, admin, ui
├── lib/
│   ├── data/             # queries (Supabase) + seed (معاينة) + orders + memoryStore
│   ├── store/            # cart (Zustand) + toast
│   ├── supabase/         # client · server · admin · middleware · env
│   ├── types.ts · utils.ts · validation.ts (Zod)
└── middleware.ts         # حماية /admin
supabase/schema.sql       # قاعدة البيانات الكاملة + RLS + Seed
public/                   # manifest, sw.js, icon
```

## 🎨 نظام التصميم

كل الألوان والمسافات والخطوط معرّفة كـ tokens في [`tailwind.config.ts`](tailwind.config.ts) و[`globals.css`](src/app/globals.css).
**⚠️ لا تغيّر هذه القيم بعد الإطلاق.** أي إضافة جديدة يجب أن تستخدم نفس الأصناف (`.btn-primary`, `.card`, `.field`, `.badge` ...)
والألوان (`brand-red`, `brand-yellow`, `ink`, `cream`) لتبقى الواجهة متناسقة.

## ☁️ النشر على Vercel

1. ارفع المشروع إلى GitHub.
2. استورده في [Vercel](https://vercel.com) (يكتشف Next.js تلقائياً).
3. أضف متغيّرات البيئة نفسها (من `.env.local`) في إعدادات المشروع.
4. اضبط `NEXT_PUBLIC_SITE_URL` على نطاق الإنتاج.
5. Deploy 🚀

## 📜 الأوامر

```bash
npm run dev        # تطوير
npm run build      # بناء الإنتاج
npm run start      # تشغيل الإنتاج
npm run typecheck  # فحص الأنواع
```

---

صُمّم بحب 🍕 — **مستر بيتزا | Mr Pizza**
