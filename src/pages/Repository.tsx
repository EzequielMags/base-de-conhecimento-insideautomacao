import { useEffect, useState } from "react";
import { PreviewLightbox } from "@/components/PreviewLightbox";
import { FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
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
  X,
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
const PREVIEW_ACCEPT_IMAGES = "image/png,image/jpeg,image/jpg,image/webp";
const PREVIEW_ACCEPT_DOCLAYOUTS = "image/png,image/jpeg,image/jpg,image/webp,application/pdf";
const MAX_PREVIEWS = 3;
const isPdf = (url?: string | null) => !!url && /\.pdf(\?|$)/i.test(url);

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
  preview_urls?: string[] | null;
  preview_paths?: string[] | null;
}

interface RepositoryProps {
  kind: RepositoryKind;
}

export const Repository = ({ kind }: RepositoryProps) => {
  const config = CONFIGS[kind];
  const hasInfo = true; // all three now have info
  const hasPreviews = kind === "skins" || kind === "doclayouts"; // images supported
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, canCreate } = useUserRole();
  const [files, setFiles] = useState<RepositoryFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");

  // Upload dialog (with observation + optional previews)
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [observation, setObservation] = useState("");
  const [previewFiles, setPreviewFiles] = useState<File[]>([]);

  // Info dialog
  const [infoFile, setInfoFile] = useState<RepositoryFile | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Edit dialog
  const [editFile, setEditFile] = useState<RepositoryFile | null>(null);
  const [editObservation, setEditObservation] = useState("");
  const [editNewPreviews, setEditNewPreviews] = useState<File[]>([]);
  const [editKeepUrls, setEditKeepUrls] = useState<string[]>([]);
  const [editKeepPaths, setEditKeepPaths] = useState<string[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  const allPreviews = (f: RepositoryFile | null) => {
    if (!f) return [] as { url: string; path: string | null }[];
    const arr: { url: string; path: string | null }[] = [];
    if (f.preview_urls && f.preview_urls.length > 0) {
      f.preview_urls.forEach((u, i) => arr.push({ url: u, path: f.preview_paths?.[i] ?? null }));
    } else if (f.preview_url) {
      arr.push({ url: f.preview_url, path: f.preview_path ?? null });
    }
    return arr;
  };

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
      setFiles((data ?? []) as RepositoryFile[]);
    }
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [kind]);

  const sanitize = (name: string) =>
    name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");

  const validExt = (name: string) => {
    const lower = name.toLowerCase();
    return config.extensions.some((ext) => lower.endsWith(ext));
  };

  const uploadPreview = async (file: File): Promise<{ url: string; path: string }> => {
    const safe = sanitize(file.name);
    const path = `${user!.id}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${safe}`;
    const { error } = await supabase.storage.from(PREVIEW_BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(PREVIEW_BUCKET).getPublicUrl(path);
    return { url: publicUrl, path };
  };

  // Open upload dialog with selected file
  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setPreviewFiles([]);
    setUploadOpen(true);
  };

  const submitUpload = async () => {
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

      const previews: { url: string; path: string }[] = [];
      if (hasPreviews) {
        for (const pf of previewFiles.slice(0, MAX_PREVIEWS)) {
          previews.push(await uploadPreview(pf));
        }
      }

      const payload: TablesInsert<"repository_files"> = {
        repository: kind,
        user_id: user.id,
        name: pendingFile.name,
        file_url: publicUrl,
        file_path: path,
        file_size: pendingFile.size,
        file_type: pendingFile.type || pendingFile.name.split(".").pop() || "",
        observation: observation.trim() || null,
        preview_urls: previews.map((p) => p.url),
        preview_paths: previews.map((p) => p.path),
      };
      const { error: insErr } = await supabase.from("repository_files").insert(payload);
      if (insErr) throw insErr;

      toast({ title: "Upload concluído!" });
      setUploadOpen(false);
      setPendingFile(null);
      setObservation("");
      setPreviewFiles([]);
      await load();
    } catch (err) {
      console.error(err);
      toast({ title: "Erro", description: "Falha ao enviar arquivo.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (file: RepositoryFile) => {
    if (!isAdmin) {
      toast({ title: "Sem permissão", description: "Apenas administradores podem excluir.", variant: "destructive" });
      return;
    }
    if (!confirm(`Excluir "${file.name}"?`)) return;
    try {
      await supabase.storage.from(config.bucket).remove([file.file_path]);
      const paths = (file.preview_paths && file.preview_paths.length > 0)
        ? file.preview_paths
        : file.preview_path ? [file.preview_path] : [];
      if (paths.length > 0) await supabase.storage.from(PREVIEW_BUCKET).remove(paths);
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
    setEditNewPreviews([]);
    const cur = allPreviews(file);
    setEditKeepUrls(cur.map((c) => c.url));
    setEditKeepPaths(cur.map((c) => c.path || ""));
  };

  const saveEdit = async () => {
    if (!editFile) return;
    setSavingEdit(true);
    try {
      const cur = allPreviews(editFile);
      // Remove from storage any preview that was dropped
      const removedPaths = cur
        .filter((c) => c.path && !editKeepPaths.includes(c.path))
        .map((c) => c.path!) as string[];
      if (removedPaths.length > 0) {
        await supabase.storage.from(PREVIEW_BUCKET).remove(removedPaths);
      }

      const urls = [...editKeepUrls];
      const paths = [...editKeepPaths];

      if (hasPreviews) {
        const slots = MAX_PREVIEWS - urls.length;
        for (const pf of editNewPreviews.slice(0, Math.max(0, slots))) {
          const up = await uploadPreview(pf);
          urls.push(up.url);
          paths.push(up.path);
        }
      }

      const payload: TablesUpdate<"repository_files"> = {
        observation: editObservation.trim() || null,
        preview_urls: urls,
        preview_paths: paths,
        // legacy fields cleared
        preview_url: null,
        preview_path: null,
      };

      const { error } = await supabase
        .from("repository_files")
        .update(payload)
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
                      onChange={handlePick}
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
                      {hasInfo && (
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
                          {canEditFile(f) && (
                            <Button size="sm" variant="outline" onClick={() => openEdit(f)} title="Editar">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {isAdmin && (
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

      {/* Upload dialog */}
      <Dialog open={uploadOpen} onOpenChange={(o) => !uploading && setUploadOpen(o)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Enviar {config.title}</DialogTitle>
            <DialogDescription>
              {pendingFile?.name}
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
            {hasPreviews && (
              <div>
                <Label>Imagens ilustrativas (até {MAX_PREVIEWS}{kind === "doclayouts" ? " — PNG, JPG, WEBP, PDF" : " — PNG, JPG, WEBP"})</Label>
                <Input
                  type="file"
                  accept={kind === "doclayouts" ? PREVIEW_ACCEPT_DOCLAYOUTS : PREVIEW_ACCEPT_IMAGES}
                  multiple
                  onChange={(e) => {
                    const list = Array.from(e.target.files || [])
                      .filter((file) => kind === "doclayouts" || file.type.startsWith("image/"))
                      .slice(0, MAX_PREVIEWS);
                    setPreviewFiles(list);
                  }}
                />
                {previewFiles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {previewFiles.map((p, i) => (
                      <div key={i} className="text-xs px-2 py-1 rounded bg-muted">
                        {p.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)} disabled={uploading}>
              Cancelar
            </Button>
            <Button onClick={submitUpload} disabled={uploading} className="gap-2">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Info dialog */}
      <Dialog open={!!infoFile} onOpenChange={(o) => {
        if (!o) {
          setLightboxIndex(null);
          setInfoFile(null);
        }
      }}>
        <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="break-all">{infoFile?.name}</DialogTitle>
            <DialogDescription>Informações e observações deste arquivo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Observação</Label>
              <p className="mt-1 text-sm whitespace-pre-wrap">
                {infoFile?.observation?.trim() || "Sem observação cadastrada."}
              </p>
            </div>
            {hasPreviews && (
              allPreviews(infoFile).length > 0 ? (
                <div>
                  <Label className="text-xs text-muted-foreground">{kind === "doclayouts" ? "Prévias e PDFs" : "Imagens na prática"}</Label>
                  <div className="mt-2 grid grid-cols-1 gap-3">
                    {allPreviews(infoFile).map((p, i) => {
                      const pdf = isPdf(p.url);
                      if (pdf) {
                        return (
                          <div key={i} className="rounded border bg-muted overflow-hidden">
                            <div className="flex items-center justify-between gap-2 border-b bg-card px-3 py-2 text-sm font-medium">
                              <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> PDF interativo</span>
                              <Button size="sm" variant="outline" onClick={() => setLightboxIndex(i)}>
                                Abrir em tela cheia
                              </Button>
                            </div>
                            <iframe
                              key={`${infoFile?.id}-${p.url}`}
                              src={`${p.url}#view=FitH`}
                              className="h-[70vh] w-full bg-background"
                              title={`PDF ${i + 1}`}
                            />
                          </div>
                        );
                      }
                      return (
                        <button
                          type="button"
                          key={i}
                          onClick={() => setLightboxIndex(i)}
                          className="group relative rounded border bg-muted overflow-hidden hover:ring-2 hover:ring-primary transition"
                          title="Clique para ampliar"
                        >
                          <img
                            src={p.url}
                            alt={`Preview ${i + 1}`}
                            className="w-full object-contain max-h-80"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ImageIcon className="h-4 w-4" /> Nenhuma imagem ilustrativa.
                </div>
              )
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
            <DialogTitle>Editar arquivo</DialogTitle>
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
            {hasPreviews && (
              <div className="space-y-2">
                <Label>Imagens (até {MAX_PREVIEWS})</Label>
                {editKeepUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {editKeepUrls.map((u, i) => (
                      <div key={u} className="relative">
                        {isPdf(u) ? (
                          <div className="h-20 w-20 rounded border bg-muted flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground">
                            <FileText className="h-5 w-5 text-primary" />
                            PDF
                          </div>
                        ) : (
                          <img src={u} alt="" className="h-20 w-20 object-cover rounded border" />
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditKeepUrls(editKeepUrls.filter((_, idx) => idx !== i));
                            setEditKeepPaths(editKeepPaths.filter((_, idx) => idx !== i));
                          }}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full h-5 w-5 flex items-center justify-center"
                          title="Remover"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {editKeepUrls.length < MAX_PREVIEWS && (
                  <Input
                    type="file"
                    accept={kind === "doclayouts" ? PREVIEW_ACCEPT_DOCLAYOUTS : PREVIEW_ACCEPT_IMAGES}
                    multiple
                    onChange={(e) => {
                      const slots = MAX_PREVIEWS - editKeepUrls.length;
                      const list = Array.from(e.target.files || [])
                        .filter((file) => kind === "doclayouts" || file.type.startsWith("image/"))
                        .slice(0, slots);
                      setEditNewPreviews(list);
                    }}
                  />
                )}
                {editNewPreviews.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    +{editNewPreviews.length} nova(s) imagem(ns) ao salvar
                  </p>
                )}
              </div>
            )}
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

      <PreviewLightbox
        items={allPreviews(infoFile).map((p) => ({ url: p.url, type: isPdf(p.url) ? "pdf" : "image" }))}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />
    </SidebarProvider>
  );
};

export default Repository;
