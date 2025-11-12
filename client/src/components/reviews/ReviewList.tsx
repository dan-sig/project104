import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

interface Review {
  id: string;
  rating: number;
  reviewText?: string | null;
  createdAt: string | Date;
  userId?: string;
  clientId?: string;
}

interface ReviewListProps {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" data-testid="review-star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );
}

export function ReviewList({ reviews, averageRating, totalReviews }: ReviewListProps) {
  if (totalReviews === 0) {
    return (
      <div className="text-center py-8" data-testid="text-no-reviews">
        <p className="text-muted-foreground">No reviews yet</p>
        <p className="text-sm text-muted-foreground mt-2">
          Be the first to leave a review!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-3" data-testid="container-review-summary">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold" data-testid="text-average-rating">
              {averageRating.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">out of 5</span>
          </div>
          <StarRating rating={Math.round(averageRating)} />
        </div>
        <div className="h-12 w-px bg-border" />
        <div>
          <p className="text-sm text-muted-foreground" data-testid="text-total-reviews">
            {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
          </p>
        </div>
      </div>

      {/* Reviews */}
      <div className="space-y-3">
        {reviews.map((review) => (
          <Card key={review.id} data-testid={`card-review-${review.id}`}>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <StarRating rating={review.rating} />
                  <span className="text-xs text-muted-foreground" data-testid="text-review-date">
                    {formatDistanceToNow(new Date(review.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                {review.reviewText && (
                  <p className="text-sm" data-testid="text-review-content">
                    {review.reviewText}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
