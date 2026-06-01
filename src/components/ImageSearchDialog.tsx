import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Paperclip, Loader2, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/types/card";

interface Props {
  cards: Card[];
  onOpenCard: (card: Card) => void;
}

interface Match {
  id: string;
  score: number;
  reason: string;
}

export const ImageSearchDialog = ({ cards, onOpenCard }: Props) => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const { toast } = useToast();

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setMatches(null);
    setLoading(false);
  };

  const handleFile = (f: File | null) => {
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setMatches(null);
  };

  const fileToBase64 = (f: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const r = reader.result as string;
        resolve(r.split(",")[1] || "");
      };
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });

  const handleSearch = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const imageBase64 = await fileToBase64(file);
      const payload = {
        imageBase64,
        mimeType: file.type || "image/png",
        cards: cards.slice(0, 30).map((c) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          category: c.category,
          cover_image: (c as any).cover_image,
        })),
      };
      const { data, error } = await supabase.functions.invoke("image-search", { body: payload });
      if (error) throw error;
      setMatches(data?.matches ?? []);
    } catch (e: any) {
      toast({ title: "Erro na busca por imagem", description: e.message ?? String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resolvedMatches =
    matches?.map((m) => ({ match: m, card: cards.find((c) => c.id === m.id) })).filter((x) => x.card) || [];

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" title="Buscar por imagem">
          <Paperclip className="h-4 w-4" /> Buscar por foto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" /> Buscar cards por imagem
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Anexe uma foto do erro/tela. A IA vai comparar com os cards da base e sugerir os mais parecidos.
          </p>

          {!previewUrl ? (
            <label className="block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-colors">
              <Paperclip className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <span className="text-sm">Clique para anexar uma imagem (PNG, JPG, WEBP)</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </label>
          ) : (
            <div className="relative">
              <img src={previewUrl} alt="Preview" className="w-full max-h-64 object-contain rounded-lg border" />
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 h-7 w-7"
                onClick={reset}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {previewUrl && (
            <Button onClick={handleSearch} disabled={loading} className="w-full gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {loading ? "Analisando com IA..." : "Buscar cards parecidos"}
            </Button>
          )}

          {matches !== null && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">
                {resolvedMatches.length > 0
                  ? `Encontrados ${resolvedMatches.length} card(s):`
                  : "Nenhum card correspondente encontrado."}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-72 overflow-auto">
                {resolvedMatches.map(({ card, match }) => (
                  <button
                    key={card!.id}
                    onClick={() => { setOpen(false); onOpenCard(card!); }}
                    className="flex gap-3 p-2 border rounded-lg hover:bg-accent text-left transition-colors"
                  >
                    {(card as any).cover_image && (
                      <img src={(card as any).cover_image} alt="" className="h-14 w-14 object-cover rounded flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium line-clamp-1">{card!.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2">{match.reason}</div>
                      <div className="text-xs text-primary mt-0.5">Similaridade: {Math.round(match.score * 100)}%</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
