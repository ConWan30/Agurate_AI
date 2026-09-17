// A deploy replaces hashed page chunks. A browser (or its service worker) holding
// an older index.html then requests a chunk that no longer exists, React's lazy()
// import rejects, and the user sees a blank screen. Recover by clearing caches and
// reloading once so the freshest index.html and chunks are fetched.
const RELOAD_FLAG = 'agurate:chunk-recovery-reloaded';

async function recover() {
  if (sessionStorage.getItem(RELOAD_FLAG)) return; // avoid reload loops
  sessionStorage.setItem(RELOAD_FLAG, '1');

  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch {
    // Cache/SW cleanup is best-effort; reload regardless.
  }

  window.location.reload();
}

function isChunkLoadError(message: string) {
  return (
    /Failed to fetch dynamically imported module/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message) ||
    /ChunkLoadError/i.test(message)
  );
}

export function installChunkRecovery() {
  if (typeof window === 'undefined') return;

  // Vite's own preload failure event fires before the lazy import rejects.
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    void recover();
  });

  window.addEventListener('error', (event) => {
    if (event.message && isChunkLoadError(event.message)) void recover();
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = typeof reason === 'string' ? reason : reason?.message ?? '';
    if (isChunkLoadError(message)) void recover();
  });

  // A successful load means we are on fresh assets again.
  window.addEventListener('load', () => {
    setTimeout(() => sessionStorage.removeItem(RELOAD_FLAG), 5000);
  });
}
