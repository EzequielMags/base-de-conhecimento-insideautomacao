import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Edit, Crown, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export const PermissionsGuide = () => {
  const [open, setOpen] = useState(true);

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
            className="fixed bottom-6 left-6 z-30 w-72 rounded-lg border bg-card text-card-foreground shadow-xl"
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
            <div className="p-4 space-y-3 text-sm">
              <div className="flex gap-2">
                <Eye className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
                <div>
                  <p className="font-medium">Visitante</p>
                  <ul className="text-xs text-muted-foreground list-disc ml-4">
                    <li>Visualizar e baixar.</li>
                    <li>Não pode criar ou excluir.</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-2">
                <Edit className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                <div>
                  <p className="font-medium">Editor</p>
                  <ul className="text-xs text-muted-foreground list-disc ml-4">
                    <li>Criar, ver e baixar.</li>
                    <li>Excluir <em>apenas os seus</em>.</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-2">
                <Crown className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <div>
                  <p className="font-medium">ADMIN</p>
                  <ul className="text-xs text-muted-foreground list-disc ml-4">
                    <li>Controle total.</li>
                    <li>Criar, ver, baixar e excluir tudo.</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
