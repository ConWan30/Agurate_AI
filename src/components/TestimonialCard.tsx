import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Quote } from "lucide-react";

interface TestimonialCardProps {
  testimonial: {
    farmer_name: string;
    farm_location: string | null;
    testimonial_text: string;
    roi_achieved: number | null;
  };
}

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  const initials = testimonial.farmer_name
    .split(' ')
    .map(n => n[0])
    .join('');

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent hover:shadow-lg transition-shadow">
      <CardContent className="p-6 space-y-4">
        {/* Quote icon */}
        <Quote className="h-8 w-8 text-primary/20" />

        {/* Farmer info */}
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{testimonial.farmer_name}</p>
            {testimonial.farm_location && (
              <p className="text-sm text-muted-foreground">{testimonial.farm_location}</p>
            )}
          </div>
        </div>

        {/* Testimonial text */}
        <blockquote className="text-sm leading-relaxed border-l-4 border-primary/30 pl-4 italic">
          "{testimonial.testimonial_text}"
        </blockquote>

        {/* ROI badge */}
        {testimonial.roi_achieved && testimonial.roi_achieved > 0 && (
          <Badge className="bg-primary/10 text-primary border-primary/30">
            Farmer-reported savings (moderated): ${testimonial.roi_achieved.toLocaleString()} this season
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
