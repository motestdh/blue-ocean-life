import { useState } from 'react';
import { usePersonalSubscriptions, PersonalSubscription, PersonalBillingCycle, PersonalSubscriptionStatus, PersonalSubscriptionCategory } from '@/hooks/usePersonalSubscriptions';
import { useTransactions } from '@/hooks/useTransactions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Calendar, DollarSign, Edit2, Trash2, Tv, Monitor, Settings, Zap, MoreHorizontal, AlertTriangle, Clock, ExternalLink, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays, addMonths, addYears, addWeeks } from 'date-fns';

const categoryConfig: Record<PersonalSubscriptionCategory, { label: string; icon: any; color: string }> = {
  entertainment: { label: 'ترفيه', icon: Tv, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  software: { label: 'برامج', icon: Monitor, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  services: { label: 'خدمات', icon: Settings, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  utilities: { label: 'خدمات عامة', icon: Zap, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  other: { label: 'أخرى', icon: MoreHorizontal, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
};

const statusConfig: Record<PersonalSubscriptionStatus, { label: string; color: string }> = {
  active: { label: 'نشط', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  paused: { label: 'متوقف', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  cancelled: { label: 'ملغى', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

const cycleConfig: Record<PersonalBillingCycle, string> = {
  weekly: 'أسبوعي',
  monthly: 'شهري',
  yearly: 'سنوي',
};

export default function MySubscriptions() {
  const { subscriptions, loading, addSubscription, updateSubscription, deleteSubscription, getMonthlyTotal } = usePersonalSubscriptions();
  const { addTransaction } = useTransactions();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<PersonalSubscription | null>(null);
  const [deletingSubscription, setDeletingSubscription] = useState<PersonalSubscription | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    currency: 'USD',
    billing_cycle: 'monthly' as PersonalBillingCycle,
    category: 'other' as PersonalSubscriptionCategory,
    next_payment_date: format(new Date(), 'yyyy-MM-dd'),
    status: 'active' as PersonalSubscriptionStatus,
    notes: '',
    url: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      currency: 'USD',
      billing_cycle: 'monthly',
      category: 'other',
      next_payment_date: format(new Date(), 'yyyy-MM-dd'),
      status: 'active',
      notes: '',
      url: '',
    });
    setEditingSubscription(null);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.amount) {
      toast({ title: 'خطأ', description: 'الرجاء ملء الحقول المطلوبة', variant: 'destructive' });
      return;
    }

    if (editingSubscription) {
      const result = await updateSubscription(editingSubscription.id, {
        ...formData,
        amount: parseFloat(formData.amount),
        url: formData.url || undefined,
        notes: formData.notes || undefined,
      });
      if (result.error) {
        toast({ title: 'خطأ', description: result.error, variant: 'destructive' });
      } else {
        toast({ title: 'تم التحديث', description: 'تم تحديث الاشتراك بنجاح' });
        setIsOpen(false);
        resetForm();
      }
    } else {
      const result = await addSubscription({
        ...formData,
        amount: parseFloat(formData.amount),
        url: formData.url || undefined,
        notes: formData.notes || undefined,
      });
      if (result.error) {
        toast({ title: 'خطأ', description: result.error, variant: 'destructive' });
      } else {
        toast({ title: 'تمت الإضافة', description: 'تم إضافة الاشتراك بنجاح' });
        setIsOpen(false);
        resetForm();
      }
    }
  };

  const handleEdit = (subscription: PersonalSubscription) => {
    setEditingSubscription(subscription);
    setFormData({
      name: subscription.name,
      amount: subscription.amount.toString(),
      currency: subscription.currency,
      billing_cycle: subscription.billing_cycle,
      category: subscription.category,
      next_payment_date: subscription.next_payment_date,
      status: subscription.status,
      notes: subscription.notes || '',
      url: subscription.url || '',
    });
    setIsOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingSubscription) return;
    const result = await deleteSubscription(deletingSubscription.id);
    if (result.error) {
      toast({ title: 'خطأ', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'تم الحذف', description: 'تم حذف الاشتراك بنجاح' });
    }
    setDeletingSubscription(null);
  };

  const handleMarkPaid = async (subscription: PersonalSubscription) => {
    // Create a transaction in Finance
    const transactionResult = await addTransaction({
      type: 'expense',
      amount: subscription.amount,
      currency: subscription.currency,
      category: `اشتراك: ${categoryConfig[subscription.category]?.label || 'أخرى'}`,
      description: `دفع اشتراك ${subscription.name}`,
      date: format(new Date(), 'yyyy-MM-dd'),
      status: 'paid',
    });

    if (transactionResult.error) {
      toast({ title: 'خطأ', description: transactionResult.error, variant: 'destructive' });
      return;
    }

    // Calculate next payment date
    let nextDate: Date;
    switch (subscription.billing_cycle) {
      case 'weekly':
        nextDate = addWeeks(new Date(subscription.next_payment_date), 1);
        break;
      case 'yearly':
        nextDate = addYears(new Date(subscription.next_payment_date), 1);
        break;
      default:
        nextDate = addMonths(new Date(subscription.next_payment_date), 1);
    }

    const result = await updateSubscription(subscription.id, {
      next_payment_date: format(nextDate, 'yyyy-MM-dd'),
    });

    if (result.error) {
      toast({ title: 'خطأ', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'تم الدفع', description: 'تم تسجيل الدفع في Finance وتحديث تاريخ الاستحقاق التالي' });
    }
  };

  const getPaymentStatus = (subscription: PersonalSubscription) => {
    if (subscription.status !== 'active') return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const nextPayment = new Date(subscription.next_payment_date);
    const daysUntil = differenceInDays(nextPayment, now);

    if (daysUntil < 0) {
      return { label: `متأخر ${Math.abs(daysUntil)} يوم`, color: 'text-red-400', urgent: true };
    } else if (daysUntil === 0) {
      return { label: 'مستحق اليوم', color: 'text-yellow-400', urgent: true };
    } else if (daysUntil <= 7) {
      return { label: `خلال ${daysUntil} أيام`, color: 'text-yellow-400', urgent: false };
    }
    return null;
  };

  // Stats
  const activeCount = subscriptions.filter(s => s.status === 'active').length;
  const overdueCount = subscriptions.filter(s => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return s.status === 'active' && new Date(s.next_payment_date) < now;
  }).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">اشتراكاتي الشخصية</h2>
          <p className="text-sm text-muted-foreground">الاشتراكات الشهرية التي عليك دفعها</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" /> إضافة</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingSubscription ? 'تعديل الاشتراك' : 'إضافة اشتراك جديد'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>اسم الاشتراك *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: Netflix, Spotify"
                />
              </div>
              <div>
                <Label>الفئة</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v as PersonalSubscriptionCategory })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entertainment">ترفيه</SelectItem>
                    <SelectItem value="software">برامج</SelectItem>
                    <SelectItem value="services">خدمات</SelectItem>
                    <SelectItem value="utilities">خدمات عامة</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>المبلغ *</Label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>العملة</Label>
                  <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="DZD">DZD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>دورة الدفع</Label>
                <Select value={formData.billing_cycle} onValueChange={(v) => setFormData({ ...formData, billing_cycle: v as PersonalBillingCycle })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">أسبوعي</SelectItem>
                    <SelectItem value="monthly">شهري</SelectItem>
                    <SelectItem value="yearly">سنوي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>تاريخ الدفع القادم</Label>
                <Input
                  type="date"
                  value={formData.next_payment_date}
                  onChange={(e) => setFormData({ ...formData, next_payment_date: e.target.value })}
                />
              </div>
              <div>
                <Label>الحالة</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as PersonalSubscriptionStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="paused">متوقف</SelectItem>
                    <SelectItem value="cancelled">ملغى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>رابط (اختياري)</Label>
                <Input
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label>ملاحظات</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="ملاحظات إضافية..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => { setIsOpen(false); resetForm(); }}>إلغاء</Button>
                <Button onClick={handleSubmit}>{editingSubscription ? 'حفظ التغييرات' : 'إضافة'}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">نشطة</p>
                <p className="text-lg font-bold">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <AlertTriangle className="h-4 w-4 text-red-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">متأخرة</p>
                <p className="text-lg font-bold">{overdueCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <DollarSign className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">شهري USD</p>
                <p className="text-lg font-bold">${getMonthlyTotal('USD').toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <DollarSign className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">شهري EUR</p>
                <p className="text-lg font-bold">€{getMonthlyTotal('EUR').toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      {subscriptions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">لا توجد اشتراكات شخصية</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {subscriptions.map(subscription => {
            const CategoryIcon = categoryConfig[subscription.category]?.icon || MoreHorizontal;
            const paymentStatus = getPaymentStatus(subscription);

            return (
              <Card key={subscription.id} className={paymentStatus?.urgent ? 'border-red-500/50' : ''}>
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg ${categoryConfig[subscription.category]?.color || categoryConfig.other.color}`}>
                        <CategoryIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm">{subscription.name}</h3>
                          <Badge variant="outline" className={`text-xs ${statusConfig[subscription.status].color}`}>
                            {statusConfig[subscription.status].label}
                          </Badge>
                          {subscription.url && (
                            <a href={subscription.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {subscription.amount} {subscription.currency} / {cycleConfig[subscription.billing_cycle]}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(subscription.next_payment_date), 'yyyy-MM-dd')}
                          </span>
                        </div>
                        {paymentStatus && (
                          <p className={`text-xs mt-1 ${paymentStatus.color} flex items-center gap-1`}>
                            <AlertTriangle className="h-3 w-3" />
                            {paymentStatus.label}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {subscription.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 px-2"
                          onClick={() => handleMarkPaid(subscription)}
                        >
                          دفع
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleEdit(subscription)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setDeletingSubscription(subscription)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingSubscription} onOpenChange={() => setDeletingSubscription(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الاشتراك</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف "{deletingSubscription?.name}"؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
