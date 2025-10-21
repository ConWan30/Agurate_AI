import localforage from 'localforage';

// Configure localforage
const offlineStore = localforage.createInstance({
  name: 'agurateai',
  storeName: 'offline_data',
  description: 'Offline storage for AgurateAI assessments and field data'
});

const syncQueue = localforage.createInstance({
  name: 'agurateai',
  storeName: 'sync_queue',
  description: 'Queue for pending uploads to sync when online'
});

export interface OfflineAssessment {
  id: string;
  fieldId: string;
  imageData: string;
  timestamp: string;
  synced: boolean;
}

export interface SyncQueueItem {
  id: string;
  type: 'assessment' | 'field' | 'claim';
  data: any;
  timestamp: string;
  retryCount: number;
}

// Store assessment offline
export const storeOfflineAssessment = async (assessment: OfflineAssessment): Promise<void> => {
  await offlineStore.setItem(`assessment_${assessment.id}`, assessment);
  
  // Add to sync queue
  const queueItem: SyncQueueItem = {
    id: assessment.id,
    type: 'assessment',
    data: assessment,
    timestamp: new Date().toISOString(),
    retryCount: 0
  };
  await syncQueue.setItem(`queue_${assessment.id}`, queueItem);
};

// Get all offline assessments
export const getOfflineAssessments = async (): Promise<OfflineAssessment[]> => {
  const assessments: OfflineAssessment[] = [];
  await offlineStore.iterate((value: any) => {
    if (value && typeof value === 'object' && 'imageData' in value) {
      assessments.push(value as OfflineAssessment);
    }
  });
  return assessments;
};

// Get sync queue items
export const getSyncQueue = async (): Promise<SyncQueueItem[]> => {
  const items: SyncQueueItem[] = [];
  await syncQueue.iterate((value: any) => {
    items.push(value as SyncQueueItem);
  });
  return items.sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
};

// Remove from sync queue after successful sync
export const removeFromSyncQueue = async (id: string): Promise<void> => {
  await syncQueue.removeItem(`queue_${id}`);
  
  // Mark as synced in offline store
  const assessment = await offlineStore.getItem<OfflineAssessment>(`assessment_${id}`);
  if (assessment) {
    assessment.synced = true;
    await offlineStore.setItem(`assessment_${id}`, assessment);
  }
};

// Increment retry count
export const incrementRetryCount = async (id: string): Promise<void> => {
  const item = await syncQueue.getItem<SyncQueueItem>(`queue_${id}`);
  if (item) {
    item.retryCount++;
    await syncQueue.setItem(`queue_${id}`, item);
  }
};

// Clear synced items older than 30 days
export const cleanupOldData = async (): Promise<void> => {
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  
  await offlineStore.iterate((value: any, key: string) => {
    if (value && value.synced && value.timestamp) {
      const itemDate = new Date(value.timestamp).getTime();
      if (itemDate < thirtyDaysAgo) {
        offlineStore.removeItem(key);
      }
    }
  });
};

// Check if online
export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Setup online/offline event listeners
export const setupNetworkListeners = (
  onOnline: () => void,
  onOffline: () => void
) => {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
};
