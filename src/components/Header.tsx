import { Moon, Sun, Plus, LogOut, LogIn, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import logo from "@/assets/logo.png";
import { motion } from "framer-motion";
import { UserSettings } from "./UserSettings";

interface HeaderProps {
  onNewCard: () => void;
}

export const Header = ({ onNewCard }: HeaderProps) => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Até logo!"
    });
    navigate("/auth");
  };

  return (
    <>
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
                <Button onClick={onNewCard} className="gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Novo Card</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setSettingsOpen(true)}
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

      <UserSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
};