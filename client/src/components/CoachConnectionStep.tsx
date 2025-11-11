import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Briefcase, Loader2, ChevronLeft } from "lucide-react";

interface CoachConnectionStepProps {
  onComplete: (trainerUsername?: string) => void;
  onBack: () => void;
}

export default function CoachConnectionStep({ onComplete, onBack }: CoachConnectionStepProps) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const handleConnect = async () => {
    if (!username.trim()) {
      setError("Please enter a trainer username");
      return;
    }

    setIsValidating(true);
    setError("");

    try {
      const response = await fetch(`/api/trainer/username/check?username=${encodeURIComponent(username.trim())}`);
      const data = await response.json();

      if (!data.available) {
        onComplete(username.trim());
      } else {
        setError("Trainer not found. Please check the username and try again.");
        setIsValidating(false);
      }
    } catch (err) {
      setError("Failed to validate trainer. Please try again.");
      setIsValidating(false);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-4"
        data-testid="button-back"
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Briefcase className="h-8 w-8 text-primary" />
          <h2 className="text-3xl font-bold">Connect with a Coach</h2>
        </div>
        <p className="text-muted-foreground">
          Do you have a personal trainer? Connect with them to get personalized guidance.
        </p>
      </div>

      <Card className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="trainer-username">Trainer Username (Optional)</Label>
            <Input
              id="trainer-username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              placeholder="alexmartinez"
              data-testid="input-trainer-username"
              onKeyDown={(e) => {
                if (e.key === "Enter" && username.trim()) {
                  handleConnect();
                }
              }}
            />
            <p className="text-sm text-muted-foreground">
              Enter your trainer's username if they invited you to Morphit
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600" data-testid="text-error">
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleSkip}
            className="flex-1"
            data-testid="button-skip-coach"
          >
            Skip for Now
          </Button>
          <Button
            onClick={handleConnect}
            disabled={isValidating || !username.trim()}
            className="flex-1"
            data-testid="button-connect-coach"
          >
            {isValidating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              "Connect with Coach"
            )}
          </Button>
        </div>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        You can always add a coach later in Settings
      </div>
    </div>
  );
}
