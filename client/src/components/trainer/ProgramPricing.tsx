import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useProgramBuilder } from "@/contexts/ProgramBuilderContext";

interface ProgramPricingProps {
  onBack: () => void;
  onSave: () => void;
  isSaving: boolean;
}

export default function ProgramPricing({ onBack, onSave, isSaving }: ProgramPricingProps) {
  const { state, dispatch } = useProgramBuilder();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing & Publishing</CardTitle>
        <CardDescription>Set your program price and publish to marketplace</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Label>Pricing Type</Label>
            <RadioGroup
              value={state.pricingType}
              onValueChange={(value: "one_time" | "subscription") =>
                dispatch({ type: "SET_PRICING", payload: { price: state.price, pricingType: value } })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="one_time" id="one_time" data-testid="radio-one-time" />
                <Label htmlFor="one_time" className="font-normal cursor-pointer">
                  One-time Purchase
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="subscription" id="subscription" data-testid="radio-subscription" />
                <Label htmlFor="subscription" className="font-normal cursor-pointer">
                  Monthly Subscription
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">
              Price ({state.pricingType === "subscription" ? "per month" : "one-time"})
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={state.price}
                onChange={(e) =>
                  dispatch({
                    type: "SET_PRICING",
                    payload: { price: parseFloat(e.target.value), pricingType: state.pricingType },
                  })
                }
                className="pl-7"
                data-testid="input-price"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              You'll earn 80% (${(state.price * 0.8).toFixed(2)}) after platform fee
            </p>
          </div>

          <div className="bg-muted p-4 rounded-md space-y-2">
            <h3 className="font-semibold">Program Summary</h3>
            <div className="text-sm space-y-1">
              <p><span className="text-muted-foreground">Name:</span> {state.name}</p>
              <p><span className="text-muted-foreground">Workouts:</span> {state.workouts.length}</p>
              <p><span className="text-muted-foreground">Total Exercises:</span> {state.workouts.reduce((sum, w) => sum + w.exercises.length, 0)}</p>
              <p><span className="text-muted-foreground">Duration:</span> {state.durationWeeks} weeks, {state.daysPerWeek} days/week</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" onClick={onBack} data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button type="submit" disabled={isSaving} data-testid="button-save">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Program
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
