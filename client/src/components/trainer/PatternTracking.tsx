import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import type { MovementPattern } from "@shared/constants";
import {
  computeWeekPatterns,
  computeProgramPatterns,
  getPatternDisplayName,
  getPatternColor,
  type PatternCoverage,
} from "@shared/movementPatternTracker";
import type { Workout } from "@/contexts/ProgramBuilderContext";

interface WeekPatternGridProps {
  weekNumber: number;
  workouts: Workout[];
  allExercises: any[];
}

export function WeekPatternGrid({ weekNumber, workouts, allExercises }: WeekPatternGridProps) {
  const weekWorkouts = workouts.filter(w => w.weekNumber === weekNumber);
  const patterns = computeWeekPatterns(weekWorkouts, allExercises);
  
  return (
    <Card data-testid={`week-pattern-grid-${weekNumber}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Week {weekNumber} Pattern Coverage</CardTitle>
        <CardDescription className="text-sm">
          {patterns.size} of 10 movement patterns covered
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1">
          {Array.from(patterns).map((pattern) => (
            <Badge
              key={pattern}
              className={`text-xs ${getPatternColor(pattern)} text-white`}
              data-testid={`week-pattern-${pattern}-${weekNumber}`}
            >
              {getPatternDisplayName(pattern)}
            </Badge>
          ))}
          {patterns.size === 0 && (
            <p className="text-sm text-muted-foreground">No patterns detected yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ProgramPatternTrackerProps {
  workouts: Workout[];
  allExercises: any[];
}

export function ProgramPatternTracker({ workouts, allExercises }: ProgramPatternTrackerProps) {
  const patternCoverage = computeProgramPatterns(workouts, allExercises);
  const coveredCount = patternCoverage.filter(p => p.isCovered).length;
  const totalPatterns = patternCoverage.length;
  const coveragePercent = totalPatterns > 0 ? Math.round((coveredCount / totalPatterns) * 100) : 0;
  
  return (
    <Card data-testid="program-pattern-tracker">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Program Movement Pattern Coverage</span>
          <Badge variant="outline" className="text-sm" data-testid="coverage-percentage">
            {coveragePercent}% Complete
          </Badge>
        </CardTitle>
        <CardDescription>
          Training {coveredCount} of {totalPatterns} functional movement patterns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {patternCoverage.map((pattern) => (
            <div
              key={pattern.pattern}
              className={`flex items-center gap-3 p-3 rounded-md border ${
                pattern.isCovered
                  ? "bg-card border-border"
                  : "bg-muted/30 border-muted"
              }`}
              data-testid={`pattern-coverage-${pattern.pattern}`}
            >
              <div className={`flex-shrink-0 ${
                pattern.isCovered ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
              }`}>
                {pattern.isCovered ? (
                  <Check className="h-5 w-5" data-testid={`check-${pattern.pattern}`} />
                ) : (
                  <X className="h-5 w-5" data-testid={`x-${pattern.pattern}`} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${
                  pattern.isCovered ? "" : "text-muted-foreground"
                }`}>
                  {getPatternDisplayName(pattern.pattern)}
                </p>
                {pattern.isCovered && (
                  <p className="text-xs text-muted-foreground" data-testid={`sets-count-${pattern.pattern}`}>
                    {pattern.exerciseCount} total sets
                  </p>
                )}
              </div>
              {pattern.isCovered && (
                <Badge
                  className={`text-xs ${getPatternColor(pattern.pattern)} text-white flex-shrink-0`}
                  data-testid={`badge-${pattern.pattern}`}
                >
                  Active
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
