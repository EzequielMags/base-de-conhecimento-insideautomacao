import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import {
  ArrowLeft,
  Upload,
  Download,
  Trash2,
  FileCode,
  Loader2,
  Menu,
  Info,
  Pencil,
  ImageIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatFileSize, downloadFile } from "@/utils/fileUpload";
import { useUserRole } from "@/hooks/use-user-role";
import { PermissionsGuide } from "@/components/PermissionsGuide";

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

const PREVIEW_BUCKET = "doclayouts-previews";
const PREVIEW_ACCEPT = "image/png,image/jpeg,image/jpg,image/webp,application/pdf";

interface RepositoryFile {
  id: string;
  name: string;
  file_url: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  created_at: string;
  user_id: string | null;
  observation?: string | null;
  preview_url?: string | null;
  preview_path?: string | null;
}

interface RepositoryProps {
  kind: RepositoryKind;
}

export const Repository = ({ kind }: RepositoryProps) => {
  const config = CONFIGS[kind];
  const isDoclayouts = kind === "doclayouts";
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, canCreate } = useUserRole();
  const [files, setFiles] = useState<RepositoryFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");

  // Doclayouts upload dialog
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [observation, setObservation] = useState("");
  const [previewFile, setPreviewFile] = useState<File | null>(null);

  // Info dialog
  const [infoFile, setInfoFile] = useState<RepositoryFile | null>(null);

  // Edit dialog
  const [editFile, setEditFile] = useState<RepositoryFile | null>(null);
  const [editObservation, setEditObservation] = useState("");
  const [editPreviewFile, setEditPreviewFile] = useState<File | null>(null);
  const [editRemovePreview, setEditRemovePreview] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

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
      setFiles((data as any as RepositoryFile[]) || []);
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

  const uploadPreview = async (file: File): Promise<{ url: string; path: string }> => {
    const safe = sanitize(file.name);
    const path = `${user!.id}/${Date.now()}-${safe}`;
    const { error } = await supabase.storage.from(PREVIEW_BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(PREVIEW_BUCKET).getPublicUrl(path);
    return { url: publicUrl, path };
  };

  // Standard (non-doclayouts) multi upload
  const handleUploadStandard = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list || list.length === 0) return;
    if (!user) {
      toast({ title: "Login necessário", variant: "destructive" });
      return;
    }
    if (!canCreate) {
      toast({ title: "Sem permissão", variant: "destructive" });
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

  // Doclayouts: open dialog with single file
  const handlePickDoclayout = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!validExt(f.name)) {
      toast({
        title: "Formato inválido",
        description: `Permitido: ${config.extensions.join(", ")}`,
        variant: "destructive",
      });
      return;
    }
    setPendingFile(f);
    setObservation("");
    setPreviewFile(null);
    setUploadOpen(true);
  };

  const submitDoclayout = async () => {
    if (!pendingFile || !user) return;
    setUploading(true);
    try {
      const safe = sanitize(pendingFile.name);
      const path = `${user.id}/${Date.now()}-${safe}`;
      const { error: upErr } = await supabase.storage
        .from(config.bucket)
        .upload(path, pendingFile, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from(config.bucket).getPublicUrl(path);

      let preview: { url: string; path: string } | null = null;
      if (previewFile) preview = await uploadPreview(previewFile);

      const { error: insErr } = await supabase.from("repository_files").insert({
        repository: kind,
        user_id: user.id,
        name: pendingFile.name,
        file_url: publicUrl,
        file_path: path,
        file_size: pendingFile.size,
        file_type: pendingFile.type || pendingFile.name.split(".").pop() || "",
        observation: observation.trim() || null,
        preview_url: preview?.url ?? null,
        preview_path: preview?.path ?? null,
      } as any);
      if (insErr) throw insErr;

      toast({ title: "Upload concluído!" });
      setUploadOpen(false);
      setPendingFile(null);
      setObservation("");
      setPreviewFile(null);
      await load();
    } catch (err) {
      console.error(err);
      toast({ title: "Erro", description: "Falha ao enviar arquivo.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (file: RepositoryFile) => {
    if (!isAdmin && file.user_id !== user?.id) {
      toast({ title: "Sem permissão", variant: "destructive" });
      return;
    }
    if (!confirm(`Excluir "${file.name}"?`)) return;
    try {
      await supabase.storage.from(config.bucket).remove([file.file_path]);
      if (file.preview_path) {
        await supabase.storage.from(PREVIEW_BUCKET).remove([file.preview_path]);
      }
      const { error } = await supabase.from("repository_files").delete().eq("id", file.id);
      if (error) throw error;
      toast({ title: "Excluído!" });
      load();
    } catch (err) {
      console.error(err);
      toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" });
    }
  };

  const openEdit = (file: RepositoryFile) => {
    setEditFile(file);
    setEditObservation(file.observation || "");
    setEditPreviewFile(null);
    setEditRemovePreview(false);
  };

  const saveEdit = async () => {
    if (!editFile) return;
    setSavingEdit(true);
    try {
      let preview_url = editFile.preview_url ?? null;
      let preview_path = editFile.preview_path ?? null;

      if (editRemovePreview && editFile.preview_path) {
        await supabase.storage.from(PREVIEW_BUCKET).remove([editFile.preview_path]);
        preview_url = null;
        preview_path = null;
      }

      if (editPreviewFile) {
        // delete previous if any
        if (preview_path) {
          await supabase.storage.from(PREVIEW_BUCKET).remove([preview_path]);
        }
        const uploaded = await uploadPreview(editPreviewFile);
        preview_url = uploaded.url;
        preview_path = uploaded.path;
      }

      const { error } = await supabase
        .from("repository_files")
        .update({
          observation: editObservation.trim() || null,
          preview_url,
          preview_path,
        } as any)
        .eq("id", editFile.id);
      if (error) throw error;

      toast({ title: "Alterações salvas!" });
      setEditFile(null);
      await load();
    } catch (err) {
      console.error(err);
      toast({ title: "Erro", description: "Não foi possível salvar.", variant: "destructive" });
    } finally {
      setSavingEdit(false);
    }
  };

  const filtered = files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));

  const canEditFile = (f: RepositoryFile) =>
    isAdmin || (canCreate && f.user_id === user?.id);

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
                      multiple={!isDoclayouts}
                      onChange={isDoclayouts ? handlePickDoclayout : handleUploadStandard}
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
                    <Card className="relative hover:shadow-lg transition-all hover:-translate-y-1">
                      {isDoclayouts && (
                        <button
                          type="button"
                          onClick={() => setInfoFile(f)}
                          title="Ver informações"
                          className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center border border-primary/30 transition"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                      )}
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="p-3 rounded-lg bg-primary/10 text-primary">
                            <FileCode className="h-8 w-8" />
                          </div>
                          <div className="flex-1 min-w-0 pr-8">
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
                          {isDoclayouts && canEditFile(f) && (
                            <Button size="sm" variant="outline" onClick={() => openEdit(f)} title="Editar">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
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
        <PermissionsGuide />
      </div>

      {/* Doclayout upload dialog */}
      <Dialog open={uploadOpen} onOpenChange={(o) => !uploading && setUploadOpen(o)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Enviar Doclayout</DialogTitle>
            <DialogDescription>
              {pendingFile?.name} — adicione uma observação e, se quiser, uma imagem do layout em execução.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="obs">Observação</Label>
              <Textarea
                id="obs"
                placeholder="Explique o que esse arquivo faz na prática..."
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                rows={4}
              />
            </div>
            <div>
              <Label>Imagem ilustrativa (PNG, JPG, WEBP ou PDF)</Label>
              <Input
                type="file"
                accept={PREVIEW_ACCEPT}
                onChange={(e) => setPreviewFile(e.target.files?.[0] ?? null)}
              />
              {previewFile && (
                <p className="text-xs text-muted-foreground mt-1">
                  Selecionado: {previewFile.name}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)} disabled={uploading}>
              Cancelar
            </Button>
            <Button onClick={submitDoclayout} disabled={uploading} className="gap-2">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Info dialog */}
      <Dialog open={!!infoFile} onOpenChange={(o) => !o && setInfoFile(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="break-all">{infoFile?.name}</DialogTitle>
            <DialogDescription>Informações e observações deste layout.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Observação</Label>
              <p className="mt-1 text-sm whitespace-pre-wrap">
                {infoFile?.observation?.trim() || "Sem observação cadastrada."}
              </p>
            </div>
            {infoFile?.preview_url ? (
              <div>
                <Label className="text-xs text-muted-foreground">Imagem na prática</Label>
                {infoFile.preview_url.toLowerCase().endsWith(".pdf") ? (
                  <iframe
                    src={infoFile.preview_url}
                    className="w-full h-[60vh] mt-2 rounded border"
                    title="Preview PDF"
                  />
                ) : (
                  <img
                    src={infoFile.preview_url}
                    alt={`Preview de ${infoFile.name}`}
                    className="mt-2 w-full rounded border object-contain max-h-[60vh] bg-muted"
                  />
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ImageIcon className="h-4 w-4" /> Nenhuma imagem ilustrativa.
              </div>
            )}
          </div>
          <DialogFooter>
            {infoFile && (
              <Button
                variant="outline"
                onClick={() => downloadFile(infoFile.file_url, infoFile.name)}
                className="gap-2"
              >
                <Download className="h-4 w-4" /> Baixar arquivo
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editFile} onOpenChange={(o) => !o && !savingEdit && setEditFile(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar layout</DialogTitle>
            <DialogDescription className="break-all">{editFile?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-obs">Observação</Label>
              <Textarea
                id="edit-obs"
                value={editObservation}
                onChange={(e) => setEditObservation(e.target.value)}
                rows={4}
              />
            </div>
            <div>
              <Label>Substituir imagem ilustrativa</Label>
              <Input
                type="file"
                accept={PREVIEW_ACCEPT}
                onChange={(e) => setEditPreviewFile(e.target.files?.[0] ?? null)}
              />
              {editFile?.preview_url && !editPreviewFile && !editRemovePreview && (
                <div className="mt-2 flex items-center gap-2">
                  <img
                    src={editFile.preview_url}
                    alt="Atual"
                    className="h-16 w-16 object-cover rounded border"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditRemovePreview(true)}
                  >
                    Remover atual
                  </Button>
                </div>
              )}
              {editRemovePreview && (
                <p className="text-xs text-destructive mt-1">A imagem atual será removida ao salvar.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditFile(null)} disabled={savingEdit}>
              Cancelar
            </Button>
            <Button onClick={saveEdit} disabled={savingEdit} className="gap-2">
              {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default Repository;
