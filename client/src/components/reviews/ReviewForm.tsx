import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

interface ReviewFormProps {
  type: "program" | "trainer";
  targetId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({ type, targetId, onSuccess, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const { toast } = useToast();

  const createReviewMutation = useMutation({
    mutationFn: async (data: { rating: number; reviewText: string }) => {
      const endpoint = type === "program" 
        ? `/api/programs/${targetId}/reviews`
        : `/api/trainers/${targetId}/reviews`;
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: type === "program" 
          ? ["/api/programs", targetId, "reviews"]
          : ["/api/trainers", targetId, "reviews"]
      });
      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });
      setRating(0);
      setReviewText("");
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit review",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating",
        variant: "destructive",
      });
      return;
    }

    createReviewMutation.mutate({ rating, reviewText });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-review">
      <div className="space-y-2">
        <Label>Rating *</Label>
        <div className="flex gap-1" data-testid="rating-stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              data-testid={`star-${star}`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="hover-elevate rounded-sm p-1"
            >
              <Star
                className={`h-6 w-6 ${
                  star <= (hoveredRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-sm text-muted-foreground" data-testid="text-rating-label">
            {rating} {rating === 1 ? "star" : "stars"}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-text">Your Review (Optional)</Label>
        <Textarea
          id="review-text"
          data-testid="textarea-review"
          placeholder="Share your experience..."
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          rows={4}
        />
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            data-testid="button-cancel-review"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={createReviewMutation.isPending}
          data-testid="button-submit-review"
        >
          {createReviewMutation.isPending ? "Submitting..." : "Submit Review"}
        </Button>
      </div>
    </form>
  );
}
