import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { ArrowLeft, Upload, Download, Trash2, Store, Loader2, Menu, Image as ImageIcon, Package } from "lucide-react";
import { motion } from "framer-motion";
import { formatFileSize, downloadFile } from "@/utils/fileUpload";

interface StoreFile {
  id: string;
  custom_name: string;
  original_name: string;
  thumbnail_url: string | null;
  file_url: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

const ALLOWED_EXT = ["zip", "rar", "xls", "xlsx"];

const BancoLojas = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [files, setFiles] = useState<StoreFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [customName, setCustomName] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("store_bank_files")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Erro", description: "Não foi possível carregar arquivos.", variant: "destructive" });
    } else {
      setFiles(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openUploadDialog = () => {
    if (!user) {
      toast({ title: "Login necessário", description: "Faça login para enviar arquivos.", variant: "destructive" });
      return;
    }
    setSelectedFile(null);
    setThumbnailFile(null);
    setCustomName("");
    setDialogOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXT.includes(ext)) {
      toast({ title: "Formato inválido", description: "Use ZIP, RAR, XLS ou XLSX.", variant: "destructive" });
      return;
    }
    setSelectedFile(f);
    if (!customName) setCustomName(f.name.replace(/\.[^.]+$/, ""));
  };

  const handleSubmit = async () => {
    if (!selectedFile || !customName.trim() || !user) {
      toast({ title: "Atenção", description: "Selecione arquivo e informe o nome.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      // upload main file
      const ext = selectedFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}-${selectedFile.name}`;
      const { error: upErr } = await supabase.storage.from("store-bank").upload(path, selectedFile, {
        cacheControl: "3600",
        upsert: false,
      });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("store-bank").getPublicUrl(path);

      // upload thumbnail if any
      let thumbUrl: string | null = null;
      if (thumbnailFile) {
        const tPath = `${user.id}/thumbs/${Date.now()}-${thumbnailFile.name}`;
        const { error: tErr } = await supabase.storage.from("store-bank").upload(tPath, thumbnailFile, {
          cacheControl: "3600",
          upsert: false,
        });
        if (tErr) throw tErr;
        thumbUrl = supabase.storage.from("store-bank").getPublicUrl(tPath).data.publicUrl;
      }

      const { error: insErr } = await supabase.from("store_bank_files").insert({
        user_id: user.id,
        custom_name: customName.trim(),
        original_name: selectedFile.name,
        thumbnail_url: thumbUrl,
        file_url: publicUrl,
        file_path: path,
        file_type: ext,
        file_size: selectedFile.size,
      });
      if (insErr) throw insErr;

      toast({ title: "Upload concluído!", description: "Arquivo adicionado." });
      setDialogOpen(false);
      load();
    } catch (err) {
      console.error(err);
      toast({ title: "Erro", description: "Falha ao enviar arquivo.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (file: StoreFile) => {
    if (!confirm(`Excluir "${file.custom_name}"?`)) return;
    try {
      await supabase.storage.from("store-bank").remove([file.file_path]);
      const { error } = await supabase.from("store_bank_files").delete().eq("id", file.id);
      if (error) throw error;
      toast({ title: "Excluído!", description: "Arquivo removido." });
      load();
    } catch (err) {
      console.error(err);
      toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" });
    }
  };

  const filtered = files.filter(f =>
    f.custom_name.toLowerCase().includes(search.toLowerCase()) ||
    f.original_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar selectedCategory="Todas" onSelectCategory={() => {}} />

        <div className="flex-1 flex flex-col">
          <Header onNewCard={() => navigate("/")} />

          <div className="flex items-center gap-2 px-4 py-3 border-b bg-card/50">
            <SidebarTrigger className="hover:bg-accent transition-colors">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
            <span className="text-sm text-muted-foreground">Banco de Lojas</span>
          </div>

          <main className="flex-1 container px-4 py-8 space-y-6 animate-fade-in-up">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">🏪 Banco de Lojas</h2>
              <p className="text-muted-foreground">Repositório de arquivos ZIP, RAR, XLS e XLSX</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 max-w-4xl mx-auto">
              <Input
                placeholder="Buscar arquivos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1"
              />
              <Button onClick={openUploadDialog} className="gap-2">
                <Upload className="h-4 w-4" /> Adicionar Arquivo
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Store className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Nenhum arquivo encontrado.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
                {filtered.map((file) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="hover:shadow-lg transition-all hover:-translate-y-1 overflow-hidden">
                      <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                        {file.thumbnail_url ? (
                          <img src={file.thumbnail_url} alt={file.custom_name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="h-16 w-16 text-muted-foreground" />
                        )}
                      </div>
                      <CardContent className="p-4 space-y-3">
                        <div>
                          <p className="font-semibold truncate" title={file.custom_name}>{file.custom_name}</p>
                          <p className="text-xs text-muted-foreground uppercase">{file.file_type}</p>
                          <p className="text-xs text-muted-foreground">
                            {file.file_size ? formatFileSize(file.file_size) : ""}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1 gap-2"
                            onClick={() => downloadFile(file.file_url, file.original_name)}>
                            <Download className="h-4 w-4" /> Baixar
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(file)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </main>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar arquivo ao Banco de Lojas</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Arquivo (ZIP, RAR, XLS, XLSX) *</Label>
                <Input type="file" accept=".zip,.rar,.xls,.xlsx" onChange={handleFileSelect} />
                {selectedFile && (
                  <p className="text-xs text-muted-foreground">
                    {selectedFile.name} — {formatFileSize(selectedFile.size)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Nome personalizado *</Label>
                <Input
                  placeholder="Ex: Loja Centro - Backup Janeiro"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Miniatura (opcional)</Label>
                <Input type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)} />
                {thumbnailFile && (
                  <p className="text-xs text-muted-foreground">{thumbnailFile.name}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={uploading}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={uploading} className="gap-2">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? "Enviando..." : "Enviar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarProvider>
  );
};

export default BancoLojas;
