import { useQuery } from "@tanstack/react-query";
import { mockClients, type MockClient } from "@/data/trainerMockData";
import type { TrainerClientRoster } from "@shared/schema";

export interface MergedClient extends MockClient {
  // Purchase data (if available from real database)
  purchaseId?: string;
  purchasePrice?: number;
  trainerEarnings?: number;
  purchaseDate?: string;
  hasPurchase: boolean;
}

export function useMergedClientData() {
  // Fetch real purchase data
  const { data: realClients, isLoading } = useQuery<TrainerClientRoster[]>({
    queryKey: ["/api/trainer/clients"],
  });

  // Merge mock clients with real purchase data
  const mergedClients: MergedClient[] = [];
  const processedEmails = new Set<string>();

  // First, add all mock clients with their purchase data overlaid
  mockClients.forEach(mockClient => {
    const purchase = realClients?.find(rc => 
      rc.clientEmail.toLowerCase() === mockClient.email.toLowerCase()
    );

    mergedClients.push({
      ...mockClient,
      id: purchase?.clientId || mockClient.id, // Use real client ID if available
      purchaseId: purchase?.programId || undefined,
      purchasePrice: purchase?.purchasePrice,
      trainerEarnings: purchase?.trainerEarnings,
      purchaseDate: purchase?.purchaseDate,
      hasPurchase: !!purchase,
    });
    
    processedEmails.add(mockClient.email.toLowerCase());
  });

  // Then, add any real clients that weren't in the mock data
  realClients?.forEach(realClient => {
    if (!processedEmails.has(realClient.clientEmail.toLowerCase())) {
      // Create a client entry from real data with placeholder workout info
      mergedClients.push({
        id: realClient.clientId,
        name: realClient.clientName,
        email: realClient.clientEmail,
        avatar: realClient.clientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
        status: 'active',
        joinedDate: realClient.purchaseDate.split('T')[0],
        lastWorkout: null,
        currentProgram: realClient.programName,
        alertsCount: 0,
        goals: 'Not specified',
        daysPerWeek: 3,
        sessionDuration: '45-60 minutes',
        equipment: [],
        subscriptionType: realClient.subscriptionType === 'subscription' ? 'monthly' : 'annual',
        subscriptionPrice: realClient.purchasePrice,
        commissionRate: 0.20,
        purchaseId: realClient.programId || undefined,
        purchasePrice: realClient.purchasePrice,
        trainerEarnings: realClient.trainerEarnings,
        purchaseDate: realClient.purchaseDate,
        hasPurchase: true,
      });
    }
  });

  // Calculate aggregate stats
  const totalAlerts = mergedClients.reduce((sum, c) => sum + c.alertsCount, 0);
  const activeClients = mergedClients.filter(c => c.status === 'active').length;
  const totalRevenue = mergedClients.reduce((sum, c) => sum + (c.trainerEarnings || 0), 0);

  return {
    clients: mergedClients,
    isLoading,
    stats: {
      totalAlerts,
      activeClients,
      totalRevenue,
    }
  };
}
