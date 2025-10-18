import { Camera, TrendingUp, MapPin, History } from 'lucide-react';
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
      icon: TrendingUp,
      label: 'Predict',
      path: '/predictions',
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

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-3 md:hidden">
      {actions.map((action) => {
        const isActive = location.pathname === action.path;
        if (isActive) return null; // Don't show button for current page
        
        const Icon = action.icon;
        return (
          <Button
            key={action.path}
            onClick={() => navigate(action.path)}
            size="icon"
            className={`h-14 w-14 rounded-full shadow-lg ${action.color}`}
            aria-label={action.label}
          >
            <Icon className="h-6 w-6" />
          </Button>
        );
      })}
    </div>
  );
}
