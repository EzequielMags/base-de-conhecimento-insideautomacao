import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { Category } from "@/components/CategoryFilter";
import { CardGrid } from "@/components/CardGrid";
import { CardForm } from "@/components/CardForm";
import { CardDetail } from "@/components/CardDetail";
import { AIAssistant } from "@/components/AIAssistant";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card } from "@/types/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Menu } from "lucide-react";

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
      
      // Parse files and videos JSON to proper types
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
          .update({
            title: cardData.title,
            description: cardData.description,
            category: cardData.category,
            files: cardData.files as any,
            videos: cardData.videos as any,
            author_name: (cardData as any).author_name
          })
          .eq('id', editingCard.id);

        if (error) throw error;
      } else {
        const newCard = {
          title: cardData.title!,
          description: cardData.description!,
          category: cardData.category!,
          files: (cardData.files || []) as any,
          videos: (cardData.videos || []) as any,
          user_id: user.id,
          author_name: (cardData as any).author_name
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
    const password = prompt("Digite a senha para editar:");
    if (password === "78592121") {
      setEditingCard(card);
      setFormOpen(true);
    } else if (password !== null) {
      toast({
        title: "Senha incorreta",
        description: "A senha digitada está incorreta.",
        variant: "destructive"
      });
    }
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
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar 
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
        
        <div className="flex-1 flex flex-col">
          <Header onNewCard={handleNewCard} />
          
          <div className="flex items-center gap-2 px-4 py-3 border-b bg-card/50">
            <SidebarTrigger className="hover:bg-accent transition-colors">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <span className="text-sm text-muted-foreground">Menu de Categorias</span>
          </div>

          <main className="flex-1 container px-4 py-8 space-y-8 animate-fade-in-up">
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
            </div>

            <CardGrid
              cards={filteredCards}
              onEdit={handleEdit}
              onDelete={handleDeleteCard}
              onView={handleView}
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

        <AIAssistant />
      </div>
    </SidebarProvider>
  );
};

export default Index;