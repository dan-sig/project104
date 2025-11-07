import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Activity, 
  ArrowLeft,
  Zap,
  BarChart3,
  Sparkles,
  TrendingUp
} from "lucide-react";
import { useLocation } from "wouter";

export default function SmartProgression() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 mb-4">
            <Activity className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold">Longevity-First Training</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Adaptive programs built on movement science and CNS progression—balancing performance, recovery, and strength that lasts
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          <Card className="p-8 space-y-6">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold">Choose Your Training Cycle</h2>
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Select the cycle that matches your current goal—each follows the same 4-week Learn → Load → Push → Deload progression:
            </p>
            
            <div className="grid gap-4">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className="font-semibold">Morphit Flow</h3>
                  <p className="text-xs text-primary font-medium italic mb-1">Find your range. Reclaim your movement.</p>
                  <p className="text-sm text-muted-foreground">
                    Mobility, joint control, and stability for recovery, travel, or longevity training.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className="font-semibold">Morphit Build</h3>
                  <p className="text-xs text-primary font-medium italic mb-1">Aesthetic meets athletic.</p>
                  <p className="text-sm text-muted-foreground">
                    Functional hypertrophy and joint integrity—shape your physique without sacrificing movement quality.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className="font-semibold">Morphit Strong</h3>
                  <p className="text-xs text-primary font-medium italic mb-1">Lift heavy. Move better. Last longer.</p>
                  <p className="text-sm text-muted-foreground">
                    Neural strength and maximal output with low reps, high tension, and technical precision.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className="font-semibold">Morphit Move</h3>
                  <p className="text-xs text-primary font-medium italic mb-1">Strong today. Capable for life.</p>
                  <p className="text-sm text-muted-foreground">
                    Total-body balance, conditioning, and longevity with moderate intensity and perfect CNS balance.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 space-y-4">
            <h3 className="text-xl font-semibold">The CNS-Balanced Session Blueprint</h3>
            <p className="text-muted-foreground leading-relaxed">
              Every workout follows a scientifically designed sequence to train your nervous system in the right order—building energy, not fatigue:
            </p>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div>
                  <strong className="text-foreground">Warm-Up:</strong> Activation & mobility to prepare joints and activate stabilizers
                </div>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div>
                  <strong className="text-foreground">Power:</strong> Explosive readiness work that primes the CNS
                </div>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div>
                  <strong className="text-foreground">Compound:</strong> Main strength block with multi-joint lifts for load and growth
                </div>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div>
                  <strong className="text-foreground">Isolation:</strong> Accessory control for targeted work on posture and balance
                </div>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div>
                  <strong className="text-foreground">Core:</strong> Stability & control through anti-rotation and trunk strength
                </div>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div>
                  <strong className="text-foreground">Conditioning:</strong> Longevity engine with carries, circuits, or steady cardio
                </div>
              </li>
            </ul>
            <div className="bg-background/50 rounded-lg p-4 mt-4">
              <p className="text-sm text-muted-foreground">
                This structure keeps sessions neuro-balanced: high-demand work first, stability in the middle, recovery and capacity last. You finish every session feeling <strong className="text-foreground">stronger, looser, and more energized</strong>.
              </p>
            </div>
          </Card>

          <div className="bg-muted/30 rounded-lg p-6 space-y-3">
            <h3 className="font-semibold text-lg">Adapts to Your Life</h3>
            <p className="text-muted-foreground">
              Morphit custom-fits your program to your real schedule and equipment. Train 3, 4, or 5 days per week. 
              Choose session lengths from 30 to 90 minutes. From bodyweight-only to full gym access, the system 
              intelligently modifies sets, reps, tempo, RPE, and rest to fit your parameters—<strong className="text-foreground">no guesswork, no wasted effort</strong>.
            </p>
          </div>

          <Card className="p-8 bg-primary/10 border-primary/30">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold">Ready to Experience It?</h3>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Create your account to unlock science-backed functional fitness training 
                that adapts to your life and goals.
              </p>
              <div className="pt-4">
                <Button
                  size="lg"
                  className="text-lg px-8 h-14"
                  onClick={() => window.location.href = "/api/login"}
                  data-testid="button-create-account"
                >
                  <Zap className="h-5 w-5 mr-2" />
                  Create Your Account
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  onClick={() => window.location.href = "/api/login"}
                  className="text-primary hover:underline font-medium"
                  data-testid="link-login"
                >
                  Log in here
                </button>
              </p>
            </div>
          </Card>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-8 border-t">
          <Button
            variant="ghost"
            onClick={() => setLocation("/how-it-works")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="text-sm text-muted-foreground">
            Step 3 of 3
          </div>
        </div>
      </div>
    </div>
  );
}
