import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Calendar,
  DollarSign,
  User,
  Dumbbell,
  Clock,
  TrendingUp,
} from "lucide-react";

interface ProgramBuyPageData {
  id: string;
  name: string;
  description: string | null;
  difficulty: "beginner" | "intermediate" | "advanced";
  durationWeeks: number;
  daysPerWeek: number;
  price: number;
  pricingType: "one_time" | "subscription";
  workouts: Array<{
    id: string;
    workoutName: string;
    description: string | null;
    weekNumber: number;
    dayNumber: number;
    estimatedDuration: number | null;
    exercises: Array<{
      exerciseName: string;
      sets: number;
      reps: string | null;
      rest: number | null;
    }>;
  }>;
  trainer: {
    id: string;
  } | null;
}

export default function ProgramBuyPage() {
  const [match, params] = useRoute("/programs/buy/:slug");
  const slug = params?.slug;

  // Fetch public program
  const { data: program, isLoading, error } = useQuery<ProgramBuyPageData>({
    queryKey: ["/api/programs/public", slug],
    enabled: !!slug,
  });

  // Update SEO metadata when program loads
  useEffect(() => {
    if (program) {
      document.title = `${program.name} - Morphit Training Program`;
      
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute(
          "content",
          program.description || 
          `${program.durationWeeks}-week ${program.difficulty} training program. ${program.daysPerWeek} workouts per week.`
        );
      }
    }

    return () => {
      document.title = "Morphit - Personal Fitness Program";
    };
  }, [program]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading program...</p>
        </div>
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold mb-2">Program Not Found</h2>
          <p className="text-muted-foreground">
            This program is not available or has been unpublished.
          </p>
        </Card>
      </div>
    );
  }

  const totalWorkouts = program.workouts.length;
  const avgDuration = program.workouts.reduce((sum, w) => sum + (w.estimatedDuration || 0), 0) / totalWorkouts;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-background border-b">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl">
            <Badge className="mb-4" data-testid="badge-difficulty">
              {program.difficulty.charAt(0).toUpperCase() + program.difficulty.slice(1)}
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-program-name">
              {program.name}
            </h1>
            {program.description && (
              <p className="text-lg text-muted-foreground mb-6" data-testid="text-program-description">
                {program.description}
              </p>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-semibold" data-testid="text-duration">{program.durationWeeks} weeks</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Workouts</p>
                  <p className="font-semibold" data-testid="text-days-per-week">{program.daysPerWeek}/week</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Session</p>
                  <p className="font-semibold">{Math.round(avgDuration)} min</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-semibold" data-testid="text-total-workouts">{totalWorkouts} workouts</p>
                </div>
              </div>
            </div>

            {/* Trainer Info */}
            {program.trainer && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Created by a certified trainer</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl">
          {/* Left: Workout Preview */}
          <div className="md:col-span-2">
            <h2 className="text-2xl font-bold mb-6">Program Workouts</h2>
            
            <Accordion type="single" collapsible className="space-y-4">
              {program.workouts.map((workout, index) => (
                <AccordionItem 
                  key={workout.id} 
                  value={workout.id}
                  data-testid={`accordion-workout-${index}`}
                >
                  <Card>
                    <AccordionTrigger className="px-6 py-4 hover:no-underline" data-testid={`button-workout-toggle-${index}`}>
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="text-left">
                          <p className="font-semibold">{workout.workoutName}</p>
                          <p className="text-sm text-muted-foreground">
                            Week {workout.weekNumber}, Day {workout.dayNumber}
                            {workout.estimatedDuration && ` • ${workout.estimatedDuration} min`}
                          </p>
                        </div>
                        <Badge variant="outline">{workout.exercises.length} exercises</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4" data-testid={`workout-content-${index}`}>
                      {workout.description && (
                        <p className="text-sm text-muted-foreground mb-4">
                          {workout.description}
                        </p>
                      )}
                      <div className="space-y-2">
                        {workout.exercises.map((exercise, exIndex) => (
                          <div
                            key={exIndex}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                            data-testid={`exercise-item-${index}-${exIndex}`}
                          >
                            <span className="font-medium">{exercise.exerciseName}</span>
                            <span className="text-sm text-muted-foreground">
                              {exercise.sets} × {exercise.reps || "varies"}
                              {exercise.rest && ` • ${exercise.rest}s rest`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Right: Pricing Card */}
          <div>
            <Card className="p-6 sticky top-6">
              <div className="space-y-6">
                <div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <DollarSign className="h-6 w-6 text-primary" />
                    <span className="text-4xl font-bold" data-testid="text-price">
                      ${program.price}
                    </span>
                    {program.pricingType === "subscription" && (
                      <span className="text-muted-foreground">/month</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {program.pricingType === "one_time" ? "One-time payment" : "Monthly subscription"}
                  </p>
                </div>

                <div className="pt-4 border-t space-y-3">
                  <h3 className="font-semibold mb-3">What's Included:</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                      <span>{totalWorkouts} complete workouts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                      <span>{program.durationWeeks}-week progressive plan</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                      <span>Detailed exercise instructions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                      <span>Progress tracking tools</span>
                    </div>
                  </div>
                </div>

                <Button className="w-full" size="lg" data-testid="button-purchase">
                  Purchase Program
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Platform fee: 20% • Trainer receives 80%
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
