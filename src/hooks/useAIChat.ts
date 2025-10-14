import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface ChatContext {
  selectedJobIds?: string[];
  searchQuery?: string;
  ratingFilter?: string[];
  tagFilter?: string[];
}

export const useAIChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string, context?: ChatContext) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    let assistantContent = '';
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Du måste vara inloggad för att använda AI-assistenten');
      }

      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-recruiter-assistant`;

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: messages
            .filter(m => !m.isStreaming)
            .concat([userMessage])
            .map(m => ({ role: m.role, content: m.content })),
          context,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('För många förfrågningar. Vänligen försök igen om en stund.');
        }
        if (response.status === 402) {
          throw new Error('AI-tjänsten är tillfälligt otillgänglig.');
        }
        throw new Error('Ett fel uppstod vid kontakt med AI-assistenten');
      }

      if (!response.body) {
        throw new Error('Inget svar från servern');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // Add streaming assistant message
      setMessages(prev => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || line.startsWith(':')) continue;
          if (!line.startsWith('data: ')) continue;

          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                const lastMsg = updated[updated.length - 1];
                if (lastMsg?.role === 'assistant') {
                  lastMsg.content = assistantContent;
                }
                return updated;
              });
            }
          } catch (e) {
            // Ignore JSON parse errors for partial chunks
          }
        }
      }

      // Finalize streaming
      setMessages(prev => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg?.role === 'assistant') {
          lastMsg.isStreaming = false;
        }
        return updated;
      });
    } catch (err) {
      console.error('AI chat error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ett okänt fel uppstod';
      setError(errorMessage);
      
      // Remove streaming message and add error message
      setMessages(prev => {
        const filtered = prev.filter(m => !m.isStreaming);
        return [
          ...filtered,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `Ursäkta, ${errorMessage}`,
            timestamp: new Date(),
          },
        ];
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
};
