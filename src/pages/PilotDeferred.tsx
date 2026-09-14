import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PILOT_CROP_LABEL,
  PILOT_PARISH_LABEL,
  PILOT_SCOPE_SUMMARY,
} from '@/lib/pilot-scope';
import { Sprout } from 'lucide-react';

/**
 * Honest holding page for modules parked during the Morehouse soybean pilot.
 * Keeps routes from looking like a full precision-ag suite before validation.
 */
export default function PilotDeferred() {
  return (
    <div className="mx-auto max-w-2xl py-10 px-4">
      <Card className="border-primary/20">
        <CardHeader className="space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Sprout className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl font-display">Parked for the pilot</CardTitle>
          <CardDescription className="text-base text-foreground/80">
            {PILOT_SCOPE_SUMMARY}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This screen is deferred while we validate {PILOT_CROP_LABEL.toLowerCase()} scans in{' '}
            {PILOT_PARISH_LABEL}. Core pilot tools remain: photo upload/scanner, fields, map,
            weather timeline, history, and Delta chat as a research aid — not a diagnosis.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/scanner">Open field scanner</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
