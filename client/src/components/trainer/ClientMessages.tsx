import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTrainerData } from "@/contexts/TrainerDataContext";
import { Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ClientMessagesProps {
  clientId: string;
}

export function ClientMessages({ clientId }: ClientMessagesProps) {
  const { getClientMessages, sendMessage } = useTrainerData();
  const messages = getClientMessages(clientId);
  const [newMessage, setNewMessage] = useState("");

  const handleSend = () => {
    if (newMessage.trim()) {
      sendMessage(clientId, newMessage);
      setNewMessage("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Messages</h2>
        <p className="text-muted-foreground">Chat with your client</p>
      </div>

      {/* Messages List */}
      <Card>
        <CardContent className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No messages yet</p>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'trainer' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] space-y-1 ${
                  message.sender === 'trainer' ? 'items-end' : 'items-start'
                }`}>
                  <div className={`rounded-lg p-3 ${
                    message.sender === 'trainer'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}>
                    <p className="text-sm">{message.message}</p>
                  </div>
                  <p className="text-xs text-muted-foreground px-1">
                    {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Message Composer */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Textarea
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={3}
              data-testid="input-message"
            />
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim()}
              data-testid="button-send-message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
