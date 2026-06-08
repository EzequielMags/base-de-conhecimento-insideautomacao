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
import Demands from "./pages/Demands";
import MinhaPasta from "./pages/MinhaPasta";
import { HoverSoundEffect } from "./components/HoverSoundEffect";
import { IntegriChatProvider } from "./components/IntegriChatContext";
import { IntegriChatPanel } from "./components/IntegriChatPanel";
import { SintegraProvider } from "./components/SintegraContext";
import { SintegraPanel } from "./components/SintegraPanel";
import { AppShell } from "./components/AppShell";
import { FloatingMusicPlayer } from "./components/FloatingMusicPlayer";
import { UpdateNotes } from "./components/UpdateNotes";
import { PrivateRoute } from "./components/PrivateRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HoverSoundEffect />
      <BrowserRouter>
        <IntegriChatProvider>
          <SintegraProvider>
            <AppShell>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={<PrivateRoute><Index /></PrivateRoute>} />
                <Route path="/pdfs-tecnicos" element={<PrivateRoute><PdfsTecnicos /></PrivateRoute>} />
                <Route path="/banco-lojas" element={<PrivateRoute><BancoLojas /></PrivateRoute>} />
                <Route path="/scripts" element={<PrivateRoute><Repository kind="scripts" /></PrivateRoute>} />
                <Route path="/skins" element={<PrivateRoute><Repository kind="skins" /></PrivateRoute>} />
                <Route path="/doclayouts" element={<PrivateRoute><Repository kind="doclayouts" /></PrivateRoute>} />
                <Route path="/impressoras" element={<PrivateRoute><Impressoras /></PrivateRoute>} />
                <Route path="/autopen" element={<PrivateRoute><Autopen /></PrivateRoute>} />
                <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
                <Route path="/consulta-cnpj" element={<PrivateRoute><ConsultaCnpj /></PrivateRoute>} />
                <Route path="/demandas" element={<PrivateRoute><Demands /></PrivateRoute>} />
                <Route path="/finalizados" element={<PrivateRoute><Demands finalized /></PrivateRoute>} />
                <Route path="/minha-pasta" element={<PrivateRoute><MinhaPasta /></PrivateRoute>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppShell>
            <IntegriChatPanel />
            <SintegraPanel />
            <FloatingMusicPlayer />
            <UpdateNotes />
          </SintegraProvider>
        </IntegriChatProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
