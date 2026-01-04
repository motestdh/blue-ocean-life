import { useEffect, useState } from 'react';
import { Moon, Sun, Globe, Bell, User, Palette, Check, Type, Sparkles, Key, Mail, Send, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/stores/useAppStore';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const themeColors = [
  { name: 'green', label: 'Green', hsl: '160 84% 39%' },
  { name: 'blue', label: 'Blue', hsl: '199 89% 48%' },
  { name: 'purple', label: 'Purple', hsl: '262 83% 58%' },
  { name: 'orange', label: 'Orange', hsl: '24 95% 53%' },
  { name: 'pink', label: 'Pink', hsl: '330 81% 60%' },
  { name: 'cyan', label: 'Cyan', hsl: '180 70% 45%' },
] as const;

const backgroundStyles = [
  { name: 'default', label: 'Default', class: '' },
  { name: 'gradient', label: 'Gradient Mesh', class: 'blitzit-gradient' },
  { name: 'subtle', label: 'Subtle Gradient', class: 'blitzit-gradient-subtle' },
  { name: 'solid', label: 'Solid Color', class: 'bg-background' },
] as const;

const fontOptions = [
  { name: 'system', label: 'System Default', family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  { name: 'inter', label: 'Inter', family: '"Inter", sans-serif' },
  { name: 'geist', label: 'Geist', family: '"Geist", sans-serif' },
  { name: 'mono', label: 'Monospace', family: '"SF Mono", "Monaco", "Inconsolata", monospace' },
] as const;

const timezones = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (US)' },
  { value: 'America/Chicago', label: 'Central Time (US)' },
  { value: 'America/Denver', label: 'Mountain Time (US)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Europe/Berlin', label: 'Berlin' },
  { value: 'Asia/Dubai', label: 'Dubai' },
  { value: 'Asia/Riyadh', label: 'Riyadh' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Shanghai', label: 'Shanghai' },
  { value: 'Australia/Sydney', label: 'Sydney' },
] as const;

const translations = {
  en: {
    settings: 'Settings',
    managePreferences: 'Manage your account and preferences',
    appearance: 'Appearance',
    darkMode: 'Dark Mode',
    darkModeDesc: 'Switch between light and dark themes',
    themeColor: 'Theme Color',
    backgroundStyle: 'Background Style',
    fontFamily: 'Font Family',
    notifications: 'Notifications',
    enableNotifications: 'Enable Browser Notifications',
    enableNotificationsDesc: 'Allow the app to send you notifications',
    taskReminders: 'Task Reminders',
    taskRemindersDesc: 'Get notified about upcoming tasks',
    habitCheckins: 'Habit Check-ins',
    habitCheckinsDesc: 'Daily reminders for your habits',
    projectUpdates: 'Project Updates',
    projectUpdatesDesc: 'Notifications for project changes',
    financialAlerts: 'Financial Alerts',
    financialAlertsDesc: 'Alerts for payments and bills',
    languageRegion: 'Language & Region',
    language: 'Language',
    languageDesc: 'Select your preferred language',
    rtlMode: 'RTL Mode',
    rtlModeDesc: 'Enable right-to-left layout',
    account: 'Account',
    editProfile: 'Edit Profile',
    testNotification: 'Test',
    aiIntegration: 'AI Integration',
    aiIntegrationDesc: 'Configure AI features for your app',
    aiEnabled: 'AI Features',
    aiEnabledDesc: 'Enable AI-powered suggestions and chat',
    aiNote: 'AI is powered by Lovable AI (no API key needed)',
    dailyNotifications: 'Daily Notifications',
    dailyNotificationsDesc: 'Configure email and Telegram notifications',
    emailNotifications: 'Email Notifications',
    emailNotificationsDesc: 'Receive daily summary via email',
    notificationEmail: 'Notification Email',
    telegramNotifications: 'Telegram Notifications',
    telegramNotificationsDesc: 'Receive daily summary via Telegram',
    telegramChatId: 'Telegram Chat ID',
    telegramChatIdHelp: 'Get your chat ID from @userinfobot on Telegram',
    notificationTime: 'Notification Time',
    notificationTimeDesc: 'When to receive daily notifications',
    timezone: 'Timezone',
    saveSettings: 'Save Settings',
    saving: 'Saving...',
    settingsSaved: 'Settings saved successfully',
  },
  ar: {
    settings: 'الإعدادات',
    managePreferences: 'إدارة حسابك وتفضيلاتك',
    appearance: 'المظهر',
    darkMode: 'الوضع الداكن',
    darkModeDesc: 'التبديل بين الوضع الفاتح والداكن',
    themeColor: 'لون السمة',
    backgroundStyle: 'نمط الخلفية',
    fontFamily: 'نوع الخط',
    notifications: 'الإشعارات',
    enableNotifications: 'تفعيل إشعارات المتصفح',
    enableNotificationsDesc: 'السماح للتطبيق بإرسال إشعارات لك',
    taskReminders: 'تذكيرات المهام',
    taskRemindersDesc: 'احصل على إشعارات حول المهام القادمة',
    habitCheckins: 'تسجيل العادات',
    habitCheckinsDesc: 'تذكيرات يومية لعاداتك',
    projectUpdates: 'تحديثات المشاريع',
    projectUpdatesDesc: 'إشعارات لتغييرات المشاريع',
    financialAlerts: 'تنبيهات مالية',
    financialAlertsDesc: 'تنبيهات للمدفوعات والفواتير',
    languageRegion: 'اللغة والمنطقة',
    language: 'اللغة',
    languageDesc: 'اختر لغتك المفضلة',
    rtlMode: 'وضع RTL',
    rtlModeDesc: 'تمكين تخطيط من اليمين إلى اليسار',
    account: 'الحساب',
    editProfile: 'تعديل الملف الشخصي',
    testNotification: 'تجربة',
    aiIntegration: 'تكامل الذكاء الاصطناعي',
    aiIntegrationDesc: 'تكوين ميزات الذكاء الاصطناعي',
    aiEnabled: 'ميزات الذكاء الاصطناعي',
    aiEnabledDesc: 'تفعيل الاقتراحات والدردشة بالذكاء الاصطناعي',
    aiNote: 'الذكاء الاصطناعي مدعوم من Lovable AI (لا حاجة لمفتاح API)',
    dailyNotifications: 'الإشعارات اليومية',
    dailyNotificationsDesc: 'تكوين إشعارات البريد الإلكتروني و Telegram',
    emailNotifications: 'إشعارات البريد الإلكتروني',
    emailNotificationsDesc: 'تلقي ملخص يومي عبر البريد الإلكتروني',
    notificationEmail: 'بريد الإشعارات',
    telegramNotifications: 'إشعارات Telegram',
    telegramNotificationsDesc: 'تلقي ملخص يومي عبر Telegram',
    telegramChatId: 'معرف محادثة Telegram',
    telegramChatIdHelp: 'احصل على معرف المحادثة من @userinfobot على Telegram',
    notificationTime: 'وقت الإشعار',
    notificationTimeDesc: 'متى تريد تلقي الإشعارات اليومية',
    timezone: 'المنطقة الزمنية',
    saveSettings: 'حفظ الإعدادات',
    saving: 'جاري الحفظ...',
    settingsSaved: 'تم حفظ الإعدادات بنجاح',
  },
};

export default function Settings() {
  const { 
    theme, setTheme, themeColor, setThemeColor, 
    language, setLanguage, rtlEnabled, setRtlEnabled,
    notificationsEnabled, setNotificationsEnabled,
    notificationSettings, updateNotificationSetting,
    backgroundStyle, setBackgroundStyle,
    fontFamily, setFontFamily,
    aiEnabled, setAiEnabled,
  } = useAppStore();
  const { user } = useAuth();
  const { isSupported, permission, requestPermission, showNotification } = useNotifications();
  const t = translations[language];

  // Daily notification settings state
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState('');
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState('');
  const [notificationTime, setNotificationTime] = useState('08:00');
  const [timezone, setTimezone] = useState('UTC');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load profile notification settings
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('notification_email, telegram_chat_id, telegram_enabled, email_notifications_enabled, notification_time, timezone')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setEmailEnabled(data.email_notifications_enabled || false);
        setNotificationEmail(data.notification_email || '');
        setTelegramEnabled(data.telegram_enabled || false);
        setTelegramChatId(data.telegram_chat_id || '');
        setNotificationTime(data.notification_time?.slice(0, 5) || '08:00');
        setTimezone(data.timezone || 'UTC');
      }
      setIsLoading(false);
    };
    
    loadProfile();
  }, [user?.id]);

  const saveNotificationSettings = async () => {
    if (!user?.id) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          email_notifications_enabled: emailEnabled,
          notification_email: notificationEmail,
          telegram_enabled: telegramEnabled,
          telegram_chat_id: telegramChatId,
          notification_time: notificationTime + ':00',
          timezone: timezone,
        })
        .eq('id', user.id);
      
      if (error) throw error;
      toast.success(t.settingsSaved);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(language === 'ar' ? 'فشل حفظ الإعدادات' : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };
  // Apply theme color, background, font, and RTL on mount
  useEffect(() => {
    const root = document.documentElement;
    // Theme colors
    ['green', 'blue', 'purple', 'orange', 'pink', 'cyan'].forEach(c => {
      root.classList.remove(`theme-${c}`);
    });
    root.classList.add(`theme-${themeColor}`);
    
    // Background style - apply to main content area
    const mainContent = document.querySelector('main');
    if (mainContent) {
      ['blitzit-gradient', 'blitzit-gradient-subtle', 'bg-background'].forEach(c => {
        mainContent.classList.remove(c);
      });
      const bgClass = backgroundStyles.find(b => b.name === backgroundStyle)?.class;
      if (bgClass) mainContent.classList.add(bgClass);
    }
    
    // Font family
    const font = fontOptions.find(f => f.name === fontFamily)?.family;
    if (font) {
      document.body.style.fontFamily = font;
    }
    
    // RTL and language
    root.dir = rtlEnabled ? 'rtl' : 'ltr';
    root.lang = language;
  }, [themeColor, rtlEnabled, language, backgroundStyle, fontFamily]);

  const handleEnableNotifications = async (enabled: boolean) => {
    if (enabled) {
      if (!isSupported) {
        toast.error(language === 'ar' ? 'الإشعارات غير مدعومة في هذا المتصفح' : 'Notifications are not supported in this browser');
        return;
      }
      const granted = await requestPermission();
      if (granted) {
        setNotificationsEnabled(true);
        toast.success(language === 'ar' ? 'تم تفعيل الإشعارات' : 'Notifications enabled');
      } else {
        toast.error(language === 'ar' ? 'تم رفض إذن الإشعارات' : 'Notification permission denied');
      }
    } else {
      setNotificationsEnabled(false);
    }
  };

  const handleTestNotification = () => {
    showNotification({
      title: language === 'ar' ? 'إشعار تجريبي' : 'Test Notification',
      body: language === 'ar' ? 'الإشعارات تعمل بشكل صحيح!' : 'Notifications are working correctly!',
    });
  };

  const initials = user?.user_metadata?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t.settings}</h1>
        <p className="text-muted-foreground mt-1">
          {t.managePreferences}
        </p>
      </div>

      {/* Appearance */}
      <div className="blitzit-card p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Palette className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">{t.appearance}</h2>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-foreground">{t.darkMode}</Label>
            <p className="text-sm text-muted-foreground">
              {t.darkModeDesc}
            </p>
          </div>
          <div className="flex items-center gap-3 bg-secondary rounded-full p-1">
            <button
              onClick={() => setTheme('light')}
              className={cn(
                "p-2 rounded-full transition-all",
                theme === 'light' ? 'bg-card shadow-sm' : 'hover:bg-muted'
              )}
            >
              <Sun className={cn("w-4 h-4", theme === 'light' ? 'text-primary' : 'text-muted-foreground')} />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={cn(
                "p-2 rounded-full transition-all",
                theme === 'dark' ? 'bg-card shadow-sm' : 'hover:bg-muted'
              )}
            >
              <Moon className={cn("w-4 h-4", theme === 'dark' ? 'text-primary' : 'text-muted-foreground')} />
            </button>
          </div>
        </div>

        <Separator />

        <div>
          <Label className="text-foreground mb-4 block">{t.themeColor}</Label>
          <div className="grid grid-cols-6 gap-3">
            {themeColors.map((color) => (
              <button
                key={color.name}
                onClick={() => setThemeColor(color.name)}
                className={cn(
                  "relative w-12 h-12 rounded-xl transition-all hover:scale-105",
                  "ring-2 ring-offset-2 ring-offset-background",
                  themeColor === color.name ? "ring-foreground" : "ring-transparent hover:ring-muted-foreground/30"
                )}
                style={{ backgroundColor: `hsl(${color.hsl})` }}
                title={color.label}
              >
                {themeColor === color.name && (
                  <Check className="w-5 h-5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                )}
              </button>
            ))}
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-foreground">{t.backgroundStyle}</Label>
            <p className="text-sm text-muted-foreground">
              {language === 'ar' ? 'اختر نمط الخلفية' : 'Choose your background style'}
            </p>
          </div>
          <Select value={backgroundStyle} onValueChange={(v: any) => setBackgroundStyle(v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {backgroundStyles.map((bg) => (
                <SelectItem key={bg.name} value={bg.name}>{bg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-1 flex items-center gap-3">
            <Type className="w-5 h-5 text-muted-foreground" />
            <div>
              <Label className="text-foreground">{t.fontFamily}</Label>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'اختر نوع الخط' : 'Choose your font'}
              </p>
            </div>
          </div>
          <Select value={fontFamily} onValueChange={(v: any) => setFontFamily(v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fontOptions.map((font) => (
                <SelectItem key={font.name} value={font.name} style={{ fontFamily: font.family }}>
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* AI Integration */}
      <div className="blitzit-card p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">{t.aiIntegration}</h2>
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="space-y-1">
            <Label className="text-foreground">{t.aiEnabled}</Label>
            <p className="text-sm text-muted-foreground">{t.aiEnabledDesc}</p>
          </div>
          <Switch 
            checked={aiEnabled} 
            onCheckedChange={setAiEnabled}
          />
        </div>

        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 text-sm text-primary">
            <Key className="w-4 h-4" />
            <span className="font-medium">{t.aiNote}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {language === 'ar' 
              ? 'تم تكوين مفتاح API تلقائيًا. لا تحتاج إلى أي إعداد إضافي.'
              : 'API key is auto-configured. No additional setup required.'}
          </p>
        </div>
      </div>

      {/* Notifications */}
      <div className="blitzit-card p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">{t.notifications}</h2>
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="space-y-1">
            <Label className="text-foreground">{t.enableNotifications}</Label>
            <p className="text-sm text-muted-foreground">{t.enableNotificationsDesc}</p>
          </div>
          <div className="flex items-center gap-2">
            {notificationsEnabled && permission === 'granted' && (
              <Button variant="outline" size="sm" onClick={handleTestNotification}>
                {t.testNotification}
              </Button>
            )}
            <Switch 
              checked={notificationsEnabled && permission === 'granted'} 
              onCheckedChange={handleEnableNotifications}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          {[
            { key: 'taskReminders' as const, label: t.taskReminders, description: t.taskRemindersDesc },
            { key: 'habitCheckins' as const, label: t.habitCheckins, description: t.habitCheckinsDesc },
            { key: 'projectUpdates' as const, label: t.projectUpdates, description: t.projectUpdatesDesc },
            { key: 'financialAlerts' as const, label: t.financialAlerts, description: t.financialAlertsDesc },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-2">
              <div className="space-y-1">
                <Label className="text-foreground">{item.label}</Label>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <Switch 
                checked={notificationSettings[item.key]}
                onCheckedChange={(checked) => updateNotificationSetting(item.key, checked)}
                disabled={!notificationsEnabled}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Daily Notifications */}
      <div className="blitzit-card p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Send className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{t.dailyNotifications}</h2>
            <p className="text-sm text-muted-foreground">{t.dailyNotificationsDesc}</p>
          </div>
        </div>

        {/* Email Notifications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <Label className="text-foreground">{t.emailNotifications}</Label>
              </div>
              <p className="text-sm text-muted-foreground">{t.emailNotificationsDesc}</p>
            </div>
            <Switch 
              checked={emailEnabled} 
              onCheckedChange={setEmailEnabled}
            />
          </div>
          
          {emailEnabled && (
            <div className="ml-6 space-y-2">
              <Label className="text-sm text-foreground">{t.notificationEmail}</Label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={notificationEmail}
                onChange={(e) => setNotificationEmail(e.target.value)}
              />
            </div>
          )}
        </div>

        <Separator />

        {/* Telegram Notifications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-muted-foreground" />
                <Label className="text-foreground">{t.telegramNotifications}</Label>
              </div>
              <p className="text-sm text-muted-foreground">{t.telegramNotificationsDesc}</p>
            </div>
            <Switch 
              checked={telegramEnabled} 
              onCheckedChange={setTelegramEnabled}
            />
          </div>
          
          {telegramEnabled && (
            <div className="ml-6 space-y-2">
              <Label className="text-sm text-foreground">{t.telegramChatId}</Label>
              <Input
                type="text"
                placeholder="123456789"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t.telegramChatIdHelp}</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Notification Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <Label className="text-foreground">{t.notificationTime}</Label>
            </div>
            <Input
              type="time"
              value={notificationTime}
              onChange={(e) => setNotificationTime(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-foreground">{t.timezone}</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={saveNotificationSettings} 
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? t.saving : t.saveSettings}
        </Button>
      </div>

      {/* Language */}
      <div className="blitzit-card p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">{t.languageRegion}</h2>
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="space-y-1">
            <Label className="text-foreground">{t.language}</Label>
            <p className="text-sm text-muted-foreground">{t.languageDesc}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={language === 'en' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setLanguage('en')}
            >
              English
            </Button>
            <Button 
              variant={language === 'ar' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setLanguage('ar')}
            >
              العربية
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="space-y-1">
            <Label className="text-foreground">{t.rtlMode}</Label>
            <p className="text-sm text-muted-foreground">{t.rtlModeDesc}</p>
          </div>
          <Switch 
            checked={rtlEnabled} 
            onCheckedChange={setRtlEnabled}
          />
        </div>
      </div>

      {/* Account */}
      <div className="blitzit-card p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <User className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">{t.account}</h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
            {initials}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">{user?.user_metadata?.full_name || 'User'}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <Button variant="outline" size="sm">{t.editProfile}</Button>
        </div>
      </div>
    </div>
  );
}
