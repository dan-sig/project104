import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { TrainerProfile } from "@shared/schema";

const bioStepSchema = z.object({
  bio: z.string().min(50, "Bio must be at least 50 characters").max(500, "Bio must be less than 500 characters"),
  yearsExperience: z.coerce.number().min(0, "Years of experience must be positive").max(50, "Please enter a valid number"),
});

const expertiseStepSchema = z.object({
  specialties: z.string().min(1, "Please enter at least one specialty"),
  certifications: z.string().optional(),
});

const socialLinksStepSchema = z.object({
  instagram: z.string().optional(),
  website: z.string().url("Please enter a valid URL").or(z.literal("")).optional(),
  linkedin: z.string().optional(),
});

type BioStepData = z.infer<typeof bioStepSchema>;
type ExpertiseStepData = z.infer<typeof expertiseStepSchema>;
type SocialLinksStepData = z.infer<typeof socialLinksStepSchema>;

function getInitialStep(status?: string): number {
  if (!status || status === "pending") return 1;
  if (status === "bio_complete") return 2;
  if (status === "expertise_complete") return 3;
  return 1;
}

export default function TrainerOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: existingProfile, isLoading: isLoadingProfile } = useQuery<TrainerProfile>({
    queryKey: ["/api/trainer/profile"],
    retry: false,
  });

  const bioForm = useForm<BioStepData>({
    resolver: zodResolver(bioStepSchema),
    defaultValues: {
      bio: "",
      yearsExperience: 0,
    },
  });

  const expertiseForm = useForm<ExpertiseStepData>({
    resolver: zodResolver(expertiseStepSchema),
    defaultValues: {
      specialties: "",
      certifications: "",
    },
  });

  const socialLinksForm = useForm<SocialLinksStepData>({
    resolver: zodResolver(socialLinksStepSchema),
    defaultValues: {
      instagram: "",
      website: "",
      linkedin: "",
    },
  });

  useEffect(() => {
    if (existingProfile) {
      if (existingProfile.bio) {
        bioForm.reset({
          bio: existingProfile.bio || "",
          yearsExperience: existingProfile.yearsExperience || 0,
        });
      }

      if (existingProfile.specialties && existingProfile.specialties.length > 0) {
        expertiseForm.reset({
          specialties: existingProfile.specialties.join(", "),
          certifications: existingProfile.certifications?.join(", ") || "",
        });
      }

      if (existingProfile.socialLinks) {
        socialLinksForm.reset({
          instagram: existingProfile.socialLinks.instagram || "",
          website: existingProfile.socialLinks.website || "",
          linkedin: existingProfile.socialLinks.linkedin || "",
        });
      }

      const initialStep = getInitialStep(existingProfile.onboardingStatus);
      setCurrentStep(initialStep);
    }
  }, [existingProfile, bioForm, expertiseForm, socialLinksForm]);

  const createProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/trainer/profile", data);
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", "/api/trainer/profile", data);
    },
  });

  const handleBioSubmit = async (data: BioStepData) => {
    try {
      if (existingProfile) {
        await updateProfileMutation.mutateAsync({
          bio: data.bio,
          yearsExperience: data.yearsExperience,
          onboardingStatus: "bio_complete",
        });
      } else {
        await createProfileMutation.mutateAsync({
          bio: data.bio,
          yearsExperience: data.yearsExperience,
          onboardingStatus: "bio_complete",
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/trainer/profile"] });
      setCurrentStep(2);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExpertiseSubmit = async (data: ExpertiseStepData) => {
    try {
      const specialtiesArray = data.specialties
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      
      const certificationsArray = data.certifications
        ? data.certifications
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      await updateProfileMutation.mutateAsync({
        specialties: specialtiesArray,
        certifications: certificationsArray,
        onboardingStatus: "expertise_complete",
      });

      await queryClient.invalidateQueries({ queryKey: ["/api/trainer/profile"] });
      setCurrentStep(3);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save expertise. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSocialLinksSubmit = async (data: SocialLinksStepData) => {
    try {
      const socialLinks: any = {};
      if (data.instagram) socialLinks.instagram = data.instagram;
      if (data.website) socialLinks.website = data.website;
      if (data.linkedin) socialLinks.linkedin = data.linkedin;

      await updateProfileMutation.mutateAsync({
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
        onboardingStatus: "completed",
      });

      await queryClient.invalidateQueries({ queryKey: ["/api/trainer/profile"] });

      toast({
        title: "Profile Complete!",
        description: "Your trainer profile has been created successfully.",
      });

      setLocation("/trainer");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete onboarding. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const steps = [
    { number: 1, title: "Bio & Experience", description: "Tell us about yourself" },
    { number: 2, title: "Expertise", description: "Your specialties and certifications" },
    { number: 3, title: "Social Links", description: "Connect your online presence (optional)" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Complete Your Trainer Profile</h1>
          <p className="text-muted-foreground">
            Let's set up your profile so clients can find you
          </p>
        </div>

        <div className="flex justify-center items-center gap-2">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    currentStep > step.number
                      ? "bg-primary border-primary text-primary-foreground"
                      : currentStep === step.number
                      ? "border-primary text-primary"
                      : "border-muted-foreground text-muted-foreground"
                  }`}
                  data-testid={`step-indicator-${step.number}`}
                >
                  {currentStep > step.number ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <span className="font-semibold">{step.number}</span>
                  )}
                </div>
                <span className="text-xs mt-1 hidden sm:block">{step.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 w-16 mx-2 ${
                    currentStep > step.number ? "bg-primary" : "bg-muted-foreground"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {currentStep === 1 && (
          <Card data-testid="onboarding-step-1">
            <CardHeader>
              <CardTitle>Bio & Experience</CardTitle>
              <CardDescription>Share your background and expertise</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...bioForm}>
                <form onSubmit={bioForm.handleSubmit(handleBioSubmit)} className="space-y-4">
                  <FormField
                    control={bioForm.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Professional Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Tell potential clients about your training philosophy, background, and what makes you unique..."
                            className="min-h-[150px] resize-none"
                            data-testid="input-bio"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={bioForm.control}
                    name="yearsExperience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Years of Experience</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            max="50"
                            placeholder="5"
                            data-testid="input-years-experience"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createProfileMutation.isPending || updateProfileMutation.isPending}
                    data-testid="button-next-step-1"
                  >
                    {(createProfileMutation.isPending || updateProfileMutation.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Next: Expertise
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card data-testid="onboarding-step-2">
            <CardHeader>
              <CardTitle>Expertise</CardTitle>
              <CardDescription>Your training specialties and certifications</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...expertiseForm}>
                <form onSubmit={expertiseForm.handleSubmit(handleExpertiseSubmit)} className="space-y-4">
                  <FormField
                    control={expertiseForm.control}
                    name="specialties"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specialties</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Strength Training, Athletic Performance, Nutrition (comma-separated)"
                            data-testid="input-specialties"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={expertiseForm.control}
                    name="certifications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Certifications (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="NASM-CPT, CSCS, FMS (comma-separated)"
                            data-testid="input-certifications"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                      className="flex-1"
                      data-testid="button-back-step-2"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={updateProfileMutation.isPending}
                      data-testid="button-next-step-2"
                    >
                      {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Next: Social Links
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && (
          <Card data-testid="onboarding-step-3">
            <CardHeader>
              <CardTitle>Social Links (Optional)</CardTitle>
              <CardDescription>Connect your online presence to build credibility</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...socialLinksForm}>
                <form onSubmit={socialLinksForm.handleSubmit(handleSocialLinksSubmit)} className="space-y-4">
                  <FormField
                    control={socialLinksForm.control}
                    name="instagram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram Handle</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="@yourhandle"
                            data-testid="input-instagram"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={socialLinksForm.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="url"
                            placeholder="https://yourwebsite.com"
                            data-testid="input-website"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={socialLinksForm.control}
                    name="linkedin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="linkedin.com/in/yourprofile"
                            data-testid="input-linkedin"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(2)}
                      className="flex-1"
                      data-testid="button-back-step-3"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={updateProfileMutation.isPending}
                      data-testid="button-complete-onboarding"
                    >
                      {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Complete Profile
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
