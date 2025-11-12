import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Dumbbell, TrendingUp, AlertTriangle, Calendar, Loader2 } from "lucide-react";
import { ClientProfile } from "@/components/trainer/ClientProfile";
import { ClientProgram } from "@/components/trainer/ClientProgram";
import { ClientProgress } from "@/components/trainer/ClientProgress";
import { ClientAlerts } from "@/components/trainer/ClientAlerts";
import { ClientWorkoutSessions } from "@/components/trainer/ClientWorkoutSessions";

interface ClientDetailData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  fitnessLevel: string;
  primaryGoal: string;
  nutritionGoal: string;
  equipmentAccess: string[];
  weeklyWorkoutDays: number;
  preferredDuration: number;
  connectionDate: string;
  activeProgram: {
    id: string;
    name: string;
    description: string | null;
    creatorId: string;
  } | null;
  stats: {
    totalWorkouts: number;
    currentStreak: number;
  };
  recentSessions: any[];
}

export default function ClientDetail() {
  const [, params] = useRoute("/trainer/client/:id");
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("profile");

  const clientId = params?.id;

  // Fetch client details from API
  const { data: client, isLoading, error } = useQuery<ClientDetailData>({
    queryKey: ["/api/trainer/clients", clientId],
    enabled: !!clientId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8">
          <p className="text-center text-muted-foreground">Client not found</p>
          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={() => setLocation('/trainer')}
            data-testid="button-back-to-dashboard"
          >
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  // Compute client name and initials
  const clientName = `${client.firstName} ${client.lastName}`;
  const clientInitials = `${client.firstName[0]}${client.lastName[0]}`.toUpperCase();

  // Transform API data to ClientProfile format
  const clientProfileData = {
    id: client.id,
    name: clientName,
    email: client.email,
    status: client.status,
    joinedDate: client.connectionDate,
    lastWorkoutDate: client.recentSessions[0]?.scheduledDate || null,
    currentProgram: client.activeProgram,
    profile: {
      fitnessLevel: client.fitnessLevel || 'beginner',
      goals: client.primaryGoal || 'General fitness',
      injuries: null, // Not available in API response
      availableEquipment: client.equipmentAccess || [],
      daysPerWeek: client.weeklyWorkoutDays || 3,
      sessionDuration: client.preferredDuration || 45,
      focusCycle: 'flow', // Not available in API response, using default
      nutritionGoal: client.nutritionGoal || 'maintenance',
    },
  };

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
                  {clientInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-client-name">{clientName}</h1>
                <p className="text-sm text-muted-foreground">{client.email}</p>
              </div>
              <Badge variant={client.status === 'active' ? 'default' : 'secondary'} data-testid="badge-client-status">
                {client.status}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4" data-testid="tabs-client-detail">
            <TabsTrigger value="profile" data-testid="tab-profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="workouts" data-testid="tab-workouts">
              <Calendar className="h-4 w-4 mr-2" />
              Workouts
            </TabsTrigger>
            <TabsTrigger value="progress" data-testid="tab-progress">
              <TrendingUp className="h-4 w-4 mr-2" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="program" data-testid="tab-program">
              <Dumbbell className="h-4 w-4 mr-2" />
              Program
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="profile">
              <ClientProfile client={clientProfileData} />
            </TabsContent>

            <TabsContent value="workouts">
              <ClientWorkoutSessions clientId={client.id} />
            </TabsContent>

            <TabsContent value="progress">
              <ClientProgress clientId={client.id} />
            </TabsContent>

            <TabsContent value="program">
              <ClientProgram clientId={client.id} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
