import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import type { TrainerProfile } from "@shared/schema";

interface TrainerOnboardingGateProps {
  children: React.ReactNode;
}

export function TrainerOnboardingGate({ children }: TrainerOnboardingGateProps) {
  const [, setLocation] = useLocation();

  const { data: profile, isLoading, error } = useQuery<TrainerProfile>({
    queryKey: ["/api/trainer/profile"],
    retry: false,
  });

  useEffect(() => {
    if (!isLoading) {
      const isProfileMissing = error?.message?.includes("404") || !profile;
      const isProfileIncomplete = profile && profile.onboardingStatus !== "completed";

      if (isProfileMissing || isProfileIncomplete) {
        setLocation("/trainer/onboarding");
      }
    }
  }, [isLoading, error, profile, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile || profile.onboardingStatus !== "completed") {
    return null;
  }

  return <>{children}</>;
}
