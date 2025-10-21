import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Keyboard } from 'lucide-react';
import { Badge } from './ui/badge';

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);

  const shortcuts = [
    { key: 'D', description: 'Go to Dashboard' },
    { key: 'F', description: 'Go to Fields' },
    { key: 'S', description: 'Go to Scanner' },
    { key: 'U', description: 'Go to Upload' },
    { key: 'H', description: 'Go to History' },
    { key: 'A', description: 'Go to Analytics' },
    { key: 'P', description: 'Go to Predictions' },
    { key: 'M', description: 'Go to Field Map' },
    { key: '?', description: 'Show this help' },
  ];

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
              <div 
                key={shortcut.key}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <span className="text-sm">{shortcut.description}</span>
                <Badge variant="outline" className="font-mono">
                  {shortcut.key}
                </Badge>
              </div>
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
