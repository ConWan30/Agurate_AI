import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface HistoricalDataPoint {
  date: string;
  health_score: number;
}

interface FieldComparison {
  id: string;
  name: string;
  avg_health: number;
}

interface HistoricalTrendProps {
  historicalData: HistoricalDataPoint[];
  trend: "improving" | "stable" | "declining";
  patternInsights: string;
  currentHealth: number;
  fieldComparison?: FieldComparison[];
}

export function HistoricalTrend({
  historicalData,
  trend,
  patternInsights,
  currentHealth,
  fieldComparison
}: HistoricalTrendProps) {
  const TrendIcon = 
    trend === "improving" ? TrendingUp :
    trend === "declining" ? TrendingDown : Minus;

  const trendColor = 
    trend === "improving" ? "text-primary" :
    trend === "declining" ? "text-destructive" : "text-muted-foreground";

  const HealthScoreBadge = ({ score }: { score: number }) => {
    const variant = score >= 80 ? "default" : score >= 60 ? "outline" : "destructive";
    return <Badge variant={variant}>{Math.round(score)}</Badge>;
  };

  if (!historicalData || historicalData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Field History Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No historical data available. Upload more images to see trends!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Field History Comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trend Chart */}
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={historicalData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => format(new Date(date), "MMM d")}
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              domain={[0, 100]} 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px"
              }}
              formatter={(value: number) => [`${Math.round(value)}%`, "Health Score"]}
              labelFormatter={(date) => format(new Date(date), "MMM d, yyyy")}
            />
            <Line 
              type="monotone" 
              dataKey="health_score" 
              stroke="hsl(142, 71%, 45%)" 
              strokeWidth={3}
              dot={{ fill: "hsl(142, 71%, 45%)", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
        
        {/* Trend Summary */}
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <TrendIcon className={`h-6 w-6 ${trendColor}`} />
            <span className="font-semibold text-lg">
              Trend: {trend === "improving" ? "Improving ↑" : trend === "stable" ? "Stable →" : "Declining ↓"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {patternInsights}
          </p>
        </div>
        
        {/* Field Comparison */}
        {fieldComparison && fieldComparison.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm font-semibold mb-3">Compared to Your Other Fields:</p>
            <div className="space-y-2">
              {fieldComparison.map((field) => {
                const difference = Math.abs(field.avg_health - currentHealth);
                const isHigher = field.avg_health > currentHealth;
                
                return (
                  <div key={field.id} className="flex justify-between items-center p-2 rounded hover:bg-muted/50">
                    <span className="text-sm font-medium">{field.name}</span>
                    <div className="flex items-center gap-3">
                      <HealthScoreBadge score={field.avg_health} />
                      <span className={`text-xs font-medium ${isHigher ? 'text-primary' : 'text-destructive'}`}>
                        {isHigher ? '↑' : '↓'} {difference.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
