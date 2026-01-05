import { useState } from 'react';
import { useSubscriptions, Subscription, SubscriptionType, BillingCycle, SubscriptionStatus } from '@/hooks/useSubscriptions';
import { useClients } from '@/hooks/useClients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Calendar, DollarSign, User, Edit2, Trash2, Server, Headphones, MoreHorizontal, AlertTriangle, Clock, CreditCard, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays, addMonths, addYears } from 'date-fns';
import MySubscriptions from '@/components/subscriptions/MySubscriptions';

const typeConfig: Record<SubscriptionType, { label: string; icon: any; color: string }> = {
  hosting: { label: 'استضافة', icon: Server, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  support: { label: 'دعم فني', icon: Headphones, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  other: { label: 'أخرى', icon: MoreHorizontal, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
};

const statusConfig: Record<SubscriptionStatus, { label: string; color: string }> = {
  active: { label: 'نشط', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  paused: { label: 'متوقف', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  cancelled: { label: 'ملغى', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  expired: { label: 'منتهي', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
};

const cycleConfig: Record<BillingCycle, string> = {
  monthly: 'شهري',
  yearly: 'سنوي',
};

export default function Subscriptions() {
  const { subscriptions, loading, addSubscription, updateSubscription, deleteSubscription } = useSubscriptions();
  const { clients } = useClients();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | SubscriptionType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | SubscriptionStatus>('all');
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [deletingSubscription, setDeletingSubscription] = useState<Subscription | null>(null);

  const [formData, setFormData] = useState({
    client_id: '',
    type: 'support' as SubscriptionType,
    name: '',
    amount: '',
    currency: 'USD',
    billing_cycle: 'monthly' as BillingCycle,
    start_date: format(new Date(), 'yyyy-MM-dd'),
    next_payment_date: format(new Date(), 'yyyy-MM-dd'),
    status: 'active' as SubscriptionStatus,
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      client_id: '',
      type: 'support',
      name: '',
      amount: '',
      currency: 'USD',
      billing_cycle: 'monthly',
      start_date: format(new Date(), 'yyyy-MM-dd'),
      next_payment_date: format(new Date(), 'yyyy-MM-dd'),
      status: 'active',
      notes: '',
    });
    setEditingSubscription(null);
  };

  const handleSubmit = async () => {
    if (!formData.client_id || !formData.name || !formData.amount) {
      toast({ title: 'خطأ', description: 'الرجاء ملء الحقول المطلوبة', variant: 'destructive' });
      return;
    }

    if (editingSubscription) {
      const result = await updateSubscription(editingSubscription.id, {
        ...formData,
        amount: parseFloat(formData.amount),
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

  const handleEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setFormData({
      client_id: subscription.client_id,
      type: subscription.type,
      name: subscription.name,
      amount: subscription.amount.toString(),
      currency: subscription.currency,
      billing_cycle: subscription.billing_cycle,
      start_date: subscription.start_date,
      next_payment_date: subscription.next_payment_date,
      status: subscription.status,
      notes: subscription.notes || '',
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

  const handleMarkPaid = async (subscription: Subscription) => {
    const nextDate = subscription.billing_cycle === 'monthly'
      ? addMonths(new Date(subscription.next_payment_date), 1)
      : addYears(new Date(subscription.next_payment_date), 1);

    const result = await updateSubscription(subscription.id, {
      next_payment_date: format(nextDate, 'yyyy-MM-dd'),
    });

    if (result.error) {
      toast({ title: 'خطأ', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'تم التحديث', description: 'تم تسجيل الدفع وتحديث تاريخ الاستحقاق التالي' });
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.client?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.client?.company?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || sub.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getPaymentStatus = (subscription: Subscription) => {
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
  const monthlyRevenue = subscriptions
    .filter(s => s.status === 'active')
    .reduce((sum, s) => {
      const monthlyAmount = s.billing_cycle === 'yearly' ? s.amount / 12 : s.amount;
      return sum + monthlyAmount;
    }, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">الاشتراكات</h1>
          <p className="text-muted-foreground">إدارة اشتراكاتك واشتراكات العملاء</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="my-subs" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="my-subs" className="gap-2">
            <CreditCard className="h-4 w-4" />
            اشتراكاتي
          </TabsTrigger>
          <TabsTrigger value="client-subs" className="gap-2">
            <Users className="h-4 w-4" />
            اشتراكات العملاء
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-subs" className="mt-6">
          <MySubscriptions />
        </TabsContent>

        <TabsContent value="client-subs" className="mt-6 space-y-6">
          {/* Client Subscriptions Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">اشتراكات العملاء</h2>
              <p className="text-sm text-muted-foreground">إدارة اشتراكات العملاء والدفعات المتكررة</p>
            </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> إضافة اشتراك</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingSubscription ? 'تعديل الاشتراك' : 'إضافة اشتراك جديد'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>العميل *</Label>
                <Select value={formData.client_id} onValueChange={(v) => setFormData({ ...formData, client_id: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر العميل" /></SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} {client.company && `(${client.company})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>نوع الاشتراك</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as SubscriptionType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="support">دعم فني</SelectItem>
                    <SelectItem value="hosting">استضافة</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>اسم الاشتراك *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: باقة الدعم الشهري"
                />
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
                <Select value={formData.billing_cycle} onValueChange={(v) => setFormData({ ...formData, billing_cycle: v as BillingCycle })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">شهري</SelectItem>
                    <SelectItem value="yearly">سنوي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>تاريخ البدء</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>تاريخ الدفع القادم</Label>
                  <Input
                    type="date"
                    value={formData.next_payment_date}
                    onChange={(e) => setFormData({ ...formData, next_payment_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>الحالة</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as SubscriptionStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="paused">متوقف</SelectItem>
                    <SelectItem value="cancelled">ملغى</SelectItem>
                    <SelectItem value="expired">منتهي</SelectItem>
                  </SelectContent>
                </Select>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">اشتراكات نشطة</p>
                <p className="text-2xl font-bold">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-red-500/10">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">دفعات متأخرة</p>
                <p className="text-2xl font-bold">{overdueCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الإيراد الشهري</p>
                <p className="text-2xl font-bold">${monthlyRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'support', 'hosting', 'other'] as const).map(type => (
            <Button
              key={type}
              variant={typeFilter === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter(type)}
            >
              {type === 'all' ? 'الكل' : typeConfig[type].label}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'paused', 'cancelled'] as const).map(status => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status === 'all' ? 'الكل' : statusConfig[status].label}
            </Button>
          ))}
        </div>
      </div>

      {/* Subscriptions List */}
      {filteredSubscriptions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا توجد اشتراكات</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredSubscriptions.map(subscription => {
            const TypeIcon = typeConfig[subscription.type].icon;
            const paymentStatus = getPaymentStatus(subscription);

            return (
              <Card key={subscription.id} className={paymentStatus?.urgent ? 'border-red-500/50' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-3 rounded-lg ${typeConfig[subscription.type].color}`}>
                        <TypeIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{subscription.name}</h3>
                          <Badge variant="outline" className={statusConfig[subscription.status].color}>
                            {statusConfig[subscription.status].label}
                          </Badge>
                          <Badge variant="outline" className={typeConfig[subscription.type].color}>
                            {typeConfig[subscription.type].label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {subscription.client?.name}
                            {subscription.client?.company && ` (${subscription.client.company})`}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5" />
                            {subscription.amount} {subscription.currency} / {cycleConfig[subscription.billing_cycle]}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            الدفع القادم: {format(new Date(subscription.next_payment_date), 'yyyy-MM-dd')}
                          </span>
                        </div>
                        {paymentStatus && (
                          <p className={`text-sm mt-2 ${paymentStatus.color} flex items-center gap-1`}>
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {paymentStatus.label}
                          </p>
                        )}
                        {subscription.notes && (
                          <p className="text-sm text-muted-foreground mt-2">{subscription.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {subscription.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkPaid(subscription)}
                        >
                          تسجيل دفع
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(subscription)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingSubscription(subscription)}
                      >
                        <Trash2 className="h-4 w-4" />
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
              هل أنت متأكد من حذف اشتراك "{deletingSubscription?.name}"؟ لا يمكن التراجع عن هذا الإجراء.
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
