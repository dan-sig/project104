import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Target, Clock, Dumbbell } from "lucide-react";
import type { MockClient } from "@/data/trainerMockData";
import { formatDistanceToNow } from "date-fns";

interface ClientProfileProps {
  client: MockClient;
}

export function ClientProfile({ client }: ClientProfileProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{client.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                {client.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Joined</p>
              <p className="font-medium">{formatDistanceToNow(new Date(client.joinedDate), { addSuffix: true })}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Workout</p>
              <p className="font-medium">
                {client.lastWorkout 
                  ? formatDistanceToNow(new Date(client.lastWorkout), { addSuffix: true })
                  : 'Never'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Training Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3">
            <Target className="h-5 w-5 text-primary mt-0.5" />
            <p className="text-muted-foreground">{client.goals}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Training Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{client.daysPerWeek} days per week</p>
              <p className="text-sm text-muted-foreground">Training frequency</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{client.sessionDuration}</p>
              <p className="text-sm text-muted-foreground">Session duration</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Equipment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3">
            <Dumbbell className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex flex-wrap gap-2">
              {client.equipment.map((item) => (
                <Badge key={item} variant="outline">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {client.currentProgram && (
        <Card>
          <CardHeader>
            <CardTitle>Current Program</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-primary">{client.currentProgram}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
