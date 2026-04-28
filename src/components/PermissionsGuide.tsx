import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Edit, Crown, X, Shield, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/use-user-role";

export const PermissionsGuide = () => {
  const [open, setOpen] = useState(false);
  const { isAdmin, isEditor, isVisitor, loading } = useUserRole();

  const currentRole = isAdmin
    ? { label: "ADMIN", icon: Crown, color: "text-primary", bg: "bg-primary/10" }
    : isEditor
    ? { label: "Editor", icon: Edit, color: "text-green-500", bg: "bg-green-500/10" }
    : { label: "Visitante", icon: Eye, color: "text-blue-500", bg: "bg-blue-500/10" };

  const RoleIcon = currentRole.icon;

  const permissions = isAdmin
    ? [
        { allowed: true, text: "Visualizar todos os conteúdos" },
        { allowed: true, text: "Baixar arquivos" },
        { allowed: true, text: "Criar cards e enviar arquivos" },
        { allowed: true, text: "Editar e excluir qualquer conteúdo" },
        { allowed: true, text: "Gerenciar usuários e permissões" },
      ]
    : isEditor
    ? [
        { allowed: true, text: "Visualizar todos os conteúdos" },
        { allowed: true, text: "Baixar arquivos" },
        { allowed: true, text: "Criar cards e enviar arquivos" },
        { allowed: true, text: "Excluir apenas seus próprios conteúdos" },
        { allowed: false, text: "Excluir conteúdos de outros usuários" },
      ]
    : [
        { allowed: true, text: "Visualizar todos os conteúdos" },
        { allowed: true, text: "Baixar arquivos" },
        { allowed: false, text: "Criar cards ou enviar arquivos" },
        { allowed: false, text: "Editar ou excluir conteúdos" },
      ];

  return (
    <>
      {!open && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 left-6 z-30 gap-2 shadow-lg"
        >
          <Shield className="h-4 w-4" /> Guia de Permissões
        </Button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-6 z-30 w-80 rounded-lg border bg-card text-card-foreground shadow-xl"
          >
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Guia de Permissões</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Seu cargo atual</p>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-md ${currentRole.bg}`}>
                      <RoleIcon className={`h-5 w-5 ${currentRole.color}`} />
                      <span className={`font-semibold ${currentRole.color}`}>{currentRole.label}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Suas permissões</p>
                    <ul className="space-y-1.5">
                      {permissions.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          {p.allowed ? (
                            <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
                          )}
                          <span className={p.allowed ? "" : "text-muted-foreground line-through"}>
                            {p.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
