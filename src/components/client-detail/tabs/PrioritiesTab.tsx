import { useState } from 'react';
import { format } from 'date-fns';
import { ImpactVerification } from '@/hooks/useClientDetail';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, ChevronDown, ChevronUp, Quote } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface PrioritiesTabProps {
  impacts: ImpactVerification[];
}

function truncate(text: string | null | undefined, maxLength: number): string {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function FiresBadge({ element }: { element: string }) {
  const colors: Record<string, string> = {
    feelings: 'bg-pink-500/10 text-pink-700 border-pink-300 dark:text-pink-400',
    influence: 'bg-blue-500/10 text-blue-700 border-blue-300 dark:text-blue-400',
    resilience: 'bg-orange-500/10 text-orange-700 border-orange-300 dark:text-orange-400',
    ethics: 'bg-green-500/10 text-green-700 border-green-300 dark:text-green-400',
    strengths: 'bg-yellow-500/10 text-yellow-700 border-yellow-300 dark:text-yellow-400',
  };

  const colorClass = colors[element.toLowerCase()] || 'bg-muted text-muted-foreground';

  return (
    <Badge variant="outline" className={`capitalize ${colorClass}`}>
      {element}
    </Badge>
  );
}

export function PrioritiesTab({ impacts }: PrioritiesTabProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Filter for only self entries (priorities)
  const priorities = impacts.filter(i => i.type?.toLowerCase() === 'self');

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (priorities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Star className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No priorities yet</p>
        <p className="text-sm mt-1">Self-reported priorities will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-muted-foreground">{priorities.length} {priorities.length === 1 ? 'priority' : 'priorities'}</p>
      </div>
      {priorities.map((priority) => {
        const isExpanded = expandedIds.has(priority.id);
        const responses = priority.responses || {};

        // Detect format - newer has what_did, older has moment
        const isNewerFormat = 'what_did' in responses || 'how_did' in responses || 'what_impact' in responses;

        return (
          <Collapsible key={priority.id} open={isExpanded} onOpenChange={() => toggleExpand(priority.id)}>
            <Card className="shadow-soft hover:shadow-md transition-shadow border-l-4 border-l-teal-500">
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-2 cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-base font-medium">
                          {format(new Date(priority.created_at), 'MMM d, yyyy')}
                        </CardTitle>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1 italic">
                        {priority.integrity_line
                          ? `"${truncate(priority.integrity_line, 60)}"`
                          : 'No integrity line'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(priority.created_at), 'h:mm a')}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="pt-0 space-y-4">
                  {/* Response Content - Format 1 (newer - daily capture) */}
                  {isNewerFormat ? (
                    <div className="space-y-3">
                      {responses.what_did && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">What they did</h4>
                          <p className="text-sm text-muted-foreground">{responses.what_did}</p>
                        </div>
                      )}
                      {responses.how_did && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">How they did it</h4>
                          <p className="text-sm text-muted-foreground">{responses.how_did}</p>
                        </div>
                      )}
                      {responses.what_impact && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">What impact</h4>
                          <p className="text-sm text-muted-foreground">{responses.what_impact}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Format 2 (older) */
                    <div className="space-y-3">
                      {responses.moment && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">Moment</h4>
                          <p className="text-sm text-muted-foreground">{responses.moment}</p>
                        </div>
                      )}
                      {responses.role && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">Role</h4>
                          <p className="text-sm text-muted-foreground">{responses.role}</p>
                        </div>
                      )}
                      {responses.impact && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">Impact</h4>
                          <p className="text-sm text-muted-foreground">{responses.impact}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Integrity Line - Highlighted */}
                  {priority.integrity_line && (
                    <div className="bg-teal-500/10 border-l-4 border-teal-500 p-4 rounded-r-lg">
                      <div className="flex items-start gap-2">
                        <Quote className="h-4 w-4 text-teal-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="text-sm font-medium text-teal-700 dark:text-teal-400 mb-1">Integrity Line</h4>
                          <p className="text-sm italic">"{priority.integrity_line}"</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FIRES Focus */}
                  {responses.fires_focus && Array.isArray(responses.fires_focus) && responses.fires_focus.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">FIRES Focus</h4>
                      <div className="flex flex-wrap gap-2">
                        {responses.fires_focus.map((element: string, idx: number) => (
                          <FiresBadge key={idx} element={element} />
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
    </div>
  );
}
