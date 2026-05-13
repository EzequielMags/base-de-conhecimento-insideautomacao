import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/use-user-role";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  CheckCircle2,
  Eye,
  Clock,
  AlertTriangle,
  Trash2,
  CalendarDays,
  ListChecks,
  BookOpen,
  Menu,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { format, isBefore, startOfToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Header } from "@/components/Header";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

interface Demand {
  id: string;
  title: string;
  description: string;
  category: string | null;
  priority: "baixa" | "media" | "alta";
  deadline: string | null;
  status: "aguardando" | "concluido";
  assignee_id: string | null;
  assignee_name: string | null;
  created_by: string;
  created_by_name: string | null;
  completed_at: string | null;
  completed_by_name: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  name: string;
}

const CATEGORIES = [
  "Impressora",
  "XD Orders",
  "Sat",
  "NFCE",
  "Dados Fiscais",
  "Sistema",
  "Tablet",
  "Extras",
];

interface Props {
  finalized?: boolean;
}

const PRIORITY_LABEL = { baixa: "Baixa", media: "Média", alta: "Alta" };
const PRIORITY_COLOR: Record<string, string> = {
  baixa: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  media: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  alta: "bg-red-500/15 text-red-400 border-red-500/30",
};

const Demands = ({ finalized = false }: Props) => {
  const { user, isAdmin, canCreate } = useUserRole();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [demands, setDemands] = useState<Demand[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);
  const [viewing, setViewing] = useState<Demand | null>(null);

  // form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Sistema",
    priority: "media" as Demand["priority"],
    deadline: "",
    assignee_id: "none",
  });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("demands" as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Erro ao carregar demandas", description: error.message, variant: "destructive" });
    } else {
      setDemands((data as any) || []);
    }
    setLoading(false);
  };

  const loadProfiles = async () => {
    const { data } = await supabase.from("profiles").select("id, name");
    setProfiles((data as any) || []);
  };

  useEffect(() => {
    load();
    loadProfiles();
    const channel = supabase
      .channel("demands-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "demands" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () => demands.filter((d) => (finalized ? d.status === "concluido" : d.status === "aguardando")),
    [demands, finalized]
  );

  const handleCreate = async () => {
    if (!form.title.trim()) {
      toast({ title: "Título obrigatório", variant: "destructive" });
      return;
    }
    if (!user) return;
    const assignee = form.assignee_id !== "none" ? profiles.find((p) => p.id === form.assignee_id) : null;
    const { error } = await supabase.from("demands" as any).insert({
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      priority: form.priority,
      deadline: form.deadline || null,
      assignee_id: assignee?.id || null,
      assignee_name: assignee?.name || null,
      created_by: user.id,
      created_by_name: user.user_metadata?.name || user.email?.split("@")[0] || null,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Demanda criada com sucesso" });
    setOpenCreate(false);
    setForm({ title: "", description: "", category: "Sistema", priority: "media", deadline: "", assignee_id: "none" });
    load();
  };

  const handleComplete = async (d: Demand) => {
    if (!user) return;
    const { error } = await supabase
      .from("demands" as any)
      .update({
        status: "concluido",
        completed_at: new Date().toISOString(),
        completed_by: user.id,
        completed_by_name: user.user_metadata?.name || user.email?.split("@")[0] || null,
      })
      .eq("id", d.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Demanda concluída!" });
    load();
  };

  const handleReopen = async (d: Demand) => {
    const { error } = await supabase
      .from("demands" as any)
      .update({ status: "aguardando", completed_at: null, completed_by: null, completed_by_name: null })
      .eq("id", d.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Demanda reaberta" });
    load();
  };

  const handleDelete = async (d: Demand) => {
    if (!confirm("Excluir esta demanda?")) return;
    const { error } = await supabase.from("demands" as any).delete().eq("id", d.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Demanda excluída" });
    load();
  };

  const isOverdue = (d: Demand) => {
    if (!d.deadline || d.status === "concluido") return false;
    return isBefore(new Date(d.deadline + "T23:59:59"), startOfToday());
  };

  const noopNewCard = () => navigate("/");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Header onNewCard={noopNewCard} canCreate={false} />
          <div className="flex items-center gap-2 px-4 py-3 border-b bg-card/50">
            <SidebarTrigger className="hover:bg-accent transition-colors">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <span className="text-sm text-muted-foreground">Menu</span>
          </div>
          <main className="flex-1 container mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <ListChecks className="h-4 w-4" />
            <span>Painel de Demandas</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {finalized ? "Demandas Finalizadas" : "Demandas Ativas"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {finalized
              ? "Histórico de demandas concluídas pela equipe."
              : "Acompanhe os tickets em aberto, seus prazos e prioridades."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(finalized ? "/demandas" : "/finalizados")} className="gap-2">
            {finalized ? <ListChecks className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            {finalized ? "Ver Ativas" : "Ver Finalizados"}
          </Button>
          <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
            <BookOpen className="h-4 w-4" />
            Cards de Conhecimento
          </Button>
          {canCreate && !finalized && (
            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Demanda
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Nova Demanda</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Título *</Label>
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Corrigir impressora loja 12" />
                  </div>
                  <div>
                    <Label>Descrição técnica</Label>
                    <Textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={4}
                      placeholder="Detalhes do que precisa ser feito..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Categoria</Label>
                      <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Prioridade</Label>
                      <Select value={form.priority} onValueChange={(v: any) => setForm({ ...form, priority: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baixa">Baixa</SelectItem>
                          <SelectItem value="media">Média</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Prazo</Label>
                      <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
                    </div>
                    <div>
                      <Label>Responsável</Label>
                      <Select value={form.assignee_id} onValueChange={(v) => setForm({ ...form, assignee_id: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sem responsável</SelectItem>
                          {profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpenCreate(false)}>Cancelar</Button>
                  <Button onClick={handleCreate}>Criar Demanda</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-12">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-xl">
          <ListChecks className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-lg text-muted-foreground">
            {finalized ? "Nenhuma demanda finalizada ainda." : "Nenhuma demanda ativa no momento."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((d, idx) => {
            const overdue = isOverdue(d);
            const stateClass = d.status === "concluido"
              ? "demand-done"
              : overdue ? "demand-overdue" : "demand-waiting";
            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.03 }}
                className={`relative rounded-xl border-2 bg-card p-5 flex flex-col gap-3 ${stateClass}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {d.status === "concluido" ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/40 gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Concluído
                      </Badge>
                    ) : overdue ? (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/40 gap-1">
                        <AlertTriangle className="h-3 w-3" /> Atrasado
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40 gap-1">
                        <Clock className="h-3 w-3" /> Aguardando
                      </Badge>
                    )}
                    <Badge variant="outline" className={PRIORITY_COLOR[d.priority]}>
                      {PRIORITY_LABEL[d.priority]}
                    </Badge>
                    {d.category && <Badge variant="secondary">{d.category}</Badge>}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold leading-tight line-clamp-2">{d.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-3 whitespace-pre-wrap">
                    {d.description || <span className="italic opacity-60">Sem descrição</span>}
                  </p>
                </div>

                <div className="text-xs text-muted-foreground space-y-0.5 mt-auto">
                  {d.deadline && (
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Prazo: {format(new Date(d.deadline + "T00:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </div>
                  )}
                  {d.assignee_name && <div>👤 Responsável: {d.assignee_name}</div>}
                  {d.created_by_name && <div>✍️ Criado por: {d.created_by_name}</div>}
                  {d.status === "concluido" && d.completed_by_name && (
                    <div>✅ Concluído por: {d.completed_by_name}</div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  {d.status === "aguardando" ? (
                    canCreate && (
                      <Button size="sm" className="flex-1 gap-1" onClick={() => handleComplete(d)}>
                        <CheckCircle2 className="h-4 w-4" /> Concluir
                      </Button>
                    )
                  ) : (
                    canCreate && (
                      <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => handleReopen(d)}>
                        <Clock className="h-4 w-4" /> Reabrir
                      </Button>
                    )
                  )}
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => setViewing(d)}>
                    <Eye className="h-4 w-4" /> Ver Detalhes
                  </Button>
                  {isAdmin && (
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(d)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-lg">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle>{viewing.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={PRIORITY_COLOR[viewing.priority]}>
                    Prioridade {PRIORITY_LABEL[viewing.priority]}
                  </Badge>
                  {viewing.category && <Badge variant="secondary">{viewing.category}</Badge>}
                </div>
                <p className="whitespace-pre-wrap">{viewing.description || "—"}</p>
                {viewing.deadline && (
                  <p className="text-muted-foreground">
                    📅 Prazo: {format(new Date(viewing.deadline + "T00:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                )}
                {viewing.assignee_name && <p className="text-muted-foreground">👤 Responsável: {viewing.assignee_name}</p>}
                {viewing.created_by_name && <p className="text-muted-foreground">✍️ Criado por: {viewing.created_by_name}</p>}
                {viewing.status === "concluido" && viewing.completed_at && (
                  <p className="text-muted-foreground">
                    ✅ Concluída em {format(new Date(viewing.completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    {viewing.completed_by_name ? ` por ${viewing.completed_by_name}` : ""}
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Demands;
