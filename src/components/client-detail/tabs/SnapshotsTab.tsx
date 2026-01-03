import { useState } from 'react';
import { format } from 'date-fns';
import { Snapshot } from '@/hooks/useClientDetail';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ZoneBadge } from '@/components/clients/ZoneBadge';
import { Badge } from '@/components/ui/badge';
import { Camera, ChevronDown, ChevronUp, MessageCircle, Users } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SnapshotsTabProps {
  snapshots: Snapshot[];
}

const FIRES_ELEMENTS = ['Feelings', 'Influence', 'Resilience', 'Ethics', 'Strengths'];

function truncate(text: string | null | undefined, maxLength: number): string {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function ScoreGrid({ title, scores }: { title: string; scores: Record<string, any> | null }) {
  if (!scores) return null;
  
  return (
    <div>
      <h4 className="text-sm font-medium mb-2">{title}</h4>
      <div className="grid grid-cols-2 gap-2">
        {FIRES_ELEMENTS.map((element) => {
          const key = element.toLowerCase();
          const value = scores[key] ?? scores[element];
          if (value === undefined) return null;
          return (
            <div key={element} className="flex justify-between text-sm bg-muted/50 px-2 py-1 rounded">
              <span className="text-muted-foreground">{element}</span>
              <span className="font-medium">{typeof value === 'number' ? value.toFixed(1) : value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ZoneBreakdownGrid({ breakdown }: { breakdown: Record<string, any> | null }) {
  if (!breakdown) return null;
  
  return (
    <div>
      <h4 className="text-sm font-medium mb-2">Zone Breakdown</h4>
      <div className="grid grid-cols-2 gap-2">
        {FIRES_ELEMENTS.map((element) => {
          const key = element.toLowerCase();
          const zone = breakdown[key] ?? breakdown[element];
          if (!zone) return null;
          return (
            <div key={element} className="flex justify-between items-center text-sm bg-muted/50 px-2 py-1 rounded">
              <span className="text-muted-foreground">{element}</span>
              <ZoneBadge zone={zone} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SnapshotsTab({ snapshots }: SnapshotsTabProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

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

  if (snapshots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Camera className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No snapshots yet</p>
        <p className="text-sm mt-1">The client hasn't completed a FIRES Snapshot.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {snapshots.map((snapshot) => {
        const isExpanded = expandedIds.has(snapshot.id);
        const fsAnswers = snapshot.fs_answers || {};
        const psAnswers = snapshot.ps_answers || {};
        
        return (
          <Collapsible key={snapshot.id} open={isExpanded} onOpenChange={() => toggleExpand(snapshot.id)}>
            <Card className="shadow-soft hover:shadow-md transition-shadow">
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-2 cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-base font-medium">
                          {format(new Date(snapshot.created_at), 'MMM d, yyyy')}
                        </CardTitle>
                        <ZoneBadge zone={snapshot.overall_zone} />
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {truncate(snapshot.goal, 60) || 'No goal set'}
                      </p>
                      {snapshot.growth_opportunity_category && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Growth Area: <span className="capitalize">{snapshot.growth_opportunity_category}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(snapshot.created_at), 'h:mm a')}
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
                <CardContent className="pt-0 space-y-6">
                  {/* Goal */}
                  {snapshot.goal && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Goal</h4>
                      <p className="text-sm text-muted-foreground">{snapshot.goal}</p>
                    </div>
                  )}

                  {/* Success Story */}
                  {snapshot.success && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Success Story</h4>
                      <p className="text-sm text-muted-foreground">{snapshot.success}</p>
                    </div>
                  )}

                  {/* Zone Breakdown */}
                  <ZoneBreakdownGrid breakdown={snapshot.zone_breakdown} />

                  {/* Scores - Two Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ScoreGrid title="Confidence Scores" scores={snapshot.confidence_scores} />
                    <ScoreGrid title="Alignment Scores" scores={snapshot.alignment_scores} />
                  </div>

                  {/* Growth Opportunity */}
                  {(fsAnswers.growth_opportunity_category || fsAnswers.growth_opportunity_zone || fsAnswers.growth_opportunity_explanation) && (
                    <div className="bg-accent/30 p-3 rounded-lg">
                      <h4 className="text-sm font-medium mb-2">Growth Opportunity</h4>
                      <div className="space-y-1 text-sm">
                        {fsAnswers.growth_opportunity_category && (
                          <p>
                            <span className="text-muted-foreground">Category: </span>
                            <Badge variant="outline" className="capitalize ml-1">
                              {fsAnswers.growth_opportunity_category}
                            </Badge>
                          </p>
                        )}
                        {fsAnswers.growth_opportunity_zone && (
                          <p className="flex items-center gap-2">
                            <span className="text-muted-foreground">Zone: </span>
                            <ZoneBadge zone={fsAnswers.growth_opportunity_zone} />
                          </p>
                        )}
                        {fsAnswers.growth_opportunity_explanation && (
                          <p className="text-muted-foreground mt-2">{fsAnswers.growth_opportunity_explanation}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Owning Highlight */}
                  {(fsAnswers.owning_highlight_category || fsAnswers.owning_highlight_zone) && (
                    <div className="bg-green-500/10 p-3 rounded-lg">
                      <h4 className="text-sm font-medium mb-2">Owning Highlight</h4>
                      <div className="space-y-1 text-sm">
                        {fsAnswers.owning_highlight_category && (
                          <p>
                            <span className="text-muted-foreground">Category: </span>
                            <Badge variant="outline" className="capitalize ml-1">
                              {fsAnswers.owning_highlight_category}
                            </Badge>
                          </p>
                        )}
                        {fsAnswers.owning_highlight_zone && (
                          <p className="flex items-center gap-2">
                            <span className="text-muted-foreground">Zone: </span>
                            <ZoneBadge zone={fsAnswers.owning_highlight_zone} />
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 48-Hour Question */}
                  {fsAnswers.forty_eight_hour_question && (
                    <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                      <div className="flex items-start gap-2">
                        <MessageCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="text-sm font-medium text-primary mb-1">48-Hour Question</h4>
                          <p className="text-sm italic">{fsAnswers.forty_eight_hour_question}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Support Network */}
                  {(psAnswers.future_support || psAnswers.past_support) && (
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <h4 className="text-sm font-medium">Support Network</h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        {psAnswers.future_support && (
                          <div>
                            <span className="text-muted-foreground">Future Support: </span>
                            <span>{psAnswers.future_support}</span>
                          </div>
                        )}
                        {psAnswers.past_support && (
                          <div>
                            <span className="text-muted-foreground">Past Support: </span>
                            <span>{psAnswers.past_support}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Narrative */}
                  {fsAnswers.narrative && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Narrative</h4>
                      <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                        {typeof fsAnswers.narrative === 'string' 
                          ? fsAnswers.narrative 
                          : JSON.stringify(fsAnswers.narrative, null, 2)}
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
