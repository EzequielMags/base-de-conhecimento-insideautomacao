import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card as CardType } from "@/types/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, User } from "lucide-react";
import { downloadFile, formatFileSize, getFileIcon } from "@/utils/fileUpload";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { VideoPlayer } from "./VideoPlayer";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface CardDetailProps {
  card: CardType | null;
  open: boolean;
  onClose: () => void;
}

export const CardDetail = ({ card, open, onClose }: CardDetailProps) => {
  const { toast } = useToast();
  const [creatorName, setCreatorName] = useState<string>("");

  useEffect(() => {
    const fetchCreatorName = async () => {
      if (!card) return;
      
      // Se tem author_name customizado, usar ele
      if ((card as any).author_name) {
        setCreatorName((card as any).author_name);
        return;
      }
      
      // Senão, buscar o nome do perfil
      if (card.user_id) {
        const { data } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", card.user_id)
          .single();
        
        if (data) {
          setCreatorName(data.name);
        }
      }
    };
    
    fetchCreatorName();
  }, [card]);

  if (!card) return null;

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      await downloadFile(fileUrl, fileName);
      toast({
        title: "Download iniciado",
        description: `${fileName} está sendo baixado.`
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível fazer o download do arquivo.",
        variant: "destructive"
      });
    }
  };

  const imageFiles = card.files?.filter(f => f.type.startsWith('image/')) || [];
  const videoFiles = card.files?.filter(f => f.type.startsWith('video/')) || [];
  const otherFiles = card.files?.filter(f => !f.type.startsWith('image/') && !f.type.startsWith('video/')) || [];
  const embeddedVideos = card.videos || [];

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col max-h-[90vh]"
          >
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge>{card.category}</Badge>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(card.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
                {creatorName && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>Criado por {creatorName}</span>
                  </div>
                )}
              </div>
              <DialogTitle className="text-2xl">{card.title}</DialogTitle>
            </DialogHeader>

            <ScrollArea className="flex-1 px-6 py-4">
              <div className="space-y-6">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <h3 className="text-lg font-semibold mb-2">Solução</h3>
                  <p className="whitespace-pre-wrap text-muted-foreground break-words">
                    {card.description}
                  </p>
                </div>

                {(embeddedVideos.length > 0 || videoFiles.length > 0) && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Vídeos</h3>
                    <div className="space-y-4">
                      {embeddedVideos.map((video, index) => (
                        <div key={`embed-${index}`}>
                          <VideoPlayer video={video} />
                        </div>
                      ))}
                      {videoFiles.map((file, index) => {
                        const videoData = { type: 'upload' as const, url: file.url, name: file.name };
                        return (
                          <div key={`upload-${index}`}>
                            <VideoPlayer video={videoData} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {imageFiles.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Imagens</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {imageFiles.map((file, index) => (
                        <motion.div 
                          key={index} 
                          className="relative group"
                          whileHover={{ scale: 1.02 }}
                          transition={{ duration: 0.2 }}
                        >
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-full h-64 object-cover rounded-lg"
                          />
                          <Button
                            size="sm"
                            variant="secondary"
                            className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity gap-2"
                            onClick={() => handleDownload(file.url, file.name)}
                          >
                            <Download className="h-4 w-4" />
                            Baixar
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

            {otherFiles.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Arquivos Anexos</h3>
                <div className="space-y-2">
                  {otherFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                    >
                      <div className="text-3xl">{getFileIcon(file.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleDownload(file.url, file.name)}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Baixar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

                {imageFiles.length === 0 && otherFiles.length === 0 && videoFiles.length === 0 && embeddedVideos.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhum arquivo anexado a este card</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  );
};