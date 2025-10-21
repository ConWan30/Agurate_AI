import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Keyboard } from 'lucide-react';
import { Badge } from './ui/badge';

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const shortcuts = [
    { key: 'D', description: 'Go to Dashboard', path: '/dashboard' },
    { key: 'F', description: 'Go to Fields', path: '/fields' },
    { key: 'S', description: 'Go to Scanner', path: '/scanner' },
    { key: 'U', description: 'Go to Upload', path: '/upload' },
    { key: 'H', description: 'Go to History', path: '/history' },
    { key: 'A', description: 'Go to Analytics', path: '/analytics' },
    { key: 'P', description: 'Go to Predictions', path: '/predictions' },
    { key: 'M', description: 'Go to Field Map', path: '/field-map' },
    { key: '?', description: 'Show this help', path: null },
  ];

  const handleShortcutClick = (path: string | null) => {
    if (path) {
      navigate(path);
      setOpen(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Keyboard className="h-4 w-4" />
        <span className="hidden md:inline">Shortcuts</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Keyboard Shortcuts
            </DialogTitle>
            <DialogDescription>
              Quick navigation for power users
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {shortcuts.map((shortcut) => (
              <button
                key={shortcut.key}
                onClick={() => handleShortcutClick(shortcut.path)}
                disabled={!shortcut.path}
                className="flex items-center justify-between p-3 rounded-lg border w-full text-left hover:bg-accent hover:border-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-border"
              >
                <span className="text-sm">{shortcut.description}</span>
                <Badge variant="outline" className="font-mono">
                  {shortcut.key}
                </Badge>
              </button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            Press any key while not typing in an input field
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
