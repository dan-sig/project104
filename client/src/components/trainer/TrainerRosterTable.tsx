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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Search, MessageCircle, AlertTriangle, TrendingUp, Calendar, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useTrainerData } from '@/contexts/TrainerDataContext';
import { format, isWithinInterval } from 'date-fns';
import type { MockClient } from '@/data/trainerMockData';
import type { DateRange } from 'react-day-picker';

type SortColumn = 'name' | 'program' | 'status' | 'subscription' | 'daysPerWeek' | 'lastWorkout' | 'completion' | 'messages' | 'alerts' | 'nextWorkout' | 'joined' | 'streak';
type SortDirection = 'asc' | 'desc' | null;

export function TrainerRosterTable() {
  const [, setLocation] = useLocation();
  const {
    clients,
    feedback,
    getUnreadMessages,
    getClientFeedback,
    getClientCompletionRate,
    getClientNextWorkout,
    getClientStreak
  } = useTrainerData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [alertFilter, setAlertFilter] = useState<string>('all');
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const enrichedClients = useMemo(() => {
    return clients.map(client => ({
      ...client,
      unreadCount: getUnreadMessages(client.id).length,
      alertCount: getClientFeedback(client.id).length,
      completionRate: getClientCompletionRate(client.id),
      nextWorkout: getClientNextWorkout(client.id),
      streak: getClientStreak(client.id)
    }));
  }, [clients, feedback, getUnreadMessages, getClientFeedback, getClientCompletionRate, getClientNextWorkout, getClientStreak]);

  const programTypes = useMemo(() => {
    const types = new Set<string>();
    clients.forEach(client => {
      if (client.currentProgram) {
        const type = client.currentProgram.split(' - ')[0];
        types.add(type);
      }
    });
    return Array.from(types).sort();
  }, [clients]);

  const filteredClients = useMemo(() => {
    return enrichedClients.filter(client => {
      const matchesSearch = 
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
      
      const matchesAlerts = 
        alertFilter === 'all' ||
        (alertFilter === 'has-alerts' && client.alertCount > 0) ||
        (alertFilter === 'no-alerts' && client.alertCount === 0);
      
      const matchesProgram = 
        programFilter === 'all' || 
        (client.currentProgram && client.currentProgram.startsWith(programFilter));
      
      const matchesDateRange = !dateRange?.from || !dateRange?.to || !client.lastWorkout ||
        isWithinInterval(new Date(client.lastWorkout), {
          start: dateRange.from,
          end: dateRange.to
        });
      
      return matchesSearch && matchesStatus && matchesAlerts && matchesProgram && matchesDateRange;
    });
  }, [enrichedClients, searchQuery, statusFilter, alertFilter, programFilter, dateRange]);

  const sortedClients = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredClients;

    return [...filteredClients].sort((a, b) => {
      let aValue: any;
      let bValue: any;
      let aHasValue = true;
      let bHasValue = true;

      switch (sortColumn) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'program':
          aValue = a.currentProgram?.toLowerCase() || '';
          bValue = b.currentProgram?.toLowerCase() || '';
          aHasValue = !!a.currentProgram;
          bHasValue = !!b.currentProgram;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'subscription':
          aValue = a.subscriptionType;
          bValue = b.subscriptionType;
          break;
        case 'daysPerWeek':
          aValue = a.daysPerWeek || 0;
          bValue = b.daysPerWeek || 0;
          break;
        case 'lastWorkout':
          aValue = a.lastWorkout ? new Date(a.lastWorkout).getTime() : 0;
          bValue = b.lastWorkout ? new Date(b.lastWorkout).getTime() : 0;
          aHasValue = !!a.lastWorkout;
          bHasValue = !!b.lastWorkout;
          break;
        case 'completion':
          aValue = a.completionRate || 0;
          bValue = b.completionRate || 0;
          break;
        case 'messages':
          aValue = a.unreadCount || 0;
          bValue = b.unreadCount || 0;
          break;
        case 'alerts':
          aValue = a.alertCount || 0;
          bValue = b.alertCount || 0;
          break;
        case 'nextWorkout':
          aValue = a.nextWorkout ? new Date(a.nextWorkout.scheduledDate).getTime() : 0;
          bValue = b.nextWorkout ? new Date(b.nextWorkout.scheduledDate).getTime() : 0;
          aHasValue = !!a.nextWorkout;
          bHasValue = !!b.nextWorkout;
          break;
        case 'joined':
          aValue = new Date(a.joinedDate).getTime();
          bValue = new Date(b.joinedDate).getTime();
          break;
        case 'streak':
          aValue = a.streak || 0;
          bValue = b.streak || 0;
          break;
        default:
          return 0;
      }

      // Handle null/missing values - always sort them to the end
      if (!aHasValue && !bHasValue) return 0;
      if (!aHasValue) return 1;
      if (!bHasValue) return -1;

      // Normal comparison
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredClients, sortColumn, sortDirection]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-50" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="h-3 w-3 ml-1" />;
    }
    return <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const hasActiveFilters = statusFilter !== 'all' || alertFilter !== 'all' || programFilter !== 'all' || searchQuery !== '' || dateRange !== undefined;

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setAlertFilter('all');
    setProgramFilter('all');
    setDateRange(undefined);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-clients"
          />
        </div>

        <Select value={programFilter} onValueChange={setProgramFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-program-filter">
            <SelectValue placeholder="All Programs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Programs</SelectItem>
            {programTypes.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select value={alertFilter} onValueChange={setAlertFilter}>
          <SelectTrigger className="w-[140px]" data-testid="select-alert-filter">
            <SelectValue placeholder="All Alerts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Alerts</SelectItem>
            <SelectItem value="has-alerts">Has Alerts</SelectItem>
            <SelectItem value="no-alerts">No Alerts</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[240px] justify-start gap-2" data-testid="button-date-filter">
              <Calendar className="h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d, yyyy')}
                  </>
                ) : (
                  format(dateRange.from, 'MMM d, yyyy')
                )
              ) : (
                'Last Workout Date'
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-2"
            data-testid="button-clear-filters"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer select-none group"
                onClick={() => handleSort('name')}
                data-testid="header-name"
              >
                <div className="flex items-center">
                  Name
                  {getSortIcon('name')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer select-none group"
                onClick={() => handleSort('program')}
                data-testid="header-program"
              >
                <div className="flex items-center">
                  Current Program
                  {getSortIcon('program')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer select-none group"
                onClick={() => handleSort('status')}
                data-testid="header-status"
              >
                <div className="flex items-center">
                  Status
                  {getSortIcon('status')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer select-none group"
                onClick={() => handleSort('subscription')}
                data-testid="header-subscription"
              >
                <div className="flex items-center">
                  Subscription
                  {getSortIcon('subscription')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer select-none group"
                onClick={() => handleSort('daysPerWeek')}
                data-testid="header-days"
              >
                <div className="flex items-center">
                  Days/Week
                  {getSortIcon('daysPerWeek')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer select-none group"
                onClick={() => handleSort('lastWorkout')}
                data-testid="header-last-workout"
              >
                <div className="flex items-center">
                  Last Workout
                  {getSortIcon('lastWorkout')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer select-none group"
                onClick={() => handleSort('completion')}
                data-testid="header-completion"
              >
                <div className="flex items-center">
                  Completion
                  {getSortIcon('completion')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer select-none group"
                onClick={() => handleSort('messages')}
                data-testid="header-messages"
              >
                <div className="flex items-center">
                  Messages
                  {getSortIcon('messages')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer select-none group"
                onClick={() => handleSort('alerts')}
                data-testid="header-alerts"
              >
                <div className="flex items-center">
                  Alerts
                  {getSortIcon('alerts')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer select-none group"
                onClick={() => handleSort('nextWorkout')}
                data-testid="header-next-workout"
              >
                <div className="flex items-center">
                  Next Workout
                  {getSortIcon('nextWorkout')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer select-none group"
                onClick={() => handleSort('joined')}
                data-testid="header-joined"
              >
                <div className="flex items-center">
                  Joined
                  {getSortIcon('joined')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer select-none group"
                onClick={() => handleSort('streak')}
                data-testid="header-streak"
              >
                <div className="flex items-center">
                  Streak
                  {getSortIcon('streak')}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="h-24 text-center text-muted-foreground">
                  {searchQuery ? 'No clients found matching your search.' : 'No clients yet.'}
                </TableCell>
              </TableRow>
            ) : (
              sortedClients.map((client) => (
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
                    <Badge
                      variant={client.subscriptionType === 'annual' ? 'default' : 'outline'}
                      data-testid={`badge-subscription-${client.id}`}
                    >
                      {client.subscriptionType === 'monthly' ? 'Monthly' : 'Annual'}
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
          Showing {sortedClients.length} of {clients.length} clients
        </div>
      </div>
    </div>
  );
}
