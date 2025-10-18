import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { CategoryFilter, Category } from "@/components/CategoryFilter";
import { CardGrid } from "@/components/CardGrid";
import { CardForm } from "@/components/CardForm";
import { CardDetail } from "@/components/CardDetail";
import { AIAssistant } from "@/components/AIAssistant";
import { Card } from "@/types/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

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
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  // Verificar autenticação
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Carregar cards
  useEffect(() => {
    loadCards();

    // Realtime subscription
    const channel = supabase
      .channel('cards-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cards'
        },
        () => {
          loadCards();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filtrar cards
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
      setCards(data || []);
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
      toast({
        title: "Erro",
        description: "Você precisa estar logado para criar cards.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingCard) {
        const { error } = await supabase
          .from('cards')
          .update(cardData)
          .eq('id', editingCard.id);

        if (error) throw error;
      } else {
        const newCard = {
          ...cardData,
          user_id: user.id,
          title: cardData.title!,
          description: cardData.description!,
          category: cardData.category!,
        };
        
        const { error } = await supabase
          .from('cards')
          .insert([newCard]);

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
    if (!confirm("Tem certeza que deseja excluir este card?")) return;

    try {
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Card excluído!",
        description: "O card foi removido com sucesso."
      });
    } catch (error) {
      console.error("Erro ao excluir card:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o card.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (card: Card) => {
    setEditingCard(card);
    setFormOpen(true);
  };

  const handleView = (card: Card) => {
    setViewingCard(card);
    setDetailOpen(true);
  };

  const handleNewCard = () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa fazer login para criar cards.",
        variant: "destructive"
      });
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
    <div className="min-h-screen bg-background">
      <Header onNewCard={handleNewCard} />

      <main className="container px-4 py-8 space-y-8">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">
              Base de Conhecimento Colaborativa
            </h2>
            <p className="text-muted-foreground">
              Encontre soluções compartilhadas pela equipe
            </p>
          </div>

          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          
          <CategoryFilter
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </div>

        <CardGrid
          cards={filteredCards}
          onEdit={handleEdit}
          onDelete={handleDeleteCard}
          onView={handleView}
        />
      </main>

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

      <AIAssistant />
    </div>
  );
};

export default Index;