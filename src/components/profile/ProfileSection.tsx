import { useState, useRef, useEffect } from 'react';
import { Camera, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ProfileSectionProps {
  language: 'en' | 'ar';
}

export function ProfileSection({ language }: ProfileSectionProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const t = {
    profile: language === 'ar' ? 'الملف الشخصي' : 'Profile',
    fullName: language === 'ar' ? 'الاسم الكامل' : 'Full Name',
    email: language === 'ar' ? 'البريد الإلكتروني' : 'Email',
    changePhoto: language === 'ar' ? 'تغيير الصورة' : 'Change Photo',
    saveProfile: language === 'ar' ? 'حفظ الملف الشخصي' : 'Save Profile',
    saving: language === 'ar' ? 'جاري الحفظ...' : 'Saving...',
    profileSaved: language === 'ar' ? 'تم حفظ الملف الشخصي' : 'Profile saved',
    uploadError: language === 'ar' ? 'فشل رفع الصورة' : 'Failed to upload image',
    saveError: language === 'ar' ? 'فشل حفظ الملف الشخصي' : 'Failed to save profile',
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setFullName(data.full_name || user?.user_metadata?.full_name || '');
        setAvatarUrl(data.avatar_url);
      } else {
        setFullName(user?.user_metadata?.full_name || '');
      }
      setIsLoading(false);
    };
    
    loadProfile();
  }, [user?.id]);

  const initials = fullName
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U';

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(language === 'ar' ? 'يرجى اختيار صورة' : 'Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(language === 'ar' ? 'حجم الصورة كبير جدًا (الحد الأقصى 5 ميجابايت)' : 'Image too large (max 5MB)');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Add cache buster
      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlWithCacheBuster })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(urlWithCacheBuster);
      toast.success(language === 'ar' ? 'تم تحديث الصورة' : 'Photo updated');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(t.uploadError);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (error) throw error;
      toast.success(t.profileSaved);
    } catch (error) {
      console.error('Save error:', error);
      toast.error(t.saveError);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="blitzit-card p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="blitzit-card p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Camera className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">{t.profile}</h2>
      </div>

      <div className="flex items-start gap-6">
        {/* Avatar */}
        <div className="relative group">
          <Avatar className="w-20 h-20 rounded-xl">
            <AvatarImage src={avatarUrl || undefined} alt="Profile" className="object-cover" />
            <AvatarFallback className="bg-primary text-primary-foreground rounded-xl text-xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={handleAvatarClick}
            disabled={isUploading}
            className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <Camera className="w-6 h-6 text-white" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Form */}
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">{t.fullName}</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <Label>{t.email}</Label>
            <Input
              value={user?.email || ''}
              disabled
              className="bg-muted"
            />
          </div>
        </div>
      </div>

      <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full">
        {isSaving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {t.saving}
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            {t.saveProfile}
          </>
        )}
      </Button>
    </div>
  );
}
