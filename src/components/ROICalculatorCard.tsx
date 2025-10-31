import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DollarSign, TrendingUp, AlertTriangle, ChevronDown, ChevronUp, Calculator, CheckCircle2 } from 'lucide-react';
import { AnimatedCounter } from '@/components/ui/animated-counter';

interface ROICalculation {
  treatmentCost: number;
  potentialLoss: number;
  netBenefit: number;
  roiPercentage: number;
  recommendation: 'highly_recommended' | 'recommended' | 'marginal' | 'not_recommended';
  breakdownDetails: {
    yieldAtRisk: number;
    pricePerUnit: number;
    costPerAcre: number;
    acres: number;
  };
}

interface ROICalculatorCardProps {
  assessmentData?: {
    healthScore: number;
    stressLevel: string;
    estimatedYieldImpact?: number;
  };
  fieldData?: {
    cropType: string;
    acreage: number;
  };
  className?: string;
}

export function ROICalculatorCard({ assessmentData, fieldData, className }: ROICalculatorCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [acres, setAcres] = useState(fieldData?.acreage?.toString() || '100');
  const [cropType, setCropType] = useState(fieldData?.cropType || 'rice');
  const [treatmentType, setTreatmentType] = useState('fungicide');
  const [roi, setRoi] = useState<ROICalculation | null>(null);

  // Louisiana Delta average prices (2024)
  const cropPrices: Record<string, { price: number; unit: string; avgYield: number }> = {
    rice: { price: 18.50, unit: 'cwt', avgYield: 75 }, // $18.50/cwt, 75 cwt/acre
    soybeans: { price: 13.50, unit: 'bu', avgYield: 52 }, // $13.50/bu, 52 bu/acre
    cotton: { price: 0.75, unit: 'lb', avgYield: 1100 }, // $0.75/lb, 1100 lb/acre
    corn: { price: 5.80, unit: 'bu', avgYield: 180 }, // $5.80/bu, 180 bu/acre
  };

  // Treatment costs per acre (Louisiana Delta averages)
  const treatmentCosts: Record<string, { cost: number; yieldProtection: number; name: string }> = {
    fungicide: { cost: 28, yieldProtection: 0.15, name: 'Fungicide Application' },
    fertilizer: { cost: 45, yieldProtection: 0.20, name: 'Corrective Fertilizer' },
    herbicide: { cost: 22, yieldProtection: 0.12, name: 'Herbicide Application' },
    irrigation: { cost: 35, yieldProtection: 0.25, name: 'Supplemental Irrigation' },
    insecticide: { cost: 30, yieldProtection: 0.18, name: 'Insecticide Treatment' },
  };

  const calculateROI = () => {
    const acreage = parseFloat(acres) || 100;
    const crop = cropPrices[cropType] || cropPrices.rice;
    const treatment = treatmentCosts[treatmentType] || treatmentCosts.fungicide;

    // Estimate yield at risk based on health score
    const healthScore = assessmentData?.healthScore || 65;
    const yieldImpactPercent = assessmentData?.estimatedYieldImpact || (100 - healthScore) * 0.8;
    const yieldAtRisk = crop.avgYield * (yieldImpactPercent / 100);

    // Calculate potential loss without treatment
    const potentialLossPerAcre = yieldAtRisk * crop.price;
    const totalPotentialLoss = potentialLossPerAcre * acreage;

    // Calculate treatment cost
    const treatmentCostPerAcre = treatment.cost;
    const totalTreatmentCost = treatmentCostPerAcre * acreage;

    // Calculate yield protection from treatment
    const yieldProtected = yieldAtRisk * treatment.yieldProtection;
    const revenueProtected = yieldProtected * crop.price * acreage;

    // Net benefit = Revenue protected - Treatment cost
    const netBenefit = revenueProtected - totalTreatmentCost;

    // ROI percentage
    const roiPercentage = (netBenefit / totalTreatmentCost) * 100;

    // Recommendation logic
    let recommendation: ROICalculation['recommendation'];
    if (roiPercentage >= 300) recommendation = 'highly_recommended';
    else if (roiPercentage >= 150) recommendation = 'recommended';
    else if (roiPercentage >= 50) recommendation = 'marginal';
    else recommendation = 'not_recommended';

    setRoi({
      treatmentCost: totalTreatmentCost,
      potentialLoss: totalPotentialLoss,
      netBenefit,
      roiPercentage,
      recommendation,
      breakdownDetails: {
        yieldAtRisk,
        pricePerUnit: crop.price,
        costPerAcre: treatmentCostPerAcre,
        acres: acreage,
      },
    });
  };

  const getRecommendationConfig = (rec: ROICalculation['recommendation']) => {
    switch (rec) {
      case 'highly_recommended':
        return {
          color: 'text-primary',
          bgColor: 'bg-primary/10 border-primary/20',
          icon: CheckCircle2,
          text: 'Highly Recommended',
          description: 'Strong economic case for immediate treatment',
        };
      case 'recommended':
        return {
          color: 'text-blue-600',
          bgColor: 'bg-blue-500/10 border-blue-500/20',
          icon: TrendingUp,
          text: 'Recommended',
          description: 'Positive ROI justifies treatment',
        };
      case 'marginal':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-500/10 border-yellow-500/20',
          icon: AlertTriangle,
          text: 'Marginal',
          description: 'Consider treatment if conditions worsen',
        };
      case 'not_recommended':
        return {
          color: 'text-muted-foreground',
          bgColor: 'bg-muted border-border',
          icon: AlertTriangle,
          text: 'Not Recommended',
          description: 'Low ROI - monitor before treating',
        };
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <Card className="field-card border-2 hover:border-primary/50 transition-colors">
        <CollapsibleTrigger className="w-full">
          <CardHeader className="cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-glow">
                  <Calculator className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <CardTitle className="text-lg">ROI Calculator</CardTitle>
                  <CardDescription>Treatment cost vs. revenue protection</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <DollarSign className="h-3 w-3" />
                  Analysis
                </Badge>
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Input Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="acres">Acres to Treat</Label>
                <Input
                  id="acres"
                  type="number"
                  value={acres}
                  onChange={(e) => setAcres(e.target.value)}
                  placeholder="100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="crop">Crop Type</Label>
                <Select value={cropType} onValueChange={setCropType}>
                  <SelectTrigger id="crop">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rice">Rice</SelectItem>
                    <SelectItem value="soybeans">Soybeans</SelectItem>
                    <SelectItem value="cotton">Cotton</SelectItem>
                    <SelectItem value="corn">Corn</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="treatment">Treatment Type</Label>
                <Select value={treatmentType} onValueChange={setTreatmentType}>
                  <SelectTrigger id="treatment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(treatmentCosts).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.name} (${value.cost}/acre)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={calculateROI} className="w-full">
              <Calculator className="h-4 w-4 mr-2" />
              Calculate ROI
            </Button>

            {/* Results */}
            {roi && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                {/* Recommendation Banner */}
                <div className={`p-4 rounded-lg border ${getRecommendationConfig(roi.recommendation).bgColor}`}>
                  <div className="flex items-center gap-3 mb-2">
                    {(() => {
                      const Icon = getRecommendationConfig(roi.recommendation).icon;
                      return <Icon className={`h-5 w-5 ${getRecommendationConfig(roi.recommendation).color}`} />;
                    })()}
                    <span className={`font-semibold ${getRecommendationConfig(roi.recommendation).color}`}>
                      {getRecommendationConfig(roi.recommendation).text}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getRecommendationConfig(roi.recommendation).description}
                  </p>
                </div>

                {/* ROI Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted">
                    <div className="text-xs text-muted-foreground mb-1">Treatment Cost</div>
                    <div className="text-xl font-bold text-destructive">
                      $<AnimatedCounter value={roi.treatmentCost} duration={800} decimals={0} />
                    </div>
                  </div>

                  <div className="text-center p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <div className="text-xs text-muted-foreground mb-1">Potential Loss</div>
                    <div className="text-xl font-bold text-yellow-600">
                      $<AnimatedCounter value={roi.potentialLoss} duration={800} decimals={0} />
                    </div>
                  </div>

                  <div className="text-center p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="text-xs text-muted-foreground mb-1">Net Benefit</div>
                    <div className="text-xl font-bold text-primary">
                      $<AnimatedCounter value={roi.netBenefit} duration={800} decimals={0} />
                    </div>
                  </div>

                  <div className="text-center p-4 rounded-lg bg-gradient-to-br from-primary to-primary/80 text-white">
                    <div className="text-xs text-white/80 mb-1">ROI</div>
                    <div className="text-xl font-bold">
                      <AnimatedCounter value={roi.roiPercentage} duration={800} decimals={0} suffix="%" />
                    </div>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <h4 className="font-semibold text-sm mb-3">Calculation Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Yield at risk:</span>
                      <span className="font-medium">
                        {roi.breakdownDetails.yieldAtRisk.toFixed(1)} {cropPrices[cropType].unit}/acre
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price per unit:</span>
                      <span className="font-medium">${roi.breakdownDetails.pricePerUnit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Treatment cost per acre:</span>
                      <span className="font-medium">${roi.breakdownDetails.costPerAcre}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total acres:</span>
                      <span className="font-medium">{roi.breakdownDetails.acres}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  * Estimates based on Louisiana Delta averages and current market prices
                </p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
