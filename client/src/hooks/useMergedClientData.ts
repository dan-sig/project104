import { useQuery } from "@tanstack/react-query";
import type { TrainerClientRoster } from "@shared/schema";

export interface TrainerClient {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: 'active' | 'inactive';
  joinedDate: string;
  lastWorkout: string | null;
  currentProgram: string | null;
  subscriptionType: 'monthly' | 'annual' | 'one-time';
  purchasePrice: number;
  trainerEarnings: number;
  purchaseDate: string;
  hasPurchase: boolean;
}

export function useTrainerClients() {
  // Fetch real client data from API
  const { data: rawClients, isLoading } = useQuery<TrainerClientRoster[]>({
    queryKey: ["/api/trainer/clients"],
  });

  // Transform API data to client format
  const clients: TrainerClient[] = (rawClients || []).map(client => ({
    id: client.clientId,
    name: client.clientName,
    email: client.clientEmail,
    avatar: client.clientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
    status: client.status as 'active' | 'inactive',
    joinedDate: client.purchaseDate?.split('T')[0] || client.connectionDate?.split('T')[0] || '',
    lastWorkout: null, // Will be populated from workout sessions if needed
    currentProgram: client.programName,
    subscriptionType: client.subscriptionType === 'subscription' ? 'monthly' : 'one-time',
    purchasePrice: client.purchasePrice || 0,
    trainerEarnings: client.trainerEarnings || 0,
    purchaseDate: client.purchaseDate || client.connectionDate || '',
    hasPurchase: !!client.programId,
  }));

  // Calculate aggregate stats from real data
  const activeClients = clients.filter(c => c.status === 'active').length;
  const totalRevenue = clients.reduce((sum, c) => sum + c.trainerEarnings, 0);

  return {
    clients,
    isLoading,
    stats: {
      activeClients,
      totalRevenue,
    }
  };
}
