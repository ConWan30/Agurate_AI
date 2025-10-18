import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Users, Plus, Building2, BarChart3, TrendingUp, UserPlus } from 'lucide-react';
import { CooperativeInviteDialog } from '@/components/CooperativeInviteDialog';

export default function Cooperatives() {
  const [open, setOpen] = useState(false);
  const [inviteCoopId, setInviteCoopId] = useState<string | null>(null);
  const [inviteCoopName, setInviteCoopName] = useState('');
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
      const { data, error } = await supabase
        .from('cooperative_members')
        .select(`
          *,
          cooperative:cooperatives(*)
        `)
        .eq('user_id', user?.id || '');
      
      if (error) throw error;
      return data;
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

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from('cooperative_members')
        .insert([{
          cooperative_id: coop.id,
          user_id: user?.id || '',
          role: 'admin'
        }]);
      
      if (memberError) throw memberError;
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
          // Get all fields in this cooperative
          const { data: fields } = await supabase
            .from('fields')
            .select('id, acreage')
            .eq('cooperative_id', coop.id);

          // Get recent assessments for cooperative fields
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

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl gradient-delta p-8 md:p-12 shadow-glow">
        <div className="relative z-10 flex flex-col md:flex-row items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-3">
              Farming Cooperatives
            </h1>
            <p className="text-white/90 text-base md:text-lg max-w-2xl">
              Multi-farm management and collaborative analytics for the Louisiana Delta
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" className="gap-2 flex-shrink-0">
                <Plus className="h-4 w-4" />
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

      {/* Educational Section */}
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
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm font-medium text-blue-700 mb-1">📊 Better Decisions</p>
                <p className="text-sm text-muted-foreground">
                  Compare your crop performance against cooperative averages to identify what is working
                </p>
              </div>
              
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm font-medium text-green-700 mb-1">💰 Cost Savings</p>
                <p className="text-sm text-muted-foreground">
                  Pool purchasing power for bulk discounts on fertilizer, seeds, and treatments
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* My Memberships */}
        {myMemberships && myMemberships.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-2xl font-display font-bold">My Cooperatives</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {myMemberships.map(membership => (
                <Card key={membership.id} className="field-card">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {membership.cooperative?.name}
                      </CardTitle>
                      <Badge variant={membership.role === 'admin' ? 'default' : 'secondary'}>
                        {membership.role}
                      </Badge>
                    </div>
                    <CardDescription>{membership.cooperative?.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* All Cooperatives */}
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
