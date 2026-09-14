import { Camera, Cloud, MapPin, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

export default function MobileFloatingActions() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  const actions = [
    {
      icon: Camera,
      label: 'Scan',
      path: '/scanner',
      color: 'bg-primary text-primary-foreground hover:bg-primary/90',
    },
    {
      icon: Cloud,
      label: 'Weather',
      path: '/weather-timeline',
      color: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
    },
    {
      icon: MapPin,
      label: 'Map',
      path: '/field-map',
      color: 'bg-accent text-accent-foreground hover:bg-accent/90',
    },
    {
      icon: History,
      label: 'History',
      path: '/history',
      color: 'bg-muted text-muted-foreground hover:bg-muted/90',
    },
  ];

  const handleClick = (path: string) => {
    // Haptic feedback for mobile devices
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    navigate(path);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 md:hidden" role="navigation" aria-label="Quick actions">
      {actions.map((action) => {
        const isActive = location.pathname === action.path;
        if (isActive) return null; // Don't show button for current page
        
        const Icon = action.icon;
        return (
          <Button
            key={action.path}
            onClick={() => handleClick(action.path)}
            size="icon"
            className={`h-14 w-14 min-h-[56px] min-w-[56px] rounded-full shadow-lg hover:scale-110 transition-transform ${action.color}`}
            aria-label={`Navigate to ${action.label}`}
          >
            <Icon className="h-6 w-6" aria-hidden="true" />
          </Button>
        );
      })}
    </div>
  );
}
