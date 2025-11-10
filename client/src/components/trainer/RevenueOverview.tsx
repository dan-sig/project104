import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
import { useTrainerData } from '@/contexts/TrainerDataContext';

export function RevenueOverview() {
  const { getTotalRevenue, getMonthlyRevenue, getAnnualRevenue } = useTrainerData();

  const totalRevenue = getTotalRevenue();
  const monthlyRevenue = getMonthlyRevenue();
  const annualRevenue = getAnnualRevenue();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Card data-testid="revenue-overview">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Revenue Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <div className="text-2xl font-bold" data-testid="text-total-revenue">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total Earnings</p>
          </div>
          <div>
            <div className="text-2xl font-bold" data-testid="text-monthly-revenue">
              {formatCurrency(monthlyRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">MRR</p>
          </div>
          <div>
            <div className="text-2xl font-bold" data-testid="text-annual-revenue">
              {formatCurrency(annualRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Annual Revenue</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
