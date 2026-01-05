import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type SubscriptionType = 'hosting' | 'support' | 'other';
export type BillingCycle = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'expired';

export interface Subscription {
  id: string;
  user_id: string;
  client_id: string;
  type: SubscriptionType;
  name: string;
  amount: number;
  currency: string;
  billing_cycle: BillingCycle;
  start_date: string;
  next_payment_date: string;
  status: SubscriptionStatus;
  notes: string;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    name: string;
    company: string | null;
  };
}

export interface SubscriptionInsert {
  client_id: string;
  type: SubscriptionType;
  name: string;
  amount: number;
  currency?: string;
  billing_cycle: BillingCycle;
  start_date?: string;
  next_payment_date?: string;
  status?: SubscriptionStatus;
  notes?: string;
}

export interface SubscriptionUpdate {
  client_id?: string;
  type?: SubscriptionType;
  name?: string;
  amount?: number;
  currency?: string;
  billing_cycle?: BillingCycle;
  start_date?: string;
  next_payment_date?: string;
  status?: SubscriptionStatus;
  notes?: string;
}

export function useSubscriptions() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
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
        .from('subscriptions')
        .select(`
          *,
          client:clients(id, name, company)
        `)
        .order('next_payment_date', { ascending: true });

      if (error) throw error;
      setSubscriptions((data as unknown as Subscription[]) || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching subscriptions:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const addSubscription = async (subscription: SubscriptionInsert) => {
    if (!user) return { error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('subscriptions')
      .insert([{ ...subscription, user_id: user.id }])
      .select(`
        *,
        client:clients(id, name, company)
      `)
      .single();

    if (error) {
      console.error('Error adding subscription:', error);
      return { error: error.message };
    }

    setSubscriptions((prev) => [data as unknown as Subscription, ...prev]);
    return { data };
  };

  const updateSubscription = async (id: string, updates: SubscriptionUpdate) => {
    const { data, error } = await supabase
      .from('subscriptions')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        client:clients(id, name, company)
      `)
      .single();

    if (error) {
      console.error('Error updating subscription:', error);
      return { error: error.message };
    }

    setSubscriptions((prev) => prev.map((s) => (s.id === id ? (data as unknown as Subscription) : s)));
    return { data };
  };

  const deleteSubscription = async (id: string) => {
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting subscription:', error);
      return { error: error.message };
    }

    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
    return { success: true };
  };

  // Get subscriptions due soon (within 7 days)
  const getDueSoon = () => {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return subscriptions.filter(s => {
      const nextPayment = new Date(s.next_payment_date);
      return s.status === 'active' && nextPayment <= weekFromNow;
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
    getDueSoon,
    getOverdue,
  };
}
