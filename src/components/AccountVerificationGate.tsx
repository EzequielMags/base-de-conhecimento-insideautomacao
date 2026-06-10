import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/use-user-role";
import { ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";

/**
 * Blocks the entire UI for users whose account hasn't been approved by an admin.
 * - Non-dismissible (no overlay click / ESC close)
 * - Has a "Verificar conta" button that re-checks status
 * - Admins are always considered verified
 */
export const AccountVerificationGate = () => {
  const location = useLocation();
  const { user, loading, isVerified, isAdmin, refreshVerified } = useUserRole();
  const [checking, setChecking] = useState(false);
  const [lastCheckMessage, setLastCheckMessage] = useState<string | null>(null);
  const [justVerified, setJustVerified] = useState(false);

  const onAuthPage = location.pathname.startsWith("/auth");
  const shouldBlock = !!user && !loading && !isVerified && !isAdmin && !onAuthPage;

  useEffect(() => {
    if (isVerified) setLastCheckMessage(null);
  }, [isVerified]);

  const handleCheck = async () => {
    setChecking(true);
    setLastCheckMessage(null);
    try {
      const v = await refreshVerified();
      if (v) {
        setJustVerified(true);
        setLastCheckMessage("Conta verificada! Bem-vindo à Base de Conhecimento.");
      } else {
        setLastCheckMessage("Os administradores ainda estão analisando sua conta. Tente novamente em instantes.");
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <Dialog open={shouldBlock || justVerified} onOpenChange={() => { /* non-dismissible */ }}>
      <DialogContent
        className="max-w-md [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {justVerified ? (
              <ShieldCheck className="h-5 w-5 text-green-500" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-primary" />
            )}
            {justVerified ? "Conta verificada" : "Conta aguardando liberação"}
          </DialogTitle>
          <DialogDescription>
            {justVerified
              ? "Sua conta foi liberada por um administrador. Agora você tem acesso completo à Base de Conhecimento."
              : "Por segurança, todo novo acesso precisa ser liberado por um administrador da Inside Automação antes de criar ou editar conteúdo. Você pode navegar e visualizar os cards, mas ações de escrita ficam bloqueadas."}
          </DialogDescription>
        </DialogHeader>

        {!justVerified && lastCheckMessage && (
          <p className="text-sm rounded-md border bg-muted/40 px-3 py-2 text-foreground/80">
            {lastCheckMessage}
          </p>
        )}

        <div className="flex flex-col gap-2 pt-2">
          {justVerified ? (
            <Button onClick={() => { setJustVerified(false); window.location.reload(); }} className="w-full">
              Continuar
            </Button>
          ) : (
            <Button onClick={handleCheck} disabled={checking} className="w-full">
              {checking ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando...</>
              ) : (
                "Verificar conta"
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
