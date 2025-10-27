import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BestPractice } from '@/types/enhanced-features';
import { CommunityInsightsCard } from '@/components/CommunityInsightsCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, DollarSign, Award, Filter } from 'lucide-react';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function CommunityInsights() {
  const [bestPractices, setBestPractices] = useState<BestPractice[]>([]);
  const [adoptionMetrics, setAdoptionMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cropFilter, setCropFilter] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: practicesData }, { data: metricsData }] = await Promise.all([
        supabase.from('best_practices_network').select('*').order('adoption_count', { ascending: false }),
        supabase.from('conservation_adoption_metrics').select('*').order('total_adopters', { ascending: false })
      ]);

      if (practicesData) setBestPractices(practicesData);
      if (metricsData) setAdoptionMetrics(metricsData);
    } catch (error) {
      console.error('Error fetching community data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPractices = cropFilter === 'all'
    ? bestPractices
    : bestPractices.filter(p => p.practice_name.toLowerCase().includes(cropFilter.toLowerCase()));

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <div className="grid gap-6 md:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-white shadow-glow">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm">
              <Users className="h-6 w-6" />
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
              Cooperative Intelligence Network
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-3">
            Community Insights
          </h1>
          <p className="text-lg text-white/90 max-w-2xl">
            Learn from successful farming practices shared by Louisiana Delta farmers in your cooperative network
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float" />
      </div>

      {/* Adoption Metrics Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Adopters</p>
                <p className="text-2xl font-bold">
                  {adoptionMetrics.reduce((sum, m) => sum + m.total_adopters, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-accent/10">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Acres</p>
                <p className="text-2xl font-bold">
                  {adoptionMetrics.reduce((sum, m) => sum + Number(m.total_acres), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-secondary/10">
                <DollarSign className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Savings</p>
                <p className="text-2xl font-bold">
                  ${(adoptionMetrics.reduce((sum, m) => sum + Number(m.average_savings), 0) / (adoptionMetrics.length || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <Select value={cropFilter} onValueChange={setCropFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by crop" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Crops</SelectItem>
                <SelectItem value="rice">Rice</SelectItem>
                <SelectItem value="soybean">Soybeans</SelectItem>
                <SelectItem value="cotton">Cotton</SelectItem>
                <SelectItem value="corn">Corn</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Best Practices Grid */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
            <Award className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold">Proven Best Practices</h2>
            <p className="text-sm text-muted-foreground">LSU-validated techniques with real farmer results</p>
          </div>
        </div>

        {filteredPractices.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No practices found"
            description="No community insights available for the selected filter"
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredPractices.map((practice) => (
              <CommunityInsightsCard key={practice.id} practice={practice} />
            ))}
          </div>
        )}
      </div>

      {/* Privacy Notice */}
      <Card className="bg-muted/50 border-muted">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 flex-shrink-0">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold mb-2">Privacy & Data Aggregation</h3>
              <p className="text-sm text-muted-foreground mb-3">
                All community insights are derived from anonymized, aggregated data from farmers in your cooperative network. 
                No individual farmer data or field locations are ever shared.
              </p>
              <p className="text-sm text-muted-foreground">
                Only farmers who opt-in to data sharing contribute to these insights. You maintain complete control 
                over your data sharing preferences in your cooperative settings.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
