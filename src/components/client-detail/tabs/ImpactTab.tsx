import { format } from 'date-fns';
import { ImpactVerification } from '@/hooks/useClientDetail';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target } from 'lucide-react';

interface ImpactTabProps {
  impacts: ImpactVerification[];
}

export function ImpactTab({ impacts }: ImpactTabProps) {
  if (impacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Target className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No impact entries yet</p>
        <p className="text-sm mt-1">Impact verifications will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {impacts.map((impact, idx) => (
        <Card key={impact.id} className="shadow-soft hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base font-medium">
                  Impact #{impacts.length - idx}
                </CardTitle>
                <Badge variant="outline" className="capitalize">
                  {impact.type}
                </Badge>
              </div>
              <span className="text-sm text-muted-foreground">
                {format(new Date(impact.created_at), 'MMM d, yyyy h:mm a')}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {impact.integrity_line && (
              <p className="text-sm italic text-muted-foreground">
                "{impact.integrity_line}"
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
