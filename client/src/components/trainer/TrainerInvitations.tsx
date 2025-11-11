import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, UserPlus, X, Check, Clock, Ban } from "lucide-react";
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

interface SearchResult {
  id: string;
  name: string;
  email: string;
}

export function TrainerInvitations() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);

  // Fetch invites
  const { data: invitesData, isLoading } = useQuery<{ 
    sent: TrainerClientInviteWithUsers[], 
    received: TrainerClientInviteWithUsers[] 
  }>({
    queryKey: ["/api/invites"],
  });

  // Search users mutation
  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await fetch(`/api/users/search?query=${encodeURIComponent(query)}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to search users");
      }
      return response.json();
    },
  });

  // Send invite mutation
  const sendInviteMutation = useMutation({
    mutationFn: async (clientId: string) => {
      return apiRequest("/api/invites", "POST", { clientId, initiatorRole: "trainer" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invites"] });
      toast({
        title: "Invite sent",
        description: "Your invitation has been sent successfully",
      });
      setIsSearchDialogOpen(false);
      setSearchQuery("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send invite",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Accept/decline/cancel mutation
  const updateInviteMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      return apiRequest(`/api/invites/${id}`, "PATCH", { status });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invites"] });
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

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchMutation.mutate(searchQuery.trim());
    }
  };

  const sentInvites = invitesData?.sent || [];
  const receivedInvites = invitesData?.received || [];
  const pendingSent = sentInvites.filter(i => i.status === "pending");
  const pendingReceived = receivedInvites.filter(i => i.status === "pending");

  if (isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Loading invitations...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" data-testid="text-invitations-title">
            Invitations
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage client invitations and connections
          </p>
        </div>
        <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-invite-client">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Client
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-search-users">
            <DialogHeader>
              <DialogTitle>Search for Clients</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by email or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  data-testid="input-search-query"
                />
                <Button 
                  onClick={handleSearch}
                  disabled={searchMutation.isPending || !searchQuery.trim()}
                  data-testid="button-search"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {searchMutation.data?.users && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {searchMutation.data.users.length} result(s) found
                  </p>
                  {searchMutation.data.users.map((user: SearchResult) => (
                    <Card key={user.id} data-testid={`card-search-result-${user.id}`}>
                      <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate" data-testid={`text-user-name-${user.id}`}>
                            {user.name}
                          </p>
                          <p className="text-sm text-muted-foreground truncate" data-testid={`text-user-email-${user.id}`}>
                            {user.email}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => sendInviteMutation.mutate(user.id)}
                          disabled={sendInviteMutation.isPending}
                          data-testid={`button-send-invite-${user.id}`}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Invite
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                  {searchMutation.data.users.length === 0 && (
                    <p className="text-center py-8 text-muted-foreground">
                      No users found. Make sure they have enabled discoverability in settings.
                    </p>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs for Sent/Received */}
      <Tabs defaultValue="sent" data-testid="tabs-invitations">
        <TabsList>
          <TabsTrigger value="sent" data-testid="tab-sent">
            Sent {pendingSent.length > 0 && (
              <Badge variant="secondary" className="ml-2" data-testid="badge-pending-sent">
                {pendingSent.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="received" data-testid="tab-received">
            Received {pendingReceived.length > 0 && (
              <Badge variant="secondary" className="ml-2" data-testid="badge-pending-received">
                {pendingReceived.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sent" className="space-y-4 mt-6">
          {sentInvites.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                No sent invitations. Click "Invite Client" to get started.
              </CardContent>
            </Card>
          ) : (
            sentInvites.map((invite) => (
              <Card key={invite.id} data-testid={`card-sent-invite-${invite.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium" data-testid={`text-client-name-${invite.id}`}>
                          {invite.counterpart.user.name}
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
                          {invite.status === "canceled" && <Ban className="h-3 w-3 mr-1" />}
                          {invite.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground" data-testid={`text-client-email-${invite.id}`}>
                        {invite.counterpart.user.email}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
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
            ))
          )}
        </TabsContent>

        <TabsContent value="received" className="space-y-4 mt-6">
          {receivedInvites.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                No received invitations yet.
              </CardContent>
            </Card>
          ) : (
            receivedInvites.map((invite) => (
              <Card key={invite.id} data-testid={`card-received-invite-${invite.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium" data-testid={`text-client-name-${invite.id}`}>
                          {invite.initiator.user.name}
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
                      <p className="text-sm text-muted-foreground" data-testid={`text-client-email-${invite.id}`}>
                        {invite.initiator.user.email}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Received {format(new Date(invite.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    {invite.status === "pending" && (
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
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
