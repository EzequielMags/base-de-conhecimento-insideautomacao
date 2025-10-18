import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card as CardType, CardCategory, CardFile } from "@/types/card";
import { Upload, X, FileIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { uploadFile, formatFileSize, getFileIcon } from "@/utils/fileUpload";
import { supabase } from "@/integrations/supabase/client";

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
  "Sistema"
];

export const CardForm = ({ open, onClose, onSave, editCard }: CardFormProps) => {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CardCategory>("Impressora");
  const [files, setFiles] = useState<CardFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (editCard) {
      setTitle(editCard.title);
      setDescription(editCard.description);
      setCategory(editCard.category);
      setFiles(editCard.files || []);
    } else {
      setTitle("");
      setDescription("");
      setCategory("Impressora");
      setFiles([]);
    }
  }, [editCard, open]);

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
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar os arquivos. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim()) {
      toast({
        title: "Erro",
        description: "Título e descrição são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await onSave({
        title,
        description,
        category,
        files,
        images: [] // Mantemos compatibilidade
      });
      
      toast({
        title: editCard ? "Card atualizado!" : "Card criado!",
        description: "As alterações foram salvas com sucesso."
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o card. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

          <div className="space-y-2">
            <Label>Arquivos (imagens, PDFs, documentos, etc.)</Label>
            <div className="border-2 border-dashed rounded-lg p-4">
              <label className="flex flex-col items-center gap-2 cursor-pointer">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground text-center">
                  {uploading ? "Enviando arquivos..." : "Clique para adicionar arquivos"}
                </span>
                <span className="text-xs text-muted-foreground">
                  Imagens, PDFs, documentos, planilhas, etc.
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>

              {files.length > 0 && (
                <div className="space-y-2 mt-4">
                  {files.map((file, index) => (
                    <div
                      key={index}
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
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-5 w-5 text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
      </DialogContent>
    </Dialog>
  );
};