import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertTrainerCustomExerciseSchema, type InsertTrainerCustomExercise, type TrainerCustomExercise } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Info } from "lucide-react";
import { 
  MOVEMENT_PATTERNS, 
  DIFFICULTY_LEVELS, 
  EQUIPMENT_TYPES, 
  MUSCLE_GROUPS,
  EXERCISE_CATEGORIES,
  TRACKING_TYPES 
} from "@shared/constants";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

interface CustomExerciseDrawerProps {
  open: boolean;
  onClose: () => void;
  onSave: (exercise: InsertTrainerCustomExercise) => Promise<void>;
  trainerId: string;
  editingExercise?: TrainerCustomExercise | null;
}

// Form data type with boolean isScalable and array validation
type CustomExerciseFormData = Omit<InsertTrainerCustomExercise, 'isScalable'> & {
  isScalable: boolean;
};

export function CustomExerciseDrawer({
  open,
  onClose,
  onSave,
  trainerId,
  editingExercise
}: CustomExerciseDrawerProps) {
  const [videoPreviewOpen, setVideoPreviewOpen] = useState(false);

  const form = useForm<CustomExerciseFormData>({
    resolver: zodResolver(insertTrainerCustomExerciseSchema.extend({
      isScalable: z.boolean(),
      primaryMuscles: z.array(z.string()).min(1, "Select at least one primary muscle"),
      equipment: z.array(z.string()).min(1, "Select at least one equipment type"),
    })),
    defaultValues: editingExercise ? {
      trainerId: editingExercise.trainerId,
      name: editingExercise.name,
      description: editingExercise.description ?? undefined,
      videoUrl: editingExercise.videoUrl ?? undefined,
      movementPattern: editingExercise.movementPattern as any,
      equipment: editingExercise.equipment,
      difficulty: editingExercise.difficulty as any,
      primaryMuscles: editingExercise.primaryMuscles,
      secondaryMuscles: editingExercise.secondaryMuscles ?? [],
      exerciseCategory: editingExercise.exerciseCategory as any,
      trackingType: editingExercise.trackingType as any,
      recommendedTempo: editingExercise.recommendedTempo ?? undefined,
      formTips: editingExercise.formTips ?? [],
      isScalable: editingExercise.isScalable === 1,
    } : {
      trainerId,
      name: "",
      description: undefined,
      videoUrl: undefined,
      movementPattern: "horizontal_push" as const,
      equipment: [],
      difficulty: "intermediate" as const,
      primaryMuscles: [],
      secondaryMuscles: [],
      exerciseCategory: "compound" as const,
      trackingType: "reps" as const,
      recommendedTempo: undefined,
      formTips: [],
      isScalable: true,
    },
  });

  const { fields: formTipFields, append: appendFormTip, remove: removeFormTip } = useFieldArray({
    control: form.control,
    name: "formTips" as any,
  });

  // Reset form when editingExercise changes or drawer opens
  useEffect(() => {
    if (open && editingExercise) {
      form.reset({
        trainerId: editingExercise.trainerId,
        name: editingExercise.name,
        description: editingExercise.description ?? undefined,
        videoUrl: editingExercise.videoUrl ?? undefined,
        movementPattern: editingExercise.movementPattern,
        equipment: editingExercise.equipment,
        difficulty: editingExercise.difficulty as "beginner" | "intermediate" | "advanced",
        primaryMuscles: editingExercise.primaryMuscles,
        secondaryMuscles: editingExercise.secondaryMuscles ?? [],
        exerciseCategory: editingExercise.exerciseCategory as "warmup" | "power" | "compound" | "isolation" | "core" | "cardio",
        trackingType: editingExercise.trackingType as "reps" | "duration" | "both",
        recommendedTempo: editingExercise.recommendedTempo ?? undefined,
        formTips: editingExercise.formTips ?? [],
        isScalable: editingExercise.isScalable === 1,
      });
    } else if (open && !editingExercise) {
      // Reset to default values when creating new exercise
      form.reset({
        trainerId,
        name: "",
        description: undefined,
        videoUrl: undefined,
        movementPattern: "horizontal_push" as const,
        equipment: [],
        difficulty: "intermediate" as const,
        primaryMuscles: [],
        secondaryMuscles: [],
        exerciseCategory: "compound" as const,
        trackingType: "reps" as const,
        recommendedTempo: undefined,
        formTips: [],
        isScalable: true,
      });
    }
  }, [open, editingExercise, trainerId, form]);

  const handleSubmit = async (data: CustomExerciseFormData) => {
    try {
      const submissionData: InsertTrainerCustomExercise = {
        ...data,
        isScalable: data.isScalable ? 1 : 0,
      };
      await onSave(submissionData);
      form.reset();
      onClose();
    } catch (error) {
      // Keep drawer open on error - error toast is shown by parent component
      console.error("Failed to save exercise:", error);
    }
  };

  const videoUrl = form.watch("videoUrl");

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-2xl w-full overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle data-testid="heading-custom-exercise">
            {editingExercise ? "Edit Custom Exercise" : "Create Custom Exercise"}
          </SheetTitle>
          <SheetDescription>
            Design a custom exercise for your training programs. All fields help ensure proper execution and progression.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
              
              {/* SECTION 1: Basics */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">Basics</h3>
                  <Separator className="flex-1" />
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exercise Name*</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Single-Arm Landmine Press" 
                          {...field} 
                          data-testid="input-exercise-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief overview of the exercise and its benefits..."
                          {...field}
                          value={field.value || ""}
                          data-testid="input-exercise-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="videoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video URL</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Input
                            type="url"
                            placeholder="https://youtube.com/..."
                            {...field}
                            value={field.value || ""}
                            data-testid="input-video-url"
                          />
                          {videoUrl && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setVideoPreviewOpen(!videoPreviewOpen)}
                              data-testid="button-toggle-video-preview"
                            >
                              {videoPreviewOpen ? "Hide" : "Show"} Preview
                            </Button>
                          )}
                          {videoPreviewOpen && videoUrl && (
                            <div className="aspect-video w-full bg-muted rounded-md flex items-center justify-center">
                              <p className="text-sm text-muted-foreground">Video preview: {videoUrl}</p>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        YouTube, Vimeo, or direct video link demonstrating proper form
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* SECTION 2: Muscles & Movement */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">Muscles & Movement</h3>
                  <Separator className="flex-1" />
                </div>

                <FormField
                  control={form.control}
                  name="movementPattern"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Movement Pattern*</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-movement-pattern">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MOVEMENT_PATTERNS.map((pattern) => (
                            <SelectItem key={pattern} value={pattern}>
                              {pattern.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="primaryMuscles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Muscles*</FormLabel>
                      <FormDescription>Main muscles worked (select 1-3)</FormDescription>
                      <div className="border rounded-md p-4 space-y-2 max-h-48 overflow-y-auto">
                        {MUSCLE_GROUPS.map((muscle) => (
                          <div key={muscle} className="flex items-center space-x-2">
                            <Checkbox
                              checked={field.value?.includes(muscle)}
                              onCheckedChange={(checked) => {
                                const current = field.value || [];
                                if (checked) {
                                  field.onChange([...current, muscle]);
                                } else {
                                  field.onChange(current.filter((m: string) => m !== muscle));
                                }
                              }}
                              data-testid={`checkbox-primary-muscle-${muscle}`}
                            />
                            <label className="text-sm capitalize">
                              {muscle.replace(/_/g, ' ')}
                            </label>
                          </div>
                        ))}
                      </div>
                      {field.value && field.value.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {field.value.map((muscle: string) => (
                            <Badge key={muscle} variant="secondary" className="text-xs">
                              {muscle.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="secondaryMuscles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secondary Muscles</FormLabel>
                      <FormDescription>Supporting muscles involved</FormDescription>
                      <div className="border rounded-md p-4 space-y-2 max-h-48 overflow-y-auto">
                        {MUSCLE_GROUPS.map((muscle) => (
                          <div key={muscle} className="flex items-center space-x-2">
                            <Checkbox
                              checked={field.value?.includes(muscle)}
                              onCheckedChange={(checked) => {
                                const current = field.value || [];
                                if (checked) {
                                  field.onChange([...current, muscle]);
                                } else {
                                  field.onChange(current.filter((m: string) => m !== muscle));
                                }
                              }}
                              data-testid={`checkbox-secondary-muscle-${muscle}`}
                            />
                            <label className="text-sm capitalize">
                              {muscle.replace(/_/g, ' ')}
                            </label>
                          </div>
                        ))}
                      </div>
                      {field.value && field.value.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {field.value.map((muscle: string) => (
                            <Badge key={muscle} variant="outline" className="text-xs">
                              {muscle.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* SECTION 3: Programming Parameters */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">Programming Parameters</h3>
                  <Separator className="flex-1" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="difficulty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Difficulty*</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-difficulty">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DIFFICULTY_LEVELS.map((level) => (
                              <SelectItem key={level} value={level}>
                                {level.charAt(0).toUpperCase() + level.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="exerciseCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category*</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {EXERCISE_CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="equipment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Equipment Required*</FormLabel>
                      <FormDescription>Select all equipment needed</FormDescription>
                      <div className="border rounded-md p-4 space-y-2 max-h-48 overflow-y-auto">
                        {EQUIPMENT_TYPES.map((equip) => (
                          <div key={equip} className="flex items-center space-x-2">
                            <Checkbox
                              checked={field.value?.includes(equip)}
                              onCheckedChange={(checked) => {
                                const current = field.value || [];
                                if (checked) {
                                  field.onChange([...current, equip]);
                                } else {
                                  field.onChange(current.filter((e: string) => e !== equip));
                                }
                              }}
                              data-testid={`checkbox-equipment-${equip}`}
                            />
                            <label className="text-sm capitalize">
                              {equip.replace(/_/g, ' ')}
                            </label>
                          </div>
                        ))}
                      </div>
                      {field.value && field.value.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {field.value.map((equip: string) => (
                            <Badge key={equip} variant="secondary" className="text-xs">
                              {equip.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="trackingType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tracking Type*</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-tracking-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TRACKING_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs">
                          How this exercise is measured
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recommendedTempo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tempo</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., 3-0-1-0"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-tempo"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Ecc-Pause-Con-Pause (seconds)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="isScalable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-scalable"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Progressive Overload Capable
                        </FormLabel>
                        <FormDescription>
                          Can this exercise be loaded progressively (weight, resistance, complexity)?
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* SECTION 4: Coaching Notes */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">Coaching Notes</h3>
                  <Separator className="flex-1" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <FormLabel>Form Tips (Max 5)</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendFormTip("")}
                      disabled={formTipFields.length >= 5}
                      data-testid="button-add-form-tip"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Tip
                    </Button>
                  </div>
                  <FormDescription>
                    Key coaching cues for proper execution
                  </FormDescription>

                  {formTipFields.length === 0 && (
                    <div className="border-2 border-dashed rounded-md p-8 text-center">
                      <Info className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        No form tips added yet. Click "Add Tip" to start.
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {formTipFields.map((field, index) => (
                      <FormField
                        key={field.id}
                        control={form.control}
                        name={`formTips.${index}`}
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input
                                  placeholder={`Tip ${index + 1}: e.g., Keep core engaged throughout`}
                                  {...field}
                                  data-testid={`input-form-tip-${index}`}
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeFormTip(index)}
                                data-testid={`button-remove-form-tip-${index}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button type="submit" data-testid="button-save-exercise">
                  {editingExercise ? "Update Exercise" : "Create Exercise"}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
