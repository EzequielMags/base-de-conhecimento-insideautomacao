import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { ArrowLeft, Plus, Trash2, Loader2, ExternalLink, Link as LinkIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useUserRole } from "@/hooks/use-user-role";
import { PermissionsGuide } from "@/components/PermissionsGuide";
import googleDriveIcon from "@/assets/google-drive-icon.png";

interface AutopenDriver {
  id: string;
  version: string;
  link: string;
  user_id: string | null;
  created_at: string;
}

// Extract Google Drive file ID from common URL formats
function extractDriveFileId(url: string): string | null {
  if (!url) return null;
  // /file/d/{id}/...
  const m1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m1) return m1[1];
  // ?id={id} or &id={id}
  const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m2) return m2[1];
  // /d/{id}
  const m3 = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (m3) return m3[1];
  return null;
}

function isDriveUrl(url: string): boolean {
  return /drive\.google\.com|docs\.google\.com/i.test(url);
}

function buildDirectDownloadUrl(url: string): string {
  const id = extractDriveFileId(url);
  if (id) {
    return `https://drive.google.com/uc?export=download&id=${id}`;
  }
  return url;
}

// Compare versions in YYYY.VV format (ascending)
function compareVersions(a: string, b: string): number {
  const parse = (v: string) => {
    const [y, n] = v.split(".").map((p) => parseInt(p, 10) || 0);
    return y * 1000 + n;
  };
  return parse(a) - parse(b);
}

export default function Autopen() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, isEditor, canCreate } = useUserRole();
  const [drivers, setDrivers] = useState<AutopenDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [version, setVersion] = useState("");
  const [link, setLink] = useState("");

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("autopen_drivers")
      .select("*");

    if (error) {
      toast({
        title: "Erro ao carregar",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    setDrivers((data ?? []) as AutopenDriver[]);
    setLoading(false);
  };

  const sorted = useMemo(
    () => [...drivers].sort((a, b) => compareVersions(a.version, b.version)),
    [drivers],
  );

  const resetForm = () => {
    setVersion("");
    setLink("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!version.trim() || !link.trim()) {
      toast({ title: "Preencha versão e link", variant: "destructive" });
      return;
    }
    if (!/^\d{4}\.\d{1,3}$/.test(version.trim())) {
      toast({
        title: "Formato de versão inválido",
        description: "Use o formato YYYY.VV (ex: 2024.09)",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("autopen_drivers").insert({
      version: version.trim(),
      link: link.trim(),
      user_id: user?.id ?? null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Versão cadastrada com sucesso" });
    resetForm();
    setDialogOpen(false);
    fetchDrivers();
  };

  const handleDelete = async (driver: AutopenDriver) => {
    if (!confirm(`Excluir AUTOPEN (${driver.version})?`)) return;
    const { error } = await supabase.from("autopen_drivers").delete().eq("id", driver.id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Versão excluída" });
    fetchDrivers();
  };

  const handleDownload = (driver: AutopenDriver) => {
    const downloadUrl = buildDirectDownloadUrl(driver.link);
    // Silent download via hidden iframe to avoid leaving the site
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = downloadUrl;
    document.body.appendChild(iframe);
    setTimeout(() => {
      try {
        document.body.removeChild(iframe);
      } catch {}
    }, 60_000);
    toast({ title: `Baixando AUTOPEN (${driver.version})...` });
  };

  const canDelete = (driver: AutopenDriver) =>
    isAdmin || (isEditor && driver.user_id === user?.id);

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Header onNewCard={() => navigate("/")} />
          <div className="border-b border-border p-3 flex items-center gap-3">
            <SidebarTrigger />
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
            </Button>
            <span className="text-sm text-muted-foreground">AUTOPEN</span>
          </div>

          <main className="flex-1 p-6 overflow-auto">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">AUTOPEN</h1>
                <p className="text-muted-foreground text-sm">
                  Repositório de versões do driver AUTOPEN
                </p>
              </div>

              <div className="flex justify-end mb-4">
                {canCreate && (
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" /> Nova Versão
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Cadastrar nova versão AUTOPEN</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="version">Versão (YYYY.VV) *</Label>
                          <Input
                            id="version"
                            placeholder="Ex: 2024.09"
                            value={version}
                            onChange={(e) => setVersion(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="link">Link do driver (Google Drive) *</Label>
                          <Input
                            id="link"
                            type="url"
                            placeholder="https://drive.google.com/file/d/..."
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            required
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                          >
                            Cancelar
                          </Button>
                          <Button type="submit" disabled={submitting}>
                            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Salvar
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : sorted.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-border rounded-lg">
                  <p className="text-muted-foreground">Nenhuma versão cadastrada ainda.</p>
                </div>
              ) : (
                <ul className="divide-y divide-border border border-border rounded-lg overflow-hidden bg-card">
                  {sorted.map((driver) => {
                    const drive = isDriveUrl(driver.link);
                    return (
                      <li
                        key={driver.id}
                        className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent/40 transition-colors"
                      >
                        <button
                          onClick={() => handleDownload(driver)}
                          className="flex items-center gap-3 flex-1 text-left group"
                          title="Clique para baixar"
                        >
                          {drive ? (
                            <img
                              src={googleDriveIcon}
                              alt="Google Drive"
                              width={20}
                              height={20}
                              loading="lazy"
                              className="h-5 w-5 object-contain shrink-0"
                            />
                          ) : (
                            <LinkIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                          )}
                          <span className="font-medium group-hover:text-primary transition-colors">
                            AUTOPEN ({driver.version})
                          </span>
                        </button>
                        <div className="flex items-center gap-1">
                          <a
                            href={driver.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-accent transition-colors"
                            title="Abrir link original"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                          {canDelete(driver) && (
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDelete(driver)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </motion.div>
          </main>
        </div>
        <PermissionsGuide />
      </div>
    </SidebarProvider>
  );
}
