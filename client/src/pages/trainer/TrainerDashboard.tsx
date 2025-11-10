import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTrainerData } from "@/contexts/TrainerDataContext";
import { useLocation } from "wouter";
import { MessageCircle, AlertTriangle, Calendar, TrendingUp, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function TrainerDashboard() {
  const { clients, getClientFeedback, getUnreadMessages } = useTrainerData();
  const [, setLocation] = useLocation();

  const activeClients = clients.filter(c => c.status === 'active');
  const totalAlerts = clients.reduce((sum, c) => sum + getClientFeedback(c.id).length, 0);
  const totalUnread = clients.reduce((sum, c) => sum + getUnreadMessages(c.id).length, 0);

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

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clients.length}</div>
              <p className="text-xs text-muted-foreground">
                {activeClients.length} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAlerts}</div>
              <p className="text-xs text-muted-foreground">
                Requiring attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
              <MessageCircle className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUnread}</div>
              <p className="text-xs text-muted-foreground">
                Across all clients
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Programs</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeClients.length}</div>
              <p className="text-xs text-muted-foreground">
                In progress
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Client Roster */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Client Roster</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => {
              const alertsCount = getClientFeedback(client.id).length;
              const unreadCount = getUnreadMessages(client.id).length;
              
              return (
                <Card
                  key={client.id}
                  className="hover-elevate cursor-pointer"
                  onClick={() => setLocation(`/trainer/client/${client.id}`)}
                  data-testid={`card-client-${client.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {client.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{client.name}</h3>
                          <p className="text-sm text-muted-foreground">{client.email}</p>
                        </div>
                      </div>
                      <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                        {client.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Alerts and Messages */}
                    <div className="flex gap-2">
                      {alertsCount > 0 && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {alertsCount} alerts
                        </Badge>
                      )}
                      {unreadCount > 0 && (
                        <Badge variant="default" className="gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {unreadCount} new
                        </Badge>
                      )}
                    </div>

                  {/* Current Program */}
                  {client.currentProgram && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Program: </span>
                      <span className="font-medium">{client.currentProgram}</span>
                    </div>
                  )}

                  {/* Last Workout */}
                  {client.lastWorkout && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Last workout {formatDistanceToNow(new Date(client.lastWorkout), { addSuffix: true })}</span>
                    </div>
                  )}

                  {/* Goals */}
                  <div className="text-sm text-muted-foreground">
                    {client.goals}
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
