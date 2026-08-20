import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card as CardType, CardCategory, CardFile, CardVideo } from "@/types/card";
import { Upload, X, FileIcon, Link as LinkIcon, Video, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { uploadFile, formatFileSize, getFileIcon } from "@/utils/fileUpload";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { useUserRole } from "@/hooks/use-user-role";

interface CardFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (card: Partial<CardType>) => Promise<void>;
  editCard?: CardType | null;
}

const categories: CardCategory[] = [
  "Impressora",
  "XD Orders",
  "Sat",
  "NFCE",
  "Dados Fiscais",
  "Sistema",
  "Tablet",
  "Extras"
];

export const CardForm = ({ open, onClose, onSave, editCard }: CardFormProps) => {
  const { toast } = useToast();
  const { isAdmin, user: roleUser } = useUserRole();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CardCategory>("Impressora");
  const [files, setFiles] = useState<CardFile[]>([]);
  const [videos, setVideos] = useState<CardVideo[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [coverImage, setCoverImage] = useState<string>("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [signatureEnabled, setSignatureEnabled] = useState(true);
  const [profileName, setProfileName] = useState("");

  // Fetch logged-in user's profile name
  useEffect(() => {
    const fetchProfile = async () => {
      if (!roleUser) return;
      const { data } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", roleUser.id)
        .single();
      if (data?.name) setProfileName(data.name);
    };
    fetchProfile();
  }, [roleUser]);

  useEffect(() => {
    if (editCard) {
      setTitle(editCard.title);
      setDescription(editCard.description);
      setCategory(editCard.category);
      setFiles(editCard.files || []);
      setVideos(editCard.videos || []);
      setAuthorName((editCard as any).author_name || "");
      setCoverImage((editCard as any).cover_image || "");
      // If editing and author matches profile, keep signature on
      setSignatureEnabled(true);
    } else {
      setTitle("");
      setDescription("");
      setCategory("Impressora");
      setFiles([]);
      setVideos([]);
      setCoverImage("");
      setSignatureEnabled(true);
    }
  }, [editCard, open]);

  // Auto-fill author when signature is enabled
  useEffect(() => {
    if (signatureEnabled && profileName) {
      setAuthorName(profileName);
    }
  }, [signatureEnabled, profileName]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const uploadPromises = Array.from(uploadedFiles).map(file => 
        uploadFile(file, user.id)
      );
      
      const uploadedFileData = await Promise.all(uploadPromises);
      setFiles(prev => [...prev, ...uploadedFileData]);
      
      toast({
        title: "Arquivos enviados!",
        description: `${uploadedFiles.length} arquivo(s) adicionado(s) com sucesso.`
      });
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      toast({
        title: "Erro no upload",
        description: error?.message || "Não foi possível enviar os arquivos. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "A capa deve ser uma imagem",
        variant: "destructive"
      });
      return;
    }

    setUploadingCover(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const uploadedFile = await uploadFile(file, user.id);
      setCoverImage(uploadedFile.url);
      
      toast({
        title: "Capa adicionada!",
        description: "A imagem de capa foi definida com sucesso."
      });
    } catch (error) {
      console.error("Erro ao fazer upload da capa:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a imagem de capa.",
        variant: "destructive"
      });
    } finally {
      setUploadingCover(false);
    }
  };

  const selectCoverFromFiles = (url: string) => {
    setCoverImage(url);
    toast({
      title: "Capa selecionada!",
      description: "A imagem foi definida como capa do card."
    });
  };

  const removeCover = () => {
    setCoverImage("");
    toast({
      title: "Capa removida",
      description: "A imagem de capa foi removida."
    });
  };

  const addVideoUrl = () => {
    if (!videoUrl.trim()) {
      toast({
        title: "Erro",
        description: "Insira um link válido de vídeo",
        variant: "destructive"
      });
      return;
    }

    const newVideo: CardVideo = {
      type: 'embed',
      url: videoUrl,
      name: videoUrl
    };

    setVideos(prev => [...prev, newVideo]);
    setVideoUrl("");
    
    toast({
      title: "Vídeo adicionado!",
      description: "Link do vídeo foi adicionado com sucesso."
    });
  };

  const removeVideo = (index: number) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Schema validation with zod
    const { z } = await import("zod");
    const cardSchema = z.object({
      title: z.string().trim().min(3, "Título deve ter no mínimo 3 caracteres").max(200, "Título deve ter no máximo 200 caracteres"),
      description: z.string().trim().min(5, "Descrição deve ter no mínimo 5 caracteres").max(10000, "Descrição muito longa (máx. 10.000 caracteres)"),
      authorName: z.string().trim().max(120, "Nome do autor muito longo").optional(),
      coverImage: z.string().trim().max(2048, "URL da capa muito longa").optional(),
    });

    const parsed = cardSchema.safeParse({
      title,
      description,
      authorName: authorName || undefined,
      coverImage: coverImage || undefined,
    });

    if (!parsed.success) {
      toast({
        title: "Erro de validação",
        description: parsed.error.errors[0]?.message ?? "Dados inválidos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await onSave({
        title: parsed.data.title,
        description: parsed.data.description,
        category,
        files,
        videos,
        images: [], // Mantemos compatibilidade
        author_name: parsed.data.authorName ?? "",
        cover_image: parsed.data.coverImage ?? ""
      } as any);
      
      toast({
        title: editCard ? "Card atualizado!" : "Card criado!",
        description: "As alterações foram salvas com sucesso."
      });
      
      onClose();
    } catch (error: any) {
      console.error("Erro ao salvar card:", error);
      toast({
        title: "Erro ao salvar",
        description: error?.message || "Não foi possível salvar o card. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <DialogHeader>
            <DialogTitle>{editCard ? "Editar Card" : "Novo Card"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Como resolver erro de conexão com impressora"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={category} onValueChange={(value) => setCategory(value as CardCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição da Solução</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o passo a passo da solução..."
                rows={6}
                required
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="author">Autor do Card</Label>
                <div className="flex items-center gap-2">
                  <Label htmlFor="signature-toggle" className="text-sm text-muted-foreground">Assinatura</Label>
                  <Switch
                    id="signature-toggle"
                    checked={signatureEnabled}
                    onCheckedChange={setSignatureEnabled}
                    disabled={!isAdmin}
                  />
                </div>
              </div>
              <Input
                id="author"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Digite o nome do autor"
                disabled={signatureEnabled}
              />
              {signatureEnabled && (
                <p className="text-xs text-muted-foreground">
                  Assinatura automática com o nome do seu perfil.
                  {!isAdmin && " Apenas ADMIN pode desativar."}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Capa do Card (miniatura)</Label>
              <div className="border-2 border-dashed rounded-lg p-4">
                {coverImage ? (
                  <div className="relative">
                    <img
                      src={coverImage}
                      alt="Capa do card"
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={removeCover}
                      className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-2 cursor-pointer">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground text-center">
                      {uploadingCover ? "Enviando capa..." : "Clique para adicionar uma capa"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Imagem que aparecerá como miniatura do card
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      className="hidden"
                      disabled={uploadingCover}
                    />
                  </label>
                )}
                
                {/* Opção para selecionar dos arquivos já adicionados */}
                {files.filter(f => f.type.startsWith('image/')).length > 0 && !coverImage && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Ou selecione dos arquivos já adicionados:</p>
                    <div className="flex gap-2 flex-wrap">
                      {files.filter(f => f.type.startsWith('image/')).map((file, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => selectCoverFromFiles(file.url)}
                          className="h-16 w-16 rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-colors"
                        >
                          <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Vídeos (YouTube, Vimeo ou Upload)</Label>
              <div className="flex gap-2">
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="Cole o link do YouTube ou Vimeo aqui"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addVideoUrl();
                    }
                  }}
                />
                <Button type="button" onClick={addVideoUrl} variant="outline" size="icon">
                  <LinkIcon className="h-4 w-4" />
                </Button>
              </div>

              <AnimatePresence>
                {videos.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 mt-4"
                  >
                    {videos.map((video, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center gap-3 p-3 bg-muted rounded-lg group"
                      >
                        <Video className="h-5 w-5 text-primary" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{video.url}</p>
                          <p className="text-xs text-muted-foreground">
                            {video.type === 'embed' ? 'Vídeo Embutido' : 'Vídeo Upload'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeVideo(index)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-5 w-5 text-destructive" />
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-2">
              <Label>Arquivos (imagens, PDFs, vídeos, documentos, etc.)</Label>
              <div className="border-2 border-dashed rounded-lg p-4">
                <label className="flex flex-col items-center gap-2 cursor-pointer">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground text-center">
                    {uploading ? "Enviando arquivos..." : "Clique para adicionar arquivos"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Imagens, vídeos, PDFs, documentos, planilhas, etc.
                  </span>
                  <input
                    type="file"
                    accept="*/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>

                <AnimatePresence>
                  {files.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 mt-4"
                    >
                      {files.map((file, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="flex items-center gap-3 p-3 bg-muted rounded-lg group"
                        >
                          <div className="text-2xl">{getFileIcon(file.type)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                          {file.type.startsWith('image/') && (
                            <img
                              src={file.url}
                              alt={file.name}
                              className="h-12 w-12 object-cover rounded"
                            />
                          )}
                          {file.type.startsWith('video/') && (
                            <Video className="h-8 w-8 text-primary" />
                          )}
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-5 w-5 text-destructive" />
                          </button>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || uploading}>
                {loading ? "Salvando..." : uploading ? "Enviando..." : editCard ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};