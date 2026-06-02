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
import { ArrowLeft, Upload, Download, Trash2, FileText, Loader2, Menu, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { formatFileSize, downloadFile } from "@/utils/fileUpload";
import { PermissionsGuide } from "@/components/PermissionsGuide";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useUserRole } from "@/hooks/use-user-role";

interface TechnicalPdf {
  id: string;
  name: string;
  file_url: string;
  file_path: string;
  file_size: number | null;
  created_at: string;
}

const PdfsTecnicos = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, canCreate } = useUserRole();
  const [pdfs, setPdfs] = useState<TechnicalPdf[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [previewEnabled, setPreviewEnabled] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("technical_pdfs")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Erro", description: "Não foi possível carregar os PDFs.", variant: "destructive" });
    } else {
      setPdfs(data || []);
    }
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const sanitizeFileName = (name: string) =>
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_+/g, "_");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (!user) {
      toast({ title: "Login necessário", description: "Faça login para enviar PDFs.", variant: "destructive" });
      return;
    }
    if (!canCreate) {
      toast({ title: "Sem permissão", description: "Apenas Admin ou Editor podem enviar PDFs.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
          toast({ title: "Formato inválido", description: `${file.name} não é um PDF.`, variant: "destructive" });
          continue;
        }
        const safeName = sanitizeFileName(file.name);
        const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
        const { error: upErr } = await supabase.storage.from("technical-pdfs").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: "application/pdf",
        });
        if (upErr) throw upErr;
        const { data: { publicUrl } } = supabase.storage.from("technical-pdfs").getPublicUrl(path);
        const { error: insErr } = await supabase.from("technical_pdfs").insert({
          user_id: user.id,
          name: file.name,
          file_url: publicUrl,
          file_path: path,
          file_size: file.size,
        });
        if (insErr) {
          await supabase.storage.from("technical-pdfs").remove([path]);
          throw insErr;
        }
      }
      toast({ title: "Upload concluído!", description: "PDFs enviados com sucesso." });
      load();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Falha ao enviar arquivo.";
      toast({ title: "Erro ao enviar PDF", description: message, variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (pdf: TechnicalPdf) => {
    if (!isAdmin) {
      toast({ title: "Sem permissão", description: "Apenas administradores podem excluir PDFs.", variant: "destructive" });
      return;
    }
    if (!confirm(`Excluir "${pdf.name}"?`)) return;
    try {
      await supabase.storage.from("technical-pdfs").remove([pdf.file_path]);
      const { error } = await supabase.from("technical_pdfs").delete().eq("id", pdf.id);
      if (error) throw error;
      toast({ title: "Excluído!", description: "PDF removido com sucesso." });
      load();
    } catch (err) {
      console.error(err);
      toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" });
    }
  };

  const filtered = pdfs.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

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
            <span className="text-sm text-muted-foreground">PDFs Técnicos</span>
          </div>

          <main className="flex-1 container px-4 py-8 space-y-6 animate-fade-in-up">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">📄 PDFs Técnicos</h2>
              <p className="text-muted-foreground">Repositório exclusivo de documentos PDF</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 max-w-4xl mx-auto">
              <Input
                placeholder="Buscar PDFs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1"
              />
              {canCreate && (
                <Button asChild disabled={uploading} className="gap-2">
                  <label className="cursor-pointer">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploading ? "Enviando..." : "Enviar PDF"}
                    <input type="file" accept="application/pdf,.pdf" multiple onChange={handleUpload} className="hidden" disabled={uploading} />
                  </label>
                </Button>
              )}
            </div>

            {/* Preview Toggle */}
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-2 bg-card border rounded-lg px-4 py-2">
                {previewEnabled ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                <Label htmlFor="preview-toggle" className="text-sm font-medium cursor-pointer select-none">
                  Pré-visualização
                </Label>
                <Switch
                  id="preview-toggle"
                  checked={previewEnabled}
                  onCheckedChange={setPreviewEnabled}
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Nenhum PDF encontrado.</p>
              </div>
            ) : (
              <div className={`grid gap-4 max-w-6xl mx-auto ${previewEnabled ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
                {filtered.map((pdf) => (
                  <motion.div
                    key={pdf.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    layout
                  >
                    <Card className="hover:shadow-lg transition-all overflow-hidden">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
                            <FileText className="h-8 w-8" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate" title={pdf.name}>{pdf.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {pdf.file_size ? formatFileSize(pdf.file_size) : ""}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(pdf.created_at).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                        </div>

                        {previewEnabled && (
                          <div className="w-full rounded-lg overflow-hidden border bg-muted/30">
                            <iframe
                              src={`${pdf.file_url}#toolbar=0&navpanes=0`}
                              className="w-full h-[400px]"
                              title={`Preview de ${pdf.name}`}
                            />
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1 gap-2"
                            onClick={() => downloadFile(pdf.file_url, pdf.name)}>
                            <Download className="h-4 w-4" /> Baixar
                          </Button>
                          {isAdmin && (
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(pdf)}>
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
    </SidebarProvider>
  );
};

export default PdfsTecnicos;
