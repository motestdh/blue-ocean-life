# 🚀 دليل تثبيت LifeOS على سيرفر VPS

## المتطلبات الأساسية

### متطلبات السيرفر
- **نظام التشغيل**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- **RAM**: 2GB كحد أدنى (4GB موصى به)
- **CPU**: 1 vCPU كحد أدنى (2 vCPU موصى به)
- **مساحة التخزين**: 20GB كحد أدنى
- **Node.js**: الإصدار 18 أو أحدث
- **npm** أو **bun**: لإدارة الحزم

### متطلبات قاعدة البيانات
- **Supabase Cloud** (موصى به) أو
- **PostgreSQL 15+** محلي مع Supabase self-hosted

---

## الخطوة 1: تجهيز السيرفر

### تحديث النظام
```bash
sudo apt update && sudo apt upgrade -y
```

### تثبيت Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### التحقق من التثبيت
```bash
node --version  # يجب أن يظهر v20.x.x
npm --version   # يجب أن يظهر 10.x.x
```

### تثبيت Git
```bash
sudo apt install -y git
```

---

## الخطوة 2: استنساخ المشروع

```bash
cd /var/www
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git lifeos
cd lifeos
```

---

## الخطوة 3: تثبيت الحزم

```bash
npm install
```

أو باستخدام bun (أسرع):
```bash
curl -fsSL https://bun.sh/install | bash
bun install
```

---

## الخطوة 4: إعداد متغيرات البيئة

### إنشاء ملف .env
```bash
cp .env.example .env
nano .env
```

### محتوى ملف .env
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id

# Optional: For Edge Functions
GEMINI_API_KEY=your-gemini-api-key
```

### الحصول على مفاتيح Supabase
1. اذهب إلى [supabase.com](https://supabase.com)
2. أنشئ مشروع جديد أو استخدم مشروع موجود
3. اذهب إلى **Settings > API**
4. انسخ `Project URL` و `anon public key`

---

## الخطوة 5: بناء التطبيق

```bash
npm run build
```

سيتم إنشاء مجلد `dist` يحتوي على ملفات الإنتاج.

---

## الخطوة 6: إعداد خادم الويب

### الخيار 1: Nginx (موصى به)

#### تثبيت Nginx
```bash
sudo apt install -y nginx
```

#### إنشاء ملف التكوين
```bash
sudo nano /etc/nginx/sites-available/lifeos
```

#### محتوى ملف التكوين
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    root /var/www/lifeos/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Handle SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (if needed)
    location /api/ {
        proxy_pass https://your-project.supabase.co/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### تفعيل الموقع
```bash
sudo ln -s /etc/nginx/sites-available/lifeos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### الخيار 2: Caddy (أسهل مع SSL تلقائي)

#### تثبيت Caddy
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

#### إنشاء Caddyfile
```bash
sudo nano /etc/caddy/Caddyfile
```

```caddyfile
your-domain.com {
    root * /var/www/lifeos/dist
    file_server
    try_files {path} /index.html
    
    encode gzip
    
    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
    }
}
```

#### تشغيل Caddy
```bash
sudo systemctl restart caddy
```

---

## الخطوة 7: إعداد SSL (HTTPS)

### مع Nginx + Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### مع Caddy
SSL يعمل تلقائياً مع Caddy!

---

## الخطوة 8: إعداد قاعدة البيانات

### استخدام Supabase Cloud (موصى به)
1. أنشئ مشروع على [supabase.com](https://supabase.com)
2. انسخ بيانات الاتصال إلى ملف `.env`
3. شغّل الـ migrations من لوحة تحكم Supabase

### استخدام Supabase Self-Hosted
راجع [دليل Supabase Self-Hosting](https://supabase.com/docs/guides/self-hosting)

---

## الخطوة 9: إعداد Edge Functions (اختياري)

إذا كنت تريد استخدام AI Chat:

### تثبيت Supabase CLI
```bash
npm install -g supabase
```

### نشر الـ Functions
```bash
cd /var/www/lifeos
supabase login
supabase link --project-ref your-project-id
supabase functions deploy gemini-chat
supabase functions deploy ai-chat
```

### إعداد الـ Secrets
```bash
supabase secrets set GEMINI_API_KEY=your-api-key
```

---

## الخطوة 10: إعداد التحديث التلقائي

### إنشاء سكريبت التحديث
```bash
nano /var/www/lifeos/update.sh
```

```bash
#!/bin/bash
cd /var/www/lifeos
git pull origin main
npm install
npm run build
sudo systemctl restart nginx
echo "✅ Update completed at $(date)"
```

```bash
chmod +x /var/www/lifeos/update.sh
```

### إعداد Webhook للتحديث التلقائي (اختياري)
يمكنك استخدام GitHub Actions أو webhook لتشغيل التحديث تلقائياً.

---

## استكشاف الأخطاء

### التطبيق لا يعمل
```bash
# تحقق من صلاحيات الملفات
sudo chown -R www-data:www-data /var/www/lifeos

# تحقق من سجلات Nginx
sudo tail -f /var/log/nginx/error.log
```

### مشاكل في الاتصال بقاعدة البيانات
```bash
# تحقق من متغيرات البيئة
cat /var/www/lifeos/.env

# اختبر الاتصال
curl https://your-project.supabase.co/rest/v1/
```

### مشاكل في SSL
```bash
# تجديد الشهادة يدوياً
sudo certbot renew --dry-run
```

---

## الأوامر المفيدة

```bash
# إعادة بناء التطبيق
npm run build

# مسح الكاش
rm -rf node_modules/.cache dist

# إعادة تشغيل Nginx
sudo systemctl restart nginx

# عرض سجلات Nginx
sudo tail -f /var/log/nginx/access.log

# التحقق من حالة الخدمات
sudo systemctl status nginx
```

---

## الأمان

### جدار الحماية (UFW)
```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### تحديثات الأمان التلقائية
```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## الدعم

- 📖 [وثائق Supabase](https://supabase.com/docs)
- 🐛 [الإبلاغ عن مشكلة](https://github.com/YOUR_USERNAME/YOUR_REPO/issues)
- 💬 [مجتمع Discord](https://discord.gg/supabase)

---

## الترخيص

هذا المشروع مرخص بموجب MIT License.
