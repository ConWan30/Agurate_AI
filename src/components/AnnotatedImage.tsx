import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

export interface ImageAnnotation {
  type: 'circle' | 'arrow' | 'rectangle' | 'text';
  x: number; // Percentage (0-100)
  y: number; // Percentage (0-100)
  radius?: number; // For circles
  width?: number; // For rectangles
  height?: number; // For rectangles
  label: string;
  color?: string;
  severity?: 'critical' | 'warning' | 'info' | 'success';
}

interface AnnotatedImageProps {
  imageUrl: string;
  annotations: ImageAnnotation[];
  alt?: string;
  className?: string;
  showLabels?: boolean;
}

export function AnnotatedImage({
  imageUrl,
  annotations,
  alt = 'Annotated crop image',
  className = '',
  showLabels = true,
}: AnnotatedImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const drawAnnotations = () => {
      const canvas = canvasRef.current;
      const image = imageRef.current;
      const container = containerRef.current;

      if (!canvas || !image || !container) return;

      // Wait for image to load
      if (!image.complete || image.naturalWidth === 0) {
        return;
      }

      // Set canvas size to match image
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw annotations
      annotations.forEach((annotation) => {
        const x = (annotation.x / 100) * canvas.width;
        const y = (annotation.y / 100) * canvas.height;

        // Determine color based on severity
        const color =
          annotation.color ||
          (annotation.severity === 'critical'
            ? '#ef4444'
            : annotation.severity === 'warning'
            ? '#f59e0b'
            : annotation.severity === 'success'
            ? '#10b981'
            : '#3b82f6');

        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 3;

        switch (annotation.type) {
          case 'circle': {
            ctx.beginPath();
            const radius = annotation.radius
              ? (annotation.radius / 100) * Math.min(canvas.width, canvas.height)
              : 30;
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.stroke();
            break;
            }

          case 'rectangle': {
            const width = annotation.width
              ? (annotation.width / 100) * canvas.width
              : 100;
            const height = annotation.height
              ? (annotation.height / 100) * canvas.height
              : 100;
            ctx.strokeRect(x - width / 2, y - height / 2, width, height);
            break;
            }

          case 'arrow':
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y - 30);
            ctx.lineTo(x - 10, y - 20);
            ctx.moveTo(x, y - 30);
            ctx.lineTo(x + 10, y - 20);
            ctx.stroke();
            break;

          case 'text':
            // Text annotations are handled separately below
            break;
        }

        // Draw label
        if (showLabels && annotation.label) {
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.font = 'bold 14px Arial';
          const textX = x + (annotation.radius ? (annotation.radius / 100) * Math.min(canvas.width, canvas.height) + 10 : 10);
          const textY = y;

          // Draw text background
          const textMetrics = ctx.measureText(annotation.label);
          const textWidth = textMetrics.width;
          const textHeight = 20;
          ctx.fillStyle = color;
          ctx.fillRect(textX - 5, textY - textHeight + 5, textWidth + 10, textHeight);

          // Draw text
          ctx.fillStyle = '#ffffff';
          ctx.fillText(annotation.label, textX, textY);
        }
      });

      setLoading(false);
    };

    const image = imageRef.current;
    if (image) {
      if (image.complete) {
        drawAnnotations();
      } else {
        image.onload = drawAnnotations;
        image.onerror = () => {
          setError('Failed to load image');
          setLoading(false);
        };
      }
    }

    // Redraw on resize
    const resizeObserver = new ResizeObserver(drawAnnotations);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [imageUrl, annotations, showLabels]);

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <img
        ref={imageRef}
        src={imageUrl}
        alt={alt}
        className="w-full h-auto"
        style={{ display: loading ? 'none' : 'block' }}
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ imageRendering: 'pixelated' }}
      />
      
      {/* Legend */}
      {annotations.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 bg-card/90 backdrop-blur-sm border rounded-lg p-3 space-y-2 max-h-32 overflow-y-auto">
          <div className="text-xs font-semibold mb-2">Annotations:</div>
          <div className="flex flex-wrap gap-2">
            {annotations.map((annotation, idx) => (
              <Badge
                key={idx}
                variant={
                  annotation.severity === 'critical'
                    ? 'destructive'
                    : annotation.severity === 'warning'
                    ? 'default'
                    : 'outline'
                }
                className="text-xs"
              >
                {annotation.label}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

