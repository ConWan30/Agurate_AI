import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Upload, 
  MapPin, 
  History as HistoryIcon, 
  User, 
  LogOut,
  Sprout,
  TrendingUp,
  Lightbulb,
  FileText,
  Users,
  Brain,
  Scan,
  Cloud
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MobileFloatingActions from "./MobileFloatingActions";
import morehouseShape from "@/assets/morehouse-parish-shape.jpg";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out successfully",
    });
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
    { icon: TrendingUp, label: "Predictions", path: "/predictions", accentIcon: TrendingUp, gradient: "from-purple-500/10 to-indigo-600/10" },
  ];

  const businessItems = [
    { icon: FileText, label: "Insurance", path: "/insurance", accentIcon: FileText, gradient: "from-red-500/10 to-rose-600/10" },
    { icon: Users, label: "Cooperatives", path: "/cooperatives", accentIcon: Users, gradient: "from-amber-500/10 to-orange-600/10" },
    { icon: Brain, label: "Delta AI", path: "/delta", accentIcon: Brain, gradient: "from-violet-500/10 to-purple-600/10" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Louisiana Agricultural Theme */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-card">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative flex items-center justify-center h-14 w-14 transition-transform group-hover:scale-105">
                {/* Morehouse Parish shape background */}
                <div className="absolute inset-0 overflow-hidden rounded-lg shadow-glow">
                  <img 
                    src={morehouseShape} 
                    alt="Morehouse Parish" 
                    className="w-full h-full object-contain brightness-110 contrast-125"
                  />
                </div>
                
                {/* Leaf symbol in center */}
                <div className="relative z-10 flex items-center justify-center h-7 w-7 rounded-full bg-primary/90">
                  <Sprout className="h-4 w-4 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-foreground">
                  Agurate<span className="font-bold text-green-600">AI</span>
                </h1>
                <p className="text-xs text-muted-foreground">Morehouse Parish, Louisiana</p>
              </div>
            </Link>
            
            <Button 
              onClick={handleLogout} 
              variant="ghost" 
              size="sm"
              className="hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation - Enhanced with Agricultural Aesthetics */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/98 backdrop-blur-lg supports-[backdrop-filter]:bg-card/90 shadow-delta-mist">
        <div className="grid grid-cols-5 gap-1 p-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-300 group ${
                  isActive 
                    ? `bg-gradient-to-br ${item.gradient} text-primary ${item.glow}` 
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {/* Animated background on hover */}
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                {/* Icon with micro animation */}
                <item.icon className={`h-5 w-5 relative z-10 transition-transform duration-300 ${isActive ? 'delta-wave' : 'group-hover:scale-110'}`} />
                
                {/* Label */}
                <span className="text-xs font-medium relative z-10">{item.label}</span>
                
                {/* Active indicator sprout */}
                {isActive && (
                  <Sprout className="absolute -top-1 -right-1 h-3 w-3 text-primary animate-float" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 pb-24 md:pb-8">
        <div className="flex gap-8">
          {/* Desktop Sidebar - Louisiana Agricultural Theme */}
          <aside className="hidden md:block w-72 flex-shrink-0">
            <nav className="space-y-2 sticky top-24">
              <div className="mb-6 pb-6 border-b border-border">
                <h2 className="text-sm font-bold text-muted-foreground mb-1">FARM MANAGEMENT</h2>
                <p className="text-xs text-muted-foreground">Delta Code Cultivation System™</p>
              </div>
              
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}>
                    <div
                      className={`relative flex items-center gap-4 p-4 rounded-xl transition-all duration-300 hover-lift group overflow-hidden ${
                        isActive 
                          ? 'bg-primary/10 text-primary shadow-field' 
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      {/* Animated gradient background */}
                      <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                      
                      {/* Icon container with glow */}
                      <div className={`relative flex items-center justify-center h-10 w-10 rounded-lg transition-all duration-300 ${
                        isActive 
                          ? `bg-primary/20 ${item.glow}` 
                          : 'bg-muted group-hover:bg-primary/10 group-hover:scale-110'
                      }`}>
                        <item.icon className={`h-5 w-5 relative z-10 ${isActive ? 'cotton-drift' : ''}`} />
                      </div>
                      
                      {/* Label */}
                      <span className="font-medium relative z-10">{item.label}</span>
                      
                      {/* Active sprout indicator */}
                      {isActive && (
                        <Sprout className="absolute right-4 h-4 w-4 text-primary/60 animate-float" />
                      )}
                    </div>
                  </Link>
                );
              })}

              {/* Delta Command Center Section */}
              <div className="mt-8 pt-6 border-t border-border">
                <h2 className="text-sm font-bold text-muted-foreground mb-4">DELTA COMMAND CENTER</h2>
                <div className="space-y-2">
                  {commandCenterItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const AccentIcon = item.accentIcon;
                    return (
                      <Link key={item.path} to={item.path}>
                        <div
                          className={`relative flex items-center gap-4 p-4 rounded-xl transition-all duration-300 hover-lift group overflow-hidden ${
                            isActive 
                              ? 'bg-primary/10 text-primary shadow-field' 
                              : 'hover:bg-muted text-foreground'
                          }`}
                        >
                          {/* Gradient shimmer on hover */}
                          <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                          
                          <div className={`relative flex items-center justify-center h-10 w-10 rounded-lg transition-all duration-300 ${
                            isActive 
                              ? 'bg-primary/20' 
                              : 'bg-muted group-hover:bg-primary/10 group-hover:scale-110'
                          }`}>
                            <item.icon className={`h-5 w-5 relative z-10 ${isActive ? 'delta-wave' : ''}`} />
                            {/* Micro accent icon */}
                            <AccentIcon className="absolute -bottom-1 -right-1 h-3 w-3 text-primary/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <span className="font-medium relative z-10">{item.label}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Business Tools Section */}
              <div className="mt-8 pt-6 border-t border-border">
                <h2 className="text-sm font-bold text-muted-foreground mb-4">BUSINESS TOOLS</h2>
                <div className="space-y-2">
                  {businessItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const AccentIcon = item.accentIcon;
                    return (
                      <Link key={item.path} to={item.path}>
                        <div
                          className={`relative flex items-center gap-4 p-4 rounded-xl transition-all duration-300 hover-lift group overflow-hidden ${
                            isActive 
                              ? 'bg-primary/10 text-primary shadow-field' 
                              : 'hover:bg-muted text-foreground'
                          }`}
                        >
                          {/* Gradient background on hover */}
                          <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                          
                          <div className={`relative flex items-center justify-center h-10 w-10 rounded-lg transition-all duration-300 ${
                            isActive 
                              ? 'bg-primary/20' 
                              : 'bg-muted group-hover:bg-primary/10 group-hover:scale-110'
                          }`}>
                            <item.icon className={`h-5 w-5 relative z-10 ${isActive ? 'cotton-drift' : ''}`} />
                            {/* Pulse accent on hover */}
                            <AccentIcon className="absolute -top-1 -right-1 h-3 w-3 text-primary/40 opacity-0 group-hover:opacity-100 animate-glow-pulse transition-opacity" />
                          </div>
                          <span className="font-medium relative z-10">{item.label}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
      
      {/* Mobile Floating Action Buttons */}
      <MobileFloatingActions />
    </div>
  );
};