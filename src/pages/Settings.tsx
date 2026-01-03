import { useEffect } from 'react';
import { Moon, Sun, Globe, Bell, User, Palette, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/stores/useAppStore';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const themeColors = [
  { name: 'green', label: 'Green', hsl: '160 84% 39%' },
  { name: 'blue', label: 'Blue', hsl: '199 89% 48%' },
  { name: 'purple', label: 'Purple', hsl: '262 83% 58%' },
  { name: 'orange', label: 'Orange', hsl: '24 95% 53%' },
  { name: 'pink', label: 'Pink', hsl: '330 81% 60%' },
  { name: 'cyan', label: 'Cyan', hsl: '180 70% 45%' },
] as const;

const translations = {
  en: {
    settings: 'Settings',
    managePreferences: 'Manage your account and preferences',
    appearance: 'Appearance',
    darkMode: 'Dark Mode',
    darkModeDesc: 'Switch between light and dark themes',
    themeColor: 'Theme Color',
    notifications: 'Notifications',
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
  },
  ar: {
    settings: 'الإعدادات',
    managePreferences: 'إدارة حسابك وتفضيلاتك',
    appearance: 'المظهر',
    darkMode: 'الوضع الداكن',
    darkModeDesc: 'التبديل بين الوضع الفاتح والداكن',
    themeColor: 'لون السمة',
    notifications: 'الإشعارات',
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
  },
};

export default function Settings() {
  const { theme, setTheme, themeColor, setThemeColor, language, setLanguage, rtlEnabled, setRtlEnabled } = useAppStore();
  const { user } = useAuth();
  const t = translations[language];

  // Apply theme color and RTL on mount
  useEffect(() => {
    const root = document.documentElement;
    ['green', 'blue', 'purple', 'orange', 'pink', 'cyan'].forEach(c => {
      root.classList.remove(`theme-${c}`);
    });
    root.classList.add(`theme-${themeColor}`);
    root.dir = rtlEnabled ? 'rtl' : 'ltr';
    root.lang = language;
  }, [themeColor, rtlEnabled, language]);

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
      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
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
      </div>

      {/* Notifications */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">{t.notifications}</h2>
        </div>

        <div className="space-y-4">
          {[
            { label: t.taskReminders, description: t.taskRemindersDesc },
            { label: t.habitCheckins, description: t.habitCheckinsDesc },
            { label: t.projectUpdates, description: t.projectUpdatesDesc },
            { label: t.financialAlerts, description: t.financialAlertsDesc },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2">
              <div className="space-y-1">
                <Label className="text-foreground">{item.label}</Label>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <Switch defaultChecked />
            </div>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
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
      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
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
