import { usePortalPreview } from './PortalPreviewContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Sparkles, AlertCircle } from 'lucide-react';

const STARTER_PROMPTS = [
  "What should I focus on this week?",
  "Help me reflect on my progress",
  "Explain the FIRES framework",
  "What are my strengths?",
];

export default function PreviewPortalChat() {
  const previewContext = usePortalPreview();
  const firstName = previewContext?.clientData?.name?.split(' ')[0] || 'Client';

  return (
    <div className="h-[calc(100vh-16rem)] flex flex-col animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-serif font-semibold text-foreground">
          Chat
        </h1>
        <p className="text-muted-foreground mt-1">
          AI coaching assistant
        </p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-serif font-medium mb-2">
              Hi {firstName}! How can I help today?
            </h2>
            <p className="text-muted-foreground text-sm max-w-md mb-6">
              I'm here to support your coaching journey. Ask me about your progress, the FIRES framework, or anything else on your mind.
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {STARTER_PROMPTS.map((prompt) => (
                <Button
                  key={prompt}
                  variant="outline"
                  size="sm"
                  disabled
                  className="text-sm"
                >
                  {prompt}
                </Button>
              ))}
            </div>
            
            {/* Preview Mode Notice */}
            <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span>Chat is disabled in preview mode</span>
            </div>
          </div>
        </ScrollArea>

        <CardContent className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="Type your message..."
              className="min-h-[44px] max-h-32 resize-none"
              disabled
            />
            <Button
              size="icon"
              disabled
              className="shrink-0 h-11 w-11"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
