import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CurrencyRates {
  usd_to_eur: number;
  eur_to_dzd: number;
}

export function useCurrencyRates() {
  const { user } = useAuth();
  const [rates, setRates] = useState<CurrencyRates>({ usd_to_eur: 0.82, eur_to_dzd: 275 });
  const [loading, setLoading] = useState(true);

  const fetchRates = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_currency_rates')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching rates:', error);
      }

      if (data) {
        setRates({
          usd_to_eur: Number(data.usd_to_eur),
          eur_to_dzd: Number(data.eur_to_dzd),
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const updateRates = async (newRates: CurrencyRates) => {
    if (!user) return { error: 'Not authenticated' };

    // Try to upsert
    const { data: existing } = await supabase
      .from('user_currency_rates')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('user_currency_rates')
        .update(newRates)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating rates:', error);
        return { error: error.message };
      }
    } else {
      const { error } = await supabase
        .from('user_currency_rates')
        .insert([{ ...newRates, user_id: user.id }]);

      if (error) {
        console.error('Error inserting rates:', error);
        return { error: error.message };
      }
    }

    setRates(newRates);
    return { success: true };
  };

  // Conversion functions
  const convertToDZD = (amount: number, currency: string): number => {
    switch (currency.toUpperCase()) {
      case 'USD':
        const eur = amount * rates.usd_to_eur;
        return eur * rates.eur_to_dzd;
      case 'EUR':
        return amount * rates.eur_to_dzd;
      case 'DZD':
      case 'DA':
        return amount;
      default:
        return amount;
    }
  };

  const formatDZD = (amount: number): string => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' DA';
  };

  return {
    rates,
    loading,
    updateRates,
    convertToDZD,
    formatDZD,
    refetch: fetchRates,
  };
}
