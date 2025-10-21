import { ReactNode, useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/use-haptics';

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
}

export function SwipeableCard({ 
  children, 
  onSwipeLeft, 
  onSwipeRight,
  className 
}: SwipeableCardProps) {
  const [swiping, setSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const { triggerHaptic } = useHaptics();

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      setSwiping(true);
      setSwipeOffset(eventData.deltaX);
    },
    onSwipedLeft: () => {
      if (onSwipeLeft && Math.abs(swipeOffset) > 100) {
        triggerHaptic('light');
        onSwipeLeft();
      }
      setSwiping(false);
      setSwipeOffset(0);
    },
    onSwipedRight: () => {
      if (onSwipeRight && Math.abs(swipeOffset) > 100) {
        triggerHaptic('light');
        onSwipeRight();
      }
      setSwiping(false);
      setSwipeOffset(0);
    },
    onSwiped: () => {
      setSwiping(false);
      setSwipeOffset(0);
    },
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: false,
  });

  const transform = swiping ? `translateX(${swipeOffset * 0.3}px)` : 'translateX(0)';
  const opacity = swiping ? Math.max(0.6, 1 - Math.abs(swipeOffset) / 300) : 1;

  return (
    <div 
      {...handlers} 
      className={cn('touch-pan-y', className)}
      style={{
        transform,
        opacity,
        transition: swiping ? 'none' : 'all 0.3s ease-out',
      }}
    >
      {children}
    </div>
  );
}
