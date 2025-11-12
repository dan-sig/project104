import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Users, AlertTriangle, Plus } from 'lucide-react';
import { useMergedClientData } from '@/hooks/useMergedClientData';
import { format, formatDistanceToNow } from 'date-fns';
import { AssignProgramDialog } from './AssignProgramDialog';

export function TrainerRosterTable() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<{ id: string; name: string } | null>(null);

  const { clients, isLoading } = useMergedClientData();

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.currentProgram && client.currentProgram.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Client Roster
            </CardTitle>
            <CardDescription>
              {clients.length} total client{clients.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or program..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-clients"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading client roster...
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No clients yet</p>
            <p className="text-sm">Clients will appear here when they purchase your programs</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No clients match your search
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Last Workout</TableHead>
                  <TableHead className="text-center">Alerts</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => {
                  const hasProgram = !!client.currentProgram && client.currentProgram !== 'No program';
                  
                  return (
                  <TableRow 
                    key={client.id}
                    className="hover-elevate"
                    data-testid={`row-client-${client.id}`}
                  >
                    <TableCell onClick={() => setLocation(`/trainer/client/${client.id}`)} className="cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {client.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium" data-testid={`text-client-name-${client.id}`}>
                            {client.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {client.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell onClick={() => setLocation(`/trainer/client/${client.id}`)} className="cursor-pointer">
                      <div className="font-medium">
                        {client.currentProgram || 'No program'}
                      </div>
                      {client.hasPurchase && (
                        <div className="text-xs text-muted-foreground">
                          Purchased {format(new Date(client.purchaseDate!), 'MMM d, yyyy')}
                        </div>
                      )}
                    </TableCell>
                    <TableCell onClick={() => setLocation(`/trainer/client/${client.id}`)} className="cursor-pointer">
                      {client.lastWorkout ? (
                        <div>
                          <div className="text-sm font-medium">
                            {formatDistanceToNow(new Date(client.lastWorkout), { addSuffix: true })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(client.lastWorkout), 'MMM d, yyyy')}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">No workouts yet</span>
                      )}
                    </TableCell>
                    <TableCell onClick={() => setLocation(`/trainer/client/${client.id}`)} className="text-center cursor-pointer">
                      {client.alertsCount > 0 ? (
                        <div className="flex items-center justify-center gap-1">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          <Badge variant="destructive" data-testid={`badge-alerts-${client.id}`}>
                            {client.alertsCount}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell onClick={() => setLocation(`/trainer/client/${client.id}`)} className="text-right cursor-pointer">
                      {client.hasPurchase ? (
                        <div>
                          <div className="font-medium text-primary" data-testid={`text-earnings-${client.id}`}>
                            ${client.trainerEarnings?.toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            of ${client.purchasePrice?.toFixed(2)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">No purchase</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      {!hasProgram && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClient({ id: client.id, name: client.name });
                            setAssignDialogOpen(true);
                          }}
                          data-testid={`button-assign-program-${client.id}`}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Assign Program
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {selectedClient && (
        <AssignProgramDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          clientId={selectedClient.id}
          clientName={selectedClient.name}
        />
      )}
    </Card>
  );
}
