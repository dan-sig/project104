import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import type { TrainerSalesMetrics } from "@shared/schema";
import { DollarSign, TrendingUp, Calendar } from "lucide-react";

export function RevenueOverview() {
  const { data: salesMetrics, isLoading } = useQuery<TrainerSalesMetrics>({
    queryKey: ["/api/trainer/sales"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
          <CardDescription>Loading revenue data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!salesMetrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
          <CardDescription>Your earnings from program sales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No revenue data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Earnings */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-md bg-primary/10">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
          </div>
          <p className="text-2xl font-bold" data-testid="text-total-earnings">
            ${salesMetrics.totalRevenue.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {salesMetrics.totalPurchases} sale{salesMetrics.totalPurchases !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* MRR */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-md bg-primary/10">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">MRR</p>
          </div>
          <p className="text-2xl font-bold" data-testid="text-monthly-revenue">
            ${salesMetrics.monthlyRevenue.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Monthly recurring
          </p>
        </CardContent>
      </Card>

      {/* ARR */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-md bg-primary/10">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">ARR</p>
          </div>
          <p className="text-2xl font-bold" data-testid="text-annual-revenue">
            ${salesMetrics.annualRevenue.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Annual recurring
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
