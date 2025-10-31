import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { gatherUnifiedContext, enrichUnifiedContext } from '@/lib/unified-ai-intelligence';
import { toast } from 'sonner';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  duration?: number;
}

export default function IntegrationTest() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);

  const updateTest = (name: string, status: TestResult['status'], message: string, duration?: number) => {
    setTests(prev => {
      const existing = prev.find(t => t.name === name);
      if (existing) {
        return prev.map(t => t.name === name ? { ...t, status, message, duration } : t);
      }
      return [...prev, { name, status, message, duration }];
    });
  };

  const runTests = async () => {
    setRunning(true);
    setTests([]);

    // Test 1: Unified AI Intelligence System
    const test1Start = Date.now();
    updateTest('Unified AI Intelligence', 'pending', 'Testing context gathering...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: fields } = await supabase.from('fields').select('id').limit(1).single();
      if (!fields) throw new Error('No fields found');

      const context = await gatherUnifiedContext(fields.id);
      if (context.fieldData && context.assessmentHistory) {
        updateTest('Unified AI Intelligence', 'success', `✅ Context gathered: ${context.assessmentHistory.length} assessments`, Date.now() - test1Start);
      } else {
        updateTest('Unified AI Intelligence', 'warning', '⚠️ Partial context gathered', Date.now() - test1Start);
      }
    } catch (error: any) {
      updateTest('Unified AI Intelligence', 'error', `❌ ${error.message}`, Date.now() - test1Start);
    }

    // Test 2: Conservation Predictions
    const test2Start = Date.now();
    updateTest('Conservation Predictions', 'pending', 'Checking predictions table...');
    try {
      const { data, error } = await (supabase as any)
        .from('conservation_predictions')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      updateTest('Conservation Predictions', 'success', '✅ Table accessible', Date.now() - test2Start);
    } catch (error: any) {
      updateTest('Conservation Predictions', 'error', `❌ ${error.message}`, Date.now() - test2Start);
    }

    // Test 3: Variety Recommendations
    const test3Start = Date.now();
    updateTest('Variety Recommendations', 'pending', 'Checking recommendations table...');
    try {
      const { data, error } = await (supabase as any)
        .from('variety_recommendations')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      updateTest('Variety Recommendations', 'success', '✅ Table accessible', Date.now() - test3Start);
    } catch (error: any) {
      updateTest('Variety Recommendations', 'error', `❌ ${error.message}`, Date.now() - test3Start);
    }

    // Test 4: Community Intelligence
    const test4Start = Date.now();
    updateTest('Community Intelligence', 'pending', 'Checking best practices network...');
    try {
      const { data, error } = await (supabase as any)
        .from('best_practices_network')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      updateTest('Community Intelligence', 'success', '✅ Network accessible', Date.now() - test4Start);
    } catch (error: any) {
      updateTest('Community Intelligence', 'error', `❌ ${error.message}`, Date.now() - test4Start);
    }

    // Test 5: Water Stress Intelligence
    const test5Start = Date.now();
    updateTest('Water Stress Intelligence', 'pending', 'Checking water stress table...');
    try {
      const { data, error } = await (supabase as any)
        .from('water_stress_intelligence')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      updateTest('Water Stress Intelligence', 'success', '✅ Table accessible', Date.now() - test5Start);
    } catch (error: any) {
      updateTest('Water Stress Intelligence', 'error', `❌ ${error.message}`, Date.now() - test5Start);
    }

    // Test 6: Conversational Forms
    const test6Start = Date.now();
    updateTest('Conversational Forms', 'pending', 'Testing form sessions...');
    try {
      const { data, error } = await supabase
        .from('conversational_form_sessions')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      updateTest('Conversational Forms', 'success', '✅ Forms system ready', Date.now() - test6Start);
    } catch (error: any) {
      updateTest('Conversational Forms', 'error', `❌ ${error.message}`, Date.now() - test6Start);
    }

    // Test 7: Predictive Analytics
    const test7Start = Date.now();
    updateTest('Predictive Analytics', 'pending', 'Testing predictive models...');
    try {
      const { data, error } = await (supabase as any)
        .from('predictive_models')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      updateTest('Predictive Analytics', 'success', '✅ Models accessible', Date.now() - test7Start);
    } catch (error: any) {
      updateTest('Predictive Analytics', 'error', `❌ ${error.message}`, Date.now() - test7Start);
    }

    setRunning(false);
    toast.success('Integration tests completed!');
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'pending': return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case 'error': return <Badge variant="destructive">Error</Badge>;
      case 'warning': return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'pending': return <Badge variant="secondary">Running...</Badge>;
    }
  };

  const successCount = tests.filter(t => t.status === 'success').length;
  const errorCount = tests.filter(t => t.status === 'error').length;
  const warningCount = tests.filter(t => t.status === 'warning').length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">AgurateAI Integration Test Suite</CardTitle>
          <CardDescription>
            Verify all enhanced features and unified intelligence systems are operational
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <Button 
              onClick={runTests} 
              disabled={running}
              size="lg"
            >
              {running ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                'Run Integration Tests'
              )}
            </Button>

            {tests.length > 0 && (
              <div className="flex gap-3 items-center">
                <Badge variant="outline" className="text-base">
                  {successCount} Passed
                </Badge>
                {warningCount > 0 && (
                  <Badge variant="outline" className="text-base bg-yellow-50">
                    {warningCount} Warnings
                  </Badge>
                )}
                {errorCount > 0 && (
                  <Badge variant="outline" className="text-base bg-red-50">
                    {errorCount} Failed
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            {tests.map((test, idx) => (
              <Card key={idx} className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getStatusIcon(test.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{test.name}</h3>
                          {getStatusBadge(test.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{test.message}</p>
                        {test.duration && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Completed in {test.duration}ms
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {tests.length === 0 && !running && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Click "Run Integration Tests" to verify all systems</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle>Enhanced Features Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm">Unified AI Intelligence System</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm">Daily Briefing Card</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm">ROI Calculator</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm">Conservation Predictions</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm">Variety Recommendations</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm">Community Intelligence</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm">Predictive Questions</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm">Enhanced Conversational Forms</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}