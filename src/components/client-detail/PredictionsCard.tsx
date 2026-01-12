import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, ExternalLink, Loader2 } from 'lucide-react';
import { useClientPredictions } from '@/hooks/useClientPredictions';
import { cn } from '@/lib/utils';

interface PredictionsCardProps {
  clientEmail: string;
}

const typeColors: Record<string, string> = {
  goal: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  challenge: 'bg-amber-100 text-amber-800 border-amber-200',
  experience: 'bg-blue-100 text-blue-800 border-blue-200',
};

const statusColors: Record<string, string> = {
  active: 'bg-primary/10 text-primary border-primary/20',
  archived: 'bg-muted text-muted-foreground border-muted',
};

export function PredictionsCard({ clientEmail }: PredictionsCardProps) {
  const { data: predictions, isLoading, error } = useClientPredictions(clientEmail);

  const predictToolUrl = import.meta.env.DEV
    ? 'http://localhost:3001'
    : 'https://snapshot.findinggood.com';

  if (isLoading) {
    return (
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Predictions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Predictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Failed to load predictions</p>
        </CardContent>
      </Card>
    );
  }

  const activePredictions = predictions?.filter(p => p.status === 'active') || [];
  const archivedPredictions = predictions?.filter(p => p.status !== 'active') || [];

  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-serif text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Predictions
          {predictions && predictions.length > 0 && (
            <Badge variant="secondary" className="ml-2 font-normal">
              {predictions.length}
            </Badge>
          )}
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => window.open(predictToolUrl, '_blank')}
        >
          Open Predict Tool
          <ExternalLink className="h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent>
        {!predictions || predictions.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground italic">
              No predictions yet
            </p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Help your client get started with their first prediction
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(predictToolUrl, '_blank')}
            >
              Start New Prediction
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Active Predictions */}
            {activePredictions.map((prediction) => (
              <PredictionItem key={prediction.id} prediction={prediction} />
            ))}

            {/* Archived Predictions */}
            {archivedPredictions.length > 0 && (
              <>
                {activePredictions.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <p className="text-xs text-muted-foreground mb-3">Archived</p>
                  </div>
                )}
                {archivedPredictions.map((prediction) => (
                  <PredictionItem key={prediction.id} prediction={prediction} />
                ))}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PredictionItemProps {
  prediction: {
    id: string;
    title: string;
    type: string | null;
    status: string | null;
    current_predictability_score: number | null;
    created_at: string;
  };
}

function PredictionItem({ prediction }: PredictionItemProps) {
  const score = prediction.current_predictability_score;
  const scoreDisplay = score !== null ? `${Math.round(score)}%` : '—';

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-medium text-sm truncate">{prediction.title}</h4>
          {prediction.type && (
            <Badge
              variant="outline"
              className={cn('text-xs capitalize', typeColors[prediction.type] || '')}
            >
              {prediction.type}
            </Badge>
          )}
          {prediction.status && (
            <Badge
              variant="outline"
              className={cn('text-xs capitalize', statusColors[prediction.status] || '')}
            >
              {prediction.status}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Created {formatDistanceToNow(new Date(prediction.created_at), { addSuffix: true })}
        </p>
      </div>
      <div className="text-right">
        <div className={cn(
          'text-lg font-semibold',
          score !== null && score >= 70 ? 'text-emerald-600' :
          score !== null && score >= 40 ? 'text-amber-600' :
          score !== null ? 'text-rose-600' : 'text-muted-foreground'
        )}>
          {scoreDisplay}
        </div>
        <p className="text-xs text-muted-foreground">score</p>
      </div>
    </div>
  );
}
