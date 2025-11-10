import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MessageCircle, AlertTriangle, TrendingUp, Calendar } from 'lucide-react';
import { useTrainerData } from '@/contexts/TrainerDataContext';
import { format } from 'date-fns';
import type { MockClient } from '@/data/trainerMockData';

export function TrainerRosterTable() {
  const [, setLocation] = useLocation();
  const {
    clients,
    getUnreadMessages,
    getClientFeedback,
    getClientCompletionRate,
    getClientNextWorkout,
    getClientStreak
  } = useTrainerData();

  const [searchQuery, setSearchQuery] = useState('');

  const enrichedClients = useMemo(() => {
    return clients.map(client => ({
      ...client,
      unreadCount: getUnreadMessages(client.id).length,
      alertCount: getClientFeedback(client.id).length,
      completionRate: getClientCompletionRate(client.id),
      nextWorkout: getClientNextWorkout(client.id),
      streak: getClientStreak(client.id)
    }));
  }, [clients, getUnreadMessages, getClientFeedback, getClientCompletionRate, getClientNextWorkout, getClientStreak]);

  const filteredClients = useMemo(() => {
    return enrichedClients.filter(client => 
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [enrichedClients, searchQuery]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-clients"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Current Program</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Days/Week</TableHead>
              <TableHead>Last Workout</TableHead>
              <TableHead>Completion</TableHead>
              <TableHead>Messages</TableHead>
              <TableHead>Alerts</TableHead>
              <TableHead>Next Workout</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Streak</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                  {searchQuery ? 'No clients found matching your search.' : 'No clients yet.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow
                  key={client.id}
                  className="cursor-pointer hover-elevate"
                  onClick={() => setLocation(`/trainer/client/${client.id}`)}
                  data-testid={`row-client-${client.id}`}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {client.avatar}
                      </div>
                      <div>
                        <div className="font-medium" data-testid={`text-client-name-${client.id}`}>
                          {client.name}
                        </div>
                        <div className="text-sm text-muted-foreground">{client.email}</div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm" data-testid={`text-program-${client.id}`}>
                      {client.currentProgram}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={client.status === 'active' ? 'default' : 'secondary'}
                      data-testid={`badge-status-${client.id}`}
                    >
                      {client.status}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm text-center" data-testid={`text-days-${client.id}`}>
                      {client.daysPerWeek}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm" data-testid={`text-last-workout-${client.id}`}>
                      {client.lastWorkout ? format(new Date(client.lastWorkout), 'MMM d') : '-'}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-16 bg-muted rounded-full overflow-hidden"
                        data-testid={`progress-completion-${client.id}`}
                      >
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${client.completionRate}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">{client.completionRate}%</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    {client.unreadCount > 0 ? (
                      <div className="flex items-center gap-1.5 text-sm">
                        <MessageCircle className="h-4 w-4 text-primary" />
                        <span className="font-medium" data-testid={`text-unread-${client.id}`}>
                          {client.unreadCount}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  <TableCell>
                    {client.alertCount > 0 ? (
                      <div className="flex items-center gap-1.5 text-sm">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <span className="font-medium" data-testid={`text-alerts-${client.id}`}>
                          {client.alertCount}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  <TableCell>
                    {client.nextWorkout ? (
                      <div className="text-sm" data-testid={`text-next-workout-${client.id}`}>
                        <div className="font-medium">{client.nextWorkout.name}</div>
                        <div className="text-muted-foreground text-xs">
                          {format(new Date(client.nextWorkout.scheduledDate), 'MMM d')}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="text-sm" data-testid={`text-joined-${client.id}`}>
                      {format(new Date(client.joinedDate), 'MMM d, yyyy')}
                    </div>
                  </TableCell>

                  <TableCell>
                    {client.streak > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium" data-testid={`text-streak-${client.id}`}>
                          {client.streak}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Showing {filteredClients.length} of {clients.length} clients
        </div>
      </div>
    </div>
  );
}
