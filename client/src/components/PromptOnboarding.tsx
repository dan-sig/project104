import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Brain, Sparkles, Loader2, Check, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { FitnessProgramData } from "../../../server/prompt-parser";

interface PromptOnboardingProps {
  onComplete: (parsedData: FitnessProgramData, needsAssessment: boolean) => void;
}

export default function PromptOnboarding({ onComplete }: PromptOnboardingProps) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState<FitnessProgramData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [examplePrompts, setExamplePrompts] = useState<string[]>([]);
  const { toast } = useToast();

  // Load example prompts on mount
  useEffect(() => {
    fetch("/api/programs/example-prompts")
      .then(res => res.json())
      .then(data => setExamplePrompts(data.examples))
      .catch(console.error);
  }, []);

  const handleParsePrompt = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please describe your fitness goals and available equipment.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/programs/generate-from-prompt", { prompt });
      const result = await response.json();

      if (!result.success) {
        const missingInfo = result.missingFields?.length 
          ? `Missing: ${result.missingFields.join(", ")}`
          : result.error || "Please provide more information about your fitness goals.";
        
        toast({
          title: "Need more details",
          description: missingInfo,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      setParsedData(result.parsedData);
      setShowPreview(true);
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to parse prompt:", error);
      toast({
        title: "Error",
        description: "Failed to understand your goals. Please try rephrasing.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (parsedData) {
      onComplete(parsedData, parsedData.wantsAssessment);
    }
  };

  const handleEdit = () => {
    setShowPreview(false);
    setParsedData(null);
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
  };

  // Show preview screen if we have parsed data
  if (showPreview && parsedData) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Check className="h-8 w-8 text-green-500" />
            <h2 className="text-3xl font-bold">Got it!</h2>
          </div>
          <p className="text-muted-foreground">
            Here's what I understood from your goals. Does this look right?
          </p>
        </div>

        <Card className="p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Training Frequency</p>
              <p className="text-lg font-semibold">{parsedData.daysPerWeek} days per week</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Workout Duration</p>
              <p className="text-lg font-semibold">{parsedData.sessionDuration} minutes</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nutrition Goal</p>
              <p className="text-lg font-semibold capitalize">{parsedData.nutritionGoal}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Experience Level</p>
              <p className="text-lg font-semibold capitalize">{parsedData.experienceLevel}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Available Equipment</p>
            <div className="flex flex-wrap gap-2">
              {parsedData.equipment.map((eq) => (
                <span
                  key={eq}
                  className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm capitalize"
                  data-testid={`equipment-${eq}`}
                >
                  {eq.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>

          {parsedData.parsedGoals && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Your Goals</p>
              <p className="text-sm italic">{parsedData.parsedGoals}</p>
            </div>
          )}
        </Card>

        {parsedData.wantsAssessment && (
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Fitness Assessment Recommended</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Based on your experience level, we recommend taking a quick fitness test to personalize
                  your program difficulty and unlock advanced movements as you progress.
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={handleEdit}
            data-testid="button-edit-prompt"
            className="flex-1"
          >
            Edit
          </Button>
          <Button
            onClick={handleConfirm}
            data-testid="button-confirm-parsed-data"
            className="flex-1"
          >
            Looks Good - Continue
          </Button>
        </div>
      </div>
    );
  }

  // Show prompt input screen
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Brain className="h-8 w-8 text-primary" />
          <h2 className="text-3xl font-bold">Tell Us Your Goals</h2>
        </div>
        <p className="text-muted-foreground">
          Describe your fitness goals, schedule, and available equipment in your own words
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <Textarea
          placeholder="Example: I want to build muscle and lose fat. I can train 4 days a week for 45 minutes with dumbbells and a pull-up bar at home."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={6}
          className="text-base"
          data-testid="input-fitness-prompt"
        />

        <Button
          onClick={handleParsePrompt}
          disabled={isLoading || !prompt.trim()}
          className="w-full"
          data-testid="button-parse-prompt"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing your goals...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Create My Program
            </>
          )}
        </Button>
      </Card>

      <div className="space-y-3">
        <p className="text-sm text-muted-foreground text-center">Or try one of these examples:</p>
        <div className="grid gap-2">
          {examplePrompts.map((example, idx) => (
            <Button
              key={idx}
              variant="outline"
              onClick={() => handleExampleClick(example)}
              className="text-left h-auto whitespace-normal p-4 justify-start"
              data-testid={`button-example-${idx}`}
            >
              <Sparkles className="h-4 w-4 mr-2 flex-shrink-0 text-primary" />
              <span className="text-sm">{example}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
