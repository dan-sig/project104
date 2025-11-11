// ==========================================
// MOCK TRAINER TEST DATA GENERATOR
// ==========================================
// Generates synthetic trainer purchase data for testing
// Controlled by ENABLE_TEST_DATA environment flag
// ==========================================

import type { TrainerClientRoster, TrainerSalesMetrics } from "../schema";

// Mock purchase data - single source of truth
interface MockPurchase {
  purchaseId: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  programId: string;
  programName: string;
  purchaseDate: string;
  subscriptionType: "subscription" | "one_time";
  purchasePrice: number;
  platformFee: number;
  trainerEarnings: number;
  status: "completed" | "refunded";
}

const mockPurchases: MockPurchase[] = [
  {
    purchaseId: "mock-purchase-1",
    clientId: "mock-client-1",
    clientName: "Sarah Johnson",
    clientEmail: "sarah.j@example.com",
    programId: "mock-program-1",
    programName: "Full Body Strength Builder",
    purchaseDate: new Date("2024-10-15").toISOString(),
    subscriptionType: "subscription",
    purchasePrice: 49.99,
    platformFee: 10.00,
    trainerEarnings: 39.99,
    status: "completed",
  },
  {
    purchaseId: "mock-purchase-2",
    clientId: "mock-client-2",
    clientName: "Mike Chen",
    clientEmail: "mike.chen@example.com",
    programId: "mock-program-2",
    programName: "Athletic Performance Program",
    purchaseDate: new Date("2024-11-01").toISOString(),
    subscriptionType: "one_time",
    purchasePrice: 79.99,
    platformFee: 16.00,
    trainerEarnings: 63.99,
    status: "completed",
  },
  {
    purchaseId: "mock-purchase-3",
    clientId: "mock-client-3",
    clientName: "Emily Rodriguez",
    clientEmail: "emily.r@example.com",
    programId: "mock-program-3",
    programName: "Beginner Fitness Foundations",
    purchaseDate: new Date("2024-10-20").toISOString(),
    subscriptionType: "subscription",
    purchasePrice: 39.99,
    platformFee: 8.00,
    trainerEarnings: 31.99,
    status: "completed",
  },
  {
    purchaseId: "mock-purchase-4",
    clientId: "mock-client-4",
    clientName: "David Kim",
    clientEmail: "david.kim@example.com",
    programId: "mock-program-4",
    programName: "Advanced Powerlifting Protocol",
    purchaseDate: new Date("2024-11-05").toISOString(),
    subscriptionType: "one_time",
    purchasePrice: 99.99,
    platformFee: 20.00,
    trainerEarnings: 79.99,
    status: "completed",
  },
  {
    purchaseId: "mock-purchase-5",
    clientId: "mock-client-5",
    clientName: "Jessica Williams",
    clientEmail: "jessica.w@example.com",
    programId: "mock-program-1",
    programName: "Full Body Strength Builder",
    purchaseDate: new Date("2024-10-25").toISOString(),
    subscriptionType: "subscription",
    purchasePrice: 49.99,
    platformFee: 10.00,
    trainerEarnings: 39.99,
    status: "completed",
  },
  {
    purchaseId: "mock-purchase-6",
    clientId: "mock-client-6",
    clientName: "Chris Martinez",
    clientEmail: "chris.m@example.com",
    programId: "mock-program-2",
    programName: "Athletic Performance Program",
    purchaseDate: new Date("2024-11-08").toISOString(),
    subscriptionType: "subscription",
    purchasePrice: 59.99,
    platformFee: 12.00,
    trainerEarnings: 47.99,
    status: "completed",
  },
];

// Generate mock client roster from purchases
export function generateMockTrainerRoster(): TrainerClientRoster[] {
  return mockPurchases.map(purchase => ({
    clientId: purchase.clientId,
    clientName: purchase.clientName,
    clientEmail: purchase.clientEmail,
    programId: purchase.programId,
    programName: purchase.programName,
    purchaseDate: purchase.purchaseDate,
    subscriptionType: purchase.subscriptionType,
    purchasePrice: purchase.purchasePrice,
    trainerEarnings: purchase.trainerEarnings,
    addedDate: purchase.purchaseDate,
  }));
}

// Generate mock sales metrics from purchases
export function generateMockTrainerSalesMetrics(): TrainerSalesMetrics {
  const completedPurchases = mockPurchases.filter(p => p.status === "completed");
  
  const totalRevenue = completedPurchases.reduce((sum, p) => sum + p.trainerEarnings, 0);
  
  const subscriptions = completedPurchases.filter(p => p.subscriptionType === "subscription");
  const monthlyRevenue = subscriptions.reduce((sum, p) => sum + p.trainerEarnings, 0);
  const annualRevenue = monthlyRevenue * 12;
  
  const totalPurchases = completedPurchases.length;
  const activePlans = completedPurchases.length;

  return {
    totalRevenue,
    monthlyRevenue,
    annualRevenue,
    totalPurchases,
    activePlans,
    purchases: completedPurchases.map(p => ({
      id: p.purchaseId,
      programName: p.programName,
      buyerName: p.clientName,
      buyerEmail: p.clientEmail,
      purchasePrice: p.purchasePrice,
      platformFee: p.platformFee,
      trainerEarnings: p.trainerEarnings,
      pricingType: p.subscriptionType,
      status: p.status,
      purchaseDate: p.purchaseDate,
    })),
  };
}
