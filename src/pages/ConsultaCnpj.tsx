import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/Header";
import { AppSidebar } from "@/components/AppSidebar";
import { useIntegriChat } from "@/components/IntegriChatContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Loader2,
  Building2,
  AlertCircle,
  Menu,
  Hash,
  FileBadge,
  MapPin,
  Home,
  Building,
  Mailbox,
  Activity,
  Calendar,
  Phone,
  Mail,
  DollarSign,
  Users,
  Globe,
  Briefcase,
  Landmark,
} from "lucide-react";

const formatCnpj = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

interface CnpjData {
  razao_social?: string;
  nome_fantasia?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  complemento?: string;
  municipio?: string;
  uf?: string;
  cnpj?: string;
  ddd_telefone_1?: string;
  ddd_telefone_2?: string;
  email?: string;
  capital_social?: number;
  porte?: { descricao?: string } | string;
  descricao_porte?: string;
  natureza_juridica?: string;
  descricao_situacao_cadastral?: string;
  situacao_cadastral?: string | number;
  data_situacao_cadastral?: string;
  data_inicio_atividade?: string;
  cnae_fiscal?: number;
  cnae_fiscal_descricao?: string;
  cnaes_secundarios?: Array<{ codigo?: number; descricao?: string }>;
  qsa?: Array<{ nome_socio?: string; qualificacao_socio?: string }>;
  inscricoes_estaduais?: Array<{ inscricao_estadual?: string; ativo?: boolean; estado?: string }>;
}

const ConsultaCnpj = () => {
  const { open: chatOpen } = useIntegriChat();
  const [cnpj, setCnpj] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CnpjData | null>(null);

  const handleSearch = async () => {
    setError(null);
    setData(null);
    const digits = cnpj.replace(/\D/g, "");
    if (digits.length !== 14) {
      setError("CNPJ inválido. Digite os 14 dígitos.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Empresa não encontrada.");
        throw new Error("Erro ao consultar a API. Tente novamente.");
      }
      const json: CnpjData = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e?.message || "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  const ie =
    data?.inscricoes_estaduais?.find((x) => x.ativo)?.inscricao_estadual ||
    data?.inscricoes_estaduais?.[0]?.inscricao_estadual ||
    "—";

  const fields = data
    ? [
        { icon: Building2, label: "Nome Empresarial (Razão Social)", value: data.razao_social || "—" },
        { icon: Building, label: "Nome Fantasia", value: data.nome_fantasia || "—" },
        { icon: FileBadge, label: "Inscrição Estadual (IE)", value: ie },
        { icon: Mailbox, label: "CEP", value: data.cep || "—" },
        { icon: Home, label: "Logradouro", value: data.logradouro || "—" },
        { icon: MapPin, label: "Bairro", value: data.bairro || "—" },
        { icon: Hash, label: "Complemento", value: data.complemento || "—" },
      ]
    : [];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />

        <div
          className={`flex-1 flex flex-col transition-all duration-300 ${
            chatOpen ? "md:mr-[40vw]" : ""
          }`}
        >
          <Header onNewCard={() => {}} canCreate={false} />

          <div className="flex items-center gap-2 px-4 py-3 border-b bg-card/50">
            <SidebarTrigger className="hover:bg-accent transition-colors">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <span className="text-sm text-muted-foreground">Menu</span>
          </div>

          <main className="flex-1 container px-4 py-8 space-y-6 animate-fade-in-up max-w-5xl">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">Consulta CNPJ</h2>
              <p className="text-sm text-muted-foreground">
                Pesquise dados cadastrais de empresas via BrasilAPI.
              </p>
            </div>

            <Card className="border-border/60">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5 text-primary" />
                  Buscar empresa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    value={cnpj}
                    onChange={(e) => setCnpj(formatCnpj(e.target.value))}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="00.000.000/0000-00"
                    inputMode="numeric"
                    className="flex-1 h-11 text-base"
                  />
                  <Button onClick={handleSearch} disabled={loading} className="gap-2 h-11 sm:w-40">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    {loading ? "Consultando..." : "Consultar"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </motion.div>
              )}

              {data && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  transition={{ duration: 0.25 }}
                  className="grid gap-4 sm:grid-cols-2"
                >
                  {fields.map((f) => {
                    const Icon = f.icon;
                    return (
                      <Card key={f.label} className="border-border/60 bg-card/80">
                        <CardContent className="p-4 space-y-1">
                          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                            <Icon className="h-3.5 w-3.5 text-primary" />
                            {f.label}
                          </div>
                          <p className="text-sm font-medium break-words">{f.value}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>

      </div>
    </SidebarProvider>
  );
};

export default ConsultaCnpj;
