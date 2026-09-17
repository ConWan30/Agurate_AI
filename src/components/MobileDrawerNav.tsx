import { Menu, Sprout, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { BrandEmblem } from './BrandEmblem';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  gradient?: string;
  accentIcon?: React.ComponentType<{ className?: string }>;
}

interface MobileDrawerNavProps {
  navItems: NavItem[];
  commandCenterItems: NavItem[];
  businessItems: NavItem[];
  enhancedItems?: NavItem[];
}

export default function MobileDrawerNav({
  navItems,
  commandCenterItems,
  businessItems,
  enhancedItems = [],
}: MobileDrawerNavProps) {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const sections = [
    { title: 'Farm Management', items: navItems },
    { title: 'Field Tools', items: commandCenterItems },
    { title: 'Business Tools', items: businessItems },
    { title: 'Resources', items: enhancedItems },
  ].filter((section) => section.items.length > 0);

  return (
    <>
      <Button
        type="button"
        size="icon"
        onClick={() => setOpen(true)}
        className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-6 z-50 h-14 w-14 rounded-full bg-primary shadow-lg hover:bg-primary/90 md:hidden"
        aria-label="Open navigation menu"
        aria-expanded={open}
      >
        <Menu className="h-6 w-6" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-[100] md:hidden" role="dialog" aria-modal="true" aria-label="AgurateAI navigation">
          <button
            type="button"
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label="Close navigation menu"
          />

          <section className="absolute inset-0 flex min-h-0 flex-col bg-background sm:right-auto sm:w-[24rem] sm:border-r sm:shadow-2xl">
            <header className="flex shrink-0 items-center justify-between border-b bg-card px-5 pb-4 pt-[calc(1rem+env(safe-area-inset-top))]">
              <Link to="/" onClick={() => setOpen(false)} className="flex min-w-0 items-center gap-3">
                <BrandEmblem className="h-11 w-11 shrink-0 shadow-glow" />
                <div className="min-w-0">
                  <div className="truncate text-lg font-bold">Agurate<span className="text-green-600">AI</span></div>
                  <div className="truncate text-xs text-muted-foreground">Local Land. Smarter Decisions.</div>
                </div>
              </Link>
              <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close navigation menu">
                <X className="h-6 w-6" />
              </Button>
            </header>

            <div
              className="min-h-0 flex-1 overflow-y-scroll overscroll-contain"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <nav className="space-y-7 px-4 py-5 pb-[calc(8rem+env(safe-area-inset-bottom))]" aria-label="Mobile navigation">
                {sections.map((section) => (
                  <div key={section.title}>
                    <h2 className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {section.title}
                    </h2>
                    <div className="grid gap-1">
                      {section.items.map((item) => {
                        const isActive = location.pathname === item.path;
                        const AccentIcon = item.accentIcon;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setOpen(false)}
                            className={`flex min-h-14 items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                              isActive ? 'bg-primary/12 text-primary' : 'text-foreground hover:bg-muted active:bg-muted'
                            }`}
                          >
                            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isActive ? 'bg-primary/15' : 'bg-muted'}`}>
                              <item.icon className="h-5 w-5" />
                            </span>
                            <span className="min-w-0 flex-1 font-medium">{item.label}</span>
                            {isActive && (AccentIcon ? <AccentIcon className="h-4 w-4 shrink-0 text-primary/60" /> : <Sprout className="h-4 w-4 shrink-0 text-primary/60" />)}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </div>

            <footer className="shrink-0 border-t bg-card px-5 py-3 pb-[calc(.75rem+env(safe-area-inset-bottom))]">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Agricultural observations are decision aids, not diagnoses.
              </p>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
