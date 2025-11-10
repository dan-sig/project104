import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Copy, Plus, Link as LinkIcon, Calendar, Users } from "lucide-react";
import { format } from "date-fns";

type InviteLink = {
  id: number;
  code: string;
  maxUses: number | null;
  usageCount: number;
  expiresAt: string | null;
  createdAt: string;
};

export function InviteManager() {
  const { toast } = useToast();
  const [maxUses, setMaxUses] = useState<string>("");
  const [expiresInDays, setExpiresInDays] = useState<string>("30");

  const { data: invites, isLoading } = useQuery<InviteLink[]>({
    queryKey: ["/api/trainer/invites"],
  });

  const createInviteMutation = useMutation({
    mutationFn: async (data: { maxUses: number | null; expiresAt: string | null }) => {
      return await apiRequest("POST", "/api/trainer/invites", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainer/invites"] });
      toast({
        title: "Invite link created",
        description: "Your new invite link is ready to share",
      });
      setMaxUses("");
      setExpiresInDays("30");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create invite link",
        variant: "destructive",
      });
    },
  });

  const handleCreateInvite = () => {
    const maxUsesValue = maxUses ? parseInt(maxUses) : null;
    const expiresAtValue = expiresInDays
      ? new Date(Date.now() + parseInt(expiresInDays) * 24 * 60 * 60 * 1000).toISOString()
      : null;

    createInviteMutation.mutate({
      maxUses: maxUsesValue,
      expiresAt: expiresAtValue,
    });
  };

  const copyInviteLink = (code: string) => {
    const inviteUrl = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(inviteUrl);
    toast({
      title: "Link copied",
      description: "Invite link copied to clipboard",
    });
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const isMaxedOut = (invite: InviteLink) => {
    if (invite.maxUses === null) return false;
    return invite.usageCount >= invite.maxUses;
  };

  const getStatusBadge = (invite: InviteLink) => {
    if (isExpired(invite.expiresAt)) {
      return <span className="text-xs px-2 py-1 rounded bg-destructive/10 text-destructive">Expired</span>;
    }
    if (isMaxedOut(invite)) {
      return <span className="text-xs px-2 py-1 rounded bg-destructive/10 text-destructive">Max Uses Reached</span>;
    }
    return <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-600 dark:text-green-400">Active</span>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Invite Link
          </CardTitle>
          <CardDescription>
            Generate a shareable link to invite clients to your training programs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxUses">Max Uses (Optional)</Label>
              <Input
                id="maxUses"
                type="number"
                placeholder="Unlimited"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                min="1"
                data-testid="input-max-uses"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for unlimited uses
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiresInDays">Expires In (Days)</Label>
              <Input
                id="expiresInDays"
                type="number"
                placeholder="30"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                min="1"
                data-testid="input-expires-days"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for no expiration
              </p>
            </div>
          </div>
          <Button
            onClick={handleCreateInvite}
            disabled={createInviteMutation.isPending}
            data-testid="button-create-invite"
          >
            {createInviteMutation.isPending ? "Creating..." : "Generate Invite Link"}
          </Button>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-lg font-semibold mb-4">Your Invite Links</h3>
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading invite links...
          </div>
        ) : !invites || invites.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No invite links yet. Create one to start inviting clients.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {invites.map((invite) => (
              <Card key={invite.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-muted-foreground" />
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                          {window.location.origin}/invite/{invite.code}
                        </code>
                        {getStatusBadge(invite)}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>
                            {invite.usageCount} / {invite.maxUses ?? "∞"} uses
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Created {format(new Date(invite.createdAt), "MMM d, yyyy")}
                          </span>
                        </div>
                        {invite.expiresAt && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Expires {format(new Date(invite.expiresAt), "MMM d, yyyy")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyInviteLink(invite.code)}
                      disabled={isExpired(invite.expiresAt) || isMaxedOut(invite)}
                      data-testid={`button-copy-invite-${invite.code}`}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
