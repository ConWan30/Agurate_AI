import { LucideIcon } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  secondary?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  secondary = false
}: EmptyStateProps) {
  return (
    <Card className={cn('border-2 border-dashed', className)}>
      <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className={cn(
          'flex items-center justify-center rounded-full mb-6 animate-float',
          secondary 
            ? 'h-20 w-20 bg-secondary/20' 
            : 'h-24 w-24 bg-primary/10'
        )}>
          <Icon className={cn(
            secondary ? 'h-10 w-10 text-secondary' : 'h-12 w-12 text-primary'
          )} />
        </div>
        
        <h3 className="text-2xl font-display font-bold mb-3">{title}</h3>
        <p className="text-muted-foreground max-w-md mb-6 leading-relaxed">
          {description}
        </p>
        
        {actionLabel && onAction && (
          <Button 
            onClick={onAction} 
            size="lg"
            className="gap-2 shadow-glow hover:shadow-field hover-lift"
          >
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
