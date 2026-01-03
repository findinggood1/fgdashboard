import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Send, 
  Trash2, 
  User, 
  Bot, 
  ChevronRight,
  ChevronLeft,
  Loader2,
  Sparkles,
  MessageSquare,
  UserCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Client {
  email: string;
  name: string;
  status: string;
}

interface ClientContext {
  client: any;
  engagement: any;
  markers: any[];
  snapshots: any[];
  sessions: any[];
}

const FOCUS_LABELS: Record<string, string> = {
  career: 'Career',
  relationships: 'Relationships',
  health: 'Health & Wellness',
  leadership: 'Leadership',
  sales: 'Sales',
  entrepreneurship: 'Entrepreneurship',
  transition: 'Life Transition',
};

const QUICK_PROMPTS = [
  { label: 'Prep me for today\'s session', prompt: 'Prep me for today\'s session with this client. What should I focus on and be curious about?' },
  { label: 'What patterns do you see?', prompt: 'Looking at this client\'s data, what patterns do you notice? Any concerning or encouraging trends?' },
  { label: 'Summarize their progress', prompt: 'Give me a summary of this client\'s progress so far. Where are they excelling and where are they stuck?' },
  { label: 'What should I be curious about?', prompt: 'Based on everything you see, what should I be curious about in our next conversation?' },
];

export default function CoachChat() {
  const { coachData } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [clientContext, setClientContext] = useState<ClientContext | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [contextLoading, setContextLoading] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch clients on mount
  useEffect(() => {
    const fetchClients = async () => {
      if (!coachData?.id) return;
      
      const { data, error } = await supabase
        .from('clients')
        .select('email, name, status')
        .eq('coach_id', coachData.id)
        .order('name');

      if (!error && data) {
        setClients(data);
      }
    };

    fetchClients();
  }, [coachData?.id]);

  // Fetch client context when selected
  useEffect(() => {
    const fetchClientContext = async () => {
      if (!selectedClient) {
        setClientContext(null);
        return;
      }

      setContextLoading(true);
      try {
        const [clientRes, engagementRes, markersRes, snapshotsRes, sessionsRes] = await Promise.all([
          supabase.from('clients').select('*').eq('email', selectedClient).maybeSingle(),
          supabase.from('coaching_engagements').select('*').eq('client_email', selectedClient).eq('status', 'active').maybeSingle(),
          supabase.from('more_less_markers').select('*').eq('client_email', selectedClient).eq('is_active', true),
          supabase.from('snapshots').select('*').eq('client_email', selectedClient).order('created_at', { ascending: false }).limit(5),
          supabase.from('session_transcripts').select('*').eq('client_email', selectedClient).order('session_date', { ascending: false }).limit(3)
        ]);

        setClientContext({
          client: clientRes.data,
          engagement: engagementRes.data,
          markers: markersRes.data || [],
          snapshots: snapshotsRes.data || [],
          sessions: sessionsRes.data || []
        });
      } catch (err) {
        console.error('Error fetching client context:', err);
        toast.error('Failed to load client context');
      } finally {
        setContextLoading(false);
      }
    };

    fetchClientContext();
  }, [selectedClient]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Build conversation history for context
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const { data, error } = await supabase.functions.invoke('coaching-chat', {
        body: {
          clientEmail: selectedClient,
          message: messageText,
          conversationHistory
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response || 'Sorry, I could not generate a response.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      toast.error('Failed to send message. Please try again.');
      // Remove the user message if failed
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast.success('Chat cleared');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4 animate-fade-in">
      {/* Left Sidebar - Client List */}
      <Card className="w-64 flex-shrink-0 shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Clients
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="p-2 space-y-1">
              <button
                onClick={() => setSelectedClient(null)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                  !selectedClient
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-muted text-muted-foreground'
                )}
              >
                No client selected
              </button>
              <Separator className="my-2" />
              {clients.map(client => (
                <button
                  key={client.email}
                  onClick={() => setSelectedClient(client.email)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                    selectedClient === client.email
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-muted'
                  )}
                >
                  <div className="font-medium truncate">{client.name || client.email}</div>
                  <div className="text-xs text-muted-foreground truncate">{client.email}</div>
                </button>
              ))}
              {clients.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No clients found
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Main Chat Area */}
      <Card className="flex-1 flex flex-col shadow-soft">
        <CardHeader className="pb-3 flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle className="font-serif text-lg">
              Coach AI Chat
            </CardTitle>
            {selectedClient && clientContext?.client && (
              <Badge variant="secondary">
                {clientContext.client.name || selectedClient}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              disabled={messages.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
              className="lg:hidden"
            >
              {rightSidebarOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>

        {/* Quick Prompts */}
        {selectedClient && messages.length === 0 && (
          <div className="px-4 pb-3">
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((qp, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => sendMessage(qp.prompt)}
                  disabled={loading}
                  className="text-xs"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {qp.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Bot className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">
                {selectedClient ? 'Start a conversation' : 'Select a client to begin'}
              </p>
              <p className="text-sm max-w-md">
                {selectedClient
                  ? 'Use the quick prompts above or type your own question about this client.'
                  : 'Choose a client from the left sidebar to load their context, or chat without a client for general coaching questions.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-3',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[70%] rounded-lg px-4 py-3',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={cn(
                      'text-xs mt-1',
                      message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    )}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <UserCircle className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        <Separator />

        {/* Input */}
        <div className="p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={selectedClient ? 'Ask about this client...' : 'Ask a general coaching question...'}
              disabled={loading}
              className="flex-1"
            />
            <Button onClick={() => sendMessage(input)} disabled={loading || !input.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </Card>

      {/* Right Sidebar - Context Summary */}
      {rightSidebarOpen && (
        <Card className="w-72 flex-shrink-0 shadow-soft hidden lg:block">
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="font-serif text-lg">Client Context</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRightSidebarOpen(false)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {contextLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !selectedClient ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Select a client to view their context
              </p>
            ) : !clientContext ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No context available
              </p>
            ) : (
              <ScrollArea className="h-[calc(100vh-14rem)]">
                <div className="space-y-4 text-sm">
                  {/* Client Info */}
                  <div>
                    <h4 className="font-medium mb-1">Client</h4>
                    <p>{clientContext.client?.name || selectedClient}</p>
                  </div>

                  {/* Engagement */}
                  {clientContext.engagement && (
                    <div>
                      <h4 className="font-medium mb-1">Engagement</h4>
                      <div className="space-y-1 text-muted-foreground">
                        <p>Phase: <span className="text-foreground font-medium">{clientContext.engagement.current_phase?.toUpperCase()}</span></p>
                        <p>Week: <span className="text-foreground">{clientContext.engagement.current_week} of 12</span></p>
                        {clientContext.engagement.focus && (
                          <p>Focus: <span className="text-foreground">{FOCUS_LABELS[clientContext.engagement.focus] || clientContext.engagement.focus}</span></p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Story */}
                  {clientContext.engagement && (
                    <div>
                      <h4 className="font-medium mb-1">The Story (3Ps)</h4>
                      <div className="space-y-2 text-muted-foreground text-xs">
                        {clientContext.engagement.story_present && (
                          <p><span className="font-medium text-foreground">Present:</span> {clientContext.engagement.story_present.substring(0, 80)}...</p>
                        )}
                        {clientContext.engagement.story_past && (
                          <p><span className="font-medium text-foreground">Past:</span> {clientContext.engagement.story_past.substring(0, 80)}...</p>
                        )}
                        {clientContext.engagement.story_potential && (
                          <p><span className="font-medium text-foreground">Potential:</span> {clientContext.engagement.story_potential.substring(0, 80)}...</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* More/Less Markers */}
                  {clientContext.markers.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-1">More/Less Markers</h4>
                      <div className="space-y-1">
                        {clientContext.markers.slice(0, 4).map((m, i) => (
                          <div key={i} className="text-xs">
                            <Badge variant="outline" className="text-xs mr-1">
                              {m.marker_type}
                            </Badge>
                            {m.marker_text}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Snapshots */}
                  {clientContext.snapshots.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-1">Recent Snapshots</h4>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        {clientContext.snapshots.slice(0, 3).map((s, i) => (
                          <p key={i}>
                            <span className="font-medium text-foreground">{s.overall_zone}</span>
                            {' - '}{new Date(s.created_at).toLocaleDateString()}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Sessions */}
                  {clientContext.sessions.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-1">Recent Sessions</h4>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        {clientContext.sessions.map((s, i) => (
                          <p key={i}>
                            Session {s.session_number} - {new Date(s.session_date).toLocaleDateString()}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
