import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, Clock, X } from "lucide-react";
import { format } from "date-fns";

interface TrainerClientInviteWithUsers {
  id: string;
  trainerId: string;
  clientId: string;
  initiatorRole: "trainer" | "client";
  status: "pending" | "accepted" | "declined" | "canceled";
  createdAt: string;
  respondedAt: string | null;
  initiator: {
    role: "trainer" | "client";
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  counterpart: {
    role: "trainer" | "client";
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export function ClientInvitations() {
  const { toast } = useToast();

  // Fetch invites (both sent and received)
  const { data: invitesData, isLoading } = useQuery<{ 
    sent: TrainerClientInviteWithUsers[], 
    received: TrainerClientInviteWithUsers[] 
  }>({
    queryKey: ["/api/invites"],
  });

  // Accept/decline/cancel mutation
  const updateInviteMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      return apiRequest(`/api/invites/${id}`, "PATCH", { status });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/client/trainer"] });
      const action = variables.status === "accepted" ? "accepted" : 
                    variables.status === "declined" ? "declined" : "canceled";
      toast({
        title: `Invite ${action}`,
        description: `The invitation has been ${action}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update invite",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const sentInvites = invitesData?.sent || [];
  const receivedInvites = invitesData?.received || [];
  const allPendingCount = [...sentInvites, ...receivedInvites].filter(i => i.status === "pending").length;

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading invitations...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold" data-testid="text-invitations-title">
            Trainer Invitations
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage your trainer connections
          </p>
        </div>
        {allPendingCount > 0 && (
          <Badge variant="secondary" data-testid="badge-pending-count">
            {allPendingCount} pending
          </Badge>
        )}
      </div>

      {sentInvites.length === 0 && receivedInvites.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            No trainer invitations yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {receivedInvites.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3">Received Invitations</h4>
              <div className="space-y-3">
                {receivedInvites.map((invite) => {
            // Show trainer info: initiator if trainer sent, counterpart if client sent
            const trainerInfo = invite.initiatorRole === "trainer" 
              ? invite.initiator.user 
              : invite.counterpart.user;
            
            return (
            <Card key={invite.id} data-testid={`card-invite-${invite.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium" data-testid={`text-trainer-name-${invite.id}`}>
                        {trainerInfo.name}
                      </p>
                      <Badge 
                        variant={
                          invite.status === "accepted" ? "default" :
                          invite.status === "pending" ? "secondary" :
                          "outline"
                        }
                        data-testid={`badge-status-${invite.id}`}
                      >
                        {invite.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                        {invite.status === "accepted" && <Check className="h-3 w-3 mr-1" />}
                        {invite.status === "declined" && <X className="h-3 w-3 mr-1" />}
                        {invite.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground" data-testid={`text-trainer-email-${invite.id}`}>
                      {trainerInfo.email}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {invite.initiatorRole === "trainer" ? "Received" : "Sent"} {format(new Date(invite.createdAt), "MMM d, yyyy")}
                      {invite.respondedAt && ` • Responded ${format(new Date(invite.respondedAt), "MMM d, yyyy")}`}
                    </p>
                  </div>
                  {invite.status === "pending" && (
                    invite.initiatorRole === "trainer" ? (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateInviteMutation.mutate({ id: invite.id, status: "declined" })}
                          disabled={updateInviteMutation.isPending}
                          data-testid={`button-decline-${invite.id}`}
                        >
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updateInviteMutation.mutate({ id: invite.id, status: "accepted" })}
                          disabled={updateInviteMutation.isPending}
                          data-testid={`button-accept-${invite.id}`}
                        >
                          Accept
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateInviteMutation.mutate({ id: invite.id, status: "canceled" })}
                        disabled={updateInviteMutation.isPending}
                        data-testid={`button-cancel-${invite.id}`}
                      >
                        Cancel
                      </Button>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )})}
              </div>
            </div>
          )}

          {sentInvites.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3">Sent Invitations</h4>
              <div className="space-y-3">
                {sentInvites.map((invite) => {
                  const trainerInfo = invite.counterpart.user;
                  
                  return (
                    <Card key={invite.id} data-testid={`card-sent-invite-${invite.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium" data-testid={`text-trainer-name-${invite.id}`}>
                                {trainerInfo.name}
                              </p>
                              <Badge 
                                variant={
                                  invite.status === "accepted" ? "default" :
                                  invite.status === "pending" ? "secondary" :
                                  "outline"
                                }
                                data-testid={`badge-status-${invite.id}`}
                              >
                                {invite.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                                {invite.status === "accepted" && <Check className="h-3 w-3 mr-1" />}
                                {invite.status === "declined" && <X className="h-3 w-3 mr-1" />}
                                {invite.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground" data-testid={`text-trainer-email-${invite.id}`}>
                              {trainerInfo.email}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Sent {format(new Date(invite.createdAt), "MMM d, yyyy")}
                              {invite.respondedAt && ` • Responded ${format(new Date(invite.respondedAt), "MMM d, yyyy")}`}
                            </p>
                          </div>
                          {invite.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateInviteMutation.mutate({ id: invite.id, status: "canceled" })}
                              disabled={updateInviteMutation.isPending}
                              data-testid={`button-cancel-${invite.id}`}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
