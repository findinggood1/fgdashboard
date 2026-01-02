import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Calendar, TrendingUp } from 'lucide-react';

export default function ClientDetail() {
  const { email } = useParams<{ email: string }>();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back Button */}
      <Link to="/clients">
        <Button variant="ghost" className="gap-2 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </Button>
      </Link>

      {/* Client Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-serif font-semibold">Client Details</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Mail className="h-4 w-4" />
            {email}
          </p>
        </div>
      </div>

      {/* Client Info Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Engagement details will load here</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Progress metrics will load here</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different data sections */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="font-serif">Client Data</CardTitle>
          <CardDescription>Sessions, notes, assessments, and more</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>Client data tabs will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
