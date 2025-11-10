import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { useTrainerData } from '@/contexts/TrainerDataContext';

export function ClientStats() {
  const { clients, getClientFeedback, getUnreadMessages } = useTrainerData();

  const activeClients = clients.filter(c => c.status === 'active');
  const totalAlerts = clients.reduce((sum, c) => sum + getClientFeedback(c.id).length, 0);
  const totalUnread = clients.reduce((sum, c) => sum + getUnreadMessages(c.id).length, 0);

  return (
    <Card data-testid="client-stats">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Users className="h-4 w-4" />
          Client Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="grid grid-cols-4 gap-6">
          <div>
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Total Clients</p>
          </div>
          <div>
            <div className="text-2xl font-bold">{activeClients.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active</p>
          </div>
          <div>
            <div className="text-2xl font-bold">{totalAlerts}</div>
            <p className="text-xs text-muted-foreground mt-1">Alerts</p>
          </div>
          <div>
            <div className="text-2xl font-bold">{totalUnread}</div>
            <p className="text-xs text-muted-foreground mt-1">Messages</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
