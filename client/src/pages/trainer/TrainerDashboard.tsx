import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { TrainerRosterTable } from "@/components/trainer/TrainerRosterTable";
import { RevenueOverview } from "@/components/trainer/RevenueOverview";
import { ClientStats } from "@/components/trainer/ClientStats";
import { CustomExerciseLibrary } from "@/components/trainer/CustomExerciseLibrary";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export default function TrainerDashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("clients");

  // Get current user ID for custom exercises
  const { data: user, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

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
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Revenue Stats */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Revenue Overview</h2>
          <RevenueOverview />
        </div>

        {/* Client Stats */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Client Statistics</h2>
          <ClientStats />
        </div>

        {/* Main Content with Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList data-testid="tabs-trainer-dashboard">
            <TabsTrigger value="clients" data-testid="tab-clients">Client Roster</TabsTrigger>
            <TabsTrigger value="programs" data-testid="tab-programs">My Programs</TabsTrigger>
            <TabsTrigger value="exercises" data-testid="tab-exercises">Custom Exercises</TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="mt-6">
            <TrainerRosterTable />
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
        </Tabs>
      </div>
    </div>
  );
}
