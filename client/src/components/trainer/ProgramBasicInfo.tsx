import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProgramBuilder } from "@/contexts/ProgramBuilderContext";

interface ProgramBasicInfoProps {
  onNext: () => void;
}

export default function ProgramBasicInfo({ onNext }: ProgramBasicInfoProps) {
  const { state, dispatch } = useProgramBuilder();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.name) return;
    onNext();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Program Information</CardTitle>
        <CardDescription>Set up the foundation of your training program</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Program Name *</Label>
            <Input
              id="name"
              value={state.name}
              onChange={(e) => dispatch({ type: "SET_BASIC_INFO", payload: { name: e.target.value } })}
              placeholder="e.g., 8-Week Strength Builder"
              required
              data-testid="input-program-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={state.description || ""}
              onChange={(e) => dispatch({ type: "SET_BASIC_INFO", payload: { description: e.target.value || null } })}
              placeholder="Describe your program's goals and approach..."
              rows={4}
              data-testid="input-program-description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select
                value={state.difficulty}
                onValueChange={(value: "beginner" | "intermediate" | "advanced") =>
                  dispatch({ type: "SET_BASIC_INFO", payload: { difficulty: value } })
                }
              >
                <SelectTrigger id="difficulty" data-testid="select-difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (Weeks)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="52"
                value={state.durationWeeks}
                onChange={(e) => dispatch({ type: "SET_BASIC_INFO", payload: { durationWeeks: parseInt(e.target.value) } })}
                data-testid="input-duration"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="daysPerWeek">Days per Week</Label>
              <Input
                id="daysPerWeek"
                type="number"
                min="1"
                max="7"
                value={state.daysPerWeek}
                onChange={(e) => dispatch({ type: "SET_BASIC_INFO", payload: { daysPerWeek: parseInt(e.target.value) } })}
                data-testid="input-days-per-week"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={!state.name} data-testid="button-next">
              Next: Build Workouts
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
