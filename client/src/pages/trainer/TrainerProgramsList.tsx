import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  Edit, 
  Trash2, 
  Copy, 
  Plus,
  DollarSign,
  Calendar,
  Dumbbell,
  Clock,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import type { TrainerProgram } from "@shared/schema";

export default function TrainerProgramsList() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [unpublishDialogOpen, setUnpublishDialogOpen] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);

  // Fetch programs
  const { data: programs, isLoading } = useQuery<TrainerProgram[]>({
    queryKey: ["/api/trainer/programs"],
  });

  // Toggle publish mutation
  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, isPublished }: { id: string; isPublished: number }) => {
      return apiRequest(`/api/trainer/programs/${id}`, "PATCH", { isPublished });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainer/programs"] });
      toast({
        title: "Success",
        description: "Program updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update program",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/trainer/programs/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainer/programs"] });
      toast({
        title: "Success",
        description: "Program deleted successfully",
      });
      setDeleteDialogOpen(false);
      setSelectedProgramId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete program",
        variant: "destructive",
      });
    },
  });

  const handlePublishToggle = (program: TrainerProgram) => {
    // If unpublishing, show confirmation dialog
    if (program.isPublished) {
      setSelectedProgramId(program.id);
      setUnpublishDialogOpen(true);
      return;
    }

    // If publishing, validate first (client-side check)
    if (!program.price || program.price <= 0) {
      toast({
        title: "Cannot Publish",
        description: "Please set a price before publishing this program",
        variant: "destructive",
      });
      return;
    }

    // Publish the program
    togglePublishMutation.mutate({ id: program.id, isPublished: 1 });
  };

  const confirmUnpublish = () => {
    if (selectedProgramId) {
      togglePublishMutation.mutate({ id: selectedProgramId, isPublished: 0 });
      setUnpublishDialogOpen(false);
      setSelectedProgramId(null);
    }
  };

  const handleDelete = (id: string) => {
    setSelectedProgramId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedProgramId) {
      deleteMutation.mutate(selectedProgramId);
    }
  };

  const copyShareableLink = (slug: string) => {
    const link = `${window.location.origin}/programs/buy/${slug}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copied",
      description: "Shareable link copied to clipboard",
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading programs...</p>
          </div>
        </div>
      </div>
    );
  }

  const hasPrograms = programs && programs.length > 0;

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Programs</h1>
          <p className="text-muted-foreground mt-1">
            Manage your training programs and share them with clients
          </p>
        </div>
        <Button onClick={() => setLocation("/trainer/programs/new")} data-testid="button-create-program">
          <Plus className="h-4 w-4 mr-2" />
          Create Program
        </Button>
      </div>

      {!hasPrograms ? (
        <Card className="p-12">
          <div className="text-center">
            <Dumbbell className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Programs Yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first training program to start selling to clients
            </p>
            <Button onClick={() => setLocation("/trainer/programs/new")} data-testid="button-create-first-program">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Program
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((program, index) => (
            <Card key={program.id} className="p-6" data-testid={`card-program-${index}`}>
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1" data-testid={`text-program-name-${index}`}>
                      {program.name}
                    </h3>
                    <Badge variant={program.difficulty === "beginner" ? "secondary" : program.difficulty === "advanced" ? "default" : "outline"}>
                      {program.difficulty}
                    </Badge>
                  </div>
                  <Switch
                    checked={!!program.isPublished}
                    onCheckedChange={() => handlePublishToggle(program)}
                    data-testid={`switch-publish-${index}`}
                  />
                </div>

                {/* Description */}
                {program.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {program.description}
                  </p>
                )}

                {/* Stats */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {program.durationWeeks} weeks • {program.daysPerWeek} days/week
                    </span>
                  </div>
                  {(program as any).avg_duration > 0 && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {(program as any).avg_duration} min avg • {(program as any).workout_count} workouts
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold" data-testid={`text-program-price-${index}`}>
                      ${program.price || 0}
                    </span>
                    <span className="text-muted-foreground">
                      {program.pricingType === "subscription" ? "/ month" : "one-time"}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  {program.isPublished ? (
                    <Badge variant="default" className="bg-green-600" data-testid={`badge-published-${index}`}>
                      Published
                    </Badge>
                  ) : (
                    <Badge variant="secondary" data-testid={`badge-draft-${index}`}>
                      Draft
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  {program.isPublished && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyShareableLink(program.slug)}
                      data-testid={`button-copy-link-${index}`}
                    >
                      <Copy className="h-3 w-3 mr-2" />
                      Copy Link
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setLocation(`/trainer/programs/${program.id}/edit`)}
                    data-testid={`button-edit-${index}`}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(program.id)}
                    data-testid={`button-delete-${index}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Program</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this program? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unpublish Confirmation Dialog */}
      <AlertDialog open={unpublishDialogOpen} onOpenChange={setUnpublishDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unpublish Program</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unpublish this program? Clients will no longer be able to purchase it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-unpublish">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUnpublish} data-testid="button-confirm-unpublish">
              Unpublish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
