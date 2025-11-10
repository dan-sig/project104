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
    <Card>
      <CardHeader>
        <CardTitle data-testid="text-revenue-title">Revenue Overview</CardTitle>
        <CardDescription>Your earnings from program sales</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Total Earnings */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold" data-testid="text-total-earnings">
                  ${salesMetrics.totalRevenue.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Monthly & Annual Revenue */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">MRR</p>
              </div>
              <p className="text-xl font-bold" data-testid="text-monthly-revenue">
                ${salesMetrics.monthlyRevenue.toFixed(2)}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">ARR</p>
              </div>
              <p className="text-xl font-bold" data-testid="text-annual-revenue">
                ${salesMetrics.annualRevenue.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-between text-sm pt-2 border-t">
            <span className="text-muted-foreground">
              {salesMetrics.totalPurchases} total sale{salesMetrics.totalPurchases !== 1 ? 's' : ''}
            </span>
            <span className="text-muted-foreground">
              {salesMetrics.activePlans} active plan{salesMetrics.activePlans !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
