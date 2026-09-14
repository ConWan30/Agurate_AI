import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, CheckCircle2, Users, Clock, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface CooperativeAlert {
  id: string;
  cooperative_id: string;
  cooperative_name: string;
  created_by: string;
  created_by_name: string;
  alert_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  crop_type: string | null;
  affected_area_acres: number | null;
  recommended_action: string | null;
  field_id: string | null;
  field_name: string | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

function AcknowledgeButton({ alert, onAcknowledge }: { alert: CooperativeAlert; onAcknowledge: (id: string) => void }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });
  }, []);

  if (acknowledged) {
    return (
      <Button variant="outline" size="sm" disabled>
        ✓ Acknowledged
      </Button>
    );
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={async () => {
        setLoading(true);
        await onAcknowledge(alert.id);
        setAcknowledged(true);
        setLoading(false);
      }}
      disabled={loading}
    >
      {loading ? 'Acknowledging...' : 'Acknowledge'}
    </Button>
  );
}

export function CooperativeAlertsManager() {
  const [alerts, setAlerts] = useState<CooperativeAlert[]>([]);
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
        .from('active_cooperative_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setAlerts((data || []) as CooperativeAlert[]);
    } catch (error) {
      console.error('Error fetching cooperative alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.rpc('acknowledge_cooperative_alert', {
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

  const normalizeSeverity = (
    severity: string
  ): 'critical' | 'high' | 'medium' | 'low' | 'unknown' => {
    const s = (severity || '').toLowerCase();
    if (s === 'critical' || s === 'high' || s === 'medium' || s === 'low') return s;
    return 'unknown';
  };

  const getSeverityVariant = (severity: string): 'default' | 'destructive' | 'outline' | 'secondary' => {
    switch (normalizeSeverity(severity)) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
      case 'low':
        return 'outline';
      default:
        // Fail closed — never style unknown severity as attention blue/yellow
        return 'secondary';
    }
  };

  const getSeverityBorder = (severity: string) => {
    switch (normalizeSeverity(severity)) {
      case 'critical':
        return 'border-destructive animate-pulse';
      case 'high':
        return 'border-orange-500';
      case 'medium':
      case 'low':
        return 'border-muted';
      default:
        return 'border-muted';
    }
  };

  const getSeverityLabel = (severity: string) => {
    const n = normalizeSeverity(severity);
    return n === 'unknown' ? 'SEVERITY UNKNOWN' : n.toUpperCase();
  };

  const getAlertTypeIcon = (alertType: string) => {
    switch (alertType) {
      case 'disease_outbreak':
      case 'pest_infestation':
        return '🐛';
      case 'weather_alert':
        return '🌦️';
      case 'treatment_success':
        return '✅';
      case 'best_practice':
        return '💡';
      default:
        return '📢';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Loading cooperative alerts...
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
            No Cooperative Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            All clear! No alerts from your cooperatives at this time.
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
            🚨 {criticalAlerts.length} Critical Cooperative Alert{criticalAlerts.length > 1 ? 's' : ''}
          </AlertTitle>
          <AlertDescription>
            Members of your cooperatives have reported critical issues requiring immediate attention.
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
                  <span className="text-2xl">{getAlertTypeIcon(alert.alert_type)}</span>
                  <CardTitle className="text-lg">{alert.title}</CardTitle>
                  <Badge variant={getSeverityVariant(alert.severity)}>
                    {getSeverityLabel(alert.severity)}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {alert.cooperative_name}
                  </div>
                  {alert.crop_type && (
                    <Badge variant="outline" className="text-xs">
                      {alert.crop_type}
                    </Badge>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed">{alert.message}</p>
            
            {alert.affected_area_acres && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Affected: {alert.affected_area_acres} acres</span>
              </div>
            )}

            {alert.recommended_action && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-semibold mb-1">Recommended Action:</p>
                <p className="text-sm text-muted-foreground">{alert.recommended_action}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="text-xs text-muted-foreground">
                {alert.created_by_name && `Shared by ${alert.created_by_name}`}
              </div>
              <div className="flex gap-2">
                {alert.field_id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/fields?field=${alert.field_id}`)}
                  >
                    View Field
                  </Button>
                )}
                <AcknowledgeButton alert={alert} onAcknowledge={acknowledgeAlert} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
