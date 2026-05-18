import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Star, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminAvaliacoes() {
  const [statusFilter, setStatusFilter] = useState("pendente");
  const { data: avaliacoes, isLoading, refetch } = trpc.avaliacoes.listarAdmin.useQuery({ status: statusFilter || undefined });

  const moderar = trpc.avaliacoes.moderar.useMutation({
    onSuccess: () => { toast.success("Avaliação moderada"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Avaliações</h1>
          <p className="text-muted-foreground">Modere as avaliações dos clientes</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pendente">Pendentes</SelectItem>
            <SelectItem value="aprovada">Aprovadas</SelectItem>
            <SelectItem value="rejeitada">Rejeitadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : !avaliacoes || avaliacoes.length === 0 ? (
        <div className="text-center py-16">
          <Star className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-2">Nenhuma avaliação {statusFilter}</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {avaliacoes.map(av => (
            <Card key={av.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium text-sm">{av.nomeCliente || "Cliente Anônimo"}</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star key={n} className={`w-3.5 h-3.5 ${n <= av.notaGeral ? "text-amber-500 fill-amber-500" : "text-gray-300"}`} />
                        ))}
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">{av.status}</Badge>
                    </div>
                    {av.comentario && <p className="text-sm text-muted-foreground mb-1">{av.comentario}</p>}
                    <p className="text-xs text-muted-foreground">
                      Oficina #{av.oficinaId} • {av.tipoServico || "—"} • {new Date(av.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  {av.status === "pendente" && (
                    <div className="flex gap-1 ml-4">
                      <Button
                        size="sm" variant="ghost"
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => moderar.mutate({ id: av.id, status: "aprovada" })}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => moderar.mutate({ id: av.id, status: "rejeitada" })}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
