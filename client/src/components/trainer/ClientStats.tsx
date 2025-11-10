import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import type { TrainerClientRoster } from "@shared/schema";
import { Users, ShoppingCart, TrendingUp } from "lucide-react";

export function ClientStats() {
  const { data: clients, isLoading } = useQuery<TrainerClientRoster[]>({
    queryKey: ["/api/trainer/clients"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Client Stats</CardTitle>
          <CardDescription>Loading client statistics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalClients = clients?.length || 0;
  const activeClients = clients?.filter(c => c.subscriptionType === 'subscription').length || 0;
  const oneTimeClients = clients?.filter(c => c.subscriptionType === 'one_time').length || 0;
  const recurringPercent = totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Clients */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-md bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
          </div>
          <p className="text-2xl font-bold" data-testid="text-total-clients">
            {totalClients}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {recurringPercent}% recurring
          </p>
        </CardContent>
      </Card>

      {/* Subscriptions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-md bg-primary/10">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Subscriptions</p>
          </div>
          <p className="text-2xl font-bold" data-testid="text-active-clients">
            {activeClients}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Monthly billing
          </p>
        </CardContent>
      </Card>

      {/* One-time */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-md bg-primary/10">
              <ShoppingCart className="h-4 w-4 text-primary" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">One-time</p>
          </div>
          <p className="text-2xl font-bold" data-testid="text-one-time-clients">
            {oneTimeClients}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Single purchase
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
