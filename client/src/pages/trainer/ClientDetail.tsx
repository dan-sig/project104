import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useTrainerData } from "@/contexts/TrainerDataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Dumbbell, TrendingUp, MessageCircle, AlertTriangle } from "lucide-react";
import { ClientProfile } from "@/components/trainer/ClientProfile";
import { ClientProgram } from "@/components/trainer/ClientProgram";
import { ClientProgress } from "@/components/trainer/ClientProgress";
import { ClientMessages } from "@/components/trainer/ClientMessages";
import { ClientAlerts } from "@/components/trainer/ClientAlerts";

export default function ClientDetail() {
  const [, params] = useRoute("/trainer/client/:id");
  const [, setLocation] = useLocation();
  const { getClient } = useTrainerData();
  const [activeTab, setActiveTab] = useState("profile");

  const clientId = params?.id;
  const client = clientId ? getClient(clientId) : undefined;

  if (!client) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8">
          <p className="text-center text-muted-foreground">Client not found</p>
          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={() => setLocation('/trainer')}
          >
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/trainer')}
              data-testid="button-back-to-dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-4 flex-1">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {client.avatar}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-client-name">{client.name}</h1>
                <p className="text-sm text-muted-foreground">{client.email}</p>
              </div>
              <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                {client.status}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Alert Summary */}
        {(client.alertsCount > 0 || client.unreadMessages > 0) && (
          <div className="flex gap-4 mb-6">
            {client.alertsCount > 0 && (
              <Card className="bg-destructive/10 border-destructive/20">
                <CardContent className="p-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <span className="font-medium">{client.alertsCount} alerts requiring attention</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab("alerts")}
                  >
                    View
                  </Button>
                </CardContent>
              </Card>
            )}
            {client.unreadMessages > 0 && (
              <Card className="bg-primary/10 border-primary/20">
                <CardContent className="p-4 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  <span className="font-medium">{client.unreadMessages} unread messages</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab("messages")}
                  >
                    View
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" data-testid="tab-profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="program" data-testid="tab-program">
              <Dumbbell className="h-4 w-4 mr-2" />
              Program
            </TabsTrigger>
            <TabsTrigger value="progress" data-testid="tab-progress">
              <TrendingUp className="h-4 w-4 mr-2" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="messages" data-testid="tab-messages">
              <MessageCircle className="h-4 w-4 mr-2" />
              Messages
              {client.unreadMessages > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 px-1 text-xs">
                  {client.unreadMessages}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="alerts" data-testid="tab-alerts">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Alerts
              {client.alertsCount > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 px-1 text-xs">
                  {client.alertsCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="profile">
              <ClientProfile client={client} />
            </TabsContent>

            <TabsContent value="program">
              <ClientProgram clientId={client.id} />
            </TabsContent>

            <TabsContent value="progress">
              <ClientProgress clientId={client.id} />
            </TabsContent>

            <TabsContent value="messages">
              <ClientMessages clientId={client.id} />
            </TabsContent>

            <TabsContent value="alerts">
              <ClientAlerts clientId={client.id} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
