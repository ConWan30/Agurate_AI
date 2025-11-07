import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, X, CheckCircle2, Bell, Phone, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface CriticalAlert {
  id: string;
  field_id: string | null;
  assessment_id: string | null;
  alert_type: string;
  severity: 'critical' | 'high' | 'medium';
  title: string;
  message: string;
  estimated_loss_usd: number | null;
  urgency_score: number;
  acknowledged: boolean;
  sms_sent: boolean;
  voice_call_attempted: boolean;
  created_at: string;
  field_name?: string;
  crop_type?: string;
}

export function CriticalAlertsManager() {
  const [alerts, setAlerts] = useState<CriticalAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAlerts();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('unacknowledged_critical_alerts')
        .select('*')
        .order('urgency_score', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAlerts((data || []) as CriticalAlert[]);
    } catch (error) {
      console.error('Error fetching critical alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const { error } = await supabase.rpc('acknowledge_critical_alert', {
        alert_id: alertId,
      });

      if (error) throw error;

      toast.success('Alert acknowledged');
      fetchAlerts();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast.error('Failed to acknowledge alert');
    }
  };

  const getSeverityVariant = (severity: string): 'default' | 'destructive' | 'outline' => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-destructive';
      case 'high':
        return 'text-orange-600';
      default:
        return 'text-yellow-600';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 animate-pulse" />
            Loading alerts...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card className="border-2 border-success/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-success">
            <CheckCircle2 className="h-5 w-5" />
            No Critical Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            All clear! No critical issues requiring immediate attention.
          </p>
        </CardContent>
      </Card>
    );
  }

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const highAlerts = alerts.filter(a => a.severity === 'high');

  return (
    <div className="space-y-4">
      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <Alert variant="destructive" className="border-2 animate-pulse">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-lg font-bold">
            🚨 {criticalAlerts.length} Critical Alert{criticalAlerts.length > 1 ? 's' : ''} Requiring Immediate Action
          </AlertTitle>
          <AlertDescription>
            These alerts have been escalated and may require SMS or voice call notification.
          </AlertDescription>
        </Alert>
      )}

      {/* Alerts List */}
      {alerts.map((alert) => (
        <Card 
          key={alert.id} 
          className={`border-2 ${
            alert.severity === 'critical' 
              ? 'border-destructive animate-pulse' 
              : alert.severity === 'high'
              ? 'border-orange-500'
              : 'border-yellow-500'
          }`}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className={`h-5 w-5 ${getSeverityColor(alert.severity)}`} />
                  <CardTitle className="text-lg">{alert.title}</CardTitle>
                  <Badge variant={getSeverityVariant(alert.severity)}>
                    {alert.severity.toUpperCase()}
                  </Badge>
                  {alert.sms_sent && (
                    <Badge variant="outline" className="gap-1">
                      <MessageSquare className="h-3 w-3" />
                      SMS Sent
                    </Badge>
                  )}
                  {alert.voice_call_attempted && (
                    <Badge variant="outline" className="gap-1">
                      <Phone className="h-3 w-3" />
                      Voice Call
                    </Badge>
                  )}
                </div>
                {alert.field_name && (
                  <p className="text-sm text-muted-foreground">
                    Field: {alert.field_name} ({alert.crop_type})
                  </p>
                )}
              </div>
              {!alert.acknowledged && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => acknowledgeAlert(alert.id)}
                  className="gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Acknowledge
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed">{alert.message}</p>

            {alert.estimated_loss_usd && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-semibold">
                  Estimated Potential Loss: ${alert.estimated_loss_usd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Urgency: {alert.urgency_score}/100</span>
                <span>{formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}</span>
              </div>
              {alert.assessment_id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/history?assessment=${alert.assessment_id}`)}
                >
                  View Assessment
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

