import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { TrainerRosterTable } from "@/components/trainer/TrainerRosterTable";
import { RevenueOverview } from "@/components/trainer/RevenueOverview";
import { ClientStats } from "@/components/trainer/ClientStats";
import { CustomExerciseLibrary } from "@/components/trainer/CustomExerciseLibrary";
import { DiscountCodeManager } from "@/components/trainer/DiscountCodeManager";
import { TrainerInvitations } from "@/components/trainer/TrainerInvitations";
import { useQuery } from "@tanstack/react-query";
import { useMergedClientData } from "@/hooks/useMergedClientData";
import { usePendingInvitesCount } from "@/hooks/usePendingInvitesCount";
import type { User, TrainerProfile } from "@shared/schema";
import { AlertTriangle, Users, Crown, Settings } from "lucide-react";

export default function TrainerDashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("clients");
  const { stats, isLoading: isLoadingClients } = useMergedClientData();

  // Get current user ID for custom exercises
  const { data: user, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  // Fetch trainer profile for subscription status
  const { data: trainerProfile, isLoading: isLoadingProfile } = useQuery<TrainerProfile>({
    queryKey: ["/api/trainer/profile"],
    retry: false,
  });

  // Fetch pending invites count for Client Invitations tab badge
  const { pendingCount: pendingInvitesCount, hasPending: hasPendingInvites } = usePendingInvitesCount();

  const clientCount = stats.activeClients || 0;
  const isPremium = trainerProfile?.subscriptionStatus === "premium";
  const freeLimit = 5;
  const isOverLimit = !isPremium && clientCount >= freeLimit;
  const isNearLimit = !isPremium && clientCount === freeLimit - 1;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-trainer-dashboard-title">Trainer Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage your clients and their programs</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation('/trainer/settings')}
                data-testid="button-settings"
              >
                <Settings className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  sessionStorage.removeItem('userRole');
                  setLocation('/');
                }}
                data-testid="button-logout"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Alert Summary Cards */}
        {!isLoadingClients && !isLoadingProfile && (stats.totalAlerts > 0 || isNearLimit || isOverLimit) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isOverLimit && (
              <Card className="bg-orange-500/10 border-orange-500/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <Users className="h-5 w-5 flex-shrink-0 text-orange-600 dark:text-orange-400" />
                  <div className="flex-1">
                    <p className="font-medium" data-testid="text-client-limit-warning">
                      {clientCount}/{freeLimit} clients - Limit reached
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Upgrade to premium for unlimited clients
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLocation('/trainer/settings')}
                    data-testid="button-upgrade-from-dashboard"
                  >
                    <Crown className="h-4 w-4 mr-1" />
                    Upgrade
                  </Button>
                </CardContent>
              </Card>
            )}
            {isNearLimit && (
              <Card className="bg-yellow-500/10 border-yellow-500/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <Users className="h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
                  <div className="flex-1">
                    <p className="font-medium" data-testid="text-client-limit-warning">
                      {clientCount}/{freeLimit} clients - Approaching limit
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Consider upgrading for unlimited clients
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLocation('/trainer/settings')}
                    data-testid="button-upgrade-from-dashboard"
                  >
                    <Crown className="h-4 w-4 mr-1" />
                    Upgrade
                  </Button>
                </CardContent>
              </Card>
            )}
            {stats.totalAlerts > 0 && (
              <Card className="bg-destructive/10 border-destructive/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium" data-testid="text-total-alerts">
                      {stats.totalAlerts} alert{stats.totalAlerts !== 1 ? 's' : ''} requiring attention
                    </p>
                    <p className="text-sm text-muted-foreground">Review client feedback and concerns</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab("clients")}
                    data-testid="button-view-alerts"
                  >
                    View
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Main Content with Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList data-testid="tabs-trainer-dashboard">
            <TabsTrigger value="clients" data-testid="tab-clients">Client Roster</TabsTrigger>
            <TabsTrigger value="revenue" data-testid="tab-revenue">Revenue</TabsTrigger>
            <TabsTrigger value="programs" data-testid="tab-programs">My Programs</TabsTrigger>
            <TabsTrigger value="exercises" data-testid="tab-exercises">Custom Exercises</TabsTrigger>
            <TabsTrigger value="client-invitations" data-testid="tab-client-invitations" className="relative">
              Client Invitations
              {hasPendingInvites && (
                <Badge 
                  variant="default" 
                  className="ml-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  data-testid="badge-pending-invites"
                >
                  {pendingInvitesCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="discount-codes" data-testid="tab-discount-codes">Discount Codes</TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="mt-6">
            <TrainerRosterTable />
          </TabsContent>

          <TabsContent value="revenue" className="mt-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Revenue Overview</h2>
              <RevenueOverview />
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-4">Client Statistics</h2>
              <ClientStats />
            </div>
          </TabsContent>

          <TabsContent value="programs" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-semibold">Training Programs</h3>
                <p className="text-sm text-muted-foreground">Create and manage your custom programs</p>
              </div>
              <Button
                onClick={() => setLocation('/trainer/programs/new')}
                data-testid="button-create-program"
              >
                Create New Program
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => setLocation('/trainer/programs')}
              className="w-full"
              data-testid="button-view-all-programs"
            >
              View All Programs
            </Button>
          </TabsContent>

          <TabsContent value="exercises" className="mt-6">
            {isLoadingUser ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading...
              </div>
            ) : user ? (
              <CustomExerciseLibrary trainerId={user.id} />
            ) : (
              <div className="text-center py-12 text-destructive">
                Error loading user information
              </div>
            )}
          </TabsContent>

          <TabsContent value="client-invitations" className="mt-6">
            <div className="mb-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Client Invitations</strong> - Manage your direct client connections. 
                Search for clients and send invitations to work together. 
                Free accounts can have up to 5 active clients.
              </p>
            </div>
            <TrainerInvitations />
          </TabsContent>

          <TabsContent value="discount-codes" className="mt-6">
            <div className="mb-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Discount Codes</strong> - Premium trainers can generate monthly 25% discount codes to attract new clients. 
                Share these codes for marketing and program sales.
              </p>
            </div>
            <DiscountCodeManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
