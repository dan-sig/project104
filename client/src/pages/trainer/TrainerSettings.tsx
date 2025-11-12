import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertSupportRequestSchema, type InsertSupportRequest } from "@shared/schema";
import type { User, TrainerProfile, SupportRequest } from "@shared/schema";
import { Crown, Mail, Globe, Linkedin, Instagram, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { useTrainerClients } from "@/hooks/useMergedClientData";

export default function TrainerSettings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const { stats } = useTrainerClients();

  const { data: user, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const { data: trainerProfile, isLoading: isLoadingProfile } = useQuery<TrainerProfile>({
    queryKey: ["/api/trainer/profile"],
    retry: false,
  });

  const { data: supportRequests, isLoading: isLoadingSupport } = useQuery<SupportRequest[]>({
    queryKey: ["/api/trainer/support-requests"],
    enabled: activeTab === "support",
  });

  const form = useForm<InsertSupportRequest>({
    resolver: zodResolver(insertSupportRequestSchema),
    defaultValues: {
      trainerId: user?.id || "",
      category: "general_question",
      subject: "",
      message: "",
    },
  });

  const submitSupportRequest = useMutation({
    mutationFn: async (data: InsertSupportRequest) => {
      return apiRequest("POST", "/api/trainer/support-requests", data);
    },
    onSuccess: () => {
      toast({
        title: "Support Request Submitted",
        description: "We'll get back to you as soon as possible.",
      });
      form.reset({
        trainerId: user?.id || "",
        category: "general_question",
        subject: "",
        message: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trainer/support-requests"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit support request",
        variant: "destructive",
      });
    },
  });

  const handleSupportSubmit = (data: InsertSupportRequest) => {
    submitSupportRequest.mutate({
      ...data,
      trainerId: user?.id || "",
    });
  };

  const isLoading = isLoadingUser || isLoadingProfile;
  const isPremium = trainerProfile?.subscriptionStatus === "premium";
  const clientCount = stats.activeClients || 0;
  const freeLimit = 5;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <Clock className="h-4 w-4" />;
      case "in_progress":
        return <AlertCircle className="h-4 w-4" />;
      case "resolved":
        return <CheckCircle2 className="h-4 w-4" />;
      case "closed":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "open":
        return "default";
      case "in_progress":
        return "secondary";
      case "resolved":
        return "outline";
      case "closed":
        return "outline";
      default:
        return "default";
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "technical_issue":
        return "Technical Issue";
      case "billing":
        return "Billing";
      case "feature_request":
        return "Feature Request";
      case "general_question":
        return "General Question";
      default:
        return category;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold" data-testid="text-settings-title">Trainer Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your profile and preferences</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5" data-testid="tabs-settings">
            <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
            <TabsTrigger value="subscription" data-testid="tab-subscription">Subscription</TabsTrigger>
            <TabsTrigger value="support" data-testid="tab-support">Support</TabsTrigger>
            <TabsTrigger value="faq" data-testid="tab-faq">FAQ</TabsTrigger>
            <TabsTrigger value="getting-started" data-testid="tab-getting-started">Getting Started</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6" data-testid="content-profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Your trainer profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Username</Label>
                  <p className="text-base" data-testid="text-username">
                    @{trainerProfile?.username || "Not set"}
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Bio</Label>
                  <p className="text-base text-muted-foreground" data-testid="text-bio">
                    {trainerProfile?.bio || "No bio provided"}
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Years of Experience</Label>
                  <p className="text-base" data-testid="text-experience">
                    {trainerProfile?.yearsExperience ? `${trainerProfile.yearsExperience} years` : "Not specified"}
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Specialties</Label>
                  <div className="flex flex-wrap gap-2" data-testid="list-specialties">
                    {trainerProfile?.specialties && trainerProfile.specialties.length > 0 ? (
                      trainerProfile.specialties.map((specialty, index) => (
                        <Badge key={index} variant="secondary" data-testid={`badge-specialty-${index}`}>
                          {specialty}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No specialties added</p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Certifications</Label>
                  <div className="flex flex-wrap gap-2" data-testid="list-certifications">
                    {trainerProfile?.certifications && trainerProfile.certifications.length > 0 ? (
                      trainerProfile.certifications.map((cert, index) => (
                        <Badge key={index} variant="outline" data-testid={`badge-certification-${index}`}>
                          {cert}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No certifications added</p>
                    )}
                  </div>
                </div>

                {trainerProfile?.socialLinks && Object.keys(trainerProfile.socialLinks).length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Social Links</Label>
                      <div className="space-y-2" data-testid="list-social-links">
                        {trainerProfile.socialLinks.website && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <a
                              href={trainerProfile.socialLinks.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                              data-testid="link-website"
                            >
                              {trainerProfile.socialLinks.website}
                            </a>
                          </div>
                        )}
                        {trainerProfile.socialLinks.instagram && (
                          <div className="flex items-center gap-2">
                            <Instagram className="h-4 w-4 text-muted-foreground" />
                            <a
                              href={`https://instagram.com/${trainerProfile.socialLinks.instagram.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                              data-testid="link-instagram"
                            >
                              @{trainerProfile.socialLinks.instagram.replace('@', '')}
                            </a>
                          </div>
                        )}
                        {trainerProfile.socialLinks.linkedin && (
                          <div className="flex items-center gap-2">
                            <Linkedin className="h-4 w-4 text-muted-foreground" />
                            <a
                              href={trainerProfile.socialLinks.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                              data-testid="link-linkedin"
                            >
                              {trainerProfile.socialLinks.linkedin}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription" className="mt-6" data-testid="content-subscription">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Plan</CardTitle>
                <CardDescription>Manage your trainer subscription</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold" data-testid="text-plan-name">
                        {isPremium ? "Premium Plan" : "Free Plan"}
                      </h3>
                      {isPremium && (
                        <Badge variant="default" className="gap-1" data-testid="badge-premium">
                          <Crown className="h-3 w-3" />
                          Premium
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground" data-testid="text-plan-description">
                      {isPremium
                        ? "Unlimited clients and advanced features"
                        : "Up to 5 clients maximum"}
                    </p>
                  </div>
                  {!isPremium && (
                    <Button variant="default" data-testid="button-upgrade">
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade to Premium
                    </Button>
                  )}
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Client Slots</Label>
                  <div className="space-y-2">
                    {isPremium ? (
                      <div>
                        <p className="text-2xl font-bold" data-testid="text-client-count">
                          {clientCount}
                        </p>
                        <p className="text-sm text-muted-foreground">clients connected</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-2xl font-bold" data-testid="text-client-count">
                          {clientCount} / {freeLimit}
                        </p>
                        <p className="text-sm text-muted-foreground">clients connected</p>
                      </div>
                    )}
                  </div>
                </div>

                {!isPremium && (
                  <>
                    <Separator />
                    <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                      <h4 className="font-medium">Premium Features</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Unlimited client connections</li>
                        <li>• Priority support</li>
                        <li>• Advanced analytics</li>
                        <li>• Monthly discount codes</li>
                      </ul>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support" className="mt-6" data-testid="content-support">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Submit Support Request</CardTitle>
                  <CardDescription>
                    Get help with technical issues, billing questions, or submit feature requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSupportSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-category">
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="technical_issue" data-testid="option-technical">
                                  Technical Issue
                                </SelectItem>
                                <SelectItem value="billing" data-testid="option-billing">
                                  Billing
                                </SelectItem>
                                <SelectItem value="feature_request" data-testid="option-feature">
                                  Feature Request
                                </SelectItem>
                                <SelectItem value="general_question" data-testid="option-general">
                                  General Question
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subject</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Brief description of your request"
                                {...field}
                                data-testid="input-subject"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Provide details about your request"
                                className="min-h-32"
                                {...field}
                                data-testid="textarea-message"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        disabled={submitSupportRequest.isPending}
                        data-testid="button-submit-support"
                      >
                        {submitSupportRequest.isPending ? "Submitting..." : "Submit Request"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Your Support Requests</CardTitle>
                  <CardDescription>View and track your submitted requests</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingSupport ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading support requests...
                    </div>
                  ) : supportRequests && supportRequests.length > 0 ? (
                    <div className="space-y-4" data-testid="list-support-requests">
                      {supportRequests.map((request) => (
                        <div
                          key={request.id}
                          className="p-4 border rounded-lg space-y-2"
                          data-testid={`request-${request.id}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-medium" data-testid={`text-subject-${request.id}`}>
                                  {request.subject}
                                </h4>
                                <Badge variant="outline" data-testid={`badge-category-${request.id}`}>
                                  {getCategoryLabel(request.category)}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground" data-testid={`text-message-${request.id}`}>
                                {request.message}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(request.createdAt!).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge
                              variant={getStatusVariant(request.status)}
                              className="gap-1 flex-shrink-0"
                              data-testid={`badge-status-${request.id}`}
                            >
                              {getStatusIcon(request.status)}
                              {request.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground" data-testid="text-no-requests">
                      No support requests yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="faq" className="mt-6" data-testid="content-faq">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>Find answers to common questions</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1" data-testid="faq-item-1">
                    <AccordionTrigger data-testid="faq-trigger-1">
                      How do I create a custom exercise?
                    </AccordionTrigger>
                    <AccordionContent data-testid="faq-content-1">
                      Navigate to your Trainer Dashboard and click on the "Custom Exercises" tab. From there, 
                      you can create new exercises by clicking the "Create Exercise" button. Fill in the exercise 
                      details including name, description, movement pattern, equipment needed, and difficulty level. 
                      You can also add video URLs and form tips to help your clients perform the exercise correctly.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-2" data-testid="faq-item-2">
                    <AccordionTrigger data-testid="faq-trigger-2">
                      How do I build a training program?
                    </AccordionTrigger>
                    <AccordionContent data-testid="faq-content-2">
                      Go to your Trainer Dashboard and select the "My Programs" tab, then click "Create New Program". 
                      The program builder lets you design custom workout programs with multiple workouts per week. 
                      You can add exercises from both the master exercise library and your custom exercises. Set 
                      the number of sets, reps, rest periods, and other training parameters for each exercise. 
                      Once published, your program will be available for clients to purchase.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-3" data-testid="faq-item-3">
                    <AccordionTrigger data-testid="faq-trigger-3">
                      How do I connect with clients?
                    </AccordionTrigger>
                    <AccordionContent data-testid="faq-content-3">
                      You can connect with clients through the "Client Invitations" tab on your Trainer Dashboard. 
                      Search for users by username or email and send them an invitation to connect. Once they accept, 
                      they'll appear in your Client Summary. You can also receive invitations from clients who want to 
                      work with you. Note that free accounts are limited to 5 active client connections, while premium 
                      accounts have unlimited connections.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-4" data-testid="faq-item-4">
                    <AccordionTrigger data-testid="faq-trigger-4">
                      What's the difference between Free and Premium?
                    </AccordionTrigger>
                    <AccordionContent data-testid="faq-content-4">
                      Free accounts can connect with up to 5 active clients, while Premium accounts have unlimited 
                      client connections. Premium also includes priority support, advanced analytics for tracking 
                      client progress, and the ability to generate monthly 25% discount codes to help market your 
                      programs and attract new clients. Premium trainers also get access to exclusive features as 
                      they're released.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-5" data-testid="faq-item-5">
                    <AccordionTrigger data-testid="faq-trigger-5">
                      How do billing and payments work?
                    </AccordionTrigger>
                    <AccordionContent data-testid="faq-content-5">
                      When clients purchase your programs, you earn 80% of the sale price as revenue. The remaining 
                      20% covers platform fees and payment processing. You can track your earnings in the "Revenue" 
                      tab on your Trainer Dashboard. Payments are processed securely through our payment system, and 
                      you'll receive detailed breakdowns of all transactions including one-time purchases and 
                      recurring subscriptions.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-6" data-testid="faq-item-6">
                    <AccordionTrigger data-testid="faq-trigger-6">
                      Can I delete my custom exercises?
                    </AccordionTrigger>
                    <AccordionContent data-testid="faq-content-6">
                      No, custom exercises cannot be deleted once created. This is to maintain the integrity of 
                      training programs that may be using those exercises. If an exercise were deleted, it could 
                      break existing programs and disrupt your clients' training. However, if you've created an 
                      exercise that you believe would benefit the entire Morphit community, you can request to have 
                      it added to the master exercise database through the Exercise Library.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="getting-started" className="mt-6" data-testid="content-getting-started">
            <div className="space-y-4">
              <Card data-testid="card-step-1">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                      1
                    </div>
                    <CardTitle>Create Your First Exercise</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-muted-foreground">
                    Start building your custom exercise library by creating your first exercise. Go to the 
                    Trainer Dashboard and navigate to the "Custom Exercises" tab. Click "Create Exercise" and 
                    fill in the details like name, movement pattern, equipment, and difficulty.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Tip:</strong> Add video URLs and form tips to help your clients perform exercises correctly 
                    and safely.
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-step-2">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                      2
                    </div>
                    <CardTitle>Build Your First Program</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-muted-foreground">
                    Once you have some exercises ready, create your first training program. Visit the "My Programs" 
                    tab and click "Create New Program". Design workouts by selecting exercises, setting sets and reps, 
                    and organizing them into a weekly structure.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Tip:</strong> Start with a simple 3-day program to get familiar with the program builder 
                    before creating more complex programs.
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-step-3">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                      3
                    </div>
                    <CardTitle>Connect with Clients</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-muted-foreground">
                    Find and connect with clients using the "Client Invitations" tab. Search for users by their 
                    username or email address, then send them an invitation to connect. When they accept, they'll 
                    appear in your Client Summary where you can track their progress.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Tip:</strong> Free accounts can connect with up to 5 clients. Upgrade to Premium for 
                    unlimited client connections.
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-step-4">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                      4
                    </div>
                    <CardTitle>Track Client Progress</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-muted-foreground">
                    Monitor your clients' training progress from the Client Summary. Click on any client to view 
                    their detailed profile, workout history, and performance metrics. You can see which workouts 
                    they've completed, track their progression, and identify areas that need attention.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Tip:</strong> Use the Revenue tab to track your earnings from program sales and client 
                    subscriptions.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
