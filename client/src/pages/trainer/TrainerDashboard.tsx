import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { TrainerRosterTable } from "@/components/trainer/TrainerRosterTable";
import { RevenueOverview } from "@/components/trainer/RevenueOverview";
import { ClientStats } from "@/components/trainer/ClientStats";

export default function TrainerDashboard() {
  const [, setLocation] = useLocation();

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
        {/* Compact Two-Card Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RevenueOverview />
          <ClientStats />
        </div>

        {/* Client Roster Table */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Client Roster</h2>
          <TrainerRosterTable />
        </div>
      </div>
    </div>
  );
}
