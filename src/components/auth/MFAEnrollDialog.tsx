import { useState, useEffect } from 'react';
import { Shield, Loader2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MFAEnrollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  language: 'en' | 'ar';
}

export function MFAEnrollDialog({ open, onOpenChange, onSuccess, language }: MFAEnrollDialogProps) {
  const [step, setStep] = useState<'qr' | 'verify'>('qr');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  const t = {
    title: language === 'ar' ? 'تفعيل المصادقة الثنائية' : 'Enable Two-Factor Authentication',
    step1: language === 'ar' ? 'امسح رمز QR باستخدام Google Authenticator' : 'Scan QR code with Google Authenticator',
    step2: language === 'ar' ? 'أو أدخل الرمز السري يدويًا:' : 'Or enter secret key manually:',
    step3: language === 'ar' ? 'أدخل رمز التحقق المكون من 6 أرقام' : 'Enter the 6-digit verification code',
    verify: language === 'ar' ? 'تحقق' : 'Verify',
    verifying: language === 'ar' ? 'جاري التحقق...' : 'Verifying...',
    cancel: language === 'ar' ? 'إلغاء' : 'Cancel',
    copySecret: language === 'ar' ? 'نسخ الرمز السري' : 'Copy Secret',
    copied: language === 'ar' ? 'تم النسخ!' : 'Copied!',
    success: language === 'ar' ? 'تم تفعيل المصادقة الثنائية بنجاح!' : '2FA enabled successfully!',
    error: language === 'ar' ? 'فشل في تفعيل المصادقة الثنائية' : 'Failed to enable 2FA',
    invalidCode: language === 'ar' ? 'رمز غير صالح. حاول مرة أخرى.' : 'Invalid code. Please try again.',
  };

  useEffect(() => {
    if (open) {
      enrollMFA();
    } else {
      // Reset state when dialog closes
      setStep('qr');
      setQrCode('');
      setSecret('');
      setFactorId('');
      setCode('');
    }
  }, [open]);

  const enrollMFA = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Blitzit Authenticator',
      });

      if (error) throw error;

      if (data?.totp) {
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setFactorId(data.id);
      }
    } catch (error: any) {
      console.error('MFA enroll error:', error);
      toast.error(t.error);
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) return;

    setIsVerifying(true);
    try {
      // Challenge the factor
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      // Verify the code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });

      if (verifyError) {
        if (verifyError.message.includes('Invalid')) {
          toast.error(t.invalidCode);
          setCode('');
          return;
        }
        throw verifyError;
      }

      toast.success(t.success);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('MFA verify error:', error);
      toast.error(t.error);
    } finally {
      setIsVerifying(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            {t.title}
          </DialogTitle>
          <DialogDescription>
            {step === 'qr' ? t.step1 : t.step3}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* QR Code */}
            {qrCode && (
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-white rounded-xl">
                  <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                </div>
                
                <div className="w-full space-y-2">
                  <p className="text-sm text-muted-foreground text-center">{t.step2}</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-muted rounded-md text-xs font-mono break-all">
                      {secret}
                    </code>
                    <Button variant="outline" size="icon" onClick={copySecret}>
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Verification Code Input */}
            <div className="space-y-4">
              <p className="text-sm font-medium text-center">{t.step3}</p>
              <div className="flex justify-center">
                <InputOTP
                  value={code}
                  onChange={setCode}
                  maxLength={6}
                  onComplete={handleVerify}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                {t.cancel}
              </Button>
              <Button 
                onClick={handleVerify} 
                disabled={code.length !== 6 || isVerifying}
                className="flex-1"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t.verifying}
                  </>
                ) : (
                  t.verify
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
