import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface Client {
  email: string;
  name: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI coaching prep assistant. I can help you prepare for sessions, review client history, or brainstorm coaching strategies. Select a client for personalized context, or ask me anything about the FIRES framework."
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      const { data } = await supabase
        .from('clients')
        .select('email, name')
        .order('name');
      if (data) setClients(data);
    };
    fetchClients();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message to conversation
    setMessages(prev => [...prev, { 
      id: Date.now().toString(), 
      role: 'user', 
      content: userMessage 
    }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('coaching-chat', {
        body: { 
          clientEmail: selectedClient?.email || null,
          message: userMessage,
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content }))
        }
      });

      if (error) throw error;

      // Add AI response to conversation
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(),
        role: 'assistant', 
        content: data.response 
      }]);

    } catch (err) {
      console.error('Error calling AI:', err);
      toast.error('Failed to get AI response');
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(),
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-serif font-semibold">AI Prep Assistant</h1>
          <p className="text-muted-foreground mt-1">Get help preparing for coaching sessions</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Client context:</span>
          <Select 
            value={selectedClient?.email || ''} 
            onValueChange={(value) => {
              const client = clients.find(c => c.email === value);
              setSelectedClient(client || null);
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="No client selected" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No client selected</SelectItem>
              {clients.map(client => (
                <SelectItem key={client.email} value={client.email}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 shadow-soft flex flex-col overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Session Prep Chat
          </CardTitle>
          <CardDescription>Ask about clients, review notes, or brainstorm approaches</CardDescription>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3 max-w-[80%]',
                message.role === 'user' ? 'ml-auto flex-row-reverse' : ''
              )}
            >
              <div className={cn(
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              )}>
                {message.role === 'user' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              <div className={cn(
                'rounded-lg px-4 py-3',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              )}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-lg px-4 py-3 bg-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </CardContent>

        {/* Input Area */}
        <div className="p-4 border-t bg-card">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={selectedClient ? `Ask about ${selectedClient.name}...` : "Ask about coaching strategies, FIRES framework..."}
              className="flex-1"
              disabled={isLoading}
            />
            <Button onClick={handleSend} className="gradient-primary" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
