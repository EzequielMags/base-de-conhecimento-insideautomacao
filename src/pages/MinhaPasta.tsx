import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Header } from "@/components/Header";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import JSZip from "jszip";
import {
  Upload,
  FolderOpen,
  FileIcon,
  Download,
  Trash2,
  Copy,
  Link as LinkIcon,
  Loader2,
  Menu,
  Search,
  HelpCircle,
  FileArchive,
  Image as ImageIcon,
  FileText,
  Music,
  Video,
  CheckSquare,
  Square,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UFile {
  name: string;
  size: number;
  updated_at: string | null;
  mimetype?: string;
}

const TUTORIAL_KEY = "minha-pasta:tutorial-v1";
const BUCKET = "user-folder";

const fmtSize = (b: number) => {
  if (!b) return "0 B";
  const u = ["B", "KB", "MB", "GB"];
  const i = Math.min(u.length - 1, Math.floor(Math.log(b) / Math.log(1024)));
  return `${(b / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${u[i]}`;
};

const iconFor = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext)) return ImageIcon;
  if (["mp3", "wav", "ogg", "m4a"].includes(ext)) return Music;
  if (["mp4", "webm", "mov", "mkv"].includes(ext)) return Video;
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return FileArchive;
  if (["pdf", "txt", "md", "doc", "docx"].includes(ext)) return FileText;
  return FileIcon;
};

const MinhaPasta = () => {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [files, setFiles] = useState<UFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [zipAsk, setZipAsk] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      if (!localStorage.getItem(TUTORIAL_KEY)) setTutorialOpen(true);
      await reload(user.id);
    })();
  }, []);

  const reload = useCallback(async (uid?: string) => {
    const id = uid || userId;
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.storage.from(BUCKET).list(id, {
        limit: 1000,
        sortBy: { column: "updated_at", order: "desc" },
      });
      if (error) throw error;
      setFiles((data || []).filter((f: any) => f.name && f.name !== ".emptyFolderPlaceholder").map((f: any) => ({
        name: f.name,
        size: f.metadata?.size ?? 0,
        updated_at: f.updated_at ?? null,
        mimetype: f.metadata?.mimetype,
      })));
    } catch (e: any) {
      toast({ title: "Erro ao listar", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  const uploadBlob = async (name: string, blob: Blob | File, contentType?: string) => {
    if (!userId) return;
    const safeName = name.replace(/[^\w.\-() ]/g, "_");
    const path = `${userId}/${safeName}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
      upsert: true,
      contentType: contentType || (blob as File).type || "application/octet-stream",
    });
    if (error) throw error;
  };

  const handleFiles = async (list: FileList | File[]) => {
    const arr = Array.from(list);
    if (!arr.length) return;
    // If exactly one zip, ask user
    if (arr.length === 1 && /\.zip$/i.test(arr[0].name)) {
      setZipAsk(arr[0]);
      return;
    }
    setUploading(true);
    try {
      let i = 0;
      for (const f of arr) {
        i++;
        setProgress(`Enviando ${i}/${arr.length}: ${f.name}`);
        await uploadBlob(f.name, f);
      }
      toast({ title: "Upload concluído", description: `${arr.length} arquivo(s) enviado(s).` });
      await reload();
    } catch (e: any) {
      toast({ title: "Falha no upload", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
      setProgress(null);
    }
  };

  const extractZip = async (zipFile: File) => {
    setUploading(true);
    try {
      setProgress(`Lendo ${zipFile.name}...`);
      const zip = await JSZip.loadAsync(zipFile);
      const entries = Object.values(zip.files).filter((e) => !e.dir);
      let i = 0;
      for (const entry of entries) {
        i++;
        setProgress(`Extraindo ${i}/${entries.length}: ${entry.name}`);
        const blob = await entry.async("blob");
        const base = entry.name.split("/").pop() || entry.name;
        await uploadBlob(base, blob);
      }
      toast({ title: "ZIP extraído", description: `${entries.length} arquivo(s) adicionados.` });
      await reload();
    } catch (e: any) {
      toast({ title: "Erro ao extrair", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
      setProgress(null);
      setZipAsk(null);
    }
  };

  const uploadZipAsFile = async (zipFile: File) => {
    setUploading(true);
    try {
      setProgress(`Enviando ${zipFile.name}...`);
      await uploadBlob(zipFile.name, zipFile);
      toast({ title: "ZIP enviado", description: "Arquivo armazenado como está." });
      await reload();
    } catch (e: any) {
      toast({ title: "Falha", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
      setProgress(null);
      setZipAsk(null);
    }
  };

  // Drag & drop
  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;
    const over = (e: DragEvent) => { e.preventDefault(); setDragOver(true); };
    const leave = () => setDragOver(false);
    const drop = (e: DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files);
    };
    el.addEventListener("dragover", over);
    el.addEventListener("dragleave", leave);
    el.addEventListener("drop", drop);
    return () => {
      el.removeEventListener("dragover", over);
      el.removeEventListener("dragleave", leave);
      el.removeEventListener("drop", drop);
    };
  }, [userId]);

  // Paste from clipboard (Ctrl+V uploads pasted files)
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.files;
      if (items && items.length) {
        handleFiles(items);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [userId]);

  const signedUrl = async (name: string) => {
    if (!userId) return null;
    const { data, error } = await supabase.storage.from(BUCKET)
      .createSignedUrl(`${userId}/${name}`, 60 * 60);
    if (error) throw error;
    return data.signedUrl;
  };

  const handleDownload = async (name: string) => {
    try {
      const url = await signedUrl(name);
      if (!url) return;
      const a = document.createElement("a");
      a.href = url; a.download = name; a.target = "_blank";
      document.body.appendChild(a); a.click(); a.remove();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const handleCopyLink = async (name: string) => {
    try {
      const url = await signedUrl(name);
      if (!url) return;
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copiado", description: "Cole onde quiser - válido por 1 hora." });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const handleCopyFile = async (name: string) => {
    try {
      const url = await signedUrl(name);
      if (!url) return;
      const res = await fetch(url);
      const blob = await res.blob();
      // Try modern Clipboard API for images
      if (blob.type.startsWith("image/") && typeof ClipboardItem !== "undefined") {
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        toast({ title: "Imagem copiada", description: "Cole (Ctrl+V) na área de trabalho ou em um app." });
        return;
      }
      // Fallback: copy link
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link do arquivo copiado",
        description: "Navegadores só permitem copiar imagens diretamente. Para outros arquivos, use Baixar.",
      });
    } catch (e: any) {
      toast({ title: "Não foi possível copiar", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (names: string[]) => {
    if (!userId || !names.length) return;
    if (!confirm(`Excluir ${names.length} arquivo(s)?`)) return;
    try {
      const paths = names.map((n) => `${userId}/${n}`);
      const { error } = await supabase.storage.from(BUCKET).remove(paths);
      if (error) throw error;
      toast({ title: "Excluído", description: `${names.length} arquivo(s) removido(s).` });
      setSelected(new Set());
      await reload();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const toggleSelect = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const filtered = useMemo(
    () => files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase())),
    [files, search]
  );

  const allSelected = filtered.length > 0 && filtered.every((f) => selected.has(f.name));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((f) => f.name)));
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Header onNewCard={() => {}} canCreate={false} />
          <div className="flex items-center gap-2 px-4 py-3 border-b bg-card/50">
            <SidebarTrigger className="hover:bg-accent transition-colors">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <span className="text-sm text-muted-foreground">Menu</span>
          </div>

          <main className="flex-1 container px-4 py-6 space-y-4 max-w-6xl">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <FolderOpen className="h-6 w-6 text-primary" /> Minha Pasta
                </h1>
                <p className="text-sm text-muted-foreground">
                  Sua pasta privada online — somente você vê estes arquivos.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setTutorialOpen(true)} className="gap-2">
                  <HelpCircle className="h-4 w-4" /> Tutorial
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="gap-2"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Enviar arquivos
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    if (e.target.files) handleFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </div>
            </div>

            <div
              ref={dropRef}
              className={cn(
                "relative rounded-xl border-2 border-dashed transition-colors p-4",
                dragOver ? "border-primary bg-primary/5" : "border-border bg-card/40"
              )}
            >
              <div className="flex items-center gap-2 mb-3">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar arquivos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 max-w-sm"
                />
                <div className="flex-1" />
                {selected.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(Array.from(selected))}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" /> Excluir ({selected.size})
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={toggleAll} className="gap-2">
                  {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                  {allSelected ? "Limpar" : "Selecionar todos"}
                </Button>
              </div>

              {progress && (
                <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" /> {progress}
                </div>
              )}

              {loading ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground space-y-2">
                  <FolderOpen className="h-10 w-10 mx-auto opacity-40" />
                  <p>Nenhum arquivo {search ? "encontrado" : "ainda"}.</p>
                  <p className="text-xs">Arraste arquivos aqui ou clique em "Enviar arquivos".</p>
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((f) => {
                    const Icon = iconFor(f.name);
                    const isSel = selected.has(f.name);
                    return (
                      <Card
                        key={f.name}
                        className={cn(
                          "p-3 flex items-center gap-3 hover:border-primary/50 transition-all",
                          isSel && "border-primary ring-1 ring-primary/40"
                        )}
                      >
                        <button
                          onClick={() => toggleSelect(f.name)}
                          className="shrink-0 h-10 w-10 rounded-md bg-muted flex items-center justify-center hover:bg-accent transition"
                          aria-label="Selecionar"
                        >
                          {isSel ? <CheckSquare className="h-5 w-5 text-primary" /> : <Icon className="h-5 w-5 text-muted-foreground" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" title={f.name}>{f.name}</p>
                          <p className="text-xs text-muted-foreground">{fmtSize(f.size)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleDownload(f.name)} title="Baixar">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleCopyFile(f.name)} title="Copiar (Ctrl+C)">
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleCopyLink(f.name)} title="Copiar link">
                            <LinkIcon className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete([f.name])} title="Excluir" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}

              {dragOver && (
                <div className="pointer-events-none absolute inset-0 rounded-xl bg-primary/10 border-2 border-primary flex items-center justify-center text-primary font-semibold">
                  Solte para enviar
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Tutorial */}
      <Dialog open={tutorialOpen} onOpenChange={(o) => { setTutorialOpen(o); if (!o) localStorage.setItem(TUTORIAL_KEY, "1"); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Bem-vindo à Minha Pasta
            </DialogTitle>
            <DialogDescription>
              Uma pasta online privada para você guardar e reutilizar arquivos rapidamente, sem trocar de aplicativo.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3">
              <Upload className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Envie arquivos</p>
                <p className="text-muted-foreground text-xs">Clique em <b>Enviar arquivos</b> ou arraste e solte qualquer quantidade aqui.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <FileArchive className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Jogue um .ZIP</p>
                <p className="text-muted-foreground text-xs">Ao enviar um arquivo zipado você escolhe entre <b>extrair tudo</b> ou guardar o ZIP inteiro.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <Copy className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Copiar e colar</p>
                <p className="text-muted-foreground text-xs">
                  Use <b>Copiar</b> para imagens (cole com Ctrl+V em outro app) ou <b>Copiar link</b> para qualquer arquivo.
                  <br/>Também pode <b>colar arquivos (Ctrl+V)</b> nesta página para enviá-los direto.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <Download className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Baixar para sua área de trabalho</p>
                <p className="text-muted-foreground text-xs">Botão de download salva o arquivo direto no seu computador.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <Trash2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Selecione vários e exclua</p>
                <p className="text-muted-foreground text-xs">Clique no ícone do arquivo para selecioná-lo e remova em lote.</p>
              </div>
            </li>
          </ul>
          <DialogFooter>
            <Button onClick={() => { setTutorialOpen(false); localStorage.setItem(TUTORIAL_KEY, "1"); }}>
              Entendi, vamos lá
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ZIP detected */}
      <AlertDialog open={!!zipAsk} onOpenChange={(o) => { if (!o) setZipAsk(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FileArchive className="h-5 w-5 text-primary" /> Arquivo ZIP detectado
            </AlertDialogTitle>
            <AlertDialogDescription>
              Como deseja salvar <b>{zipAsk?.name}</b>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button variant="outline" onClick={() => zipAsk && uploadZipAsFile(zipAsk)}>
              Guardar como ZIP
            </Button>
            <AlertDialogAction onClick={() => zipAsk && extractZip(zipAsk)}>
              Extrair conteúdo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
};

export default MinhaPasta;
