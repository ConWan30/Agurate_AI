import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DollarSign, TrendingUp, AlertTriangle, ChevronDown, ChevronUp, Calculator, CheckCircle2, RefreshCw } from 'lucide-react';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { supabase } from '@/integrations/supabase/client';

interface ROICalculation {
  treatmentCost: number;
  potentialLoss: number;
  netBenefit: number;
  roiPercentage: number;
  recommendation: 'highly_recommended' | 'recommended' | 'marginal' | 'not_recommended';
  breakdownDetails: {
    yieldAtRisk: number;
    pricePerUnit: number;
    priceUnit: string;
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

const TREATMENT_COSTS: Record<string, { cost: number; name: string }> = {
  fungicide: { cost: 28, name: 'Fungicide Application' },
  fertilizer: { cost: 45, name: 'Corrective Fertilizer' },
  herbicide: { cost: 22, name: 'Herbicide Application' },
  irrigation: { cost: 35, name: 'Supplemental Irrigation' },
  insecticide: { cost: 30, name: 'Insecticide Treatment' },
};

/** Unit hints for placeholders only — never used as silent price/yield defaults. */
const UNIT_HINTS: Record<string, string> = {
  rice: 'cwt',
  soybean: 'bu',
  soybeans: 'bu',
  cotton: 'lb',
  corn: 'bu',
};

export function ROICalculatorCard({ assessmentData, fieldData, className }: ROICalculatorCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [acres, setAcres] = useState(fieldData?.acreage != null ? String(fieldData.acreage) : '');
  const [cropType, setCropType] = useState(fieldData?.cropType || 'rice');
  const [treatmentType, setTreatmentType] = useState('fungicide');
  const [roi, setRoi] = useState<ROICalculation | null>(null);
  const [marketPrice, setMarketPrice] = useState<{
    price: number;
    unit: string;
    source: string;
    last_updated: string;
  } | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [yieldAtRiskPercent, setYieldAtRiskPercent] = useState(
    assessmentData?.estimatedYieldImpact != null ? String(assessmentData.estimatedYieldImpact) : ''
  );
  const [avgYieldInput, setAvgYieldInput] = useState('');
  const [yieldProtectionPercent, setYieldProtectionPercent] = useState('');
  const [manualPriceInput, setManualPriceInput] = useState('');

  useEffect(() => {
    void fetchMarketPrice(cropType);
  }, [cropType]);

  useEffect(() => {
    if (assessmentData?.estimatedYieldImpact != null) {
      setYieldAtRiskPercent(String(assessmentData.estimatedYieldImpact));
    }
  }, [assessmentData?.estimatedYieldImpact]);

  const fetchMarketPrice = async (crop: string) => {
    setLoadingPrice(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-market-prices?crop_type=${crop}`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );

      if (response.ok) {
        const priceData = await response.json();
        const unit = priceData.unit === 'bushel' ? (crop === 'rice' ? 'cwt' : 'bu') : priceData.unit;
        const price = priceData.price_per_bushel || priceData.price_per_pound || priceData.price;
        if (Number.isFinite(Number(price)) && Number(price) > 0) {
          setMarketPrice({
            price: Number(price),
            unit: unit || UNIT_HINTS[crop] || 'unit',
            source: priceData.source || 'Market API',
            last_updated: priceData.last_updated || new Date().toISOString(),
          });
          return;
        }
      }
      setMarketPrice(null);
    } catch (error) {
      console.error('Error fetching market price:', error);
      setMarketPrice(null);
    } finally {
      setLoadingPrice(false);
    }
  };

  const getCurrentPrice = (): { price: number; unit: string } | null => {
    if (marketPrice && Number.isFinite(marketPrice.price) && marketPrice.price > 0) {
      return { price: marketPrice.price, unit: marketPrice.unit };
    }
    const manual = Number(manualPriceInput);
    if (Number.isFinite(manual) && manual > 0) {
      return { price: manual, unit: UNIT_HINTS[cropType] || 'unit' };
    }
    return null;
  };

  const hasAssessmentHealth =
    assessmentData?.healthScore != null && !Number.isNaN(Number(assessmentData.healthScore));
  const hasYieldAtRisk =
    yieldAtRiskPercent !== '' &&
    Number.isFinite(Number(yieldAtRiskPercent)) &&
    Number(yieldAtRiskPercent) >= 0;
  const hasAvgYield =
    avgYieldInput !== '' && Number.isFinite(Number(avgYieldInput)) && Number(avgYieldInput) > 0;
  const hasProtection =
    yieldProtectionPercent !== '' &&
    Number.isFinite(Number(yieldProtectionPercent)) &&
    Number(yieldProtectionPercent) >= 0;
  const hasAcres = acres !== '' && Number.isFinite(Number(acres)) && Number(acres) > 0;
  const currentPrice = getCurrentPrice();
  const hasPrice = currentPrice != null;

  const calculateROI = () => {
    if (!hasAssessmentHealth || !hasYieldAtRisk || !hasAvgYield || !hasProtection || !hasAcres || !hasPrice) {
      setRoi(null);
      return;
    }

    const acreage = Number(acres);
    const crop = currentPrice;
    const treatment = TREATMENT_COSTS[treatmentType] || TREATMENT_COSTS.fungicide;
    const avgYield = Number(avgYieldInput);
    const yieldImpactPercent = Number(yieldAtRiskPercent);
    const protectionFraction = Number(yieldProtectionPercent) / 100;

    if (!Number.isFinite(yieldImpactPercent) || yieldImpactPercent < 0 || !Number.isFinite(protectionFraction)) {
      setRoi(null);
      return;
    }

    const yieldAtRisk = avgYield * (yieldImpactPercent / 100);
    const totalPotentialLoss = yieldAtRisk * crop.price * acreage;
    const totalTreatmentCost = treatment.cost * acreage;
    const revenueProtected = yieldAtRisk * protectionFraction * crop.price * acreage;
    const netBenefit = revenueProtected - totalTreatmentCost;
    const roiPercentage = totalTreatmentCost > 0 ? (netBenefit / totalTreatmentCost) * 100 : 0;

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
        priceUnit: crop.unit,
        costPerAcre: treatment.cost,
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
          text: 'Favorable (illustrative)',
          description: 'Illustrative planning estimate — strong case under your inputs',
        };
      case 'recommended':
        return {
          color: 'text-secondary',
          bgColor: 'bg-secondary/10 border-secondary/20',
          icon: TrendingUp,
          text: 'Favorable (illustrative)',
          description: 'Positive ROI under the assumptions you entered',
        };
      case 'marginal':
        return {
          color: 'text-health-moderate',
          bgColor: 'bg-health-moderate/10 border-health-moderate/20',
          icon: AlertTriangle,
          text: 'Marginal',
          description: 'Consider treatment if conditions worsen',
        };
      case 'not_recommended':
        return {
          color: 'text-muted-foreground',
          bgColor: 'bg-muted border-border',
          icon: AlertTriangle,
          text: 'Not recommended (under these inputs)',
          description: 'Low ROI under the assumptions you entered — monitor before treating',
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="acres">Acres to Treat</Label>
                <Input
                  id="acres"
                  type="number"
                  value={acres}
                  onChange={(e) => setAcres(e.target.value)}
                  placeholder="Enter field acres"
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
                    <SelectItem value="soybean">Soybeans</SelectItem>
                    <SelectItem value="cotton">Cotton</SelectItem>
                    <SelectItem value="corn">Corn</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="yield-at-risk">Yield at risk (%)</Label>
                <Input
                  id="yield-at-risk"
                  type="number"
                  min={0}
                  max={100}
                  value={yieldAtRiskPercent}
                  onChange={(e) => setYieldAtRiskPercent(e.target.value)}
                  placeholder="From assessment or enter estimate"
                />
                <p className="text-xs text-muted-foreground">
                  Required. Prefills from assessment when available — never invented from health score alone.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="avg-yield">Typical yield (units/acre)</Label>
                <Input
                  id="avg-yield"
                  type="number"
                  min={0}
                  value={avgYieldInput}
                  onChange={(e) => setAvgYieldInput(e.target.value)}
                  placeholder="Enter your typical yield"
                />
                <p className="text-xs text-muted-foreground">
                  Required. Use your field average — defaults are not assumed.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="yield-protection">Assumed treatment yield protection (%)</Label>
                <Input
                  id="yield-protection"
                  type="number"
                  min={0}
                  max={100}
                  value={yieldProtectionPercent}
                  onChange={(e) => setYieldProtectionPercent(e.target.value)}
                  placeholder="e.g. 15"
                />
                <p className="text-xs text-muted-foreground">
                  Planning assumption you control — not a measured efficacy claim.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="crop-price">Price per unit ($)</Label>
                <Input
                  id="crop-price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={
                    marketPrice && Number.isFinite(marketPrice.price)
                      ? String(marketPrice.price)
                      : manualPriceInput
                  }
                  onChange={(e) => {
                    setManualPriceInput(e.target.value);
                    if (marketPrice) setMarketPrice(null);
                  }}
                  placeholder={
                    loadingPrice
                      ? 'Loading market price…'
                      : `Enter $/${UNIT_HINTS[cropType] || 'unit'}`
                  }
                  disabled={loadingPrice}
                />
                <p className="text-xs text-muted-foreground">
                  {marketPrice
                    ? `Using ${marketPrice.source} quote — edit to override.`
                    : 'Required. Market quote unavailable — enter your price; no silent commodity default.'}
                </p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="treatment">Treatment Type</Label>
                <Select value={treatmentType} onValueChange={setTreatmentType}>
                  <SelectTrigger id="treatment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TREATMENT_COSTS).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.name} (${value.cost}/acre)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(!hasAssessmentHealth || !hasYieldAtRisk || !hasPrice) && (
              <p className="text-sm text-muted-foreground text-center">
                ROI needs a real assessment health score, an explicit yield-at-risk %, and a crop price
                (market or entered).
              </p>
            )}
            <Button
              onClick={calculateROI}
              className="w-full"
              disabled={
                !hasAssessmentHealth ||
                !hasYieldAtRisk ||
                !hasAvgYield ||
                !hasProtection ||
                !hasAcres ||
                !hasPrice
              }
            >
              <Calculator className="h-4 w-4 mr-2" />
              Calculate ROI
            </Button>

            {roi && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
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

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted">
                    <div className="text-xs text-muted-foreground mb-1">Treatment Cost</div>
                    <div className="text-xl font-bold text-destructive">
                      $<AnimatedCounter value={roi.treatmentCost} duration={800} decimals={0} />
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-health-moderate/10 border border-health-moderate/20">
                    <div className="text-xs text-muted-foreground mb-1">Potential Loss</div>
                    <div className="text-xl font-bold text-health-moderate">
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

                <div className="p-4 rounded-lg bg-muted/50 border">
                  <h4 className="font-semibold text-sm mb-3">Calculation Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Yield at risk:</span>
                      <span className="font-medium">
                        {roi.breakdownDetails.yieldAtRisk.toFixed(1)} {roi.breakdownDetails.priceUnit}/acre
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Price per unit:</span>
                      <span className="font-medium flex items-center gap-2">
                        ${roi.breakdownDetails.pricePerUnit}
                        {marketPrice && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <RefreshCw className="h-3 w-3" />
                            {marketPrice.source}
                          </Badge>
                        )}
                      </span>
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

                <div className="text-xs text-muted-foreground text-center space-y-1">
                  <p>
                    * Illustrative planning estimate using your inputs
                    {marketPrice ? ` and ${marketPrice.source} market prices` : ''}. Treatment $/acre uses
                    Louisiana Delta planning averages.
                  </p>
                  {marketPrice && (
                    <p className="flex items-center justify-center gap-1">
                      <RefreshCw className="h-3 w-3" />
                      Prices updated: {new Date(marketPrice.last_updated).toLocaleDateString()}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 px-2 text-xs"
                        onClick={() => void fetchMarketPrice(cropType)}
                        disabled={loadingPrice}
                      >
                        {loadingPrice ? 'Updating...' : 'Refresh'}
                      </Button>
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
