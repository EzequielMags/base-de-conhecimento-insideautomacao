import { LayoutGrid, FileType, Store } from "lucide-react";
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

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const navigate = useNavigate();
  const location = useLocation();

  const sections = [
    { label: "Cards de Conhecimento", icon: LayoutGrid, path: "/" },
    { label: "PDFs Técnicos", icon: FileType, path: "/pdfs-tecnicos" },
    { label: "Banco de Lojas", icon: Store, path: "/banco-lojas" },
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
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
