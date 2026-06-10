import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { HoverSoundEffect } from "./components/HoverSoundEffect";
import { IntegriChatProvider } from "./components/IntegriChatContext";
import { IntegriChatPanel } from "./components/IntegriChatPanel";
import { SintegraProvider } from "./components/SintegraContext";
import { SintegraPanel } from "./components/SintegraPanel";
import { AppShell } from "./components/AppShell";
import { FloatingMusicPlayer } from "./components/FloatingMusicPlayer";
import { AccountVerificationGate } from "./components/AccountVerificationGate";
import { PrivateRoute } from "./components/PrivateRoute";

// Eager: landing + auth (most-used)
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Lazy: everything else
const NotFound = lazy(() => import("./pages/NotFound"));
const PdfsTecnicos = lazy(() => import("./pages/PdfsTecnicos"));
const BancoLojas = lazy(() => import("./pages/BancoLojas"));
const Repository = lazy(() => import("./pages/Repository"));
const Impressoras = lazy(() => import("./pages/Impressoras"));
const Autopen = lazy(() => import("./pages/Autopen"));
const Settings = lazy(() => import("./pages/Settings"));
const ConsultaCnpj = lazy(() => import("./pages/ConsultaCnpj"));
const Demands = lazy(() => import("./pages/Demands"));
const MinhaPasta = lazy(() => import("./pages/MinhaPasta"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});

const PageFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);

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
              <Suspense fallback={<PageFallback />}>
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
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </AppShell>
            <IntegriChatPanel />
            <SintegraPanel />
            <FloatingMusicPlayer />
            <AccountVerificationGate />
          </SintegraProvider>
        </IntegriChatProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
