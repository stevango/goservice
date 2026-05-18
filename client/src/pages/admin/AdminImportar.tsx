import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Download, Loader2, X } from "lucide-react";
import { useState } from "react";
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
    cidade: "",
    estado: "",
  });
  const utils = trpc.useUtils();

  const jobs = trpc.importacao.listar.useQuery(undefined, {
    refetchInterval: 15_000,
  });

  const iniciar = trpc.importacao.iniciar.useMutation({
    onSuccess: () => {
      toast.success(
        "Importação iniciada! Ela roda devagar (1 lote por minuto) em segundo plano."
      );
      setForm({ ...form, cidade: "", estado: "" });
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
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                required
                value={form.cidade}
                onChange={e => setForm({ ...form, cidade: e.target.value })}
                placeholder="Divinópolis"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">UF</Label>
              <Input
                id="estado"
                required
                maxLength={2}
                value={form.estado}
                onChange={e =>
                  setForm({ ...form, estado: e.target.value.toUpperCase() })
                }
                placeholder="MG"
              />
            </div>
            <div className="md:col-span-4">
              <Button type="submit" disabled={iniciar.isPending}>
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
                    Página {job.pagina} · {job.importados} importadas ·{" "}
                    {job.duplicados} já existiam · {job.encontrados} vistas
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
