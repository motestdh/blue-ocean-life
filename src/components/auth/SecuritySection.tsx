import { useState, useEffect } from 'react';
import { Shield, Loader2, ShieldCheck, ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { MFAEnrollDialog } from './MFAEnrollDialog';
import { toast } from 'sonner';

interface SecuritySectionProps {
  language: 'en' | 'ar';
}

export function SecuritySection({ language }: SecuritySectionProps) {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDisabling, setIsDisabling] = useState(false);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);

  const t = {
    security: language === 'ar' ? 'الأمان' : 'Security',
    twoFactor: language === 'ar' ? 'المصادقة الثنائية' : 'Two-Factor Authentication',
    twoFactorDesc: language === 'ar' 
      ? 'أضف طبقة أمان إضافية لحسابك باستخدام Google Authenticator' 
      : 'Add an extra layer of security to your account using Google Authenticator',
    enabled: language === 'ar' ? 'مفعّل' : 'Enabled',
    disabled: language === 'ar' ? 'معطّل' : 'Disabled',
    enable: language === 'ar' ? 'تفعيل المصادقة الثنائية' : 'Enable 2FA',
    disable: language === 'ar' ? 'تعطيل المصادقة الثنائية' : 'Disable 2FA',
    disabling: language === 'ar' ? 'جاري التعطيل...' : 'Disabling...',
    disableSuccess: language === 'ar' ? 'تم تعطيل المصادقة الثنائية' : '2FA disabled successfully',
    disableError: language === 'ar' ? 'فشل في تعطيل المصادقة الثنائية' : 'Failed to disable 2FA',
  };

  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      
      if (!error && data) {
        const verifiedFactor = data.totp?.find(f => f.status === 'verified');
        setMfaEnabled(!!verifiedFactor);
        setFactorId(verifiedFactor?.id || null);
      }
    } catch (error) {
      console.error('Error checking MFA status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableMFA = async () => {
    if (!factorId) return;

    setIsDisabling(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      
      if (error) throw error;

      setMfaEnabled(false);
      setFactorId(null);
      toast.success(t.disableSuccess);
    } catch (error: any) {
      console.error('Error disabling MFA:', error);
      toast.error(t.disableError);
    } finally {
      setIsDisabling(false);
    }
  };

  const handleEnrollSuccess = () => {
    checkMFAStatus();
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
    <>
      <div className="blitzit-card p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">{t.security}</h2>
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Label className="text-foreground">{t.twoFactor}</Label>
              {mfaEnabled ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-600">
                  <ShieldCheck className="w-3 h-3" />
                  {t.enabled}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                  <ShieldOff className="w-3 h-3" />
                  {t.disabled}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{t.twoFactorDesc}</p>
          </div>
        </div>

        <Separator />

        {mfaEnabled ? (
          <Button 
            variant="destructive" 
            onClick={handleDisableMFA}
            disabled={isDisabling}
            className="w-full"
          >
            {isDisabling ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t.disabling}
              </>
            ) : (
              <>
                <ShieldOff className="w-4 h-4 mr-2" />
                {t.disable}
              </>
            )}
          </Button>
        ) : (
          <Button onClick={() => setEnrollDialogOpen(true)} className="w-full">
            <Shield className="w-4 h-4 mr-2" />
            {t.enable}
          </Button>
        )}
      </div>

      <MFAEnrollDialog
        open={enrollDialogOpen}
        onOpenChange={setEnrollDialogOpen}
        onSuccess={handleEnrollSuccess}
        language={language}
      />
    </>
  );
}
