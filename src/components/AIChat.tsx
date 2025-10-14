import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Trash2 } from 'lucide-react';
import { AIChatMessage } from './AIChatMessage';
import { AIChatInput } from './AIChatInput';
import { useAIChat, ChatContext } from '@/hooks/useAIChat';
import { cn } from '@/lib/utils';

interface AIChatProps {
  context?: ChatContext;
  className?: string;
}

export const AIChat = ({ context, className }: AIChatProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, isLoading, sendMessage, clearMessages } = useAIChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (content: string) => {
    sendMessage(content, context);
  };

  const handleClear = () => {
    if (confirm('Är du säker på att du vill rensa konversationen?')) {
      clearMessages();
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50',
          className
        )}
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Chat drawer */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
          <SheetHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle>AI Rekryteringsassistent</SheetTitle>
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClear}
                  title="Rensa konversation"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </SheetHeader>

          {/* Messages area */}
          <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
                <MessageCircle className="h-12 w-12 text-muted-foreground" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Välkommen till AI-assistenten</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Jag kan hjälpa dig att hitta kandidater, analysera din kandidatpool och svara på frågor om rekryteringen.
                  </p>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground max-w-sm">
                  <p className="font-medium">Exempel på frågor:</p>
                  <ul className="text-left space-y-1">
                    <li>• "Visa mig de 10 bäst rankade kandidaterna"</li>
                    <li>• "Hur många kandidater har vi totalt?"</li>
                    <li>• "Vilka kandidater har 5 stjärnor?"</li>
                    <li>• "Ge mig statistik om ansökningarna"</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((message) => (
                  <AIChatMessage key={message.id} message={message} />
                ))}
                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex gap-3 mb-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-muted">
                      <MessageCircle className="w-4 h-4 text-muted-foreground animate-pulse" />
                    </div>
                    <div className="flex-1 max-w-[80%]">
                      <div className="rounded-lg px-4 py-2 bg-muted">
                        <span className="text-sm text-muted-foreground">Tänker...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input area */}
          <div className="px-6 py-4 border-t">
            <AIChatInput
              onSend={handleSend}
              disabled={isLoading}
              placeholder="Fråga mig om kandidater, statistik eller filter..."
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
