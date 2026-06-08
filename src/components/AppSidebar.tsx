import { LayoutGrid, FileType, Store, Code2, Palette, FileBox, Printer, PenTool, Building2, FolderOpen } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIntegriChat } from "@/components/IntegriChatContext";
import integgriLogo from "@/assets/integgri-logo.png";

interface NavSection {
  label: string;
  icon: LucideIcon;
  path: string;
  formats?: string;
}

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const navigate = useNavigate();
  const location = useLocation();
  const { open: chatOpen, toggle: toggleChat } = useIntegriChat();

  const sections: NavSection[] = [
    { label: "Cards de Conhecimento", icon: LayoutGrid, path: "/" },
    { label: "PDFs Técnicos", icon: FileType, path: "/pdfs-tecnicos" },
    { label: "Banco de Lojas", icon: Store, path: "/banco-lojas" },
    { label: "Scripts", icon: Code2, path: "/scripts" },
    { label: "Skins", icon: Palette, path: "/skins" },
    { label: "Doclayouts", icon: FileBox, path: "/doclayouts" },
    { label: "Impressoras", icon: Printer, path: "/impressoras" },
    { label: "AUTOPEN", icon: PenTool, path: "/autopen" },
    { label: "Consulta CNPJ", icon: Building2, path: "/consulta-cnpj" },
    { label: "Minha Pasta", icon: FolderOpen, path: "/minha-pasta" },
  ];

  return (
    <Sidebar className={`${isCollapsed ? "w-14" : "w-60"} transition-all duration-300`} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-semibold">Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = location.pathname === section.path;

                return (
                  <SidebarMenuItem key={section.path}>
                    <SidebarMenuButton
                      onClick={() => navigate(section.path)}
                      className={`transition-all duration-200 ${
                        isActive
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "hover:bg-accent"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isCollapsed ? "" : "mr-2"}`} />
                      {!isCollapsed && <span>{section.label}</span>}
                    </SidebarMenuButton>
                    {!isCollapsed && section.formats && (
                      <p className="pl-9 pr-2 -mt-0.5 mb-1 text-[10px] text-muted-foreground font-mono leading-tight">
                        {section.formats}
                      </p>
                    )}
                  </SidebarMenuItem>
                );
              })}

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={toggleChat}
                  className={`transition-all duration-200 ${
                    chatOpen
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "hover:bg-accent"
                  }`}
                >
                  <img
                    src={integgriLogo}
                    alt="Integgri"
                    className={`h-4 w-4 object-contain ${isCollapsed ? "" : "mr-2"}`}
                  />
                  {!isCollapsed && <span>Integgri Chat</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
