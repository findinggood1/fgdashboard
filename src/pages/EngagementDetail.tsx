import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Target, Flame, MessageSquare } from 'lucide-react';

export default function EngagementDetail() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back Button */}
      <Link to="/clients">
        <Button variant="ghost" className="gap-2 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </Button>
      </Link>

      {/* Engagement Header */}
      <div>
        <h1 className="text-3xl font-serif font-semibold">Engagement Details</h1>
        <p className="text-muted-foreground mt-1">ID: {id}</p>
      </div>

      {/* Engagement Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Goals will load here</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Flame className="h-5 w-5 text-destructive" />
              FIRES Focus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">FIRES focus will load here</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-accent" />
              Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Session count will load here</p>
          </CardContent>
        </Card>
      </div>

      {/* More/Less Markers */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="font-serif">More/Less Markers</CardTitle>
          <CardDescription>Track behavioral changes over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <p>More/Less markers will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
