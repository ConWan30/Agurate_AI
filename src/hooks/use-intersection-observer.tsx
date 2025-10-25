import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
) {
  const { threshold = 0.1, root = null, rootMargin = '0px', freezeOnceVisible = false } = options;
  
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = targetRef.current;
    if (!node) return;

    if (freezeOnceVisible && hasIntersected) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Use RAF to batch state updates and prevent forced reflows
        requestAnimationFrame(() => {
          const isElementIntersecting = entry.isIntersecting;
          setIsIntersecting(isElementIntersecting);
          
          if (isElementIntersecting && !hasIntersected) {
            setHasIntersected(true);
          }
        });
      },
      { threshold, root, rootMargin }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [threshold, root, rootMargin, freezeOnceVisible, hasIntersected]);

  return { ref: targetRef, isIntersecting, hasIntersected };
}
