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
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { TrainerClientRoster } from '@shared/schema';
import { format } from 'date-fns';

export function TrainerRosterTable() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: clients, isLoading } = useQuery<TrainerClientRoster[]>({
    queryKey: ["/api/trainer/clients"],
  });

  const filteredClients = clients?.filter(client => 
    client.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.clientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.programName && client.programName.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

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
              {clients ? `${clients.length} total client${clients.length !== 1 ? 's' : ''}` : 'Loading...'}
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
        ) : !clients || clients.length === 0 ? (
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
                  <TableHead>Purchase Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Your Earnings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow 
                    key={client.clientId}
                    data-testid={`row-client-${client.clientId}`}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium" data-testid={`text-client-name-${client.clientId}`}>
                          {client.clientName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {client.clientEmail}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {client.programName || 'No program'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(client.purchaseDate), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={client.subscriptionType === 'subscription' ? 'default' : 'secondary'}
                        data-testid={`badge-subscription-${client.clientId}`}
                      >
                        {client.subscriptionType === 'subscription' ? 'Monthly' : 'One-time'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium">
                        ${client.purchasePrice.toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium text-primary" data-testid={`text-earnings-${client.clientId}`}>
                        ${client.trainerEarnings.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        (80%)
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
