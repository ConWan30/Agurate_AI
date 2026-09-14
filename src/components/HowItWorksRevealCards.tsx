import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';

type PipelineStep = {
  icon: LucideIcon;
  title: string;
  description: string;
  tech: string;
  color: string;
};

type FeatureCard = {
  icon: LucideIcon;
  title: string;
  description: string;
  benefit: string;
  color?: string;
};

type UseCaseCard = {
  icon: LucideIcon;
  title: string;
  scenario: string;
  impact: string;
  savings: string;
};

export function PipelineStepCard({
  step,
  index,
  isLast,
}: {
  step: PipelineStep;
  index: number;
  isLast: boolean;
}) {
  const { ref, hasIntersected } = useIntersectionObserver({ freezeOnceVisible: true });

  return (
    <div
      ref={ref}
      className={`${hasIntersected ? 'animate-fade-in opacity-100' : 'opacity-0'} stagger-${Math.min(index + 1, 5)}`}
    >
      <div className="relative">
        <Card className="field-card hover-lift border-2 transition-all group">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                <div
                  className={`h-16 w-16 rounded-2xl border ${step.color} flex flex-col items-center justify-center shadow-field group-hover:scale-110 transition-transform`}
                >
                  <step.icon className="h-7 w-7 mb-1" aria-hidden="true" />
                  <span className="text-xs font-bold">{index + 1}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-heading font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed mb-3">{step.description}</p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg border text-xs font-mono">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" aria-hidden="true" />
                  {step.tech}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {!isLast && (
          <div className="flex justify-center py-2">
            <ArrowRight className="h-6 w-6 text-primary/40 rotate-90" />
          </div>
        )}
      </div>
    </div>
  );
}

export function FeatureRevealCard({ feature, index }: { feature: FeatureCard; index: number }) {
  const { ref, hasIntersected } = useIntersectionObserver({ freezeOnceVisible: true });

  return (
    <Card
      ref={ref}
      className={`field-card hover-lift border-2 ${hasIntersected ? 'animate-fade-in opacity-100' : 'opacity-0'} stagger-${Math.min(index + 1, 5)}`}
    >
      <CardHeader>
        <div
          className={`inline-flex h-12 w-12 rounded-xl items-center justify-center mb-3 ${feature.color ?? 'bg-primary/10 text-primary'}`}
        >
          <feature.icon className="h-6 w-6" />
        </div>
        <CardTitle className="text-lg">{feature.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
        <div className="pt-2 border-t">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-semibold">
            ✨ {feature.benefit}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export function UseCaseRevealCard({ useCase, index }: { useCase: UseCaseCard; index: number }) {
  const { ref, hasIntersected } = useIntersectionObserver({ freezeOnceVisible: true });

  return (
    <div
      ref={ref}
      className={`${hasIntersected ? 'animate-scale-in opacity-100' : 'opacity-0'} stagger-${Math.min(index + 1, 5)}`}
    >
      <Card className="field-card hover-lift glass-strong">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-xl gradient-delta shadow-glow flex items-center justify-center animate-glow-pulse">
              <useCase.icon className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-xl">{useCase.title}</CardTitle>
          </div>
          <CardDescription className="text-base">{useCase.scenario}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-muted/50 rounded-lg border">
            <p className="text-sm font-medium mb-1">Impact:</p>
            <p className="text-sm text-muted-foreground">{useCase.impact}</p>
          </div>
          <div className="flex items-center justify-between p-3 bg-health-good/10 border border-health-good/20 rounded-lg">
            <span className="text-sm font-medium text-health-good">Planning benefit:</span>
            <span className="text-lg font-bold text-health-good">{useCase.savings}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
