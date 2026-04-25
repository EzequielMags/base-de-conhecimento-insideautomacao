import { Printer, ShoppingCart, Cpu, FileText, Database, Settings, Tablet, Plus, LayoutGrid, FileType, Store } from "lucide-react";
import { Category } from "./CategoryFilter";
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

const categoryIcons: Record<string, any> = {
  "Todas": LayoutGrid,
  "Impressora": Printer,
  "XD Orders": ShoppingCart,
  "Sat": Cpu,
  "NFCE": FileText,
  "Dados Fiscais": Database,
  "Sistema": Settings,
  "Tablet": Tablet,
  "Extras": Plus,
};

interface AppSidebarProps {
  selectedCategory: Category;
  onSelectCategory: (category: Category) => void;
}

export function AppSidebar({ selectedCategory, onSelectCategory }: AppSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const navigate = useNavigate();
  const location = useLocation();

  const categories: Category[] = [
    "Todas",
    "Impressora",
    "XD Orders",
    "Sat",
    "NFCE",
    "Dados Fiscais",
    "Sistema",
    "Tablet",
    "Extras"
  ];

  const extraSections = [
    { label: "PDFs Técnicos", icon: FileType, path: "/pdfs-tecnicos" },
    { label: "Banco de Lojas", icon: Store, path: "/banco-lojas" },
  ];

  const handleCategoryClick = (category: Category) => {
    if (location.pathname !== "/") {
      navigate("/");
    }
    onSelectCategory(category);
  };

  return (
    <Sidebar className={`${isCollapsed ? "w-14" : "w-60"} transition-all duration-300`} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-semibold">Categorias</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {categories.map((category) => {
                const Icon = categoryIcons[category] || LayoutGrid;
                const isActive = location.pathname === "/" && selectedCategory === category;
                
                return (
                  <SidebarMenuItem key={category}>
                    <SidebarMenuButton
                      onClick={() => handleCategoryClick(category)}
                      className={`transition-all duration-200 ${
                        isActive 
                          ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                          : "hover:bg-accent"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isCollapsed ? "" : "mr-2"}`} />
                      {!isCollapsed && <span>{category}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-semibold">Repositórios</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {extraSections.map((section) => {
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
