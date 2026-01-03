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

export default function Settings() {
  const { theme, setTheme, themeColor, setThemeColor } = useAppStore();
  const { user } = useAuth();

  // Apply theme color on mount
  useEffect(() => {
    const root = document.documentElement;
    ['green', 'blue', 'purple', 'orange', 'pink', 'cyan'].forEach(c => {
      root.classList.remove(`theme-${c}`);
    });
    root.classList.add(`theme-${themeColor}`);
  }, [themeColor]);

  const initials = user?.user_metadata?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Appearance */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Palette className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-foreground">Dark Mode</Label>
            <p className="text-sm text-muted-foreground">
              Switch between light and dark themes
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
          <Label className="text-foreground mb-4 block">Theme Color</Label>
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
          <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
        </div>

        <div className="space-y-4">
          {[
            { label: 'Task Reminders', description: 'Get notified about upcoming tasks' },
            { label: 'Habit Check-ins', description: 'Daily reminders for your habits' },
            { label: 'Project Updates', description: 'Notifications for project changes' },
            { label: 'Financial Alerts', description: 'Alerts for payments and bills' },
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
          <h2 className="text-lg font-semibold text-foreground">Language & Region</h2>
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="space-y-1">
            <Label className="text-foreground">Language</Label>
            <p className="text-sm text-muted-foreground">Select your preferred language</p>
          </div>
          <Button variant="outline" size="sm">English</Button>
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="space-y-1">
            <Label className="text-foreground">RTL Mode</Label>
            <p className="text-sm text-muted-foreground">Enable right-to-left layout</p>
          </div>
          <Switch />
        </div>
      </div>

      {/* Account */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <User className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Account</h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
            {initials}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">{user?.user_metadata?.full_name || 'User'}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <Button variant="outline" size="sm">Edit Profile</Button>
        </div>
      </div>
    </div>
  );
}
