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

### 🗄️ قاعدة البيانات | Database Schema

#### الجداول الرئيسية | Main Tables

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
| `user_categories` | الفئات المخصصة |
| `user_currency_rates` | أسعار الصرف |
| `user_nav_order` | ترتيب القائمة |

---

### 📊 Full Database Schema

<details>
<summary><strong>👤 profiles</strong> - User profiles and settings</summary>

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  notification_email TEXT,
  email_notifications_enabled BOOLEAN DEFAULT false,
  telegram_enabled BOOLEAN DEFAULT false,
  telegram_chat_id TEXT,
  telegram_bot_token TEXT,
  notification_time TIME DEFAULT '08:00:00',
  gemini_api_key TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```
</details>

<details>
<summary><strong>📁 projects</strong> - Project management</summary>

```sql
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status project_status DEFAULT 'new',
  priority priority_level DEFAULT 'medium',
  category TEXT DEFAULT 'General',
  color TEXT DEFAULT '#0EA5E9',
  progress INTEGER DEFAULT 0,
  due_date DATE,
  budget NUMERIC,
  actual_cost NUMERIC DEFAULT 0,
  client_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);
```
</details>

<details>
<summary><strong>✅ tasks</strong> - Task management with Kanban support</summary>

```sql
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status task_status DEFAULT 'todo',
  priority priority_level DEFAULT 'medium',
  due_date DATE,
  estimated_time NUMERIC,
  actual_time NUMERIC DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  project_id UUID,
  parent_task_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);
```
</details>

<details>
<summary><strong>🎯 habits & habit_completions</strong> - Habit tracking</summary>

```sql
CREATE TABLE public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT '⭐',
  color TEXT DEFAULT '#0EA5E9',
  frequency habit_frequency DEFAULT 'daily',
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL,
  user_id UUID NOT NULL,
  completed_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own habits" ON public.habits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD their own habit_completions" ON public.habit_completions FOR ALL USING (auth.uid() = user_id);
```
</details>

<details>
<summary><strong>💰 transactions</strong> - Financial tracking</summary>

```sql
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type transaction_type NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  description TEXT DEFAULT '',
  date DATE DEFAULT CURRENT_DATE,
  status transaction_status DEFAULT 'paid',
  project_id UUID,
  client_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);
```
</details>

<details>
<summary><strong>👥 clients</strong> - Client management</summary>

```sql
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  status client_status DEFAULT 'lead',
  notes TEXT DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own clients" ON public.clients FOR ALL USING (auth.uid() = user_id);
```
</details>

<details>
<summary><strong>🔄 subscriptions</strong> - Client subscriptions (services you provide)</summary>

```sql
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_id UUID NOT NULL,
  name TEXT NOT NULL,
  type subscription_type DEFAULT 'support',
  amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  billing_cycle billing_cycle DEFAULT 'monthly',
  start_date DATE DEFAULT CURRENT_DATE,
  next_payment_date DATE DEFAULT CURRENT_DATE,
  status subscription_status DEFAULT 'active',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own subscriptions" ON public.subscriptions FOR ALL USING (auth.uid() = user_id);
```
</details>

<details>
<summary><strong>💳 personal_subscriptions</strong> - Personal subscriptions (services you pay for)</summary>

```sql
CREATE TABLE public.personal_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  billing_cycle TEXT DEFAULT 'monthly',
  category TEXT DEFAULT 'other',
  next_payment_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active',
  url TEXT,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.personal_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own personal_subscriptions" ON public.personal_subscriptions FOR ALL USING (auth.uid() = user_id);
```
</details>

<details>
<summary><strong>📝 notes</strong> - Note-taking with folders</summary>

```sql
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  folder TEXT DEFAULT 'General',
  is_pinned BOOLEAN DEFAULT false,
  project_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own notes" ON public.notes FOR ALL USING (auth.uid() = user_id);
```
</details>

<details>
<summary><strong>📚 courses & lessons</strong> - Learning management</summary>

```sql
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  platform TEXT,
  instructor TEXT,
  status TEXT DEFAULT 'not-started',
  total_lessons INTEGER DEFAULT 0,
  completed_lessons INTEGER DEFAULT 0,
  target_date DATE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  section TEXT,
  duration_minutes INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own courses" ON public.courses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD their own lessons" ON public.lessons FOR ALL USING (auth.uid() = user_id);
```
</details>

<details>
<summary><strong>📖 books_podcasts</strong> - Reading & listening list</summary>

```sql
CREATE TABLE public.books_podcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'book',
  status TEXT DEFAULT 'to-consume',
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.books_podcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own books_podcasts" ON public.books_podcasts FOR ALL USING (auth.uid() = user_id);
```
</details>

<details>
<summary><strong>🎬 movies_series</strong> - Watch list</summary>

```sql
CREATE TABLE public.movies_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'movie',
  status TEXT DEFAULT 'to-watch',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.movies_series ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own movies_series" ON public.movies_series FOR ALL USING (auth.uid() = user_id);
```
</details>

<details>
<summary><strong>🎯 focus_sessions</strong> - Pomodoro & focus tracking</summary>

```sql
CREATE TABLE public.focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  task_id UUID,
  session_type TEXT DEFAULT 'focus',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own focus_sessions" ON public.focus_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own focus_sessions" ON public.focus_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own focus_sessions" ON public.focus_sessions FOR UPDATE USING (auth.uid() = user_id);
```
</details>

<details>
<summary><strong>⚙️ user_categories</strong> - Custom categories</summary>

```sql
CREATE TABLE public.user_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#0EA5E9',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.user_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own categories" ON public.user_categories FOR ALL USING (auth.uid() = user_id);
```
</details>

<details>
<summary><strong>💱 user_currency_rates</strong> - Currency exchange rates</summary>

```sql
CREATE TABLE public.user_currency_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  usd_to_eur NUMERIC DEFAULT 0.82,
  eur_to_dzd NUMERIC DEFAULT 275,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.user_currency_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own rates" ON public.user_currency_rates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own rates" ON public.user_currency_rates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own rates" ON public.user_currency_rates FOR UPDATE USING (auth.uid() = user_id);
```
</details>

<details>
<summary><strong>📋 user_nav_order</strong> - Navigation order customization</summary>

```sql
CREATE TABLE public.user_nav_order (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nav_order TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.user_nav_order ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own nav order" ON public.user_nav_order FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own nav order" ON public.user_nav_order FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own nav order" ON public.user_nav_order FOR UPDATE USING (auth.uid() = user_id);
```
</details>

---

### 🔢 Database Enums

```sql
-- Priority levels
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');

-- Project status
CREATE TYPE project_status AS ENUM ('new', 'in_progress', 'on_hold', 'completed', 'cancelled');

-- Task status
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'done');

-- Client status
CREATE TYPE client_status AS ENUM ('lead', 'active', 'inactive', 'archived');

-- Transaction type
CREATE TYPE transaction_type AS ENUM ('income', 'expense');

-- Transaction status
CREATE TYPE transaction_status AS ENUM ('pending', 'paid', 'cancelled');

-- Billing cycle
CREATE TYPE billing_cycle AS ENUM ('monthly', 'quarterly', 'yearly');

-- Subscription type
CREATE TYPE subscription_type AS ENUM ('support', 'hosting', 'maintenance', 'other');

-- Subscription status
CREATE TYPE subscription_status AS ENUM ('active', 'paused', 'cancelled', 'expired');

-- Habit frequency
CREATE TYPE habit_frequency AS ENUM ('daily', 'weekly', 'monthly');
```

---

### 🔧 Database Functions

```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Repeat for other tables...
```

---

### 🗺️ Entity Relationship Diagram

```
┌─────────────────┐
│     profiles    │
│─────────────────│
│ id (PK)         │◄─────────────────────────────────────────────────────┐
│ full_name       │                                                       │
│ avatar_url      │                                                       │
│ timezone        │                                                       │
│ telegram_*      │                                                       │
└─────────────────┘                                                       │
        │                                                                 │
        │ user_id                                                         │
        ▼                                                                 │
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐      │
│     clients     │     │    projects     │     │      tasks      │      │
│─────────────────│     │─────────────────│     │─────────────────│      │
│ id (PK)         │◄────│ client_id (FK)  │     │ id (PK)         │      │
│ user_id         │     │ id (PK)         │◄────│ project_id (FK) │      │
│ name            │     │ user_id         │     │ user_id         │      │
│ email           │     │ title           │     │ title           │      │
│ company         │     │ status          │     │ status          │      │
│ status          │     │ budget          │     │ priority        │      │
└─────────────────┘     │ progress        │     │ parent_task_id  │◄─┐   │
        │               └─────────────────┘     └─────────────────┘  │   │
        │                       │                       │            │   │
        │                       │                       └────────────┘   │
        ▼                       ▼                                        │
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐      │
│  subscriptions  │     │  transactions   │     │ focus_sessions  │      │
│─────────────────│     │─────────────────│     │─────────────────│      │
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │      │
│ client_id (FK)  │     │ project_id (FK) │     │ task_id (FK)    │──────┤
│ user_id         │     │ client_id (FK)  │     │ user_id         │      │
│ amount          │     │ amount          │     │ duration        │      │
│ billing_cycle   │     │ type            │     │ completed       │      │
│ status          │     │ category        │     └─────────────────┘      │
└─────────────────┘     └─────────────────┘                              │
                                                                         │
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐      │
│     habits      │     │     courses     │     │      notes      │      │
│─────────────────│     │─────────────────│     │─────────────────│      │
│ id (PK)         │◄─┐  │ id (PK)         │◄─┐  │ id (PK)         │      │
│ user_id         │  │  │ user_id         │  │  │ user_id         │──────┤
│ name            │  │  │ title           │  │  │ title           │      │
│ frequency       │  │  │ platform        │  │  │ folder          │      │
│ current_streak  │  │  │ status          │  │  │ project_id (FK) │      │
└─────────────────┘  │  └─────────────────┘  │  └─────────────────┘      │
        │            │          │            │                           │
        │            │          │            │                           │
        ▼            │          ▼            │                           │
┌─────────────────┐  │  ┌─────────────────┐  │                           │
│habit_completions│  │  │     lessons     │  │                           │
│─────────────────│  │  │─────────────────│  │                           │
│ id (PK)         │  │  │ id (PK)         │  │                           │
│ habit_id (FK)   │──┘  │ course_id (FK)  │──┘                           │
│ user_id         │     │ user_id         │──────────────────────────────┘
│ completed_date  │     │ title           │
└─────────────────┘     │ is_completed    │
                        └─────────────────┘
```

---

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
