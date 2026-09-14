import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Copy, Mail, Check } from 'lucide-react';
import { toast } from 'sonner';

type InviteDialogProps = {
  cooperativeId: string;
  cooperativeName: string;
  open: boolean;
  onClose: () => void;
};

export function CooperativeInviteDialog({ cooperativeId, cooperativeName, open, onClose }: InviteDialogProps) {
  const [email, setEmail] = useState('');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const createInvite = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('cooperative_invitations')
        .insert({
          cooperative_id: cooperativeId,
          email,
          invited_by: user?.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setInviteCode(data.invite_code);
      toast.success('Invitation created successfully');
      setEmail('');
    },
    onError: (error: any) => {
      if (error.message.includes('duplicate')) {
        toast.error('This email has already been invited');
      } else {
        toast.error('Failed to create invitation');
      }
    }
  });

  const copyInviteLink = () => {
    if (!inviteCode) return;
    const inviteLink = `${window.location.origin}/cooperatives/join/${inviteCode}`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success('Invite link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Members to {cooperativeName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Email Invite */}
          <div>
            <Label>Invite by Email</Label>
            <div className="flex gap-2 mt-2">
              <Input
                type="email"
                placeholder="farmer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    createInvite.mutate();
                  }
                }}
              />
              <Button
                onClick={() => createInvite.mutate()}
                disabled={!email || createInvite.isPending}
                className="gap-2"
              >
                <Mail className="h-4 w-4" />
                Invite
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Share the code or link below. The invitee must sign in with this same email to join.
            </p>
          </div>

          {/* Invite Link */}
          {inviteCode && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6 space-y-3">
                <div>
                  <Label className="text-xs">Invitation Code</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={inviteCode}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyInviteLink}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Full Invite Link</Label>
                  <div className="mt-1 p-2 bg-background rounded-md">
                    <p className="text-xs font-mono break-all">
                      {window.location.origin}/cooperatives/join/{inviteCode}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  ⏰ This invitation expires in 7 days
                </p>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-semibold">How it works:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Enter the farmer's email address and click "Invite"</li>
              <li>Share the invitation code or link with them (no email is sent automatically)</li>
              <li>They must sign in with the invited email, then use the code or link to join</li>
              <li>Once accepted, they can share their fields with the co-op</li>
            </ol>
          </div>

          <Button variant="outline" onClick={onClose} className="w-full">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}