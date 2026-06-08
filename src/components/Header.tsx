import { Moon, Sun, Plus, LogIn, ListChecks, BookOpen, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import logo from "@/assets/logo.png";
import { motion } from "framer-motion";
import { UserMenu } from "@/components/UserMenu";
import { useThemeLogoFilter } from "@/hooks/use-theme-logo";

interface HeaderProps {
  onNewCard: () => void;
  canCreate?: boolean;
}

export const Header = ({ onNewCard, canCreate = true }: HeaderProps) => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const logoFilter = useThemeLogoFilter();
  const [user, setUser] = useState<any>(null);
  const [pendingDemands, setPendingDemands] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setPendingDemands(0);
      return;
    }
    const fetchCount = async () => {
      const { count } = await (supabase as any)
        .from("demands")
        .select("id", { count: "exact", head: true })
        .eq("status", "aguardando");
      setPendingDemands(count || 0);
    };
    fetchCount();
    const channel = supabase
      .channel("demands-header-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "demands" }, fetchCount)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Logout handled inside UserMenu

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60"
    >
      <div className="container flex h-16 items-center justify-between px-4">
        <motion.div 
          className="flex items-center"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <img src={logo} alt="Inside Automação" className="h-12 object-contain" />
        </motion.div>
        
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {(() => {
                const onDemands = location.pathname === "/demandas" || location.pathname === "/finalizados";
                return (
                  <Button
                    variant="outline"
                    onClick={() => navigate(onDemands ? "/" : "/demandas")}
                    className="gap-2 border-primary/40 hover:bg-primary/10 relative"
                  >
                    {onDemands ? <BookOpen className="h-4 w-4" /> : <ListChecks className="h-4 w-4" />}
                    <span className="hidden sm:inline">{onDemands ? "Cards de Conhecimento" : "Demandas"}</span>
                    {!onDemands && pendingDemands > 0 && (
                      <span
                        className="demand-badge absolute -top-2 -right-2 min-w-[20px] h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center gap-0.5 border-2 border-background"
                        aria-label={`${pendingDemands} demandas pendentes`}
                      >
                        <AlertCircle className="h-2.5 w-2.5" />
                        {pendingDemands}
                      </span>
                    )}
                  </Button>
                );
              })()}
              {canCreate && (
                <Button onClick={onNewCard} className="gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Novo Card</span>
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={() => navigate("/settings")}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Configurações</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </>
          ) : (
            <Button
              onClick={() => navigate("/auth")}
              className="gap-2"
            >
              <LogIn className="h-4 w-4" />
              Entrar
            </Button>
          )}

          <div id="header-music-slot" className="flex items-center" />

          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </motion.header>
  );
};
