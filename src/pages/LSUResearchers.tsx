import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LSUResearcher } from '@/types/enhanced-features';
import { LSUResearcherContactCard } from '@/components/LSUResearcherContactCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedCard } from '@/components/ui/animated-card';
import { LoadingState } from '@/components/ui/loading-state';
import { AgriculturalBadge } from '@/components/ui/agricultural-badge';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, GraduationCap, BookOpen } from 'lucide-react';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { EmptyState } from '@/components/ui/empty-state';
import TutorialTooltip from '@/components/TutorialTooltip';
import bgLsuResearch from '@/assets/bg-lsu-research.jpg';

export default function LSUResearchers() {
  const [researchers, setResearchers] = useState<LSUResearcher[]>([]);
  const [publications, setPublications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: researchersData }, { data: publicationsData }] = await Promise.all([
        supabase.from('lsu_researchers_directory').select('*').order('name'),
        supabase.from('lsu_publications').select('*').order('year', { ascending: false }).limit(10)
      ]);

      if (researchersData) setResearchers(researchersData as LSUResearcher[]);
      if (publicationsData) setPublications(publicationsData);
    } catch (error) {
      console.error('Error fetching LSU data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResearchers = researchers.filter((r) => {
    const q = searchQuery.toLowerCase();
    const expertise = Array.isArray(r.expertise) ? r.expertise : [];
    return (
      (r.name || '').toLowerCase().includes(q) ||
      expertise.some((e) => String(e).toLowerCase().includes(q)) ||
      (r.department || '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingState message="Loading LSU AgCenter researchers..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <TutorialTooltip
        steps={[
          { id: "welcome", title: "LSU AgCenter directory", content: "Browse publicly listed LSU AgCenter researcher profiles for Louisiana crops", position: "bottom" },
          { id: "browse", title: "Browse Researchers", content: "Filter by expertise area (rice, soybeans, pests, soil science)", position: "bottom" },
          { id: "ask", title: "Official contact channels", content: "Reach specialists through official LSU channels — AgurateAI does not broker introductions", position: "bottom" },
          { id: "publications", title: "Research Library", content: "Find public LSU studies relevant to your crops and region", position: "bottom" }
        ]}
        storageKey="tutorial-lsu-researchers-shown"
      />
      {/* Header */}
      <div
        className="relative overflow-hidden rounded-2xl p-8 text-white shadow-glow"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(16, 185, 129, 0.92) 0%, rgba(5, 150, 105, 0.88) 100%), url(${bgLsuResearch})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm">
              <GraduationCap className="h-6 w-6" aria-hidden="true" />
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
              LSU AgCenter research directory
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-3">
            LSU AgCenter Researchers
          </h1>
          <p className="text-lg text-white/90 max-w-2xl">
            Browse publicly listed Louisiana State University AgCenter researcher profiles. Contact them through official LSU channels — AgurateAI does not broker introductions.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float" />
      </div>

      {/* Search */}
      <AnimatedCard>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <Input
              type="text"
              placeholder="Search by name, expertise, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 focus-ring"
              aria-label="Search researchers"
            />
          </div>
        </CardContent>
      </AnimatedCard>

      {/* Researchers Grid */}
      <div>
        <h2 className="text-2xl font-heading font-bold mb-6">Available Researchers</h2>
        {filteredResearchers.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No researchers found"
            description="Try adjusting your search criteria"
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredResearchers.map((researcher) => (
              <LSUResearcherContactCard
                key={researcher.id}
                researcher={researcher}
                onContact={() => {
                  // Contact is handled via public LSU channels in the card UI
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Publications */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-2xl font-heading font-bold">Recent LSU Publications</h2>
            <p className="text-sm text-muted-foreground">Public LSU studies for Louisiana crops — not an AgurateAI partnership endorsement</p>
          </div>
        </div>
        <div className="space-y-4">
          {publications.map((pub, idx) => (
            <AnimatedCard key={pub.id} delay={idx * 50} className="border-primary/20">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-heading">{pub.title}</CardTitle>
                    <CardDescription className="mt-2">
                      By {(Array.isArray(pub.authors) ? pub.authors : []).join(', ') || 'Authors not listed'} • {pub.year ?? 'Year n/a'}
                    </CardDescription>
                  </div>
                  {Array.isArray(pub.crops) && pub.crops[0] ? (
                    <AgriculturalBadge type="growing">{pub.crops[0]}</AgriculturalBadge>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(pub.topics) ? pub.topics : []).slice(0, 3).map((topic: string) => (
                      <Badge key={topic} variant="secondary" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                  {Array.isArray(pub.key_findings) && pub.key_findings.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      <strong>Key Findings:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        {pub.key_findings.slice(0, 2).map((finding: string, idx: number) => (
                          <li key={idx}>{finding}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <a
                    href={pub.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
                    View Publication →
                  </a>
                </div>
              </CardContent>
            </AnimatedCard>
          ))}
        </div>
      </div>

      {/* Partnership Notice */}
      <Card className="bg-accent/10 border-accent/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-accent/20 flex-shrink-0">
              <GraduationCap className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="font-bold mb-2">Directory notice</h3>
              <p className="text-sm text-muted-foreground mb-3">
                AgurateAI is not an official LSU AgCenter partner. This page lists publicly available researcher profiles for convenience.
                Contact researchers through official LSU channels — we do not broker introductions or claim a partnership.
              </p>
              <p className="text-sm text-muted-foreground">
                For general LSU AgCenter inquiries, use official LSU contact channels such as the AgCenter website.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
