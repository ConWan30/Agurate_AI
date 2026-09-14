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
        toast.success('Back online');
        checkSyncQueue();
      },
      () => {
        setOnline(false);
        toast.info('Offline — new scans need a connection; queued items stay on this device until synced');
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
    try {
      const queue = await getSyncQueue();
      if (queue.length === 0) {
        toast.message('Nothing queued to sync');
        return;
      }
      // Automatic upload of queued offline captures is not enabled yet.
      toast.message('Offline queue is stored on this device', {
        description: `${queue.length} item(s) waiting. Re-run scans while online to upload — auto-sync is not enabled yet.`,
      });
      await checkSyncQueue();
    } finally {
      setSyncing(false);
    }
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
