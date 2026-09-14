import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedCard } from '@/components/ui/animated-card';
import { LoadingState } from '@/components/ui/loading-state';
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
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setSessionEmail(user?.email ?? null);
    });
  }, []);

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
      if (!user) throw new Error('Please log in with the invited email address to accept this invitation');
      if (!invitation) throw new Error('No invitation found');
      if (user.email && invitation.email && user.email.toLowerCase() !== invitation.email.toLowerCase()) {
        throw new Error(`Sign in as ${invitation.email} to accept this invitation (currently ${user.email})`);
      }

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
            <Users className="h-10 w-10 text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-heading font-bold mb-2">Join Cooperative</h1>
          <p className="text-muted-foreground">
            Enter your invitation code to join a farming cooperative
          </p>
        </div>

        {/* Manual Code Entry */}
        {!code && (
          <AnimatedCard>
            <CardHeader>
              <CardTitle className="text-lg font-heading">Enter Invitation Code</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="invite-code">Invitation Code</Label>
                  <Input
                    id="invite-code"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="e.g., abc123de"
                    className="font-mono focus-ring"
                    aria-label="Enter invitation code"
                  />
                </div>
              </div>
            </CardContent>
          </AnimatedCard>
        )}

        {/* Loading State */}
        {isLoading && manualCode && (
          <AnimatedCard>
            <CardContent className="pt-6 text-center py-12">
              <LoadingState message="Verifying invitation code..." />
            </CardContent>
          </AnimatedCard>
        )}

        {/* Error State */}
        {error && manualCode && (
          <AnimatedCard className="border-destructive">
            <CardContent className="pt-6 text-center py-12">
              <XCircle className="h-12 w-12 mx-auto mb-4 text-destructive" aria-hidden="true" />
              <p className="font-semibold mb-2">Invalid or Expired Invitation</p>
              <p className="text-sm text-muted-foreground">
                This invitation code is not valid or has expired. Please check with the person who invited you.
              </p>
            </CardContent>
          </AnimatedCard>
        )}

        {/* Valid Invitation */}
        {invitation && !isLoading && (
          <AnimatedCard className="border-primary">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 font-heading">
                    <Users className="h-5 w-5" aria-hidden="true" />
                    {invitation.cooperative?.name}
                  </CardTitle>
                  <CardDescription>{invitation.cooperative?.description}</CardDescription>
                </div>
                <Badge variant="default">Pending</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                <p className="text-sm text-muted-foreground">You've been invited to join:</p>
                <p className="font-semibold text-lg">{invitation.cooperative?.name}</p>
                <p className="text-xs text-muted-foreground">
                  This invite is bound to <span className="font-medium text-foreground">{invitation.email}</span>.
                  {sessionEmail
                    ? sessionEmail.toLowerCase() === invitation.email.toLowerCase()
                      ? ' You are signed in with a matching email.'
                      : ` You are signed in as ${sessionEmail} — switch accounts to accept.`
                    : ' Sign in with that email before accepting.'}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <p className="font-semibold">What you'll get:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-health-good mt-0.5" aria-hidden="true" />
                    <span>Access to shared cooperative analytics</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-health-good mt-0.5" aria-hidden="true" />
                    <span>Option to share your field data with members</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-health-good mt-0.5" aria-hidden="true" />
                    <span>Collaborative insights and benchmarking</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => acceptInvitation.mutate()}
                  disabled={
                    acceptInvitation.isPending
                    || !sessionEmail
                    || sessionEmail.toLowerCase() !== invitation.email.toLowerCase()
                  }
                  className="flex-1 gap-2 focus-ring"
                  aria-label="Accept invitation and join cooperative"
                >
                  {acceptInvitation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      Accept & Join
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/cooperatives')}
                  className="flex-1 focus-ring"
                  aria-label="Decline invitation"
                >
                  Decline
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Invitation expires: <time dateTime={invitation.expires_at}>{new Date(invitation.expires_at).toLocaleDateString()}</time>
              </p>
            </CardContent>
          </AnimatedCard>
        )}

        <div className="text-center">
          <Button variant="link" onClick={() => navigate('/')} className="focus-ring" aria-label="Return to home page">
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}