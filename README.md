# LifeOS - نظام إدارة الحياة الشخصية

<div align="center">

![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-2.0-3FCF8E?style=flat-square&logo=supabase)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=flat-square&logo=vite)

**نظام شامل لإدارة حياتك الشخصية والمهنية**

[English](#english) | [العربية](#العربية)

</div>

---

## العربية

### 📋 نظرة عامة

LifeOS هو تطبيق ويب متكامل لإدارة جميع جوانب حياتك الشخصية والمهنية في مكان واحد. يوفر لوحة تحكم شاملة مع أدوات لإدارة المشاريع، المهام، العادات، المالية، التعلم، والمزيد.

### ✨ الميزات الرئيسية

| الميزة | الوصف |
|--------|--------|
| 📊 **لوحة التحكم** | نظرة شاملة على جميع أنشطتك ومهامك اليومية |
| 📁 **إدارة المشاريع** | تنظيم المشاريع مع تتبع التقدم والميزانية |
| ✅ **إدارة المهام** | لوحة Kanban مع السحب والإفلات وتتبع الوقت |
| ⏱️ **وضع التركيز** | تقنية Pomodoro مع إحصائيات الإنتاجية |
| 🔄 **تتبع العادات** | بناء عادات إيجابية مع تتبع السلاسل |
| 💰 **إدارة المالية** | تتبع الدخل والمصروفات مع رسوم بيانية |
| 📅 **التقويم** | جدولة المواعيد والأحداث |
| 👥 **إدارة العملاء** | قاعدة بيانات العملاء والاشتراكات |
| 💳 **الاشتراكات الشخصية** | تتبع اشتراكاتك الشهرية |
| 📝 **الملاحظات** | تدوين الملاحظات مع التنظيم بالمجلدات |
| 📚 **التعلم** | تتبع الدورات والدروس |
| 📖 **الكتب والبودكاست** | قائمة القراءة والاستماع |
| 🎬 **الأفلام والمسلسلات** | قائمة المشاهدة |
| 📈 **التحليلات** | إحصائيات وتقارير شاملة |
| 🤖 **الذكاء الاصطناعي** | مساعد ذكي للإنتاجية |
| 📱 **بوت تيليجرام** | إشعارات وتحكم عبر تيليجرام |

### 🛠️ التقنيات المستخدمة

#### Frontend
- **React 18** - مكتبة واجهة المستخدم
- **TypeScript** - للكتابة الآمنة
- **Vite** - أداة البناء السريعة
- **Tailwind CSS** - للتنسيق
- **Shadcn/UI** - مكونات واجهة المستخدم
- **Radix UI** - مكونات أساسية
- **Recharts** - الرسوم البيانية
- **Framer Motion** - الحركات والتأثيرات

#### State Management
- **Zustand** - إدارة الحالة العامة
- **TanStack Query** - إدارة البيانات والتخزين المؤقت

#### Backend
- **Supabase** - قاعدة البيانات والمصادقة
- **PostgreSQL** - قاعدة البيانات
- **Edge Functions** - الوظائف السحابية
- **Row Level Security** - أمان على مستوى الصفوف

### 📦 المتطلبات

- Node.js 18 أو أحدث
- npm أو bun أو yarn
- حساب Supabase (Cloud أو Self-Hosted)

### 🚀 التثبيت السريع

```bash
# 1. استنساخ المشروع
git clone https://github.com/YOUR_USERNAME/lifeos.git
cd lifeos

# 2. تثبيت الحزم
npm install
# أو
bun install

# 3. إعداد متغيرات البيئة
cp .env.example .env
# قم بتعديل .env بمفاتيح Supabase الخاصة بك

# 4. تشغيل التطبيق محلياً
npm run dev
```

### 🖥️ التثبيت على VPS

للحصول على دليل تفصيلي للتثبيت على خادم VPS، راجع:

📖 **[دليل التثبيت الكامل (DEPLOYMENT.md)](./DEPLOYMENT.md)**

يشمل الدليل:
- إعداد الخادم (Ubuntu/Debian/CentOS)
- تثبيت وإعداد Nginx أو Caddy
- شهادات SSL مع Let's Encrypt
- إعداد Supabase (Cloud أو Self-Hosted)
- نشر Edge Functions
- التحديثات التلقائية
- استكشاف الأخطاء وإصلاحها

### ⚙️ متغيرات البيئة

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

### 🗄️ قاعدة البيانات

#### الجداول الرئيسية

| الجدول | الوصف |
|--------|--------|
| `profiles` | بيانات المستخدمين |
| `projects` | المشاريع |
| `tasks` | المهام |
| `habits` | العادات |
| `habit_completions` | سجل إكمال العادات |
| `transactions` | المعاملات المالية |
| `clients` | العملاء |
| `subscriptions` | اشتراكات العملاء |
| `personal_subscriptions` | الاشتراكات الشخصية |
| `notes` | الملاحظات |
| `courses` | الدورات التعليمية |
| `lessons` | الدروس |
| `focus_sessions` | جلسات التركيز |
| `books_podcasts` | الكتب والبودكاست |
| `movies_series` | الأفلام والمسلسلات |

#### تشغيل الـ Migrations

```bash
# باستخدام Supabase CLI
supabase db push

# أو تشغيل ملفات SQL يدوياً من مجلد
supabase/migrations/
```

### 🔌 Edge Functions

| الوظيفة | الوصف |
|---------|--------|
| `ai-chat` | محادثة مع الذكاء الاصطناعي |
| `gemini-chat` | دعم Google Gemini AI |
| `telegram-bot` | بوت تيليجرام للإشعارات |

#### نشر Edge Functions

```bash
# تثبيت Supabase CLI
npm install -g supabase

# تسجيل الدخول
supabase login

# نشر الوظائف
supabase functions deploy ai-chat
supabase functions deploy gemini-chat
supabase functions deploy telegram-bot

# إعداد المتغيرات السرية
supabase secrets set GEMINI_API_KEY=your-api-key
```

### 📁 هيكل المشروع

```
lifeos/
├── public/                 # الملفات الثابتة
├── src/
│   ├── components/         # مكونات React
│   │   ├── ui/            # مكونات Shadcn/UI
│   │   ├── layout/        # مكونات التخطيط
│   │   ├── dashboard/     # ودجات لوحة التحكم
│   │   ├── tasks/         # مكونات المهام
│   │   ├── finance/       # مكونات المالية
│   │   └── ...
│   ├── contexts/          # React Contexts
│   ├── hooks/             # Custom Hooks
│   ├── pages/             # صفحات التطبيق
│   ├── stores/            # Zustand Stores
│   ├── lib/               # أدوات مساعدة
│   └── integrations/      # تكامل Supabase
├── supabase/
│   ├── functions/         # Edge Functions
│   ├── migrations/        # Database Migrations
│   └── config.toml        # إعدادات Supabase
├── .env.example           # مثال متغيرات البيئة
├── DEPLOYMENT.md          # دليل التثبيت
└── README.md              # هذا الملف
```

### 🤝 المساهمة

نرحب بمساهماتكم! للمساهمة:

1. Fork المشروع
2. أنشئ فرع جديد (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push للفرع (`git push origin feature/amazing-feature`)
5. افتح Pull Request

### 📄 الترخيص

هذا المشروع مرخص تحت [MIT License](LICENSE).

---

## English

### 📋 Overview

LifeOS is a comprehensive web application for managing all aspects of your personal and professional life in one place. It provides a complete dashboard with tools for managing projects, tasks, habits, finances, learning, and more.

### ✨ Key Features

- **Dashboard** - Complete overview of all your activities and daily tasks
- **Project Management** - Organize projects with progress and budget tracking
- **Task Management** - Kanban board with drag-and-drop and time tracking
- **Focus Mode** - Pomodoro technique with productivity statistics
- **Habit Tracking** - Build positive habits with streak tracking
- **Finance Management** - Track income and expenses with charts
- **Calendar** - Schedule appointments and events
- **Client Management** - Client database and subscriptions
- **Personal Subscriptions** - Track your monthly subscriptions
- **Notes** - Note-taking with folder organization
- **Learning** - Track courses and lessons
- **Books & Podcasts** - Reading and listening list
- **Movies & Series** - Watchlist management
- **Analytics** - Comprehensive statistics and reports
- **AI Assistant** - Smart productivity assistant
- **Telegram Bot** - Notifications and control via Telegram

### 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/lifeos.git
cd lifeos

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase keys

# Run development server
npm run dev
```

### 🖥️ VPS Deployment

For detailed VPS deployment instructions, see:

📖 **[Full Deployment Guide (DEPLOYMENT.md)](./DEPLOYMENT.md)**

### 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

**Made with ❤️ using React, TypeScript, and Supabase**

</div>
