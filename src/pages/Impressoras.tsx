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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import {
  ArrowLeft,
  Upload,
  Trash2,
  Printer,
  Loader2,
  Menu,
  Download,
  Plus,
  FileArchive,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatFileSize, downloadFile } from "@/utils/fileUpload";
import { useUserRole } from "@/hooks/use-user-role";
import { PermissionsGuide } from "@/components/PermissionsGuide";

const BRANDS = ["EPSON", "TANCA", "BEMATECH", "ELGIN", "POS", "TOMATE", "CONTROL ID"] as const;
const TYPES = ["DRIVER", "UTILITARIO"] as const;
const ALLOWED_EXT = [".zip", ".rar", ".exe"];
const BUCKET = "printer-files";

type Brand = (typeof BRANDS)[number];
type FileType = (typeof TYPES)[number];

interface PrinterFile {
  id: string;
  title: string;
  brand: Brand;
  type: FileType;
  file_url: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  user_id: string | null;
  created_at: string;
}

export const Impressoras = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, canCreate } = useUserRole();

  const [files, setFiles] = useState<PrinterFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);

  // form state
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState<Brand | "">("");
  const [type, setType] = useState<FileType | "">("");
  const [file, setFile] = useState<File | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("printer_files" as any)
      .select("*")
      .order("brand", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      toast({ title: "Erro", description: "Não foi possível carregar.", variant: "destructive" });
    } else {
      setFiles((data as unknown as PrinterFile[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    const map: Record<string, PrinterFile[]> = {};
    BRANDS.forEach((b) => (map[b] = []));
    files.forEach((f) => {
      if (!map[f.brand]) map[f.brand] = [];
      map[f.brand].push(f);
    });
    return map;
  }, [files]);

  const sanitize = (n: string) =>
    n.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");

  const validExt = (n: string) => {
    const lower = n.toLowerCase();
    return ALLOWED_EXT.some((ext) => lower.endsWith(ext));
  };

  const resetForm = () => {
    setTitle("");
    setBrand("");
    setType("");
    setFile(null);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Login necessário", variant: "destructive" });
      return;
    }
    if (!canCreate) {
      toast({ title: "Sem permissão", variant: "destructive" });
      return;
    }
    if (!title.trim() || !brand || !type || !file) {
      toast({ title: "Campos obrigatórios", description: "Preencha todos os campos.", variant: "destructive" });
      return;
    }
    if (!validExt(file.name)) {
      toast({
        title: "Formato inválido",
        description: `Permitido: ${ALLOWED_EXT.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const safe = sanitize(file.name);
      const path = `${user.id}/${Date.now()}-${safe}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (upErr) throw upErr;
      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const { error: insErr } = await supabase.from("printer_files" as any).insert({
        title: title.trim(),
        brand,
        type,
        user_id: user.id,
        file_url: publicUrl,
        file_path: path,
        file_size: file.size,
        file_type: file.type || file.name.split(".").pop() || "",
      });
      if (insErr) throw insErr;
      toast({ title: "Cadastrado!" });
      resetForm();
      setOpen(false);
      await load();
    } catch (err) {
      console.error(err);
      toast({ title: "Erro", description: "Falha ao cadastrar.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (f: PrinterFile) => {
    if (!isAdmin && f.user_id !== user?.id) {
      toast({ title: "Sem permissão", variant: "destructive" });
      return;
    }
    if (!confirm(`Excluir "${f.title}"?`)) return;
    try {
      await supabase.storage.from(BUCKET).remove([f.file_path]);
      const { error } = await supabase.from("printer_files" as any).delete().eq("id", f.id);
      if (error) throw error;
      toast({ title: "Excluído!" });
      load();
    } catch (err) {
      console.error(err);
      toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" });
    }
  };

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
            <span className="text-sm text-muted-foreground">Impressoras</span>
          </div>

          <main className="flex-1 container px-4 py-8 space-y-6 animate-fade-in-up max-w-5xl">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                  <Printer className="h-7 w-7 text-primary" /> Impressoras
                </h2>
                <p className="text-muted-foreground text-sm">
                  Drivers e utilitários organizados por modelo. Formatos aceitos: .zip, .rar, .exe
                </p>
              </div>

              {canCreate && (
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" /> Novo Registro
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                      <DialogTitle>Cadastrar Driver / Utilitário</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label htmlFor="title">Título *</Label>
                        <Input
                          id="title"
                          placeholder="Ex: Driver de Instalação v1.0"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Modelo *</Label>
                          <Select value={brand} onValueChange={(v) => setBrand(v as Brand)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Marca" />
                            </SelectTrigger>
                            <SelectContent>
                              {BRANDS.map((b) => (
                                <SelectItem key={b} value={b}>
                                  {b}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Tipo *</Label>
                          <Select value={type} onValueChange={(v) => setType(v as FileType)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              {TYPES.map((t) => (
                                <SelectItem key={t} value={t}>
                                  {t}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="file">Arquivo * (.zip, .rar, .exe)</Label>
                        <Input
                          id="file"
                          type="file"
                          accept=".zip,.rar,.exe,application/zip,application/x-rar-compressed,application/x-msdownload"
                          onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                        {file && (
                          <p className="text-xs text-muted-foreground">
                            {file.name} • {formatFileSize(file.size)}
                          </p>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setOpen(false)} disabled={uploading}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSubmit} disabled={uploading} className="gap-2">
                        {uploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        {uploading ? "Enviando..." : "Cadastrar"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Accordion type="multiple" className="space-y-2">
                {BRANDS.map((b) => {
                  const items = grouped[b] || [];
                  return (
                    <AccordionItem
                      key={b}
                      value={b}
                      className="border rounded-lg bg-card/40 px-4"
                    >
                      <AccordionTrigger className="hover:no-underline py-3">
                        <div className="flex items-center gap-3">
                          <Printer className="h-4 w-4 text-primary" />
                          <span className="font-semibold tracking-wide">{b}</span>
                          <Badge variant="secondary" className="ml-1">
                            {items.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {items.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-2 pl-7">
                            Nenhum arquivo cadastrado.
                          </p>
                        ) : (
                          <ul className="divide-y">
                            {items.map((f) => (
                              <motion.li
                                key={f.id}
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.18 }}
                                className="flex items-center justify-between py-2 pl-7 pr-1 gap-3"
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <FileArchive className="h-4 w-4 text-muted-foreground shrink-0" />
                                  <button
                                    onClick={() =>
                                      downloadFile(
                                        f.file_url,
                                        `${sanitize(f.title)}.${f.file_path.split(".").pop()}`
                                      )
                                    }
                                    className="text-left text-sm font-medium text-primary hover:underline truncate"
                                    title={f.title}
                                  >
                                    {f.title}
                                  </button>
                                  <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">
                                    {f.type}
                                  </Badge>
                                  {f.file_size && (
                                    <span className="text-xs text-muted-foreground hidden md:inline">
                                      {formatFileSize(f.file_size)}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() =>
                                      downloadFile(
                                        f.file_url,
                                        `${sanitize(f.title)}.${f.file_path.split(".").pop()}`
                                      )
                                    }
                                    title="Baixar"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  {(isAdmin || f.user_id === user?.id) && (
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => handleDelete(f)}
                                      title="Excluir"
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </motion.li>
                            ))}
                          </ul>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </main>
        </div>
        <PermissionsGuide />
      </div>
    </SidebarProvider>
  );
};

export default Impressoras;
