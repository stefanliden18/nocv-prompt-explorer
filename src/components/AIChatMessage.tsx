import { Message } from '@/hooks/useAIChat';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface AIChatMessageProps {
  message: Message;
}

export const AIChatMessage = ({ message }: AIChatMessageProps) => {
  const isUser = message.role === 'user';

  return (
    <div className={cn(
      'flex gap-3 mb-4',
      isUser && 'flex-row-reverse'
    )}>
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
        isUser ? 'bg-primary' : 'bg-muted'
      )}>
        {isUser ? (
          <User className="w-4 h-4 text-primary-foreground" />
        ) : (
          <Bot className="w-4 h-4 text-muted-foreground" />
        )}
      </div>

      <div className={cn(
        'flex-1 max-w-[80%] space-y-1',
        isUser && 'flex flex-col items-end'
      )}>
        <div className={cn(
          'rounded-lg px-4 py-2',
          isUser 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted text-foreground'
        )}>
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="text-sm prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
          {message.isStreaming && (
            <span className="inline-block animate-pulse">▋</span>
          )}
        </div>
        
        <span className="text-xs text-muted-foreground px-1">
          {message.timestamp.toLocaleTimeString('sv-SE', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      </div>
    </div>
  );
};
