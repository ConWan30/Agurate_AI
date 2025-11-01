import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, BookOpen, Sparkles } from 'lucide-react';
import { EnhancedPageHeader } from '@/components/EnhancedPageHeader';
import { InteractiveTutorial } from '@/components/InteractiveTutorial';

interface Tutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: string;
  steps: number;
  route?: string;
}

export default function Tutorials() {
  const navigate = useNavigate();
  const [showInteractiveTutorial, setShowInteractiveTutorial] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const tutorials: Tutorial[] = [
    {
      id: 'interactive',
      title: "James's Journey - Complete Platform Tour",
      description: "Follow James through a day in the life using AgurateAI",
      duration: "8 minutes",
      category: "Getting Started",
      steps: 8
    },
    {
      id: 'scanner',
      title: "AI Crop Scanner",
      description: "Learn how to capture and analyze crop photos",
      duration: "2 minutes",
      category: "Core Features",
      steps: 3,
      route: '/scanner'
    },
    {
      id: 'predictions',
      title: "7-Day Stress Predictions",
      description: "Master predictive analytics for proactive farming",
      duration: "3 minutes",
      category: "Core Features",
      steps: 4,
      route: '/predictions'
    },
    {
      id: 'delta-chat',
      title: "Delta Intelligence Chat",
      description: "Get the most from your AI agricultural advisor",
      duration: "4 minutes",
      category: "Core Features",
      steps: 5,
      route: '/delta-intelligence'
    },
    {
      id: 'insurance',
      title: "Insurance Claims",
      description: "Streamline your crop insurance documentation",
      duration: "3 minutes",
      category: "Business Tools",
      steps: 4,
      route: '/insurance'
    },
    {
      id: 'field-map',
      title: "Interactive Field Map",
      description: "Navigate spatial crop health visualization",
      duration: "2 minutes",
      category: "Core Features",
      steps: 3,
      route: '/field-map'
    },
    {
      id: 'cooperatives',
      title: "Cooperatives & Community",
      description: "Join cooperatives and access community intelligence",
      duration: "3 minutes",
      category: "Enhanced Features",
      steps: 4,
      route: '/cooperatives'
    },
    {
      id: 'conservation',
      title: "Conservation Practices",
      description: "Track sustainable farming practices and cost savings",
      duration: "3 minutes",
      category: "Enhanced Features",
      steps: 3,
      route: '/conservation-practices'
    }
  ];

  const categories = ['All', 'Getting Started', 'Core Features', 'Enhanced Features', 'Business Tools'];

  const filteredTutorials = selectedCategory === 'All' 
    ? tutorials 
    : tutorials.filter(t => t.category === selectedCategory);

  const getTutorialCompleted = (id: string) => {
    return localStorage.getItem(`tutorial-${id}-completed`) === 'true';
  };

  const startTutorial = (id: string, route?: string) => {
    if (id === 'interactive') {
      setShowInteractiveTutorial(true);
    } else if (route) {
      // Clear tutorial tooltip for destination page to trigger it
      localStorage.removeItem(`tutorial-${route.replace('/', '')}-shown`);
      // Navigate with tutorial state
      navigate(route, { state: { startTutorial: true } });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <EnhancedPageHeader
        title="Tutorials"
        description="Learn how to get the most from AgurateAI"
        icon={BookOpen}
      />

      {/* Beta Message */}
      <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-emerald-50/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground mb-1">
                Welcome Beta Farmer! 🌱
              </p>
              <p className="text-sm text-muted-foreground">
                These tutorials will help you master all 17 AgurateAI features. 
                Your feedback on tutorials helps us improve!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map(category => (
          <Badge 
            key={category} 
            variant={selectedCategory === category ? "default" : "outline"}
            className="cursor-pointer hover:bg-primary/10 transition-colors"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Badge>
        ))}
      </div>

      {/* Tutorial Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTutorials.map(tutorial => {
          const isCompleted = getTutorialCompleted(tutorial.id);
          
          return (
            <Card key={tutorial.id} className="hover:shadow-lg transition-all hover:border-primary/50">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    {tutorial.category}
                  </Badge>
                  {isCompleted && (
                    <CheckCircle className="h-5 w-5 text-health-good" />
                  )}
                </div>
                <CardTitle className="text-lg">{tutorial.title}</CardTitle>
                <CardDescription>{tutorial.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    ⏱️ {tutorial.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    📋 {tutorial.steps} steps
                  </span>
                </div>
                <Button 
                  className="w-full"
                  variant={isCompleted ? "outline" : "default"}
                  onClick={() => startTutorial(tutorial.id, tutorial.route)}
                >
                  {isCompleted ? 'Replay Tutorial' : 'Start Tutorial'} →
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Interactive Tutorial Modal */}
      {showInteractiveTutorial && (
        <InteractiveTutorial
          open={showInteractiveTutorial}
          onOpenChange={setShowInteractiveTutorial}
        />
      )}
    </div>
  );
}
