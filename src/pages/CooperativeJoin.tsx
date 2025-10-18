import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Users, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CooperativeJoin() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [manualCode, setManualCode] = useState(code || '');

  const { data: invitation, isLoading, error } = useQuery({
    queryKey: ['invitation', manualCode],
    queryFn: async () => {
      if (!manualCode) return null;
      
      const { data, error } = await supabase
        .from('cooperative_invitations')
        .select(`
          *,
          cooperative:cooperatives(name, description)
        `)
        .eq('invite_code', manualCode)
        .eq('status', 'pending')
        .single();
      
      if (error) throw error;

      // Check if expired
      if (new Date(data.expires_at) < new Date()) {
        throw new Error('This invitation has expired');
      }

      return data;
    },
    enabled: !!manualCode,
    retry: false
  });

  const acceptInvitation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please log in to accept this invitation');
      if (!invitation) throw new Error('No invitation found');

      // Add user to cooperative
      const { error: memberError } = await supabase
        .from('cooperative_members')
        .insert({
          cooperative_id: invitation.cooperative_id,
          user_id: user.id,
          role: 'member'
        });
      
      if (memberError) throw memberError;

      // Update invitation status
      const { error: updateError } = await supabase
        .from('cooperative_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id);
      
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast.success('Successfully joined cooperative!');
      setTimeout(() => navigate('/cooperatives'), 1500);
    },
    onError: (error: any) => {
      if (error.message.includes('duplicate')) {
        toast.error('You are already a member of this cooperative');
      } else {
        toast.error(error.message || 'Failed to join cooperative');
      }
    }
  });

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-2xl mb-4">
            <Users className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold mb-2">Join Cooperative</h1>
          <p className="text-muted-foreground">
            Enter your invitation code to join a farming cooperative
          </p>
        </div>

        {/* Manual Code Entry */}
        {!code && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Enter Invitation Code</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Invitation Code</Label>
                  <Input
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="e.g., abc123de"
                    className="font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && manualCode && (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
              <p className="text-muted-foreground">Verifying invitation code...</p>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && manualCode && (
          <Card className="border-destructive">
            <CardContent className="pt-6 text-center py-12">
              <XCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <p className="font-semibold mb-2">Invalid or Expired Invitation</p>
              <p className="text-sm text-muted-foreground">
                This invitation code is not valid or has expired. Please check with the person who invited you.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Valid Invitation */}
        {invitation && !isLoading && (
          <Card className="border-primary">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {invitation.cooperative?.name}
                  </CardTitle>
                  <CardDescription>{invitation.cooperative?.description}</CardDescription>
                </div>
                <Badge variant="default">Pending</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-primary/5 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">You've been invited to join:</p>
                <p className="font-semibold text-lg">{invitation.cooperative?.name}</p>
              </div>

              <div className="space-y-2 text-sm">
                <p className="font-semibold">What you'll get:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Access to shared cooperative analytics</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Option to share your field data with members</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Collaborative insights and benchmarking</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => acceptInvitation.mutate()}
                  disabled={acceptInvitation.isPending}
                  className="flex-1 gap-2"
                >
                  {acceptInvitation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Accept & Join
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/cooperatives')}
                  className="flex-1"
                >
                  Decline
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Invitation expires: {new Date(invitation.expires_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <Button variant="link" onClick={() => navigate('/')}>
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}