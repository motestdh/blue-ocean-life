import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type PersonalBillingCycle = 'weekly' | 'monthly' | 'yearly';
export type PersonalSubscriptionStatus = 'active' | 'paused' | 'cancelled';
export type PersonalSubscriptionCategory = 'entertainment' | 'software' | 'services' | 'utilities' | 'other';

export interface PersonalSubscription {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  currency: string;
  billing_cycle: PersonalBillingCycle;
  category: PersonalSubscriptionCategory;
  next_payment_date: string;
  status: PersonalSubscriptionStatus;
  notes: string | null;
  url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonalSubscriptionInsert {
  name: string;
  amount: number;
  currency?: string;
  billing_cycle?: PersonalBillingCycle;
  category?: PersonalSubscriptionCategory;
  next_payment_date?: string;
  status?: PersonalSubscriptionStatus;
  notes?: string;
  url?: string;
}

export interface PersonalSubscriptionUpdate {
  name?: string;
  amount?: number;
  currency?: string;
  billing_cycle?: PersonalBillingCycle;
  category?: PersonalSubscriptionCategory;
  next_payment_date?: string;
  status?: PersonalSubscriptionStatus;
  notes?: string;
  url?: string;
}

export function usePersonalSubscriptions() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<PersonalSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    if (!user) {
      setSubscriptions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('personal_subscriptions')
        .select('*')
        .order('next_payment_date', { ascending: true });

      if (error) throw error;
      setSubscriptions((data as PersonalSubscription[]) || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching personal subscriptions:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const addSubscription = async (subscription: PersonalSubscriptionInsert) => {
    if (!user) return { error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('personal_subscriptions')
      .insert([{ ...subscription, user_id: user.id }])
      .select()
      .single();

    if (error) {
      console.error('Error adding personal subscription:', error);
      return { error: error.message };
    }

    setSubscriptions((prev) => [data as PersonalSubscription, ...prev].sort(
      (a, b) => new Date(a.next_payment_date).getTime() - new Date(b.next_payment_date).getTime()
    ));
    return { data };
  };

  const updateSubscription = async (id: string, updates: PersonalSubscriptionUpdate) => {
    const { data, error } = await supabase
      .from('personal_subscriptions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating personal subscription:', error);
      return { error: error.message };
    }

    setSubscriptions((prev) => prev.map((s) => (s.id === id ? (data as PersonalSubscription) : s)));
    return { data };
  };

  const deleteSubscription = async (id: string) => {
    const { error } = await supabase
      .from('personal_subscriptions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting personal subscription:', error);
      return { error: error.message };
    }

    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
    return { success: true };
  };

  // Calculate monthly total
  const getMonthlyTotal = (currency?: string) => {
    return subscriptions
      .filter(s => s.status === 'active' && (!currency || s.currency === currency))
      .reduce((sum, s) => {
        let monthlyAmount = s.amount;
        if (s.billing_cycle === 'yearly') monthlyAmount = s.amount / 12;
        if (s.billing_cycle === 'weekly') monthlyAmount = s.amount * 4.33;
        return sum + monthlyAmount;
      }, 0);
  };

  // Get upcoming payments (within 7 days)
  const getUpcoming = () => {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return subscriptions.filter(s => {
      const nextPayment = new Date(s.next_payment_date);
      return s.status === 'active' && nextPayment >= now && nextPayment <= weekFromNow;
    });
  };

  // Get overdue subscriptions
  const getOverdue = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return subscriptions.filter(s => {
      const nextPayment = new Date(s.next_payment_date);
      return s.status === 'active' && nextPayment < now;
    });
  };

  return {
    subscriptions,
    loading,
    error,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    refetch: fetchSubscriptions,
    getMonthlyTotal,
    getUpcoming,
    getOverdue,
  };
}
