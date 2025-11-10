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

  return (
    <Card>
      <CardHeader>
        <CardTitle data-testid="text-client-stats-title">Client Stats</CardTitle>
        <CardDescription>Overview of your client base</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Total Clients */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold" data-testid="text-total-clients">
                  {totalClients}
                </p>
              </div>
            </div>
          </div>

          {/* Subscription Breakdown */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Subscriptions</p>
              </div>
              <p className="text-xl font-bold" data-testid="text-active-clients">
                {activeClients}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">One-time</p>
              </div>
              <p className="text-xl font-bold" data-testid="text-one-time-clients">
                {oneTimeClients}
              </p>
            </div>
          </div>

          {/* Stats Footer */}
          {totalClients > 0 && (
            <div className="flex items-center justify-between text-sm pt-2 border-t">
              <span className="text-muted-foreground">
                {Math.round((activeClients / totalClients) * 100)}% recurring revenue
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
