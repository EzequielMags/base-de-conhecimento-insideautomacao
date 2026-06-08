import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings as SettingsIcon, Palette, Users, LogOut, Pencil, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { AvatarCropDialog } from "@/components/AvatarCropDialog";

const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export const UserMenu = () => {
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;
      setUserId(user.id);
      setEmail(user.email || "");
      const { data: profile } = await (supabase as any)
        .from("profiles").select("name, avatar_url").eq("id", user.id).maybeSingle();
      if (profile && mounted) {
        setName(profile.name || "");
        setAvatarUrl(profile.avatar_url ?? null);
      }
    };
    load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => load());
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Logout realizado", description: "Até logo!" });
    navigate("/auth");
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ALLOWED.includes(file.type)) {
      toast({ title: "Formato inválido", description: "Envie JPG, PNG ou WEBP.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { setCropSrc(reader.result as string); setCropOpen(true); };
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = async (blob: Blob) => {
    if (!userId) return;
    setUploading(true);
    try {
      const path = `${userId}/avatar.jpg`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
      await (supabase as any).from("profiles").update({ avatar_url: publicUrl }).eq("id", userId);
      setAvatarUrl(publicUrl);
      setCropOpen(false); setCropSrc(null);
      toast({ title: "Avatar atualizado!" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Falha ao enviar avatar.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!userId) return;
    try {
      await supabase.storage.from("avatars").remove([`${userId}/avatar.jpg`]);
      await (supabase as any).from("profiles").update({ avatar_url: null }).eq("id", userId);
      setAvatarUrl(null);
      toast({ title: "Foto removida" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const initials = (name || email || "?").slice(0, 2).toUpperCase();

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={onPickFile}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="group relative rounded-full ring-1 ring-border hover:ring-primary/60 transition outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Menu do usuário"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={avatarUrl || undefined} alt={name || email} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); fileRef.current?.click(); }}
              className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition cursor-pointer"
              title="Alterar foto"
            >
              {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Pencil className="h-3 w-3" />}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel className="flex flex-col">
            <span className="text-sm font-semibold truncate">{name || "Usuário"}</span>
            <span className="text-xs text-muted-foreground truncate">{email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => fileRef.current?.click()}>
            <Pencil className="mr-2 h-4 w-4" /> Alterar foto
          </DropdownMenuItem>
          {avatarUrl && (
            <DropdownMenuItem onClick={handleRemoveAvatar}>
              <Pencil className="mr-2 h-4 w-4 opacity-60" /> Remover foto
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/settings")}>
            <SettingsIcon className="mr-2 h-4 w-4" /> Configurações
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/settings?tab=temas")}>
            <Palette className="mr-2 h-4 w-4" /> Temas / Skins
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem onClick={() => navigate("/settings?tab=usuarios")}>
              <Users className="mr-2 h-4 w-4" /> Gerenciamento de usuários
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AvatarCropDialog
        open={cropOpen}
        imageSrc={cropSrc}
        onClose={() => { setCropOpen(false); setCropSrc(null); }}
        onSave={handleSaveAvatar}
      />
    </>
  );
};
