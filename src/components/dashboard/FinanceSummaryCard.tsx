import { Wallet, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface FinanceSummaryCardProps {
  income: number;
  expenses: number;
  balance: number;
}

export function FinanceSummaryCard({ income, expenses, balance }: FinanceSummaryCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="blitzit-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">This Month</h3>
        </div>
        <Link to="/finance" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
          Details <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-sm text-muted-foreground">Income</span>
          </div>
          <span className="font-semibold text-emerald-500">{formatCurrency(income)}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-destructive" />
            </div>
            <span className="text-sm text-muted-foreground">Expenses</span>
          </div>
          <span className="font-semibold text-destructive">{formatCurrency(expenses)}</span>
        </div>

        <div className="pt-3 border-t border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Net Balance</span>
            <span className={cn(
              "text-lg font-bold",
              balance >= 0 ? "text-emerald-500" : "text-destructive"
            )}>
              {formatCurrency(balance)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
