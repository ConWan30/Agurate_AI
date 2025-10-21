import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wifi, Download, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function InstallPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const navigate = useNavigate();

  const handleInstall = async () => {
    if (!deferredPrompt) {
      alert('Installation is available on mobile devices or when using a compatible browser');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-2">
        <CardHeader>
          <CardTitle className="text-3xl flex items-center gap-3">
            <Download className="h-8 w-8 text-primary" />
            Install AgurateAI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="font-semibold mb-2 flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Why Install?
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary">✓</span>
                <span>Works offline in areas with poor connectivity</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">✓</span>
                <span>Faster load times and app-like experience</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">✓</span>
                <span>Access from your home screen like a native app</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">✓</span>
                <span>Automatic updates in the background</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Installation Instructions</h3>
            
            <div className="space-y-4">
              <div className="p-3 border rounded-lg">
                <p className="font-medium mb-2">📱 On iPhone/iPad (Safari)</p>
                <ol className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>1. Tap the Share button at the bottom</li>
                  <li>2. Scroll down and tap "Add to Home Screen"</li>
                  <li>3. Tap "Add" in the top right</li>
                </ol>
              </div>

              <div className="p-3 border rounded-lg">
                <p className="font-medium mb-2">🤖 On Android (Chrome)</p>
                <ol className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>1. Tap the menu (three dots) in the top right</li>
                  <li>2. Tap "Add to Home screen" or "Install app"</li>
                  <li>3. Tap "Add" or "Install"</li>
                </ol>
              </div>

              <div className="p-3 border rounded-lg">
                <p className="font-medium mb-2">💻 On Desktop (Chrome/Edge)</p>
                <ol className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>1. Click the install icon in the address bar</li>
                  <li>2. Click "Install" in the popup</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleInstall} className="flex-1 gap-2">
              <Download className="h-4 w-4" />
              Install Now
            </Button>
            <Button onClick={() => navigate('/')} variant="outline">
              Maybe Later
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
            <Wifi className="h-4 w-4" />
            <span>Works offline after installation</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
