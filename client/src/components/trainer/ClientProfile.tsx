import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Target, Clock, Dumbbell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ClientProfileProps {
  client: {
    id: string;
    name: string;
    email: string;
    status: string;
    joinedDate: string;
    lastWorkoutDate: string | null;
    currentProgram: {
      id: string;
      name: string;
      description: string | null;
    } | null;
    profile: {
      fitnessLevel: string;
      goals: string;
      injuries: string | null;
      availableEquipment: string[];
      daysPerWeek: number;
      sessionDuration: number;
      focusCycle: string;
      nutritionGoal: string;
    };
  };
}

export function ClientProfile({ client }: ClientProfileProps) {
  return (
    <div className="space-y-6">
      <Card data-testid="card-client-info">
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium" data-testid="text-client-email">{client.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={client.status === 'active' ? 'default' : 'secondary'} data-testid="badge-client-status">
                {client.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Joined</p>
              <p className="font-medium" data-testid="text-joined-date">{formatDistanceToNow(new Date(client.joinedDate), { addSuffix: true })}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Workout</p>
              <p className="font-medium" data-testid="text-last-workout">
                {client.lastWorkoutDate 
                  ? formatDistanceToNow(new Date(client.lastWorkoutDate), { addSuffix: true })
                  : 'Never'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-training-goals">
        <CardHeader>
          <CardTitle>Training Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3">
            <Target className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="text-muted-foreground" data-testid="text-goals">{client.profile.goals}</p>
              {client.profile.injuries && (
                <div className="text-sm">
                  <span className="font-medium">Injuries/Limitations:</span>
                  <p className="text-muted-foreground mt-1">{client.profile.injuries}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-training-schedule">
        <CardHeader>
          <CardTitle>Training Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium" data-testid="text-days-per-week">{client.profile.daysPerWeek} days per week</p>
              <p className="text-sm text-muted-foreground">Training frequency</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium" data-testid="text-session-duration">{client.profile.sessionDuration} minutes</p>
              <p className="text-sm text-muted-foreground">Session duration</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <p className="text-sm text-muted-foreground">Fitness Level</p>
              <Badge variant="outline" data-testid="badge-fitness-level">{client.profile.fitnessLevel}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Focus Cycle</p>
              <Badge variant="outline" data-testid="badge-focus-cycle">{client.profile.focusCycle}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nutrition Goal</p>
              <Badge variant="outline" data-testid="badge-nutrition-goal">{client.profile.nutritionGoal}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-equipment">
        <CardHeader>
          <CardTitle>Available Equipment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3">
            <Dumbbell className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex flex-wrap gap-2">
              {client.profile.availableEquipment.map((item) => (
                <Badge key={item} variant="outline" data-testid={`badge-equipment-${item}`}>
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {client.currentProgram && (
        <Card data-testid="card-current-program">
          <CardHeader>
            <CardTitle>Current Program</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-primary" data-testid="text-program-name">{client.currentProgram.name}</p>
            {client.currentProgram.description && (
              <p className="text-sm text-muted-foreground mt-2">{client.currentProgram.description}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
