import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dumbbell, Target, TrendingUp, Calendar, Zap, Award, Brain, Repeat, Clock, Activity, Luggage, Heart } from "lucide-react";
import { useLocation } from "wouter";
import morphitLogo from "@assets/31FDE9D6-272E-4F80-9D02-C546AEF4F1A8_1762631595796.png";
import { RoleSelectionDialog } from "@/components/RoleSelectionDialog";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [showRoleDialog, setShowRoleDialog] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        
        <div className="relative max-w-7xl mx-auto px-6 py-24 lg:py-32">
          <div className="text-center space-y-8">
            {/* Logo/Brand */}
            <div className="flex flex-col items-center justify-center gap-6">
              <div className="w-80 max-w-full px-4">
                <img 
                  src={morphitLogo} 
                  alt="Morphit - Train Smarter. Move Stronger. Live Longer." 
                  className="w-full h-auto rounded-2xl shadow-lg"
                  data-testid="img-morphit-logo"
                />
              </div>
            </div>

            {/* Main Headline */}
            <div className="space-y-4 max-w-3xl mx-auto">
              <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
                Train Smarter. <br />
                Move Stronger. <br />
                <span className="text-primary">Live Longer.</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                The first longevity-based training system that evolves with you. 
                Personalized 4-week cycles built on human movement science and CNS progression—balancing performance, recovery, and strength that lasts.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button
                size="lg"
                className="text-lg px-8 h-14 w-full sm:w-auto"
                onClick={() => setLocation("/about")}
                data-testid="button-get-started"
              >
                <Zap className="h-5 w-5 mr-2" />
                Get Started
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 h-14 w-full sm:w-auto"
                onClick={() => setShowRoleDialog(true)}
                data-testid="button-login"
              >
                Log In
              </Button>
            </div>

            <RoleSelectionDialog 
              open={showRoleDialog} 
              onOpenChange={setShowRoleDialog}
            />
          </div>
        </div>
      </div>

      {/* The 4 Morphit Cycles Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center space-y-4 mb-12">
          <h3 className="text-3xl font-bold">Four Training Cycles. One Adaptive System.</h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the cycle that matches your goal—each follows the same 4-week Learn → Load → Push → Deload progression
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {/* Morphit Flow */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10 w-fit">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Morphit Flow</h3>
            </div>
            <p className="text-sm text-primary font-medium italic">Find your range. Reclaim your movement.</p>
            <p className="text-muted-foreground">
              Mobility, joint control, and stability. Perfect for recovery, travel, or longevity training with slower tempos and controlled movements.
            </p>
          </Card>

          {/* Morphit Build */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10 w-fit">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Morphit Build</h3>
            </div>
            <p className="text-sm text-primary font-medium italic">Aesthetic meets athletic.</p>
            <p className="text-muted-foreground">
              Functional hypertrophy and joint integrity. Shape your physique without sacrificing movement quality through progressive overload and full-range lifts.
            </p>
          </Card>

          {/* Morphit Strong */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10 w-fit">
                <Dumbbell className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Morphit Strong</h3>
            </div>
            <p className="text-sm text-primary font-medium italic">Lift heavy. Move better. Last longer.</p>
            <p className="text-muted-foreground">
              Neural strength and maximal output. Low reps, high tension, longer rest periods with technical precision for experienced lifters and athletes.
            </p>
          </Card>

          {/* Morphit Move */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10 w-fit">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Morphit Move</h3>
            </div>
            <p className="text-sm text-primary font-medium italic">Strong today. Capable for life.</p>
            <p className="text-muted-foreground">
              Total-body balance, conditioning, and longevity. Moderate intensity hybrid sessions with perfect CNS balance for sustainable, long-term fitness.
            </p>
          </Card>
        </div>

        <div className="text-center space-y-4 mb-12 mt-16">
          <h3 className="text-3xl font-bold">Built on Movement Science</h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every cycle adapts to your schedule, equipment, and fitness level
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* CNS-Ordered Programming */}
          <Card className="p-6 space-y-4">
            <div className="p-3 rounded-lg bg-primary/10 w-fit">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">CNS-Ordered Programming</h3>
            <p className="text-muted-foreground">
              Professional workout structure following Central Nervous System demand hierarchy: warmup → power → compounds → isolations → core → cardio. Train smarter, recover better.
            </p>
          </Card>

          {/* 10 Functional Movement Patterns */}
          <Card className="p-6 space-y-4">
            <div className="p-3 rounded-lg bg-primary/10 w-fit">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">10 Real-World Movement Patterns</h3>
            <p className="text-muted-foreground">
              Train movements you use daily: squat (sit down), hinge (pick things up), push (move objects away), pull (bring things close), lunge (climb stairs), carry (groceries), rotate (twist), and core stability.
            </p>
          </Card>

          {/* 3/4/5 Day Splits */}
          <Card className="p-6 space-y-4">
            <div className="p-3 rounded-lg bg-primary/10 w-fit">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">3, 4, or 5 Day Splits</h3>
            <p className="text-muted-foreground">
              Choose your weekly schedule. Each split follows specific workout focus patterns: balanced full-body (3-day), upper/lower (4-day), or specialized training (5-day). Pick your training dates each cycle.
            </p>
          </Card>

          {/* Adaptive Training */}
          <Card className="p-6 space-y-4">
            <div className="p-3 rounded-lg bg-primary/10 w-fit">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Adaptive Difficulty Levels</h3>
            <p className="text-muted-foreground">
              Complete a fitness assessment to establish your baseline across all movement patterns. Programs adapt based on your skill level—unlock advanced movements as you progress and track your improvement.
            </p>
          </Card>

          {/* Flexible Duration */}
          <Card className="p-6 space-y-4">
            <div className="p-3 rounded-lg bg-primary/10 w-fit">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">30, 45, 60, or 90 Minute Workouts</h3>
            <p className="text-muted-foreground">
              Time-optimized programming that fits your schedule. Shorter workouts use aggressive supersets for efficiency. Longer sessions add volume and variety. Every minute is purposeful.
            </p>
          </Card>

          {/* Equipment-Based Swapping */}
          <Card className="p-6 space-y-4">
            <div className="p-3 rounded-lg bg-primary/10 w-fit">
              <Luggage className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Smart Equipment Swapping</h3>
            <p className="text-muted-foreground">
              Traveling or gym equipment unavailable? Instantly swap exercises based on what you have access to—from full gym to bodyweight-only. Your program adapts to you, wherever you are.
            </p>
          </Card>

          {/* Advanced Cardio */}
          <Card className="p-6 space-y-4">
            <div className="p-3 rounded-lg bg-primary/10 w-fit">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Zone 2 & HIIT Training</h3>
            <p className="text-muted-foreground">
              Advanced cardio programming with automated HIIT intervals and Zone 2 steady-state training. Cardio variety rotates based on your nutrition goals—balance fat loss with muscle preservation.
            </p>
          </Card>

          {/* Progressive Cycles */}
          <Card className="p-6 space-y-4">
            <div className="p-3 rounded-lg bg-primary/10 w-fit">
              <Repeat className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Intelligent 7-Day Cycles</h3>
            <p className="text-muted-foreground">
              Complete a cycle, repeat the same training days, or regenerate for variety. Automatically reschedules missed workouts. Track cycle number and total workouts completed for long-term progress.
            </p>
          </Card>

          {/* AI Enhancement */}
          <Card className="p-6 space-y-4">
            <div className="p-3 rounded-lg bg-primary/10 w-fit">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">AI-Enhanced Insights</h3>
            <p className="text-muted-foreground">
              Core programming driven by exercise science. Supplemental AI provides workout summaries and insights. More advanced programming features in development—including health app integration.
            </p>
          </Card>
        </div>
      </div>

      {/* Social Proof / Trust Section */}
      <div className="bg-muted/30 py-16">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-8">
          <div className="flex items-center justify-center gap-2">
            <Award className="h-8 w-8 text-primary" />
            <h3 className="text-2xl font-bold">Built on Science, Designed for Life</h3>
          </div>
          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">195+</div>
              <p className="text-muted-foreground">Exercise Variations</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">10</div>
              <p className="text-muted-foreground">Movement Patterns</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">3-5</div>
              <p className="text-muted-foreground">Days Per Week</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">30-90</div>
              <p className="text-muted-foreground">Minute Options</p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="space-y-6 max-w-2xl mx-auto">
          <h3 className="text-3xl font-bold">The Morphit Promise</h3>
          <p className="text-lg text-muted-foreground">
            Smarter. Stronger. Longer. Whatever your goal—to move better, build muscle, lift heavier, or simply stay in the game—Morphit gives you a structured, adaptive system that keeps you progressing without burning out.
          </p>
          <Button
            size="lg"
            className="text-lg px-8 h-14"
            onClick={() => setLocation("/about")}
            data-testid="button-start-journey"
          >
            Start Your Journey
          </Button>
        </div>
      </div>
    </div>
  );
}
