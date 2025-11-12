import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dumbbell, User, Crown, HeadphonesIcon, HelpCircle, Rocket, CheckCircle } from "lucide-react";
import { insertSupportRequestSchema, type User as UserType, type SupportRequest } from "@shared/schema";
import ThemeToggle from "@/components/ThemeToggle";

const CYCLE_MAP = {
  flow: { name: "Flow", description: "Mobility & Movement Quality" },
  build: { name: "Build", description: "Muscle Growth & Hypertrophy" },
  strong: { name: "Strong", description: "Maximal Strength & Power" },
  move: { name: "Move", description: "Athletic Performance" },
};

const WEEK_MAP = {
  1: { name: "Learn", description: "Introduction & Technique" },
  2: { name: "Load", description: "Progressive Overload" },
  3: { name: "Push", description: "Peak Intensity" },
  4: { name: "Deload", description: "Recovery & Adaptation" },
};

const supportFormSchema = insertSupportRequestSchema.omit({
  userId: true,
  trainerId: true,
});

export default function UserSettings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: user, isLoading: isLoadingUser } = useQuery<UserType>({
    queryKey: ['/api/user'],
  });

  const { data: supportRequests, isLoading: isLoadingSupport } = useQuery<SupportRequest[]>({
    queryKey: ['/api/support-requests'],
  });

  const supportForm = useForm<z.infer<typeof supportFormSchema>>({
    resolver: zodResolver(supportFormSchema),
    defaultValues: {
      category: undefined,
      subject: "",
      message: "",
    },
  });

  const createSupportMutation = useMutation({
    mutationFn: async (data: z.infer<typeof supportFormSchema>) =>
      apiRequest('POST', '/api/support-requests', data),
    onSuccess: () => {
      toast({
        title: "Support request submitted",
        description: "We'll get back to you as soon as possible.",
      });
      supportForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/support-requests'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit support request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmitSupport = (data: z.infer<typeof supportFormSchema>) => {
    createSupportMutation.mutate(data);
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Dumbbell className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Morphit Settings</h1>
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main className="max-w-7xl mx-auto p-6">
          <div className="text-center">Loading...</div>
        </main>
      </div>
    );
  }

  const cycleInfo = user?.focusCycle ? CYCLE_MAP[user.focusCycle as keyof typeof CYCLE_MAP] : null;
  const weekInfo = user?.currentWeekInCycle ? WEEK_MAP[user.currentWeekInCycle as keyof typeof WEEK_MAP] : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Dumbbell className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Morphit Settings</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setLocation("/")}
              data-testid="button-back-dashboard"
            >
              Back to Dashboard
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5" data-testid="tabs-user-settings">
            <TabsTrigger value="profile" data-testid="tab-profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="subscription" data-testid="tab-subscription">
              <Crown className="h-4 w-4 mr-2" />
              Subscription
            </TabsTrigger>
            <TabsTrigger value="support" data-testid="tab-support">
              <HeadphonesIcon className="h-4 w-4 mr-2" />
              Support
            </TabsTrigger>
            <TabsTrigger value="faq" data-testid="tab-faq">
              <HelpCircle className="h-4 w-4 mr-2" />
              FAQ
            </TabsTrigger>
            <TabsTrigger value="getting-started" data-testid="tab-getting-started">
              <Rocket className="h-4 w-4 mr-2" />
              Getting Started
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" data-testid="content-profile">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Profile Information</h2>
              
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">Name</Label>
                    <p className="text-lg" data-testid="text-user-name">
                      {user?.firstName} {user?.lastName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-muted-foreground">Email</Label>
                    <p className="text-lg" data-testid="text-user-email">{user?.email}</p>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Current Training Focus</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-semibold text-muted-foreground">Morphit Cycle</Label>
                      {cycleInfo ? (
                        <div data-testid="text-current-cycle">
                          <p className="text-lg font-bold">{cycleInfo.name}</p>
                          <p className="text-sm text-muted-foreground">{cycleInfo.description}</p>
                        </div>
                      ) : (
                        <p className="text-lg text-muted-foreground">Not set</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-muted-foreground">Current Week (4-Week Progression)</Label>
                      {weekInfo ? (
                        <div data-testid="text-current-week">
                          <p className="text-lg font-bold">Week {user?.currentWeekInCycle}: {weekInfo.name}</p>
                          <p className="text-sm text-muted-foreground">{weekInfo.description}</p>
                        </div>
                      ) : (
                        <p className="text-lg text-muted-foreground">Not set</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Training Preferences</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-semibold text-muted-foreground">Equipment Access</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {user?.equipment && user.equipment.length > 0 ? (
                          user.equipment.map((eq, index) => (
                            <Badge key={index} variant="outline" data-testid={`badge-equipment-${index}`}>
                              {eq}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">Not set</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-muted-foreground">Workouts Per Week</Label>
                      <p className="text-lg" data-testid="text-days-per-week">
                        {user?.daysPerWeek || "Not set"} days
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <Button variant="outline" onClick={() => setLocation("/settings/program")} data-testid="button-edit-preferences">
                    Edit Training Preferences
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" data-testid="content-subscription">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Subscription</h2>
              
              <div className="space-y-6">
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">Current Plan</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant={user?.subscriptionTier === "premium" ? "default" : "outline"} className="text-lg px-4 py-2" data-testid="badge-subscription-tier">
                      {user?.subscriptionTier === "premium" ? (
                        <>
                          <Crown className="h-4 w-4 mr-2" />
                          Premium
                        </>
                      ) : (
                        "Free"
                      )}
                    </Badge>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Plan Comparison</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-md border bg-card" data-testid="plan-free">
                      <h4 className="font-semibold mb-3">Free Plan</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          Unlimited training programs
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          4 Morphit cycles (Flow, Build, Strong, Move)
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          Equipment swapping
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          Workout tracking & history
                        </li>
                      </ul>
                    </div>
                    <div className="p-4 rounded-md border border-primary bg-card" data-testid="plan-premium">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Crown className="h-4 w-4 text-primary" />
                        Premium Plan
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          Everything in Free, plus:
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          Personal trainer support
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          Priority support responses
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          Advanced analytics & insights
                        </li>
                      </ul>
                      {user?.subscriptionTier !== "premium" && (
                        <Button className="w-full mt-4" data-testid="button-upgrade">
                          Upgrade to Premium
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support" data-testid="content-support">
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Submit Support Request</h2>
                
                <Form {...supportForm}>
                  <form onSubmit={supportForm.handleSubmit(onSubmitSupport)} className="space-y-4">
                    <FormField
                      control={supportForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-support-category">
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="technical_issue" data-testid="option-technical-issue">Technical Issue</SelectItem>
                              <SelectItem value="billing" data-testid="option-billing">Billing</SelectItem>
                              <SelectItem value="program_question" data-testid="option-program-question">Program Question</SelectItem>
                              <SelectItem value="general_question" data-testid="option-general-question">General Question</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={supportForm.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Brief description of your issue"
                              data-testid="input-support-subject"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={supportForm.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Provide detailed information about your request"
                              rows={5}
                              data-testid="textarea-support-message"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={createSupportMutation.isPending}
                      data-testid="button-submit-support"
                    >
                      {createSupportMutation.isPending ? "Submitting..." : "Submit Request"}
                    </Button>
                  </form>
                </Form>
              </Card>

              {/* Past Support Requests */}
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Your Support Requests</h2>
                
                {isLoadingSupport ? (
                  <p className="text-center text-muted-foreground">Loading requests...</p>
                ) : supportRequests && supportRequests.length > 0 ? (
                  <div className="space-y-4">
                    {supportRequests.map((request) => (
                      <div key={request.id} className="p-4 rounded-md border bg-card" data-testid={`card-support-${request.id}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold" data-testid={`text-support-subject-${request.id}`}>
                              {request.subject}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <Badge variant={
                            request.status === "resolved" ? "default" :
                            request.status === "in_progress" ? "secondary" :
                            "outline"
                          } data-testid={`badge-support-status-${request.id}`}>
                            {request.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Category: {request.category.replace('_', ' ')}
                        </p>
                        <p className="text-sm" data-testid={`text-support-message-${request.id}`}>
                          {request.message}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground" data-testid="text-no-support-requests">
                    No support requests yet.
                  </p>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq" data-testid="content-faq">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" data-testid="faq-cycles">
                  <AccordionTrigger data-testid="trigger-faq-cycles">What are the 4 Morphit cycles?</AccordionTrigger>
                  <AccordionContent>
                    Morphit uses 4 training cycles to help you achieve balanced fitness:
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li><strong>Flow:</strong> Focuses on mobility, flexibility, and movement quality. Perfect for improving range of motion and preventing injuries.</li>
                      <li><strong>Build:</strong> Targets muscle growth and hypertrophy. Ideal for adding lean muscle mass.</li>
                      <li><strong>Strong:</strong> Emphasizes maximal strength and power development. Great for building raw strength.</li>
                      <li><strong>Move:</strong> Develops athletic performance, agility, and functional movement patterns.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" data-testid="faq-progression">
                  <AccordionTrigger data-testid="trigger-faq-progression">How does the 4-week progression work?</AccordionTrigger>
                  <AccordionContent>
                    Each Morphit cycle uses a 4-week microcycle for optimal progression:
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li><strong>Week 1 - Learn:</strong> Introduction to movements with focus on proper technique and form.</li>
                      <li><strong>Week 2 - Load:</strong> Progressive overload begins, gradually increasing intensity.</li>
                      <li><strong>Week 3 - Push:</strong> Peak intensity week with maximum effort and volume.</li>
                      <li><strong>Week 4 - Deload:</strong> Recovery week allowing your body to adapt and grow stronger.</li>
                    </ul>
                    This scientific approach prevents burnout and maximizes results.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" data-testid="faq-equipment">
                  <AccordionTrigger data-testid="trigger-faq-equipment">Can I swap exercises based on my equipment?</AccordionTrigger>
                  <AccordionContent>
                    Yes! Morphit has an intelligent exercise swapping system. During any workout, you can swap exercises to match your available equipment. The system will suggest alternatives that target the same movement patterns and maintain program integrity. Simply tap on any exercise during your workout to see available swaps.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" data-testid="faq-missed-workout">
                  <AccordionTrigger data-testid="trigger-faq-missed-workout">What happens if I miss a workout?</AccordionTrigger>
                  <AccordionContent>
                    Morphit automatically reschedules missed workouts. If you skip a scheduled workout, the system will shift it forward and adjust your future sessions accordingly. This ensures you complete all workouts in your program without losing progress. You can also manually reschedule workouts in your program settings.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" data-testid="faq-assessments">
                  <AccordionTrigger data-testid="trigger-faq-assessments">How do fitness assessments work?</AccordionTrigger>
                  <AccordionContent>
                    Fitness assessments help Morphit customize your program difficulty. During onboarding, you'll complete bodyweight tests (push-ups, squats, etc.) or optional 1RM strength tests. These results determine your starting difficulty level for each of the 10 movement patterns. You can retake assessments anytime to update your program as you progress.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6" data-testid="faq-switch-cycles">
                  <AccordionTrigger data-testid="trigger-faq-switch-cycles">Can I switch between cycles mid-program?</AccordionTrigger>
                  <AccordionContent>
                    For best results, we recommend completing the full 4-week progression before switching cycles. However, you can change your focus cycle anytime in Program Settings. When you switch, Morphit will generate a new program based on your selected cycle. Your progress and workout history are always preserved.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          </TabsContent>

          {/* Getting Started Tab */}
          <TabsContent value="getting-started" data-testid="content-getting-started">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Getting Started with Morphit</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xl font-bold text-primary">1</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Choose Your Morphit Cycle</h3>
                    <p className="text-muted-foreground mb-3">
                      Select one of the 4 training cycles based on your current fitness goals. Not sure which to pick? Start with <strong>Flow</strong> to build a strong foundation of movement quality.
                    </p>
                    <Button variant="outline" onClick={() => setLocation("/settings/program")} data-testid="button-choose-cycle">
                      Go to Program Settings
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xl font-bold text-primary">2</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Take Your Fitness Assessment</h3>
                    <p className="text-muted-foreground mb-3">
                      Complete a quick fitness assessment to help Morphit customize your program difficulty. You can choose bodyweight tests (push-ups, squats) or skip and start with beginner level.
                    </p>
                    <Button variant="outline" onClick={() => setLocation("/assessment")} data-testid="button-start-assessment">
                      Start Assessment
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xl font-bold text-primary">3</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Generate Your First Program</h3>
                    <p className="text-muted-foreground mb-3">
                      Based on your cycle selection, available equipment, and assessment results, Morphit will generate a personalized 4-week training program with the perfect progression for your goals.
                    </p>
                    <Button variant="outline" onClick={() => setLocation("/onboarding")} data-testid="button-generate-program">
                      Generate Program
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xl font-bold text-primary">4</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Start Training!</h3>
                    <p className="text-muted-foreground mb-3">
                      Your program is ready. Head to your dashboard to see today's workout. Each session includes CNS-ordered exercises (warmup → power → compounds → isolations → core → cardio) for optimal results.
                    </p>
                    <Button onClick={() => setLocation("/")} data-testid="button-go-dashboard">
                      Go to Dashboard
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
