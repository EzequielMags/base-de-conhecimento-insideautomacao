import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, Save, User, LogOut, ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useUserRole, AppRole } from "@/hooks/use-user-role";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarCropDialog } from "@/components/AvatarCropDialog";
import { Camera } from "lucide-react";

type SettingsTab = "conta" | "usuarios";

interface ManagedUser {
  id: string;
  name: string;
  email: string | null;
  role: AppRole;
  pendingRole: AppRole;
  avatar_url?: string | null;
}

const roleLabel = (r: AppRole) =>
  r === "admin" ? "ADMIN" : r === "user" ? "Editor" : "Visitante";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>("conta");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useUserRole();

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setEmail(user.email || "");
        const { data: profile } = await (supabase as any)
          .from("profiles").select("name, avatar_url").eq("id", user.id).maybeSingle();
        if (profile) {
          setName(profile.name);
          setAvatarUrl(profile.avatar_url ?? null);
        }
      }
    };
    loadUserData();
    if (isAdmin) loadUsers();
  }, [isAdmin]);

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
        avatar_url: u.avatar_url ?? null,
      }));
      setUsers(merged);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Não foi possível carregar os usuários.", variant: "destructive" });
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Logout realizado", description: "Até logo!" });
    navigate("/auth");
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({ title: "Formato inválido", description: "Envie JPG, PNG ou WEBP.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = async (blob: Blob) => {
    if (!userId) return;
    setUploadingAvatar(true);
    try {
      const path = `${userId}/avatar.jpg`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
      const { error: updErr } = await (supabase as any)
        .from("profiles").update({ avatar_url: publicUrl }).eq("id", userId);
      if (updErr) throw updErr;
      setAvatarUrl(publicUrl);
      setCropOpen(false);
      setCropSrc(null);
      toast({ title: "Avatar atualizado!", description: "Sua foto de perfil foi salva." });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Falha ao enviar avatar.", variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const sidebarItems: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { key: "conta", label: "Conta", icon: <User className="h-4 w-4" /> },
    ...(isAdmin ? [{ key: "usuarios" as SettingsTab, label: "Usuários", icon: <Users className="h-4 w-4" /> }] : []),
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col shrink-0">
        <div className="p-4 border-b">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2 w-full justify-start">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        </div>

        <div className="p-3 space-y-1 flex-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Configurações</p>
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                activeTab === item.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        <div className="p-3 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-8">
          {activeTab === "conta" && (
            <div className="space-y-8">
              <div>
                <h1 className="text-2xl font-bold">Conta</h1>
                <p className="text-muted-foreground text-sm mt-1">Gerencie suas informações pessoais e credenciais</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informações Pessoais</h3>

                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20 ring-2 ring-border">
                      <AvatarImage src={avatarUrl || undefined} alt={name} />
                      <AvatarFallback>{(name || email || "?").slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <label
                      htmlFor="avatar-input"
                      className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow hover:scale-105 transition"
                      title="Alterar foto"
                    >
                      {uploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                    </label>
                    <input
                      id="avatar-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={handleAvatarFile}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Foto de Perfil</p>
                    <p>JPG, PNG ou WEBP. Recorte 1:1.</p>
                  </div>
                </div>

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
                <h3 className="text-lg font-semibold">Alterar Senha</h3>
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
            </div>
          )}

          {activeTab === "usuarios" && isAdmin && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold">Gerenciamento de Usuários</h1>
                <p className="text-muted-foreground text-sm mt-1">Liste, altere e salve as permissões dos usuários cadastrados.</p>
              </div>

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
                  <div className="overflow-x-auto">
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
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9 shrink-0">
                                  <AvatarImage src={u.avatar_url || undefined} alt={u.name} />
                                  <AvatarFallback>{(u.name || u.email || "?").slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-medium text-sm truncate">{u.email || "—"}</span>
                                  <span className="text-xs text-muted-foreground truncate">{u.name}</span>
                                </div>
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
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <AvatarCropDialog
        open={cropOpen}
        imageSrc={cropSrc}
        onClose={() => { setCropOpen(false); setCropSrc(null); }}
        onSave={handleSaveAvatar}
      />
    </div>
  );
};

export default Settings;
