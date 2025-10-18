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
import { Users, Plus, Building2, BarChart3, TrendingUp } from 'lucide-react';

export default function Cooperatives() {
  const [open, setOpen] = useState(false);
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
    <div className="min-h-screen bg-gradient-subtle pb-24">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-display font-bold text-gradient-delta">
              Cooperatives
            </h1>
            <p className="text-muted-foreground mt-2">
              Multi-farm management and collaborative analytics
            </p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
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
      </div>
    </div>
  );
}
