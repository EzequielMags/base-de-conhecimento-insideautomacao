import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, Save } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useUserRole, AppRole } from "@/hooks/use-user-role";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface UserSettingsProps {
  open: boolean;
  onClose: () => void;
}

interface ManagedUser {
  id: string;
  name: string;
  email: string | null;
  role: AppRole;
  pendingRole: AppRole;
}

const roleLabel = (r: AppRole) =>
  r === "admin" ? "ADMIN" : r === "user" ? "Editor" : "Visitante";

export const UserSettings = ({ open, onClose }: UserSettingsProps) => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAdmin } = useUserRole();

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || "");
        const { data: profile } = await supabase
          .from("profiles").select("name").eq("id", user.id).maybeSingle();
        if (profile) setName(profile.name);
      }
    };
    if (open) {
      loadUserData();
      if (isAdmin) loadUsers();
    }
  }, [open, isAdmin]);

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const { data, error } = await supabase.rpc("admin_list_users");
      if (error) throw error;

      const merged: ManagedUser[] = (data || []).map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role as AppRole,
        pendingRole: u.role as AppRole,
      }));
      setUsers(merged);
    } catch (e: any) {
      console.error("admin_list_users error", e);
      toast({
        title: "Erro",
        description: e.message || "Não foi possível carregar os usuários.",
        variant: "destructive",
      });
    } finally {
      setUsersLoading(false);
    }
  };

  const handleSaveRole = async (u: ManagedUser) => {
    if (u.pendingRole === u.role) return;
    setSavingUserId(u.id);
    try {
      const { error } = await supabase.rpc("admin_set_user_role", {
        _user_id: u.id,
        _role: u.pendingRole,
      });
      if (error) throw error;

      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: u.pendingRole } : x));
      toast({ title: "Permissão atualizada", description: `${u.email || u.name} agora é ${roleLabel(u.pendingRole)}.` });
    } catch (e: any) {
      console.error("admin_set_user_role error", e);
      toast({ title: "Erro", description: e.message || "Não foi possível atualizar.", variant: "destructive" });
    } finally {
      setSavingUserId(null);
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");
      const { error: profileError } = await supabase
        .from("profiles").update({ name }).eq("id", user.id);
      if (profileError) throw profileError;
      if (email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email });
        if (emailError) throw emailError;
        toast({ title: "Perfil atualizado!", description: "Verifique seu novo email para confirmar." });
      } else {
        toast({ title: "Perfil atualizado!", description: "Suas informações foram atualizadas." });
      }
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Não foi possível atualizar.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Erro", description: "As senhas não coincidem.", variant: "destructive" }); return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Erro", description: "A nova senha deve ter pelo menos 6 caracteres.", variant: "destructive" }); return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Senha atualizada!", description: "Sua senha foi alterada com sucesso." });
      setNewPassword(""); setConfirmPassword("");
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Não foi possível atualizar a senha.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={isAdmin ? "max-w-3xl max-h-[90vh] overflow-y-auto" : "max-w-md"}>
        <DialogHeader>
          <DialogTitle>Configurações</DialogTitle>
          <DialogDescription>
            Gerencie suas informações pessoais e credenciais
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Informações Pessoais</h3>

            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
            </div>

            <Button onClick={handleUpdateProfile} disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Atualizar Perfil
            </Button>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Alterar Senha</h3>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input id="newPassword" type="password" placeholder="Mínimo 6 caracteres"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input id="confirmPassword" type="password" placeholder="Repita a nova senha"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading} />
            </div>
            <Button onClick={handleUpdatePassword} disabled={loading || !newPassword || !confirmPassword} className="w-full" variant="secondary">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Alterar Senha
            </Button>
          </div>

          {isAdmin && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Gerenciamento de Usuários</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Liste, altere e salve as permissões dos usuários cadastrados.
                </p>

                <div className="border rounded-lg overflow-hidden">
                  {usersLoading ? (
                    <div className="p-6 flex justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : users.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      Nenhum usuário encontrado.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email / Nome</TableHead>
                          <TableHead>Cargo Atual</TableHead>
                          <TableHead>Novo Cargo</TableHead>
                          <TableHead className="text-right">Ação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium text-sm">{u.email || "—"}</span>
                                <span className="text-xs text-muted-foreground">{u.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={u.role === "admin" ? "default" : u.role === "user" ? "secondary" : "outline"}>
                                {roleLabel(u.role)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={u.pendingRole}
                                onValueChange={(v) =>
                                  setUsers(prev => prev.map(x => x.id === u.id ? { ...x, pendingRole: v as AppRole } : x))
                                }
                              >
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-popover z-50">
                                  <SelectItem value="read">Visitante</SelectItem>
                                  <SelectItem value="user">Editor</SelectItem>
                                  <SelectItem value="admin">ADMIN</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                disabled={u.pendingRole === u.role || savingUserId === u.id}
                                onClick={() => handleSaveRole(u)}
                                className="gap-1"
                              >
                                {savingUserId === u.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Save className="h-3 w-3" />
                                )}
                                Salvar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
