import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Upload, MapPin, History as HistoryIcon, User, LogOut, Sprout, Lightbulb, Scan, Cloud } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MobileFloatingActions from "./MobileFloatingActions";
import MobileDrawerNav from "./MobileDrawerNav";
import { KeyboardShortcutsHelp } from "./KeyboardShortcutsHelp";
import { PILOT_TAGLINE } from "@/lib/pilot-scope";

interface LayoutProps { children: ReactNode; }

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "Couldn't sign out", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Logged out successfully" });
    navigate("/auth");
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", gradient: "from-green-500/20 to-emerald-500/20", glow: "shadow-[0_0_15px_rgba(34,197,94,0.3)]" },
    { icon: Upload, label: "Upload", path: "/upload", gradient: "from-blue-500/20 to-cyan-500/20", glow: "shadow-[0_0_15px_rgba(59,130,246,0.3)]" },
    { icon: MapPin, label: "My Fields", path: "/fields", gradient: "from-amber-500/20 to-yellow-500/20", glow: "shadow-[0_0_15px_rgba(251,191,36,0.3)]" },
    { icon: HistoryIcon, label: "History", path: "/history", gradient: "from-purple-500/20 to-pink-500/20", glow: "shadow-[0_0_15px_rgba(168,85,247,0.3)]" },
    { icon: Lightbulb, label: "How It Works", path: "/how-it-works", gradient: "from-orange-500/20 to-red-500/20", glow: "shadow-[0_0_15px_rgba(249,115,22,0.3)]" },
    { icon: User, label: "Profile", path: "/profile", gradient: "from-slate-500/20 to-gray-500/20", glow: "shadow-[0_0_15px_rgba(100,116,139,0.3)]" },
  ];
  const commandCenterItems = [
    { icon: Scan, label: "Field Scanner", path: "/scanner", accentIcon: Sprout, gradient: "from-green-500/10 to-emerald-600/10" },
    { icon: MapPin, label: "Field Map", path: "/field-map", accentIcon: Sprout, gradient: "from-blue-500/10 to-sky-600/10" },
    { icon: Cloud, label: "Weather Timeline", path: "/weather-timeline", accentIcon: Cloud, gradient: "from-cyan-500/10 to-blue-600/10" },
  ];
  const businessItems: typeof commandCenterItems = [];
  const enhancedItems: typeof businessItems = [];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-card">
        <div className="container mx-auto px-6 py-5"><div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group"><div className="flex items-center justify-center h-12 w-12 rounded-xl gradient-delta shadow-glow transition-transform group-hover:scale-105"><Sprout className="h-7 w-7 text-white" /></div><div><h1 className="text-2xl font-display font-bold text-foreground">Agurate<span className="font-bold text-green-600">AI</span></h1><p className="text-xs text-muted-foreground">{PILOT_TAGLINE}</p></div></Link>
          <div className="flex items-center gap-2"><KeyboardShortcutsHelp /><Button onClick={handleLogout} variant="ghost" size="sm" className="hover:bg-destructive/10 hover:text-destructive transition-colors"><LogOut className="mr-2 h-4 w-4" />Logout</Button></div>
        </div></div>
      </header>
      <MobileDrawerNav navItems={navItems} commandCenterItems={commandCenterItems} businessItems={businessItems} enhancedItems={enhancedItems} />
      <div className="container mx-auto px-6 py-8 pb-8"><div className="flex gap-8">
        <aside className="hidden md:block w-72 flex-shrink-0"><nav className="space-y-2 sticky top-24">
          <div className="mb-6 pb-6 border-b border-border"><h2 className="text-sm font-bold text-muted-foreground mb-1">FARM MANAGEMENT</h2><p className="text-xs text-muted-foreground">Public agricultural decision aid</p></div>
          {navItems.map((item) => { const isActive = location.pathname === item.path; return <Link key={item.path} to={item.path}><div className={`relative flex items-center gap-4 p-4 rounded-xl transition-all duration-300 hover-lift group overflow-hidden ${isActive ? 'bg-primary/10 text-primary shadow-field' : 'hover:bg-muted text-foreground'}`}><div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} /><div className={`relative flex items-center justify-center h-10 w-10 rounded-lg transition-all duration-300 ${isActive ? `bg-primary/20 ${item.glow}` : 'bg-muted group-hover:bg-primary/10 group-hover:scale-110'}`}><item.icon className={`h-5 w-5 relative z-10 ${isActive ? 'cotton-drift' : ''}`} /></div><span className="font-medium relative z-10">{item.label}</span>{isActive && <Sprout className="absolute right-4 h-4 w-4 text-primary/60 animate-float" />}</div></Link>; })}
          <div className="mt-8 pt-6 border-t border-border"><h2 className="text-sm font-bold text-muted-foreground mb-4">FIELD TOOLS</h2><div className="space-y-2">{commandCenterItems.map((item) => { const isActive = location.pathname === item.path; const AccentIcon = item.accentIcon; return <Link key={item.path} to={item.path}><div className={`relative flex items-center gap-4 p-4 rounded-xl transition-all duration-300 hover-lift group overflow-hidden ${isActive ? 'bg-primary/10 text-primary shadow-field' : 'hover:bg-muted text-foreground'}`}><div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} /><div className={`relative flex items-center justify-center h-10 w-10 rounded-lg transition-all duration-300 ${isActive ? 'bg-primary/20' : 'bg-muted group-hover:bg-primary/10 group-hover:scale-110'}`}><item.icon className="h-5 w-5 relative z-10" /><AccentIcon className="absolute -bottom-1 -right-1 h-3 w-3 text-primary/40 opacity-0 group-hover:opacity-100 transition-opacity" /></div><span className="font-medium relative z-10">{item.label}</span></div></Link>; })}</div></div>
        </nav></aside>
        <main id="main-content" className="flex-1 min-w-0">{children}</main>
      </div></div>
      <footer className="border-t bg-muted/30 py-8"><div className="container mx-auto px-6"><div className="flex flex-col md:flex-row justify-between items-center gap-4"><div className="text-center md:text-left"><p className="text-sm text-muted-foreground">© 2026 AgurateAI. Agricultural observations are decision aids, not diagnoses.</p></div><div className="flex flex-wrap justify-center gap-4"><Link to="/auth"><Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">Account access</Button></Link><Link to="/how-it-works"><Button variant="ghost" size="sm">How It Works</Button></Link><Link to="/pilot-deferred"><Button variant="ghost" size="sm">Evidence scope</Button></Link></div></div></div></footer>
      <MobileFloatingActions />
    </div>
  );
};
