import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, X, CheckCircle2, Bell } from 'lucide-react';
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

  const normalizeSeverity = (severity: string): 'critical' | 'high' | 'medium' | 'unknown' => {
    const s = (severity || '').toLowerCase();
    if (s === 'critical' || s === 'high' || s === 'medium') return s;
    return 'unknown';
  };

  const getSeverityVariant = (severity: string): 'default' | 'destructive' | 'outline' | 'secondary' => {
    switch (normalizeSeverity(severity)) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'outline';
      default:
        // Fail closed — never style unknown severity as medium/yellow urgency
        return 'secondary';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (normalizeSeverity(severity)) {
      case 'critical':
        return 'text-destructive';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const getSeverityBorder = (severity: string) => {
    switch (normalizeSeverity(severity)) {
      case 'critical':
        return 'border-destructive animate-pulse';
      case 'high':
        return 'border-orange-500';
      case 'medium':
        return 'border-yellow-500';
      default:
        return 'border-muted';
    }
  };

  const getSeverityLabel = (severity: string) => {
    const n = normalizeSeverity(severity);
    return n === 'unknown' ? 'SEVERITY UNKNOWN' : n.toUpperCase();
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
            These alerts appear in-app. SMS/voice delivery is not enabled in this build.
          </AlertDescription>
        </Alert>
      )}

      {/* Alerts List */}
      {alerts.map((alert) => (
        <Card 
          key={alert.id} 
          className={`border-2 ${getSeverityBorder(alert.severity)}`}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className={`h-5 w-5 ${getSeverityColor(alert.severity)}`} />
                  <CardTitle className="text-lg">{alert.title}</CardTitle>
                  <Badge variant={getSeverityVariant(alert.severity)}>
                    {getSeverityLabel(alert.severity)}
                  </Badge>
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

            {Number.isFinite(Number(alert.estimated_loss_usd)) && Number(alert.estimated_loss_usd) > 0 && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-semibold">
                  Illustrative planning estimate: ${Number(alert.estimated_loss_usd).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>
                  Urgency:{' '}
                  {Number.isFinite(Number(alert.urgency_score))
                    ? `${Math.round(Number(alert.urgency_score))}/100`
                    : 'not recorded'}
                </span>
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

