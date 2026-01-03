import { Moon, Sun, Globe, Bell, User, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/stores/useAppStore';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';

export default function Settings() {
  const { theme, setTheme } = useAppStore();
  const { user } = useAuth();

  const initials = user?.user_metadata?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="max-w-2xl space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Appearance */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Palette className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-foreground">Dark Mode</Label>
            <p className="text-sm text-muted-foreground">
              Switch between light and dark themes
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Sun className="w-4 h-4 text-muted-foreground" />
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            />
            <Moon className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        <Separator />

        <div>
          <Label className="text-foreground mb-3 block">Theme Colors</Label>
          <div className="flex gap-3">
            {['#0EA5E9', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'].map((color) => (
              <button
                key={color}
                className="w-8 h-8 rounded-full border-2 border-transparent hover:border-foreground/20 transition-all"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
        </div>

        <div className="space-y-4">
          {[
            { label: 'Task Reminders', description: 'Get notified about upcoming tasks' },
            { label: 'Habit Check-ins', description: 'Daily reminders for your habits' },
            { label: 'Project Updates', description: 'Notifications for project changes' },
            { label: 'Financial Alerts', description: 'Alerts for payments and bills' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
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
          <Globe className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Language & Region</h2>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-foreground">Language</Label>
            <p className="text-sm text-muted-foreground">Select your preferred language</p>
          </div>
          <Button variant="outline">English</Button>
        </div>

        <div className="flex items-center justify-between">
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
          <User className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Account</h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-foreground">{user?.user_metadata?.full_name || 'User'}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <Button variant="outline" className="ml-auto">Edit Profile</Button>
        </div>
      </div>
    </div>
  );
}
