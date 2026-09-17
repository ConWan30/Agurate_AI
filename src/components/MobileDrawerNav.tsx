import { Menu, Sprout } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { BrandEmblem } from './BrandEmblem';

interface NavItem { icon: React.ComponentType<{ className?: string }>; label: string; path: string; gradient?: string; accentIcon?: React.ComponentType<{ className?: string }>; }
interface MobileDrawerNavProps { navItems: NavItem[]; commandCenterItems: NavItem[]; businessItems: NavItem[]; enhancedItems?: NavItem[]; }

export default function MobileDrawerNav({ navItems, commandCenterItems, businessItems, enhancedItems }: MobileDrawerNavProps) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const NavSection = ({ title, items }: { title?: string; items: NavItem[] }) => (
    <div className="space-y-1">
      {title && <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{title}</h3>}
      {items.map((item) => { const isActive = location.pathname === item.path; const AccentIcon = item.accentIcon; return (
        <Link key={item.path} to={item.path} onClick={() => setOpen(false)} className={`relative flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${isActive ? 'bg-primary/10 text-primary shadow-sm' : 'text-foreground hover:bg-muted'}`}>
          <div className={`flex items-center justify-center h-9 w-9 rounded-lg ${isActive ? 'bg-primary/20' : 'bg-muted'}`}><item.icon className="h-5 w-5" /></div>
          <span className="font-medium">{item.label}</span>
          {isActive && AccentIcon && <AccentIcon className="ml-auto h-4 w-4 text-primary/60" />}
          {isActive && !AccentIcon && <Sprout className="ml-auto h-4 w-4 text-primary/60" />}
        </Link>
      ); })}
    </div>
  );
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild><Button size="icon" className="fixed bottom-6 left-6 z-50 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 md:hidden" aria-label="Open navigation menu"><Menu className="h-6 w-6" /></Button></SheetTrigger>
      <SheetContent side="left" className="w-80 p-0"><SheetHeader className="p-6 pb-4"><SheetTitle className="flex items-center gap-3"><BrandEmblem className="h-10 w-10 shadow-glow" /><div><div className="text-lg font-bold">Agurate<span className="text-green-600">AI</span></div><div className="text-xs text-muted-foreground font-normal">Public agricultural decision aid</div></div></SheetTitle></SheetHeader><Separator />
        <ScrollArea className="h-[calc(100vh-5rem)] px-4 py-4"><div className="space-y-6"><NavSection items={navItems} />{commandCenterItems.length > 0 && <><Separator /><NavSection title="Field Tools" items={commandCenterItems} /></>}{businessItems.length > 0 && <><Separator /><NavSection title="Business Tools" items={businessItems} /></>}{enhancedItems && enhancedItems.length > 0 && <><Separator /><NavSection title="Enhanced Features" items={enhancedItems} /></>}</div></ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
