import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAppStore } from '@/stores/useAppStore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  actions?: any[];
}

export function AIChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { language, aiEnabled } = useAppStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Try Gemini first (user's own API key)
      const { data: geminiData, error: geminiError } = await supabase.functions.invoke('gemini-chat', {
        body: { 
          message: userMessage, 
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content }))
        },
      });

      if (!geminiError && geminiData && !geminiData.error) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: geminiData.response,
          actions: geminiData.actions 
        }]);
        
        // Show action confirmations
        if (geminiData.actions && geminiData.actions.length > 0) {
          geminiData.actions.forEach((action: any) => {
            if (action.result?.success) {
              toast.success(action.result.message);
            }
          });
        }
        return;
      }

      // If Gemini fails with missing API key, show helpful message
      if (geminiData?.error?.includes('API key')) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: language === 'ar' 
            ? '⚙️ للحصول على ميزات الذكاء الاصطناعي الكاملة، يرجى إضافة مفتاح Gemini API في الإعدادات ← تكامل الذكاء الاصطناعي.\n\nيمكنك الحصول على مفتاح مجاني من Google AI Studio.'
            : '⚙️ For full AI features, please add your Gemini API key in Settings → AI Integration.\n\nYou can get a free key from Google AI Studio.'
        }]);
        return;
      }

      // Fallback to basic AI chat
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { message: userMessage, context: { language } },
      });

      if (error) throw error;

      if (data?.error) {
        if (data.error.includes('Rate limit')) {
          toast.error(language === 'ar' ? 'تم تجاوز الحد. انتظر قليلاً.' : 'Rate limited. Please wait.');
        } else if (data.error.includes('Payment')) {
          toast.error(language === 'ar' ? 'يرجى إضافة رصيد للمتابعة' : 'Please add credits to continue');
        } else {
          throw new Error(data.error);
        }
        return;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err) {
      console.error('AI chat error:', err);
      toast.error(language === 'ar' ? 'فشل الحصول على رد' : 'Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  if (!aiEnabled) return null;

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50",
          "bg-primary hover:bg-primary/90 transition-all duration-300",
          "hover:scale-110",
          isOpen && "hidden"
        )}
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[400px] h-[550px] bg-card border border-border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {language === 'ar' ? 'المساعد الذكي' : 'AI Assistant'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {language === 'ar' ? 'إدارة كل شيء بالذكاء الاصطناعي' : 'Manage everything with AI'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={clearChat} title={language === 'ar' ? 'محو المحادثة' : 'Clear chat'}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium mb-2">
                    {language === 'ar' ? 'مرحباً! كيف يمكنني مساعدتك؟' : 'Hello! How can I help you?'}
                  </p>
                  <div className="text-xs space-y-1 max-w-[280px] mx-auto">
                    <p>{language === 'ar' ? 'جرب أن تقول:' : 'Try saying:'}</p>
                    <p className="text-primary/80">"{language === 'ar' ? 'أضف مهمة جديدة: مراجعة التقرير' : 'Add a new task: Review report'}"</p>
                    <p className="text-primary/80">"{language === 'ar' ? 'أظهر لي مهامي اليوم' : 'Show me my tasks for today'}"</p>
                    <p className="text-primary/80">"{language === 'ar' ? 'أضف نفقة 50 دولار للطعام' : 'Add expense $50 for food'}"</p>
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex",
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap",
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted text-foreground rounded-bl-md'
                    )}
                  >
                    {msg.content}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/50 text-xs opacity-80">
                        {msg.actions.map((action: any, j: number) => (
                          <div key={j} className="flex items-center gap-1">
                            <span className={action.result?.success ? 'text-green-500' : 'text-red-500'}>
                              {action.result?.success ? '✓' : '✗'}
                            </span>
                            <span>{action.function}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-md">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={language === 'ar' ? 'اكتب أمرًا أو سؤالًا...' : 'Type a command or question...'}
                className="flex-1"
                disabled={isLoading}
              />
              <Button 
                onClick={sendMessage} 
                size="icon" 
                disabled={!input.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
