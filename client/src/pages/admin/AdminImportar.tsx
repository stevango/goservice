import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ESTADOS_BRASIL, ESTADOS_BRASIL_NOMES } from "@shared/types";
import { Download, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const STATUS_STYLE: Record<string, string> = {
  pendente: "bg-amber-100 text-amber-700",
  rodando: "bg-blue-100 text-blue-700",
  concluido: "bg-green-100 text-green-700",
  cancelado: "bg-gray-100 text-gray-600",
  erro: "bg-red-100 text-red-700",
};

export default function AdminImportar() {
  const [form, setForm] = useState({
    termo: "oficina mecânica",
    estado: "",
    cidade: "",
    limite: 60,
  });
  const [cidades, setCidades] = useState<string[]>([]);
  const [cidadesLoading, setCidadesLoading] = useState(false);
  const [cidadesErro, setCidadesErro] = useState(false);

  const jobs = trpc.importacao.listar.useQuery(undefined, {
    refetchInterval: 15_000,
  });

  const iniciar = trpc.importacao.iniciar.useMutation({
    onSuccess: () => {
      toast.success(
        "Importação iniciada! Ela roda devagar (1 lote por minuto) em segundo plano."
      );
      setForm(f => ({ ...f, cidade: "" }));
      jobs.refetch();
    },
    onError: e => toast.error(e.message),
  });

  const cancelar = trpc.importacao.cancelar.useMutation({
    onSuccess: () => {
      toast.success("Importação cancelada.");
      jobs.refetch();
    },
    onError: e => toast.error(e.message),
  });

  // Ao trocar a UF, busca as cidades daquele estado no IBGE.
  useEffect(() => {
    if (!form.estado) {
      setCidades([]);
      setCidadesErro(false);
      return;
    }
    const ctrl = new AbortController();
    setCidadesLoading(true);
    setCidadesErro(false);
    setCidades([]);
    fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${form.estado}/municipios?orderBy=nome`,
      { signal: ctrl.signal }
    )
      .then(r => {
        if (!r.ok) throw new Error(`IBGE ${r.status}`);
        return r.json();
      })
      .then((data: Array<{ nome: string }>) => {
        setCidades(data.map(m => m.nome));
      })
      .catch((err: unknown) => {
        if ((err as Error).name === "AbortError") return;
        setCidadesErro(true);
      })
      .finally(() => setCidadesLoading(false));
    return () => ctrl.abort();
  }, [form.estado]);

  const podeIniciar =
    form.termo.trim().length >= 2 &&
    form.estado.length === 2 &&
    form.cidade.trim().length >= 2 &&
    form.limite >= 1 &&
    form.limite <= 300 &&
    !iniciar.isPending;

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Importar Oficinas (Google)
        </h1>
        <p className="text-muted-foreground">
          Busca oficinas no Google e cadastra como{" "}
          <strong>pendentes / não verificadas</strong>. Roda devagar, em
          segundo plano, sem travar o site.
        </p>
      </div>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <form
            className="grid gap-4 md:grid-cols-4 md:items-end"
            onSubmit={e => {
              e.preventDefault();
              iniciar.mutate(form);
            }}
          >
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="termo">O que buscar</Label>
              <Input
                id="termo"
                required
                value={form.termo}
                onChange={e => setForm({ ...form, termo: e.target.value })}
                placeholder="oficina mecânica"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado">Estado (UF)</Label>
              <Select
                value={form.estado}
                onValueChange={uf =>
                  setForm({ ...form, estado: uf, cidade: "" })
                }
              >
                <SelectTrigger id="estado" className="w-full">
                  <SelectValue placeholder="Selecione o estado" />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_BRASIL.map(uf => (
                    <SelectItem key={uf} value={uf}>
                      {ESTADOS_BRASIL_NOMES[uf]} ({uf})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              {cidadesErro ? (
                <Input
                  id="cidade"
                  required
                  value={form.cidade}
                  onChange={e =>
                    setForm({ ...form, cidade: e.target.value })
                  }
                  placeholder="Digite a cidade"
                  disabled={!form.estado}
                />
              ) : (
                <Select
                  value={form.cidade}
                  onValueChange={c => setForm({ ...form, cidade: c })}
                  disabled={!form.estado || cidadesLoading}
                >
                  <SelectTrigger id="cidade" className="w-full">
                    <SelectValue
                      placeholder={
                        !form.estado
                          ? "Escolha o estado antes"
                          : cidadesLoading
                            ? "Carregando cidades..."
                            : "Selecione a cidade"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {cidades.map(c => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="limite">Quantas oficinas buscar</Label>
              <Input
                id="limite"
                type="number"
                min={1}
                max={300}
                required
                value={form.limite}
                onChange={e =>
                  setForm({
                    ...form,
                    limite: Math.max(
                      1,
                      Math.min(300, Number(e.target.value) || 1)
                    ),
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Máximo de 300 por cidade. A busca para ao atingir esse número.
              </p>
            </div>

            <div className="md:col-span-4">
              <Button type="submit" disabled={!podeIniciar}>
                {iniciar.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Iniciar importação
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <h2 className="font-semibold mb-3">Importações</h2>
      {jobs.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : !jobs.data || jobs.data.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">
          Nenhuma importação ainda.
        </p>
      ) : (
        <div className="space-y-3">
          {jobs.data.map(job => (
            <Card key={job.id}>
              <CardContent className="py-4 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[180px]">
                  <p className="font-medium">
                    {job.termo} — {job.cidade}/{job.estado}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Página {job.pagina} · {job.importados}/{job.limite}{" "}
                    importadas · {job.duplicados} já existiam ·{" "}
                    {job.encontrados} vistas
                  </p>
                  {job.erro && (
                    <p className="text-xs text-red-600 mt-1">{job.erro}</p>
                  )}
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    STATUS_STYLE[job.status] ?? "bg-gray-100 text-gray-600"
                  }`}
                >
                  {job.status}
                </span>
                {(job.status === "pendente" || job.status === "rodando") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => cancelar.mutate({ id: job.id })}
                    disabled={cancelar.isPending}
                  >
                    <X className="w-3.5 h-3.5 mr-1" />
                    Cancelar
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
