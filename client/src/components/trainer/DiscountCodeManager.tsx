import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Copy, Sparkles, Calendar, Crown, AlertCircle, CheckCircle2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

type DiscountCodeData = {
  activeCode: {
    id: string;
    code: string;
    createdAt: string;
    expiresAt: string;
    redeemedAt: string | null;
    redeemedBy: string | null;
  } | null;
  canGenerate: boolean;
  isPremium: boolean;
  isDowngraded: boolean;
  nextAvailableDate: string | null;
};

export function DiscountCodeManager() {
  const { toast } = useToast();

  const { data, isLoading } = useQuery<DiscountCodeData>({
    queryKey: ["/api/trainer/discount-code"],
  });

  const generateCodeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/trainer/discount-code", "POST", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainer/discount-code"] });
      toast({
        title: "Discount code generated",
        description: "Your new 25% discount code is ready to share",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate discount code",
        variant: "destructive",
      });
    },
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Code copied",
      description: "Discount code copied to clipboard",
    });
  };

  if (isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Loading discount code information...
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-destructive">
          Error loading discount code data
        </CardContent>
      </Card>
    );
  }

  // Show premium upgrade message for free trainers
  if (!data.isPremium) {
    return (
      <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            Premium Feature
          </CardTitle>
          <CardDescription>
            Upgrade to premium to unlock monthly discount codes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              What you get:
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <span>1 discount code per month (25% off)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <span>Single-use codes to attract new clients</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <span>30-day validity period</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <span>Perfect for marketing and promotions</span>
              </li>
            </ul>
          </div>
          <Button className="w-full" data-testid="button-upgrade-for-codes">
            <Crown className="h-4 w-4 mr-2" />
            Upgrade to Premium
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show downgraded message
  if (data.isDowngraded) {
    return (
      <Card className="bg-destructive/10 border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Premium Subscription Required
          </CardTitle>
          <CardDescription>
            Your premium subscription has ended
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Reactivate your premium subscription to continue generating discount codes
          </p>
          <Button className="w-full" data-testid="button-reactivate-premium">
            <Crown className="h-4 w-4 mr-2" />
            Reactivate Premium
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isExpired = data.activeCode && new Date(data.activeCode.expiresAt) < new Date();
  const isRedeemed = data.activeCode?.redeemedAt !== null;

  return (
    <div className="space-y-6">
      {/* Active Code Display */}
      {data.activeCode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Your Discount Code
            </CardTitle>
            <CardDescription>
              25% off any program purchase - Share this code with potential clients
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4 p-4 bg-muted rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <code className="text-2xl font-bold font-mono" data-testid="text-active-code">
                    {data.activeCode.code}
                  </code>
                  {isRedeemed ? (
                    <Badge variant="secondary" data-testid="badge-code-redeemed">Used</Badge>
                  ) : isExpired ? (
                    <Badge variant="destructive" data-testid="badge-code-expired">Expired</Badge>
                  ) : (
                    <Badge variant="default" className="bg-green-600 hover:bg-green-700" data-testid="badge-code-active">Active</Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {isExpired 
                        ? `Expired ${format(new Date(data.activeCode.expiresAt), "MMM d, yyyy")}`
                        : `Expires ${format(new Date(data.activeCode.expiresAt), "MMM d, yyyy")} (${formatDistanceToNow(new Date(data.activeCode.expiresAt), { addSuffix: true })})`
                      }
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => copyCode(data.activeCode!.code)}
                disabled={isExpired || isRedeemed}
                data-testid="button-copy-code"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Code
              </Button>
            </div>

            {isRedeemed && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4 inline mr-1" />
                  Code redeemed on {format(new Date(data.activeCode.redeemedAt!), "MMM d, yyyy")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Generate New Code Section */}
      <Card>
        <CardHeader>
          <CardTitle>Generate New Discount Code</CardTitle>
          <CardDescription>
            Premium trainers can generate one 25% discount code every 30 days
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!data.canGenerate && data.nextAvailableDate && (
            <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <p className="text-sm text-orange-700 dark:text-orange-400">
                <Calendar className="h-4 w-4 inline mr-1" />
                Next code available on {format(new Date(data.nextAvailableDate), "MMM d, yyyy")}
              </p>
            </div>
          )}

          {!data.canGenerate && !data.nextAvailableDate && data.activeCode && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                You already have an active code. Wait until it expires or is redeemed to generate a new one.
              </p>
            </div>
          )}

          <Button
            onClick={() => generateCodeMutation.mutate()}
            disabled={!data.canGenerate || generateCodeMutation.isPending}
            className="w-full"
            data-testid="button-generate-code"
          >
            {generateCodeMutation.isPending ? "Generating..." : "Generate New Code"}
          </Button>

          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">How it works:</h4>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Each code provides 25% off any program purchase</li>
              <li>• Codes are valid for 30 days from creation</li>
              <li>• Single-use only (automatically marked as used after redemption)</li>
              <li>• Generate a new code every 30 days</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
