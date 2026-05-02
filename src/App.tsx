import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import PdfsTecnicos from "./pages/PdfsTecnicos";
import BancoLojas from "./pages/BancoLojas";
import Repository from "./pages/Repository";
import Impressoras from "./pages/Impressoras";
import Autopen from "./pages/Autopen";
import Settings from "./pages/Settings";
import ConsultaCnpj from "./pages/ConsultaCnpj";
import { HoverSoundEffect } from "./components/HoverSoundEffect";
import { IntegriChatProvider } from "./components/IntegriChatContext";
import { IntegriChatPanel } from "./components/IntegriChatPanel";
import { AppShell } from "./components/AppShell";
import { FloatingMusicPlayer } from "./components/FloatingMusicPlayer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HoverSoundEffect />
      <BrowserRouter>
        <IntegriChatProvider>
          <AppShell>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/pdfs-tecnicos" element={<PdfsTecnicos />} />
              <Route path="/banco-lojas" element={<BancoLojas />} />
              <Route path="/scripts" element={<Repository kind="scripts" />} />
              <Route path="/skins" element={<Repository kind="skins" />} />
              <Route path="/doclayouts" element={<Repository kind="doclayouts" />} />
              <Route path="/impressoras" element={<Impressoras />} />
              <Route path="/autopen" element={<Autopen />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/consulta-cnpj" element={<ConsultaCnpj />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppShell>
          <IntegriChatPanel />
          <FloatingMusicPlayer />
        </IntegriChatProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
