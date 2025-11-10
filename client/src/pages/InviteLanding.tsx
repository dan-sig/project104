import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle2, ExternalLink, AlertCircle, User as UserIcon } from "lucide-react";

type TrainerProfile = {
  userId: string;
  bio: string;
  yearsExperience: number;
  certifications: string[];
  specialties: string[];
  socialLinks: Record<string, string>;
  onboardingStatus: string;
};

type InviteLink = {
  id: number;
  code: string;
  trainerId: string;
  maxUses: number | null;
  usageCount: number;
  expiresAt: string | null;
  createdAt: string;
};

type InviteResponse = {
  invite: InviteLink;
  trainer: {
    id: string;
    name: string;
    email: string;
    profile: TrainerProfile;
  };
};

export default function InviteLanding() {
  const [, params] = useRoute("/invite/:code");
  const [, setLocation] = useLocation();
  const code = params?.code;

  const { data: inviteData, isLoading, error } = useQuery<InviteResponse | { error: string; status: number }>({
    queryKey: ["/api/invites", code],
    enabled: !!code,
    queryFn: async () => {
      const response = await fetch(`/api/invites/${code}`);
      const data = await response.json();
      
      // Return error info for 404 and 410 instead of throwing
      if (!response.ok) {
        return { error: data.error || "Unknown error", status: response.status };
      }
      
      return data;
    },
  });

  const trackUsageMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/invites/${code}/track`, {});
    },
  });

  // Check if response is an error
  const isErrorResponse = inviteData && 'error' in inviteData && 'status' in inviteData;
  const errorStatus = isErrorResponse ? inviteData.status : null;
  const errorMessage = isErrorResponse ? inviteData.error : null;

  // Derive validity flags client-side for successful responses
  const validInviteData = !isErrorResponse ? inviteData : null;
  
  const isExpired = validInviteData?.invite.expiresAt
    ? new Date(validInviteData.invite.expiresAt) < new Date()
    : false;
  
  const isMaxedOut = validInviteData?.invite.maxUses
    ? validInviteData.invite.usageCount >= validInviteData.invite.maxUses
    : false;

  const isValid = validInviteData && !isExpired && !isMaxedOut;

  useEffect(() => {
    if (isValid && code) {
      trackUsageMutation.mutate();
    }
  }, [isValid, code]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading invite...</p>
        </div>
      </div>
    );
  }

  // Handle 410 responses specially (expired or maxed)
  if (errorStatus === 410) {
    if (errorMessage?.toLowerCase().includes("expired")) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-6 w-6" />
                <CardTitle>Invite Expired</CardTitle>
              </div>
              <CardDescription>
                This invite link has expired and is no longer valid.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setLocation("/")}
                variant="outline"
                className="w-full"
                data-testid="button-go-home"
              >
                Go to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (errorMessage?.toLowerCase().includes("maximum uses")) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-6 w-6" />
                <CardTitle>Invite Limit Reached</CardTitle>
              </div>
              <CardDescription>
                This invite link has reached its maximum number of uses.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setLocation("/")}
                variant="outline"
                className="w-full"
                data-testid="button-go-home"
              >
                Go to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  // Handle other errors (404, 500, etc.)
  if (error || !inviteData || isErrorResponse) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-6 w-6" />
              <CardTitle>Invalid Invite</CardTitle>
            </div>
            <CardDescription>
              This invite link is not valid or has been removed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setLocation("/")}
              variant="outline"
              className="w-full"
              data-testid="button-go-home"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const trainer = validInviteData!.trainer;
  const profile = trainer.profile;
  const initials = trainer.name?.split(" ").map(n => n[0]).join("").toUpperCase() || "T";

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/10 to-background border-b">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center space-y-6">
            <Avatar className="h-24 w-24 mx-auto border-4 border-background">
              <AvatarFallback className="text-2xl bg-primary/10">
                <UserIcon className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-4xl font-bold mb-2" data-testid="text-trainer-invite-title">
                You're Invited to Train with a Pro
              </h1>
              <p className="text-lg text-muted-foreground">
                Join a personalized fitness program designed by an expert trainer
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Trainer Profile */}
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>About {trainer.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {profile && (
              <>
                <div>
                  <h3 className="font-semibold mb-2">Bio</h3>
                  <p className="text-muted-foreground" data-testid="text-trainer-bio">
                    {profile.bio}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Experience</h3>
                  <p className="text-muted-foreground">
                    {profile.yearsExperience} years of professional training experience
                  </p>
                </div>

                {profile.specialties && profile.specialties.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.specialties.map((specialty, idx) => (
                        <Badge key={idx} variant="secondary" data-testid={`badge-specialty-${idx}`}>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {profile.certifications && profile.certifications.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Certifications</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.certifications.map((cert, idx) => (
                        <Badge key={idx} variant="outline" data-testid={`badge-cert-${idx}`}>
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {profile.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Connect</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(profile.socialLinks).map(([platform, url]) => (
                        <Button
                          key={platform}
                          variant="outline"
                          size="sm"
                          asChild
                          data-testid={`link-social-${platform}`}
                        >
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            {platform.charAt(0).toUpperCase() + platform.slice(1)}
                          </a>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-6 text-center space-y-4">
            <h3 className="text-2xl font-bold">Ready to Start Your Journey?</h3>
            <p className="text-muted-foreground">
              Explore personalized training programs designed for your goals
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button
                size="lg"
                onClick={() => setLocation("/trainer/programs")}
                data-testid="button-view-programs"
              >
                View Training Programs
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setLocation("/")}
                data-testid="button-learn-more"
              >
                Learn More About Morphit
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
