import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Upload, 
  MapPin, 
  History, 
  User, 
  LogOut,
  Sprout,
  TrendingUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: Upload, label: "Upload", path: "/upload" },
    { icon: MapPin, label: "My Fields", path: "/fields" },
    { icon: History, label: "History", path: "/history" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  const commandCenterItems = [
    { icon: MapPin, label: "Field Scanner", path: "/scanner" },
    { icon: MapPin, label: "Field Map", path: "/field-map" },
    { icon: History, label: "Weather Timeline", path: "/weather-timeline" },
    { icon: TrendingUp, label: "Predictions", path: "/predictions" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Louisiana Agricultural Theme */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-card">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="flex items-center justify-center h-12 w-12 rounded-xl gradient-delta shadow-glow transition-transform group-hover:scale-105">
                <Sprout className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-foreground">AgurateAI</h1>
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

      {/* Mobile Navigation - Enhanced Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 shadow-field">
        <div className="grid grid-cols-5 gap-1 p-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200 active:scale-95 ${
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
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
                <h2 className="text-sm font-semibold text-muted-foreground mb-1">FARM MANAGEMENT</h2>
                <p className="text-xs text-muted-foreground">Delta Code Cultivation System™</p>
              </div>
              
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}>
                    <div
                      className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 hover-lift group ${
                        isActive 
                          ? 'bg-primary/10 text-primary shadow-field' 
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      <div className={`flex items-center justify-center h-10 w-10 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-primary/20' 
                          : 'bg-muted group-hover:bg-primary/10'
                      }`}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      <span className="font-medium">{item.label}</span>
                    </div>
                  </Link>
                );
              })}

              {/* Delta Command Center Section */}
              <div className="mt-8 pt-6 border-t border-border">
                <h2 className="text-sm font-semibold text-muted-foreground mb-4">DELTA COMMAND CENTER</h2>
                <div className="space-y-2">
                  {commandCenterItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link key={item.path} to={item.path}>
                        <div
                          className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 hover-lift group ${
                            isActive 
                              ? 'bg-primary/10 text-primary shadow-field' 
                              : 'hover:bg-muted text-foreground'
                          }`}
                        >
                          <div className={`flex items-center justify-center h-10 w-10 rounded-lg transition-colors ${
                            isActive 
                              ? 'bg-primary/20' 
                              : 'bg-muted group-hover:bg-primary/10'
                          }`}>
                            <item.icon className="h-5 w-5" />
                          </div>
                          <span className="font-medium">{item.label}</span>
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
    </div>
  );
};