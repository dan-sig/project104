import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Brain, Sparkles, TrendingUp, Dumbbell, Settings, Loader2, ChevronDown, ChevronUp, Target, Calendar, Zap, CheckCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface InsightResponse {
  success: boolean;
  insights: string;
  metrics: any;
  error?: string;
}

interface GenerateProgramResponse {
  success: boolean;
  parsedData?: any;
  needsAssessment?: boolean;
  needsMoreInfo?: boolean;
  missingFields?: string[];
  error?: string;
}

export default function AITrainingAssistant() {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"insights" | "generate" | "update">("insights");
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [insightResults, setInsightResults] = useState<InsightResponse | null>(null);
  const [generateSuccess, setGenerateSuccess] = useState(false);
  const { toast } = useToast();

  const examplePrompts = {
    insights: [
      "How am I doing this week?",
      "Show my best lifts",
      "Am I ready for heavier weights?",
      "What's my progress this month?"
    ],
    generate: [
      "Create a 4-day strength program with barbells and dumbbells",
      "I want a 3-day full body routine with just bodyweight",
      "Build me a 5-day push/pull/legs split"
    ],
    update: [
      "I just got a kettlebell, add it to my equipment",
      "Change my workout days to Monday, Wednesday, Friday",
      "I can now train for 60 minutes instead of 45"
    ]
  };

  const handleGetInsights = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a question about your progress.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setInsightResults(null);

    try {
      const response = await apiRequest("POST", "/api/insights/prompt", {
        prompt,
        level: "2" // Weekly insights by default
      });

      const result = await response.json();
      setInsightResults(result);

      if (!result.success) {
        toast({
          title: "Unable to generate insights",
          description: result.error || "Please try completing some workouts first.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to get insights:", error);
      toast({
        title: "Error",
        description: "Failed to generate insights. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateProgram = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please describe your fitness goals and preferences.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setGenerateSuccess(false);

    try {
      // Step 1: Parse the prompt and update user profile
      const parseResponse = await apiRequest("POST", "/api/programs/generate-from-prompt", { prompt });
      
      // Check for HTTP errors first
      if (!parseResponse.ok) {
        const errorData = await parseResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to process your request. Please try again.");
      }
      
      const parseResult: GenerateProgramResponse = await parseResponse.json();

      // Handle missing information
      if (!parseResult.success || parseResult.needsMoreInfo) {
        const missingInfo = parseResult.missingFields?.length 
          ? `Missing: ${parseResult.missingFields.join(", ")}`
          : parseResult.error || "Please provide more information about your fitness goals.";
        
        toast({
          title: "Need more details",
          description: missingInfo,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Handle fitness assessment requirement
      if (parseResult.needsAssessment) {
        toast({
          title: "Fitness assessment required",
          description: "Please complete the fitness assessment in Settings before generating a program. This helps us create the right program for your fitness level.",
          variant: "default",
          duration: 6000,
        });
        setIsLoading(false);
        return;
      }

      // Step 2: Generate the program with updated profile
      const generateResponse = await apiRequest("POST", "/api/programs/generate", {});
      
      if (!generateResponse.ok) {
        const errorData = await generateResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate program");
      }

      const generateResult = await generateResponse.json();

      // Success! Invalidate queries and show success state
      await queryClient.invalidateQueries({ queryKey: ["/api/home-data"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/program-workouts"] });
      
      setGenerateSuccess(true);
      toast({
        title: "Program created!",
        description: "Your new workout program is ready. Check the home page to get started.",
      });
      
    } catch (error) {
      console.error("Failed to generate program:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate program. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
  };

  const renderInsightsContent = () => {
    if (insightResults?.success && insightResults.insights) {
      const metrics = insightResults.metrics;
      
      return (
        <div className="space-y-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Brain className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm whitespace-pre-wrap" data-testid="text-insights-result">
                  {insightResults.insights}
                </p>
              </div>
            </CardContent>
          </Card>

          {metrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {metrics.totalSessions !== undefined && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Dumbbell className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Sessions</p>
                    </div>
                    <p className="text-2xl font-bold" data-testid="metric-sessions">
                      {metrics.totalSessions}
                    </p>
                  </CardContent>
                </Card>
              )}
              
              {metrics.totalVolume !== undefined && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Volume</p>
                    </div>
                    <p className="text-2xl font-bold" data-testid="metric-volume">
                      {Math.round(metrics.totalVolume).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              )}
              
              {metrics.avgWorkDensity !== undefined && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Intensity</p>
                    </div>
                    <p className="text-2xl font-bold" data-testid="metric-intensity">
                      {Math.round(metrics.avgWorkDensity)}
                    </p>
                  </CardContent>
                </Card>
              )}
              
              {metrics.avgSessionDuration !== undefined && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Avg Time</p>
                    </div>
                    <p className="text-2xl font-bold" data-testid="metric-duration">
                      {Math.round(metrics.avgSessionDuration)}m
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <Button
            variant="outline"
            onClick={() => {
              setInsightResults(null);
              setPrompt("");
            }}
            className="w-full"
            data-testid="button-ask-another"
          >
            Ask Another Question
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <Textarea
          placeholder="Ask me anything about your training progress..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="text-base resize-none"
          data-testid="input-insights-prompt"
        />

        <Button
          onClick={handleGetInsights}
          disabled={isLoading || !prompt.trim()}
          className="w-full"
          data-testid="button-get-insights"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <TrendingUp className="h-4 w-4 mr-2" />
              Get Insights
            </>
          )}
        </Button>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Example questions:</p>
          <div className="grid gap-2">
            {examplePrompts.insights.map((example, idx) => (
              <Button
                key={idx}
                variant="outline"
                onClick={() => handleExampleClick(example)}
                className="text-left h-auto whitespace-normal p-3 justify-start text-sm hover-elevate"
                data-testid={`button-example-insights-${idx}`}
              >
                <Sparkles className="h-3 w-3 mr-2 flex-shrink-0 text-primary" />
                {example}
              </Button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderGenerateContent = () => {
    if (generateSuccess) {
      return (
        <div className="space-y-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1" data-testid="text-program-success">
                    Program created successfully!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your new workout program is ready. Check the home page to start your first workout.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            variant="outline"
            onClick={() => {
              setGenerateSuccess(false);
              setPrompt("");
            }}
            className="w-full"
            data-testid="button-create-another"
          >
            Create Another Program
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <Textarea
          placeholder="Describe your fitness goals and preferences..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          className="text-base resize-none"
          data-testid="input-generate-prompt"
        />

        <Button
          onClick={handleGenerateProgram}
          disabled={isLoading || !prompt.trim()}
          className="w-full"
          data-testid="button-generate-program"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating program...
            </>
          ) : (
            <>
              <Dumbbell className="h-4 w-4 mr-2" />
              Generate Program
            </>
          )}
        </Button>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Example prompts:</p>
          <div className="grid gap-2">
            {examplePrompts.generate.map((example, idx) => (
              <Button
                key={idx}
                variant="outline"
                onClick={() => handleExampleClick(example)}
                className="text-left h-auto whitespace-normal p-3 justify-start text-sm hover-elevate"
                data-testid={`button-example-generate-${idx}`}
              >
                <Sparkles className="h-3 w-3 mr-2 flex-shrink-0 text-primary" />
                {example}
              </Button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderComingSoon = (mode: string) => (
    <Card className="bg-muted/50">
      <CardContent className="pt-6 text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-semibold">Coming Soon</h3>
        <p className="text-sm text-muted-foreground" data-testid={`text-${mode}-coming-soon`}>
          Update your preferences and equipment with natural language
        </p>
        <div className="pt-2 space-y-1">
          <p className="text-xs text-muted-foreground">Example prompts:</p>
          {examplePrompts[mode as keyof typeof examplePrompts].slice(0, 2).map((example, idx) => (
            <p key={idx} className="text-xs text-muted-foreground italic">
              "{example}"
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CollapsibleTrigger className="w-full" data-testid="button-toggle-ai-assistant">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <CardTitle className="flex items-center gap-2">
                    AI Training Assistant
                    <Badge variant="secondary" className="text-xs">
                      Beta
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Ask questions, get insights, and manage your program
                  </CardDescription>
                </div>
              </div>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="insights" data-testid="tab-insights">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Insights
                </TabsTrigger>
                <TabsTrigger value="generate" data-testid="tab-generate">
                  <Dumbbell className="h-4 w-4 mr-2" />
                  Generate
                </TabsTrigger>
                <TabsTrigger value="update" data-testid="tab-update">
                  <Settings className="h-4 w-4 mr-2" />
                  Update
                </TabsTrigger>
              </TabsList>

              <TabsContent value="insights" className="mt-0">
                {renderInsightsContent()}
              </TabsContent>

              <TabsContent value="generate" className="mt-0">
                {renderGenerateContent()}
              </TabsContent>

              <TabsContent value="update" className="mt-0">
                {renderComingSoon("update")}
              </TabsContent>
            </Tabs>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
