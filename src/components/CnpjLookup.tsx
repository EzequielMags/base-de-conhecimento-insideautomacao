import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, Building2, MapPin, FileText, Activity, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB",
  "PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

interface CnpjData {
  razao_social?: string;
  nome_fantasia?: string;
  situacao_cadastral?: string | number;
  descricao_situacao_cadastral?: string;
  cnae_fiscal?: number;
  cnae_fiscal_descricao?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  ddd_telefone_1?: string;
  email?: string;
  cnpj?: string;
}

const formatCnpj = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

export const CnpjLookup = () => {
  const [uf, setUf] = useState<string>("SP");
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

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const enderecoCompleto = data
    ? [
        data.logradouro,
        data.numero,
        data.complemento,
        data.bairro,
        data.municipio && `${data.municipio}/${data.uf}`,
        data.cep,
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Building2 className="h-5 w-5 text-primary" />
          Consulta CNPJ / Sintegra
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Consulte rapidamente dados cadastrais de empresas via BrasilAPI.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[120px_1fr_auto]">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">UF</label>
            <Select value={uf} onValueChange={setUf}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {UFS.map((u) => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">CNPJ</label>
            <Input
              value={cnpj}
              onChange={(e) => setCnpj(formatCnpj(e.target.value))}
              onKeyDown={handleKey}
              placeholder="00.000.000/0000-00"
              inputMode="numeric"
            />
          </div>

          <div className="space-y-1 flex flex-col justify-end">
            <Button onClick={handleSearch} disabled={loading} className="gap-2 h-10">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {loading ? "Consultando..." : "Consultar"}
            </Button>
          </div>
        </div>

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
              key="data"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.25 }}
              className="rounded-lg border bg-muted/30 p-4 space-y-3"
            >
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Razão Social</p>
                <p className="font-semibold">{data.razao_social || "—"}</p>
              </div>

              {data.nome_fantasia && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Nome Fantasia</p>
                  <p>{data.nome_fantasia}</p>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <InfoLine
                  icon={<Activity className="h-4 w-4" />}
                  label="Situação Cadastral"
                  value={data.descricao_situacao_cadastral || String(data.situacao_cadastral ?? "—")}
                  highlight={(data.descricao_situacao_cadastral || "").toUpperCase() === "ATIVA"}
                />
                <InfoLine
                  icon={<FileText className="h-4 w-4" />}
                  label="CNAE Principal"
                  value={
                    data.cnae_fiscal
                      ? `${data.cnae_fiscal} — ${data.cnae_fiscal_descricao || ""}`
                      : "—"
                  }
                />
              </div>

              <InfoLine
                icon={<MapPin className="h-4 w-4" />}
                label="Endereço"
                value={enderecoCompleto || "—"}
              />

              {(data.ddd_telefone_1 || data.email) && (
                <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-border/50">
                  {data.ddd_telefone_1 && (
                    <InfoLine label="Telefone" value={data.ddd_telefone_1} />
                  )}
                  {data.email && <InfoLine label="E-mail" value={data.email} />}
                </div>
              )}

              <p className="text-[10px] text-muted-foreground pt-2 border-t border-border/50">
                Consultado para UF selecionada: <strong>{uf}</strong> · Fonte: BrasilAPI
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

const InfoLine = ({
  icon,
  label,
  value,
  highlight,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <div>
    <p className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
      {icon}
      {label}
    </p>
    <p className={cn("text-sm", highlight && "text-green-500 font-semibold")}>{value}</p>
  </div>
);
