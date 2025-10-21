import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { setupNetworkListeners, getSyncQueue, isOnline } from '@/lib/offlineStorage';

export default function NetworkStatus() {
  const [online, setOnline] = useState(isOnline());
  const [syncPending, setSyncPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const cleanup = setupNetworkListeners(
      () => {
        setOnline(true);
        toast.success('Back online - ready to sync');
        checkSyncQueue();
      },
      () => {
        setOnline(false);
        toast.info('Offline mode - data will sync when connected');
      }
    );

    checkSyncQueue();
    return cleanup;
  }, []);

  const checkSyncQueue = async () => {
    const queue = await getSyncQueue();
    setSyncPending(queue.length);
  };

  const handleSync = async () => {
    if (!online) {
      toast.error('Cannot sync while offline');
      return;
    }

    setSyncing(true);
    toast.info('Syncing pending data...');
    
    // Simulate sync - in real app, this would sync with Supabase
    setTimeout(async () => {
      await checkSyncQueue();
      setSyncing(false);
      toast.success('Sync complete');
    }, 2000);
  };

  if (online && syncPending === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      <Badge 
        variant={online ? "default" : "destructive"}
        className="gap-2 px-3 py-2 shadow-lg animate-fade-in"
      >
        {online ? (
          <>
            <Wifi className="h-3 w-3" aria-hidden="true" />
            Online
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" aria-hidden="true" />
            Offline
          </>
        )}
      </Badge>

      {syncPending > 0 && (
        <>
          <Badge variant="outline" className="gap-2 px-3 py-2 shadow-lg">
            {syncPending} pending
          </Badge>
          
          {online && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSync}
              disabled={syncing}
              className="gap-2 shadow-lg"
              aria-label="Sync pending data"
            >
              <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} aria-hidden="true" />
              Sync
            </Button>
          )}
        </>
      )}
    </div>
  );
}
