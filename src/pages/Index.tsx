import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { Category } from "@/components/CategoryFilter";
import { CategoryFilterDropdown } from "@/components/CategoryFilterDropdown";
import { CardGrid } from "@/components/CardGrid";
import { CardForm } from "@/components/CardForm";
import { CardDetail } from "@/components/CardDetail";
import { AIAssistant } from "@/components/AIAssistant";
import { PermissionsGuide } from "@/components/PermissionsGuide";
import { AppSidebar } from "@/components/AppSidebar";
import { useIntegriChat } from "@/components/IntegriChatContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card } from "@/types/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Menu } from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import { PinCardsDialog } from "@/components/PinCardsDialog";
import { usePinnedCards } from "@/hooks/use-pinned-cards";
import { ImageSearchDialog } from "@/components/ImageSearchDialog";

const Index = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [filteredCards, setFilteredCards] = useState<Card[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("Todas");
  const [formOpen, setFormOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [viewingCard, setViewingCard] = useState<Card | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, isAdmin, isEditor, isVisitor, canCreate } = useUserRole();
  const { open: chatOpen } = useIntegriChat();
  const { pinned, toggle: togglePin, max: maxPins } = usePinnedCards();

  useEffect(() => {
    loadCards();

    const channel = supabase
      .channel('cards-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, () => {
        loadCards();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let filtered = cards;

    if (selectedCategory !== "Todas") {
      filtered = filtered.filter((card) => card.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (card) =>
          card.title.toLowerCase().includes(query) ||
          card.description.toLowerCase().includes(query) ||
          card.category.toLowerCase().includes(query)
      );
    }

    setFilteredCards(filtered);
  }, [cards, searchQuery, selectedCategory]);

  const loadCards = async () => {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const parsedCards = (data || []).map(card => ({
        ...card,
        files: (card.files || []) as any as Card['files'],
        videos: (card.videos || []) as any as Card['videos']
      }));

      setCards(parsedCards as Card[]);
    } catch (error) {
      console.error("Erro ao carregar cards:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os cards.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCard = async (cardData: Partial<Card>) => {
    if (!user) {
      toast({ title: "Erro", description: "Você precisa estar logado.", variant: "destructive" });
      return;
    }

    try {
      if (editingCard) {
        // Editor só pode editar próprios cards
        if (!isAdmin && editingCard.user_id !== user.id) {
          toast({ title: "Sem permissão", description: "Você só pode editar cards criados por você.", variant: "destructive" });
          return;
        }

        const { error } = await supabase
          .from('cards')
          .update({
            title: cardData.title,
            description: cardData.description,
            category: cardData.category,
            files: cardData.files as any,
            videos: cardData.videos as any,
            author_name: (cardData as any).author_name,
            cover_image: (cardData as any).cover_image,
          })
          .eq('id', editingCard.id);

        if (error) throw error;
      } else {
        if (!canCreate) {
          toast({ title: "Sem permissão", description: "Você não tem permissão para criar um Card.", variant: "destructive" });
          return;
        }

        const newCard = {
          title: cardData.title!,
          description: cardData.description!,
          category: cardData.category!,
          files: (cardData.files || []) as any,
          videos: (cardData.videos || []) as any,
          user_id: user.id,
          author_name: (cardData as any).author_name,
          cover_image: (cardData as any).cover_image,
        };

        const { error } = await supabase.from('cards').insert([newCard]);
        if (error) throw error;
      }

      setEditingCard(null);
      setFormOpen(false);
    } catch (error) {
      console.error("Erro ao salvar card:", error);
      throw error;
    }
  };

  const handleDeleteCard = async (id: string) => {
    if (!isAdmin) {
      toast({ title: "Sem permissão", description: "Apenas administradores podem excluir cards.", variant: "destructive" });
      return;
    }

    const password = prompt("Digite a senha de confirmação para excluir o card:");
    if (password === null) return;
    if (password !== "78592121") {
      toast({ title: "Senha incorreta", description: "A senha de confirmação está incorreta.", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase.from('cards').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Card excluído!", description: "O card foi removido com sucesso." });
    } catch (error) {
      console.error("Erro ao excluir card:", error);
      toast({ title: "Erro", description: "Não foi possível excluir o card.", variant: "destructive" });
    }
  };

  const handleEdit = (card: Card) => {
    if (!user) return;

    // Editor só pode editar próprios; admin pode tudo
    if (!isAdmin && card.user_id !== user.id) {
      toast({ title: "Sem permissão", description: "Você só pode editar cards criados por você.", variant: "destructive" });
      return;
    }

    setEditingCard(card);
    setFormOpen(true);
  };

  const handleView = (card: Card) => {
    setViewingCard(card);
    setDetailOpen(true);
  };

  const handleNewCard = () => {
    if (!user) {
      toast({ title: "Login necessário", description: "Você precisa fazer login para criar cards.", variant: "destructive" });
      return;
    }
    if (!canCreate) {
      toast({ title: "Sem permissão", description: "Você não tem permissão para criar um Card.", variant: "destructive" });
      return;
    }
    setEditingCard(null);
    setFormOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />

        <div className="flex-1 flex flex-col">
          <Header onNewCard={handleNewCard} canCreate={canCreate} />

          <div className="flex items-center gap-2 px-4 py-3 border-b bg-card/50">
            <SidebarTrigger className="hover:bg-accent transition-colors">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <span className="text-sm text-muted-foreground">Menu</span>
          </div>

          <main className="flex-1 container px-4 py-8 space-y-8 animate-fade-in-up">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">
                  Base de Conhecimento Colaborativa
                </h2>
              </div>

              <div className="flex items-center gap-2 max-w-2xl mx-auto flex-wrap justify-center">
                <div className="flex-1 min-w-[220px]">
                  <SearchBar value={searchQuery} onChange={setSearchQuery} />
                </div>
                <CategoryFilterDropdown
                  selected={selectedCategory}
                  onSelect={setSelectedCategory}
                />
                <ImageSearchDialog cards={cards} onOpenCard={handleView} />
                {canCreate && (
                  <PinCardsDialog
                    cards={cards}
                    pinned={pinned}
                    max={maxPins}
                    onToggle={togglePin}
                  />
                )}
              </div>
            </div>

            <CardGrid
              cards={filteredCards}
              onEdit={handleEdit}
              onDelete={handleDeleteCard}
              onView={handleView}
              currentUserId={user?.id}
              isAdmin={isAdmin}
              isVisitor={isVisitor}
              compact={chatOpen}
              pinnedIds={pinned}
            />
          </main>
        </div>

        <CardForm
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            setEditingCard(null);
          }}
          onSave={handleSaveCard}
          editCard={editingCard}
        />

        <CardDetail
          card={viewingCard}
          open={detailOpen}
          onClose={() => {
            setDetailOpen(false);
            setViewingCard(null);
          }}
        />

        <AIAssistant onOpenCard={handleView} />
        <PermissionsGuide />
      </div>
    </SidebarProvider>
  );
};

export default Index;
