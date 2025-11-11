import { useQuery } from "@tanstack/react-query";

interface Invite {
  id: string;
  status: string;
  initiatorRole: string;
}

interface InvitesData {
  sent: Invite[];
  received: Invite[];
}

export function usePendingInvitesCount() {
  const { data: invitesData, isLoading } = useQuery<InvitesData>({
    queryKey: ["/api/invites"],
  });

  const pendingCount = invitesData
    ? [...(invitesData.sent || []), ...(invitesData.received || [])].filter(
        (i) => i.status === "pending"
      ).length
    : 0;

  const hasPending = pendingCount > 0;

  return {
    pendingCount,
    hasPending,
    isLoading,
  };
}
