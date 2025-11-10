import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { MockExercise } from '@/data/trainerMockData';

interface ExerciseEditorDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercise: MockExercise | null;
  workoutName: string;
  onSave: (updates: Partial<MockExercise>) => void;
}

const EXERCISE_ALTERNATIVES = [
  'Barbell Back Squat',
  'Front Squat',
  'Goblet Squat',
  'Romanian Deadlift',
  'Conventional Deadlift',
  'Sumo Deadlift',
  'Overhead Press',
  'Push Press',
  'Dumbbell Press',
  'Bench Press',
  'Incline Bench Press',
  'Dumbbell Bench Press',
  'Pull-ups',
  'Chin-ups',
  'Lat Pulldown',
  'Barbell Row',
  'Dumbbell Row',
  'Cable Row',
  'Leg Press',
  'Bulgarian Split Squat',
  'Walking Lunges',
  'Leg Curl',
  'Leg Extension',
  'Face Pulls',
  'Lateral Raises',
  'Cable Flyes',
];

export function ExerciseEditorDrawer({
  open,
  onOpenChange,
  exercise,
  workoutName,
  onSave,
}: ExerciseEditorDrawerProps) {
  const [formData, setFormData] = useState({
    name: '',
    sets: 3,
    reps: '8-10',
    weight: '0 lbs',
    tempo: '2-0-2-0',
    rpe: 7,
    rir: 3,
    restSeconds: 90,
  });

  useEffect(() => {
    if (exercise) {
      setFormData({
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        weight: exercise.weight,
        tempo: exercise.tempo || '2-0-2-0',
        rpe: exercise.rpe || 7,
        rir: exercise.rir || 3,
        restSeconds: exercise.restSeconds,
      });
    }
  }, [exercise]);

  const handleSave = () => {
    const updates: Partial<MockExercise> = {};
    
    if (exercise) {
      if (formData.name !== exercise.name) updates.name = formData.name;
      if (formData.sets !== exercise.sets) updates.sets = formData.sets;
      if (formData.reps !== exercise.reps) updates.reps = formData.reps;
      if (formData.weight !== exercise.weight) updates.weight = formData.weight;
      if (formData.tempo !== (exercise.tempo || '2-0-2-0')) updates.tempo = formData.tempo;
      if (formData.rpe !== (exercise.rpe || 7)) updates.rpe = formData.rpe;
      if (formData.rir !== (exercise.rir || 3)) updates.rir = formData.rir;
      if (formData.restSeconds !== exercise.restSeconds) updates.restSeconds = formData.restSeconds;

      if (Object.keys(updates).length > 0) {
        onSave(updates);
        onOpenChange(false);
      }
    }
  };

  const hasChanges = exercise && (
    formData.name !== exercise.name ||
    formData.sets !== exercise.sets ||
    formData.reps !== exercise.reps ||
    formData.weight !== exercise.weight ||
    formData.tempo !== (exercise.tempo || '2-0-2-0') ||
    formData.rpe !== (exercise.rpe || 7) ||
    formData.rir !== (exercise.rir || 3) ||
    formData.restSeconds !== exercise.restSeconds
  );

  if (!exercise) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto" data-testid="drawer-exercise-editor">
        <SheetHeader>
          <SheetTitle>Edit Exercise</SheetTitle>
          <SheetDescription>
            Modify parameters for this exercise in {workoutName}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="exercise-name">Exercise</Label>
            <Select value={formData.name} onValueChange={(value) => setFormData({ ...formData, name: value })}>
              <SelectTrigger id="exercise-name" data-testid="select-exercise-name">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXERCISE_ALTERNATIVES.map((ex) => (
                  <SelectItem key={ex} value={ex}>{ex}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.name !== exercise.name && (
              <Badge variant="outline" className="text-xs">
                Changed from: {exercise.name}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sets">Sets</Label>
              <Input
                id="sets"
                type="number"
                min="1"
                max="10"
                value={formData.sets}
                onChange={(e) => setFormData({ ...formData, sets: parseInt(e.target.value) || 1 })}
                data-testid="input-sets"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reps">Reps</Label>
              <Input
                id="reps"
                placeholder="e.g., 8-10"
                value={formData.reps}
                onChange={(e) => setFormData({ ...formData, reps: e.target.value })}
                data-testid="input-reps"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight">Weight</Label>
            <Input
              id="weight"
              placeholder="e.g., 135 lbs"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              data-testid="input-weight"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tempo">Tempo</Label>
            <Input
              id="tempo"
              placeholder="e.g., 2-0-2-0"
              value={formData.tempo}
              onChange={(e) => setFormData({ ...formData, tempo: e.target.value })}
              data-testid="input-tempo"
            />
            <p className="text-xs text-muted-foreground">
              Format: Eccentric-Pause-Concentric-Pause (seconds)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rpe">RPE (Rate of Perceived Exertion)</Label>
              <Input
                id="rpe"
                type="number"
                min="1"
                max="10"
                step="0.5"
                value={formData.rpe}
                onChange={(e) => setFormData({ ...formData, rpe: parseFloat(e.target.value) || 7 })}
                data-testid="input-rpe"
              />
              <p className="text-xs text-muted-foreground">Scale: 1-10</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rir">RIR (Reps in Reserve)</Label>
              <Input
                id="rir"
                type="number"
                min="0"
                max="5"
                value={formData.rir}
                onChange={(e) => setFormData({ ...formData, rir: parseInt(e.target.value) || 0 })}
                data-testid="input-rir"
              />
              <p className="text-xs text-muted-foreground">Reps left in tank</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rest">Rest Period (seconds)</Label>
            <Input
              id="rest"
              type="number"
              min="30"
              max="300"
              step="15"
              value={formData.restSeconds}
              onChange={(e) => setFormData({ ...formData, restSeconds: parseInt(e.target.value) || 60 })}
              data-testid="input-rest"
            />
            <p className="text-xs text-muted-foreground">
              {Math.floor(formData.restSeconds / 60)}:{(formData.restSeconds % 60).toString().padStart(2, '0')} minutes
            </p>
          </div>
        </div>

        <SheetFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-exercise-edit"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            data-testid="button-save-exercise"
          >
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
