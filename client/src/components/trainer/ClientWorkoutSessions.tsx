import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, CheckCircle2, Circle, ChevronRight, ChevronDown, Save } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { WorkoutSession } from "@shared/schema";

interface ClientWorkoutSessionsProps {
  clientId: string;
}

export function ClientWorkoutSessions({ clientId }: ClientWorkoutSessionsProps) {
  const { toast } = useToast();
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<{
    sessionId: string;
    preSessionNotes: string;
    postSessionReview: string;
  } | null>(null);

  // Fetch client's workout sessions
  const { data: sessions = [], isLoading } = useQuery<WorkoutSession[]>({
    queryKey: ['/api/trainer/clients', clientId, 'sessions'],
    enabled: !!clientId,
  });

  // Mutation to update trainer notes
  const updateNotesMutation = useMutation({
    mutationFn: async ({ sessionId, notes }: { sessionId: string; notes: { trainerPreSessionNotes?: string; trainerPostSessionReview?: string } }) => {
      return await apiRequest('PATCH', `/api/workout-sessions/${sessionId}`, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trainer/clients', clientId, 'sessions'] });
      toast({
        title: "Notes saved",
        description: "Trainer notes have been updated successfully",
      });
      setEditingNotes(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error saving notes",
        description: error.message || "Failed to save trainer notes",
        variant: "destructive",
      });
    },
  });

  const toggleSessionExpanded = (sessionId: string) => {
    if (expandedSessionId === sessionId) {
      setExpandedSessionId(null);
      setEditingNotes(null);
    } else {
      setExpandedSessionId(sessionId);
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        setEditingNotes({
          sessionId,
          preSessionNotes: session.trainerPreSessionNotes || '',
          postSessionReview: session.trainerPostSessionReview || '',
        });
      }
    }
  };

  const handleSaveNotes = () => {
    if (!editingNotes) return;

    const { sessionId, preSessionNotes, postSessionReview } = editingNotes;
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    // Only send fields that changed or need to be cleared
    const updates: { trainerPreSessionNotes?: string; trainerPostSessionReview?: string } = {};
    
    if (preSessionNotes !== (session.trainerPreSessionNotes || '')) {
      updates.trainerPreSessionNotes = preSessionNotes;
    }
    
    if (postSessionReview !== (session.trainerPostSessionReview || '')) {
      updates.trainerPostSessionReview = postSessionReview;
    }

    // Only send request if there are changes
    if (Object.keys(updates).length > 0) {
      updateNotesMutation.mutate({ sessionId, notes: updates });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Loading workout sessions...</p>
        </CardContent>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">No workout sessions found for this client</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Workout Sessions</h2>
        <p className="text-muted-foreground">Add pre-session guidance and post-session reviews</p>
      </div>

      <div className="grid gap-4">
        {sessions.map((session) => {
          const isExpanded = expandedSessionId === session.id;
          const isCompleted = session.status === 'completed';
          const scheduledDate = session.scheduledDate ? new Date(session.scheduledDate) : new Date(session.sessionDate);
          
          return (
            <Card
              key={session.id}
              data-testid={`card-session-${session.id}`}
            >
              <CardHeader
                className="cursor-pointer hover-elevate"
                onClick={() => toggleSessionExpanded(session.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isCompleted ? (
                      <CheckCircle2 className="h-6 w-6 text-success" />
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground" />
                    )}
                    <div>
                      <CardTitle>{session.workoutName || 'Workout Session'}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {scheduledDate.toLocaleDateString()} - {
                            isCompleted
                              ? `Completed ${formatDistanceToNow(scheduledDate, { addSuffix: true })}`
                              : 'Scheduled'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <Badge variant={isCompleted ? 'default' : 'outline'}>
                        {session.sessionType}
                      </Badge>
                      {session.durationMinutes && (
                        <p className="text-sm text-muted-foreground mt-1">{session.durationMinutes} min</p>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {isExpanded && editingNotes?.sessionId === session.id && (
                <CardContent className="space-y-4">
                  {/* Client notes (read-only) */}
                  {session.notes && (
                    <div className="bg-muted/50 p-3 rounded-md">
                      <p className="text-sm font-medium mb-1">Client Notes:</p>
                      <p className="text-sm text-muted-foreground">{session.notes}</p>
                    </div>
                  )}

                  {/* Pre-session notes (for upcoming or any workout) */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Pre-Session Notes {!isCompleted && <span className="text-muted-foreground">(Guidance for upcoming workout)</span>}
                    </label>
                    <Textarea
                      value={editingNotes.preSessionNotes}
                      onChange={(e) => setEditingNotes({
                        ...editingNotes,
                        preSessionNotes: e.target.value,
                      })}
                      placeholder="Add guidance, focus areas, or modifications for this workout..."
                      className="min-h-[100px]"
                      data-testid={`textarea-pre-session-notes-${session.id}`}
                    />
                  </div>

                  {/* Post-session review (for completed workouts) */}
                  {isCompleted && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Post-Session Review <span className="text-muted-foreground">(Feedback on completed workout)</span>
                      </label>
                      <Textarea
                        value={editingNotes.postSessionReview}
                        onChange={(e) => setEditingNotes({
                          ...editingNotes,
                          postSessionReview: e.target.value,
                        })}
                        placeholder="Add feedback, observations, or recommendations based on performance..."
                        className="min-h-[100px]"
                        data-testid={`textarea-post-session-review-${session.id}`}
                      />
                    </div>
                  )}

                  {/* Save button */}
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveNotes}
                      disabled={updateNotesMutation.isPending}
                      data-testid={`button-save-notes-${session.id}`}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateNotesMutation.isPending ? 'Saving...' : 'Save Notes'}
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
