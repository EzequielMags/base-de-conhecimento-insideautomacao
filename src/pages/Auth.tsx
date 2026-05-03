import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import loginBg from "@/assets/login-bg.jpg";
import logo from "@/assets/logo.png";

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Login realizado!",
          description: "Bem-vindo de volta ao FixCards."
        });

        navigate("/");
      } else {
        // Validar domínio do email antes de criar conta
        if (!email.endsWith("@insideautomacao.com.br")) {
          toast({
            title: "Erro de validação",
            description: "Apenas emails do domínio @insideautomacao.com.br podem criar contas.",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name: name
            }
          }
        });

        if (error) throw error;

        toast({
          title: "Conta criada!",
          description: "Você já pode começar a usar o FixCards."
        });

        navigate("/");
      }
    } catch (error: any) {
      console.error("Erro de autenticação:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível completar a operação.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Desktop: static background image with glassmorphism */}
      <div
        className="absolute inset-0 hidden md:block bg-cover bg-center"
        style={{ backgroundImage: `url(${loginBg})` }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 hidden md:block"
        style={{ backdropFilter: "blur(12px) brightness(0.6)", WebkitBackdropFilter: "blur(12px) brightness(0.6)", backgroundColor: "hsl(0 0% 0% / 0.3)" }}
        aria-hidden="true"
      />

      {/* Mobile: animated wave gradient background */}
      <div className="absolute inset-0 md:hidden auth-mobile-bg overflow-hidden" aria-hidden="true">
        <div className="auth-wave-layer" />
        <div className="auth-wave-layer" style={{ animationDelay: "-6s", animationDuration: "16s" }} />
      </div>
      <Card className="relative w-full max-w-md shadow-2xl border-white/10 bg-card/80 backdrop-blur-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <img
              src={logo}
              alt="Inside Automação"
              className="h-20 w-auto object-contain drop-shadow-[0_0_15px_rgba(255,165,0,0.4)]"
            />
          </div>
          <CardTitle className="text-3xl font-bold">
            {isLogin ? "Bem-vindo de volta" : "Criar conta"}
          </CardTitle>
          <CardDescription>
            {isLogin
              ? "Entre com suas credenciais para acessar a Base de Conhecimento"
              : "Crie sua conta para começar a compartilhar soluções"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : isLogin ? (
                "Entrar"
              ) : (
                "Criar conta"
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline"
              disabled={loading}
            >
              {isLogin
                ? "Não tem uma conta? Criar conta"
                : "Já tem uma conta? Fazer login"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;