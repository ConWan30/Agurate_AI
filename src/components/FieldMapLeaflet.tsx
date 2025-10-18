import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Field {
  id: string;
  name: string;
  crop_type: string;
  location_lat: number;
  location_lng: number;
  acreage: number | null;
  health_score?: number;
  stress_level?: string;
}

interface FieldMapLeafletProps {
  fields: Field[];
}

export default function FieldMapLeaflet({ fields }: FieldMapLeafletProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getHealthColor = (healthScore: number = 0.5) => {
    if (healthScore >= 0.75) return '#10b981';
    if (healthScore >= 0.50) return '#eab308';
    return '#ef4444';
  };

  useEffect(() => {
    if (!mapContainer.current || fields.length === 0) return;

    setIsLoading(true);

    // Initialize map centered on Louisiana Delta
    map.current = L.map(mapContainer.current).setView([32.5, -91.5], 9);

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map.current);

    // Create custom icon function
    const createHealthIcon = (healthScore: number = 0.5) => {
      const color = getHealthColor(healthScore);
      return L.divIcon({
        html: `
          <div style="
            width: 24px;
            height: 24px;
            background-color: ${color};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          "></div>
        `,
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
    };

    // Add field markers
    const bounds: L.LatLngBoundsExpression = [];
    fields.forEach((field) => {
      const latLng: L.LatLngExpression = [field.location_lat, field.location_lng];
      bounds.push(latLng);

      const marker = L.marker(latLng, {
        icon: createHealthIcon(field.health_score),
      }).addTo(map.current!);

      // Add popup with field details
      const healthPercentage = ((field.health_score || 0.5) * 100).toFixed(0);
      marker.bindPopup(`
        <div style="font-family: system-ui; padding: 8px;">
          <h3 style="font-weight: bold; margin: 0 0 8px 0; font-size: 16px;">${field.name}</h3>
          <p style="margin: 4px 0; font-size: 14px; color: #666;">
            <strong>Crop:</strong> ${field.crop_type}
          </p>
          <p style="margin: 4px 0; font-size: 14px; color: #666;">
            <strong>Acreage:</strong> ${field.acreage || 'N/A'} acres
          </p>
          <p style="margin: 4px 0; font-size: 14px; color: #666;">
            <strong>Health:</strong> ${healthPercentage}%
          </p>
          ${field.stress_level ? `
            <p style="margin: 4px 0; font-size: 14px; color: #666;">
              <strong>Status:</strong> ${field.stress_level}
            </p>
          ` : ''}
        </div>
      `);
    });

    // Fit map to show all markers
    if (bounds.length > 0) {
      map.current.fitBounds(bounds, { padding: [50, 50] });
    }

    setIsLoading(false);

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [fields]);

  if (fields.length === 0) {
    return null;
  }

  return (
    <Card className="field-card overflow-hidden">
      <CardContent className="p-0">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        )}
        <div 
          ref={mapContainer} 
          className="w-full h-[500px] rounded-lg"
          style={{ zIndex: 0 }}
        />
      </CardContent>
    </Card>
  );
}
