import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Calendar } from 'lucide-react';
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
    <div className="grid gap-4 md:grid-cols-3 mb-6" data-testid="revenue-overview">
      <Card data-testid="card-total-revenue">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold" data-testid="text-total-revenue">
            {formatCurrency(totalRevenue)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Combined monthly + annual commissions
          </p>
        </CardContent>
      </Card>

      <Card data-testid="card-monthly-revenue">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold" data-testid="text-monthly-revenue">
            {formatCurrency(monthlyRevenue)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Paid monthly from active subscribers
          </p>
        </CardContent>
      </Card>

      <Card data-testid="card-annual-revenue">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Annual Revenue</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold" data-testid="text-annual-revenue">
            {formatCurrency(annualRevenue)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Paid annually from active subscribers
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
