import { ReactElement } from 'react';
import PullToRefreshComponent from 'react-simple-pull-to-refresh';
import { RefreshCw } from 'lucide-react';
import { useHaptics } from '@/hooks/use-haptics';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactElement;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const { triggerHaptic } = useHaptics();

  const handleRefresh = async () => {
    triggerHaptic('light');
    await onRefresh();
    triggerHaptic('success');
  };

  return (
    <PullToRefreshComponent
      onRefresh={handleRefresh}
      pullingContent={
        <div className="flex flex-col items-center justify-center py-4">
          <RefreshCw className="h-6 w-6 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground mt-2">Pull to refresh</p>
        </div>
      }
      refreshingContent={
        <div className="flex flex-col items-center justify-center py-4">
          <RefreshCw className="h-6 w-6 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground mt-2">Refreshing...</p>
        </div>
      }
      resistance={2}
      maxPullDownDistance={95}
    >
      {children}
    </PullToRefreshComponent>
  );
}
