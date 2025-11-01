import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedCard } from '@/components/ui/animated-card';
import { LoadingState } from '@/components/ui/loading-state';
import { AgriculturalBadge } from '@/components/ui/agricultural-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Users, Plus, Building2, BarChart3, TrendingUp, UserPlus, Award, Filter, DollarSign } from 'lucide-react';
import { CooperativeInviteDialog } from '@/components/CooperativeInviteDialog';
import { CommunityInsightsCard } from '@/components/CommunityInsightsCard';
import { BestPractice } from '@/types/enhanced-features';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TutorialTooltip from '@/components/TutorialTooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import bgCooperativeCommunity from '@/assets/bg-cooperative-community.jpg';

export default function Cooperatives() {
  const [open, setOpen] = useState(false);
  const [inviteCoopId, setInviteCoopId] = useState<string | null>(null);
  const [inviteCoopName, setInviteCoopName] = useState('');
  const [bestPractices, setBestPractices] = useState<BestPractice[]>([]);
  const [adoptionMetrics, setAdoptionMetrics] = useState<any[]>([]);
  const [cropFilter, setCropFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  const { data: cooperatives } = useQuery({
    queryKey: ['cooperatives'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cooperatives')
        .select(`
          *,
          members:cooperative_members(count),
          cooperative_fields:fields(count)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: myMemberships } = useQuery({
    queryKey: ['my-memberships'],
    queryFn: async () => {
      const { data: memberships, error: memberError } = await supabase
        .from('cooperative_members')
        .select(`
          *,
          cooperative:cooperatives(*)
        `)
        .eq('user_id', user?.id || '');
      
      if (memberError) throw memberError;

      const { data: roles, error: roleError } = await supabase
        .from('cooperative_roles' as any)
        .select('cooperative_id, role')
        .eq('user_id', user?.id || '');
      
      if (roleError) throw roleError;

      return memberships?.map(m => ({
        ...m,
        role: (roles as any)?.find((r: any) => r.cooperative_id === m.cooperative_id)?.role || 'member'
      }));
    },
    enabled: !!user
  });

  const createCooperative = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data: coop, error: coopError } = await supabase
        .from('cooperatives')
        .insert([{
          name: formData.get('name') as string,
          description: formData.get('description') as string,
          created_by: user?.id || ''
        }])
        .select()
        .single();
      
      if (coopError) throw coopError;

      const { error: memberError } = await supabase
        .from('cooperative_members')
        .insert([{
          cooperative_id: coop.id,
          user_id: user?.id || ''
        }]);
      
      if (memberError) throw memberError;

      const { error: roleError } = await supabase
        .from('cooperative_roles' as any)
        .insert([{
          cooperative_id: coop.id,
          user_id: user?.id || '',
          role: 'admin'
        }]);
      
      if (roleError) throw roleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cooperatives'] });
      queryClient.invalidateQueries({ queryKey: ['my-memberships'] });
      toast.success('Cooperative created successfully');
      setOpen(false);
    }
  });

  const { data: cooperativeStats } = useQuery({
    queryKey: ['cooperative-stats'],
    queryFn: async () => {
      if (!cooperatives?.length) return null;

      const stats = await Promise.all(
        cooperatives.map(async (coop) => {
          const { data: fields } = await supabase
            .from('fields')
            .select('id, acreage')
            .eq('cooperative_id', coop.id);

          const fieldIds = fields?.map(f => f.id) || [];
          const { data: assessments } = await supabase
            .from('assessments')
            .select('health_score')
            .in('field_id', fieldIds)
            .order('analyzed_at', { ascending: false })
            .limit(50);

          const totalAcreage = fields?.reduce((sum, f) => sum + (Number(f.acreage) || 0), 0) || 0;
          const avgHealth = assessments?.length 
            ? assessments.reduce((sum, a) => sum + (Number(a.health_score) || 0), 0) / assessments.length
            : 0;

          return {
            cooperative_id: coop.id,
            total_acreage: totalAcreage,
            field_count: fields?.length || 0,
            avg_health: Math.round(avgHealth)
          };
        })
      );

      return stats;
    },
    enabled: !!cooperatives?.length
  });

  useEffect(() => {
    const fetchCommunityData = async () => {
      try {
        const [{ data: practicesData }, { data: metricsData }] = await Promise.all([
          supabase.from('best_practices_network').select('*').order('adoption_count', { ascending: false }),
          supabase.from('conservation_adoption_metrics').select('*').order('total_adopters', { ascending: false })
        ]);

        if (practicesData) setBestPractices(practicesData);
        if (metricsData) setAdoptionMetrics(metricsData);
      } catch (error) {
        console.error('Error fetching community data:', error);
      }
    };

    fetchCommunityData();
  }, []);

  const filteredPractices = cropFilter === 'all'
    ? bestPractices
    : bestPractices.filter(p => p.practice_name.toLowerCase().includes(cropFilter.toLowerCase()));

  return (
    <div className="space-y-8">
      <TutorialTooltip
        steps={[
          { id: "welcome", title: "Welcome to Cooperatives!", content: "Join or create farming networks to share insights with neighboring farms", position: "bottom" },
          { id: "create", title: "Create Cooperative", content: "Start your own multi-farm network for collaborative intelligence", position: "bottom" },
          { id: "stats", title: "View Stats", content: "See aggregate health data, total acreage, and member insights", position: "bottom" },
          { id: "insights", title: "Community Insights", content: "Access shared best practices and early disease outbreak warnings", position: "bottom" },
          { id: "invite", title: "Invite Members", content: "Grow your cooperative with email invitations for better analytics", position: "bottom" }
        ]}
        storageKey="tutorial-cooperatives-shown"
      />
      <div
        className="relative overflow-hidden rounded-2xl p-8 md:p-12 shadow-glow"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(45, 106, 79, 0.92) 0%, rgba(27, 64, 48, 0.88) 100%), url(${bgCooperativeCommunity})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-white mb-3">
              Cooperatives & Community Intelligence
            </h1>
            <p className="text-white/90 text-base md:text-lg max-w-2xl">
              Multi-farm management, collaborative analytics, and shared best practices for the Louisiana Delta
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" className="gap-2 flex-shrink-0 focus-ring" aria-label="Create new cooperative">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Create Cooperative
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Cooperative</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                createCooperative.mutate(formData);
              }} className="space-y-4">
                <div>
                  <Label>Cooperative Name</Label>
                  <Input name="name" placeholder="Delta Farmers Co-op" required />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea 
                    name="description" 
                    rows={3} 
                    placeholder="Collaborative farming network for Louisiana Delta region..."
                  />
                </div>
                <Button type="submit" className="w-full">Create Cooperative</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <Tabs defaultValue="cooperatives" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cooperatives" className="gap-2 focus-ring">
            <Building2 className="h-4 w-4" aria-hidden="true" />
            My Cooperatives
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2 focus-ring">
            <Award className="h-4 w-4" aria-hidden="true" />
            Community Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cooperatives" className="space-y-8">
          <Card className="field-card bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                What are Farming Cooperatives?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Purpose</h3>
                  <p className="text-sm text-muted-foreground">
                    Join forces with neighboring farmers to share insights, aggregate data, and make 
                    better decisions together. Cooperatives enable multi-farm analytics, bulk purchasing 
                    recommendations, and community-wide crop health monitoring across the Louisiana Delta.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Who Benefits?</h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Farm managers</strong> overseeing multiple properties</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Neighboring farms</strong> sharing resources and knowledge</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Family operations</strong> managing inherited land across parishes</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">How It Works</h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="p-3 bg-background rounded-lg">
                    <div className="font-semibold text-primary mb-1">1. Create Co-op</div>
                    <p className="text-muted-foreground">
                      Start a cooperative and invite other farmers to join your network
                    </p>
                  </div>
                  <div className="p-3 bg-background rounded-lg">
                    <div className="font-semibold text-primary mb-1">2. Link Fields</div>
                    <p className="text-muted-foreground">
                      Members can optionally assign their fields to the cooperative for shared analytics
                    </p>
                  </div>
                  <div className="p-3 bg-background rounded-lg">
                    <div className="font-semibold text-primary mb-1">3. Analyze Together</div>
                    <p className="text-muted-foreground">
                      View aggregate health scores, total acreage, and comparative insights across all member farms
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-secondary/10 border border-secondary/20 rounded-lg">
                  <p className="text-sm font-medium text-secondary mb-1">📊 Better Decisions</p>
                  <p className="text-sm text-muted-foreground">
                    Compare your crop performance against cooperative averages to identify what is working
                  </p>
                </div>
                <div className="p-4 bg-health-good/10 border border-health-good/20 rounded-lg">
                  <p className="text-sm font-medium text-health-good mb-1">💰 Cost Savings</p>
                  <p className="text-sm text-muted-foreground">
                    Pool purchasing power for bulk discounts on fertilizer, seeds, and treatments
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {myMemberships && myMemberships.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-2xl font-heading font-bold">My Cooperatives</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {myMemberships.map((membership, idx) => (
                  <AnimatedCard key={membership.id} delay={idx * 100}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="font-heading flex items-center gap-2">
                          <Users className="h-5 w-5" aria-hidden="true" />
                          {membership.cooperative?.name}
                        </CardTitle>
                        <AgriculturalBadge type={membership.role === 'admin' ? 'healthy' : 'growing'}>
                          {membership.role}
                        </AgriculturalBadge>
                      </div>
                      <CardDescription>{membership.cooperative?.description}</CardDescription>
                    </CardHeader>
                    {membership.role === 'admin' && (
                      <CardContent>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-2 focus-ring"
                          onClick={() => {
                            setInviteCoopId(membership.cooperative?.id || '');
                            setInviteCoopName(membership.cooperative?.name || '');
                          }}
                          aria-label="Invite members to cooperative"
                        >
                          <UserPlus className="h-4 w-4" aria-hidden="true" />
                          Invite Members
                        </Button>
                      </CardContent>
                    )}
                  </AnimatedCard>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-4">
            <h2 className="text-2xl font-display font-bold">All Cooperatives</h2>
            {cooperatives?.length === 0 ? (
              <Card className="field-card">
                <CardContent className="pt-6 text-center py-12">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No cooperatives yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Create a cooperative to manage multiple farms collaboratively
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {cooperatives?.map(coop => {
                  const stats = cooperativeStats?.find(s => s.cooperative_id === coop.id);
                  return (
                    <Card key={coop.id} className="field-card hover-lift">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Building2 className="h-5 w-5" />
                              {coop.name}
                            </CardTitle>
                            <CardDescription>{coop.description}</CardDescription>
                          </div>
                          <Badge variant="outline">
                            {coop.members?.[0]?.count || 0} members
                          </Badge>
                        </div>
                      </CardHeader>
                      {stats && (
                        <CardContent>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 bg-muted/50 rounded-lg text-center">
                              <div className="flex items-center justify-center gap-2 mb-1">
                                <BarChart3 className="h-4 w-4 text-primary" />
                                <span className="text-2xl font-bold">{stats.field_count}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">Fields</p>
                            </div>
                            <div className="p-4 bg-muted/50 rounded-lg text-center">
                              <div className="flex items-center justify-center gap-2 mb-1">
                                <Building2 className="h-4 w-4 text-primary" />
                                <span className="text-2xl font-bold">{Math.round(stats.total_acreage)}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">Total Acres</p>
                            </div>
                            <div className="p-4 bg-muted/50 rounded-lg text-center">
                              <div className="flex items-center justify-center gap-2 mb-1">
                                <TrendingUp className="h-4 w-4 text-primary" />
                                <span className="text-2xl font-bold">{stats.avg_health}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">Avg Health</p>
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        </TabsContent>

        <TabsContent value="insights" className="space-y-8">
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
              <Card className="field-card">
                <CardContent className="pt-6 text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No practices found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    No community insights available for the selected filter
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {filteredPractices.map((practice) => (
                  <CommunityInsightsCard key={practice.id} practice={practice} />
                ))}
              </div>
            )}
          </div>

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
        </TabsContent>
      </Tabs>

      {inviteCoopId && (
        <CooperativeInviteDialog
          cooperativeId={inviteCoopId}
          cooperativeName={inviteCoopName}
          open={!!inviteCoopId}
          onClose={() => {
            setInviteCoopId(null);
            setInviteCoopName('');
          }}
        />
      )}
    </div>
  );
}
