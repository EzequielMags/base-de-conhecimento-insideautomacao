import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { ArrowLeft, Upload, Download, Trash2, FileCode, Loader2, Menu } from "lucide-react";
import { motion } from "framer-motion";
import { formatFileSize, downloadFile } from "@/utils/fileUpload";
import { useUserRole } from "@/hooks/use-user-role";

export type RepositoryKind = "scripts" | "skins" | "doclayouts";

interface RepositoryConfig {
  kind: RepositoryKind;
  bucket: string;
  title: string;
  emoji: string;
  description: string;
  extensions: string[];
  accept: string;
}

const CONFIGS: Record<RepositoryKind, RepositoryConfig> = {
  scripts: {
    kind: "scripts",
    bucket: "scripts-files",
    title: "Scripts",
    emoji: "💻",
    description: "Repositório de scripts (.cs, .bat, .txt, .ps1, .vbs)",
    extensions: [".cs", ".bat", ".txt", ".ps1", ".vbs"],
    accept: ".cs,.bat,.txt,.ps1,.vbs",
  },
  skins: {
    kind: "skins",
    bucket: "skins-files",
    title: "Skins",
    emoji: "🎨",
    description: "Repositório de skins (.rar, .zip)",
    extensions: [".rar", ".zip"],
    accept: ".rar,.zip,application/zip,application/x-rar-compressed",
  },
  doclayouts: {
    kind: "doclayouts",
    bucket: "doclayouts-files",
    title: "Doclayouts",
    emoji: "📐",
    description: "Repositório de layouts (.DOK, .BAK, .txt)",
    extensions: [".dok", ".bak", ".txt"],
    accept: ".dok,.bak,.txt",
  },
};

interface RepositoryFile {
  id: string;
  name: string;
  file_url: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  created_at: string;
  user_id: string | null;
}

interface RepositoryProps {
  kind: RepositoryKind;
}

export const Repository = ({ kind }: RepositoryProps) => {
  const config = CONFIGS[kind];
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, canCreate } = useUserRole();
  const [files, setFiles] = useState<RepositoryFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("repository_files")
      .select("*")
      .eq("repository", kind)
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Erro", description: "Não foi possível carregar os arquivos.", variant: "destructive" });
    } else {
      setFiles((data as RepositoryFile[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [kind]);

  const sanitize = (name: string) =>
    name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");

  const validExt = (name: string) => {
    const lower = name.toLowerCase();
    return config.extensions.some((ext) => lower.endsWith(ext));
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list || list.length === 0) return;
    if (!user) {
      toast({ title: "Login necessário", variant: "destructive" });
      return;
    }
    if (!canCreate) {
      toast({ title: "Sem permissão", description: "Apenas Editores e Admins podem enviar arquivos.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      for (const file of Array.from(list)) {
        if (!validExt(file.name)) {
          toast({
            title: "Formato inválido",
            description: `${file.name} — permitido: ${config.extensions.join(", ")}`,
            variant: "destructive",
          });
          continue;
        }
        const safe = sanitize(file.name);
        const path = `${user.id}/${Date.now()}-${safe}`;
        const { error: upErr } = await supabase.storage.from(config.bucket).upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (upErr) throw upErr;
        const { data: { publicUrl } } = supabase.storage.from(config.bucket).getPublicUrl(path);
        const { error: insErr } = await supabase.from("repository_files").insert({
          repository: kind,
          user_id: user.id,
          name: file.name,
          file_url: publicUrl,
          file_path: path,
          file_size: file.size,
          file_type: file.type || file.name.split(".").pop() || "",
        });
        if (insErr) throw insErr;
      }
      toast({ title: "Upload concluído!" });
      await load();
    } catch (err) {
      console.error(err);
      toast({ title: "Erro", description: "Falha ao enviar arquivo.", variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (file: RepositoryFile) => {
    if (!isAdmin && file.user_id !== user?.id) {
      toast({ title: "Sem permissão", description: "Você só pode excluir arquivos que enviou.", variant: "destructive" });
      return;
    }
    if (!confirm(`Excluir "${file.name}"?`)) return;
    try {
      await supabase.storage.from(config.bucket).remove([file.file_path]);
      const { error } = await supabase.from("repository_files").delete().eq("id", file.id);
      if (error) throw error;
      toast({ title: "Excluído!" });
      load();
    } catch (err) {
      console.error(err);
      toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" });
    }
  };

  const filtered = files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />

        <div className="flex-1 flex flex-col">
          <Header onNewCard={() => navigate("/")} />

          <div className="flex items-center gap-2 px-4 py-3 border-b bg-card/50">
            <SidebarTrigger className="hover:bg-accent transition-colors">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
            <span className="text-sm text-muted-foreground">{config.title}</span>
          </div>

          <main className="flex-1 container px-4 py-8 space-y-6 animate-fade-in-up">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">{config.emoji} {config.title}</h2>
              <p className="text-muted-foreground">{config.description}</p>
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: <span className="font-mono">{config.extensions.join(" ")}</span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 max-w-4xl mx-auto">
              <Input
                placeholder={`Buscar em ${config.title}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1"
              />
              {canCreate && (
                <Button asChild disabled={uploading} className="gap-2">
                  <label className="cursor-pointer">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploading ? "Enviando..." : "Enviar Arquivo"}
                    <input
                      type="file"
                      accept={config.accept}
                      multiple
                      onChange={handleUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </Button>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <FileCode className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Nenhum arquivo encontrado.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
                {filtered.map((f) => (
                  <motion.div key={f.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    <Card className="hover:shadow-lg transition-all hover:-translate-y-1">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="p-3 rounded-lg bg-primary/10 text-primary">
                            <FileCode className="h-8 w-8" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate" title={f.name}>{f.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {f.file_size ? formatFileSize(f.file_size) : ""}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(f.created_at).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1 gap-2" onClick={() => downloadFile(f.file_url, f.name)}>
                            <Download className="h-4 w-4" /> Baixar
                          </Button>
                          {(isAdmin || f.user_id === user?.id) && (
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(f)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Repository;
