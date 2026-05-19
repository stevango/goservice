import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Search, Eye, CheckCircle2, XCircle, Clock, Ban } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ESTADOS_BRASIL, SEGMENTOS, segmentoLabel } from "@shared/types";

export default function AdminOficinas() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [estado, setEstado] = useState("");
  const [segmento, setSegmento] = useState("");

  const { data, isLoading, refetch } = trpc.oficinas.listarAdmin.useQuery({
    search: search || undefined,
    status: status || undefined,
    estado: estado || undefined,
    segmento: segmento || undefined,
    limit: 100,
  });

  const alterarStatus = trpc.oficinas.alterarStatus.useMutation({
    onSuccess: () => { toast.success("Status alterado"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const statusBadge = (s: string) => {
    switch (s) {
      case "ativa": return <Badge className="bg-green-100 text-green-700 border-green-200 border">Ativa</Badge>;
      case "pendente": return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 border">Pendente</Badge>;
      case "bloqueada": return <Badge className="bg-red-100 text-red-700 border-red-200 border">Bloqueada</Badge>;
      case "rejeitada": return <Badge className="bg-gray-100 text-gray-600 border-gray-200 border">Rejeitada</Badge>;
      default: return <Badge variant="outline">{s}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Oficinas</h1>
          <p className="text-muted-foreground">Gerencie a rede de oficinas credenciadas</p>
        </div>
        <p className="text-sm text-muted-foreground">{data?.total || 0} oficinas no total</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="ativa">Ativa</SelectItem>
            <SelectItem value="bloqueada">Bloqueada</SelectItem>
            <SelectItem value="rejeitada">Rejeitada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={estado} onValueChange={setEstado}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            {ESTADOS_BRASIL.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={segmento} onValueChange={setSegmento}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Segmento" /></SelectTrigger>
          <SelectContent>
            {SEGMENTOS.map(g => (
              <SelectGroup key={g.grupo}>
                <SelectLabel>{g.grupo}</SelectLabel>
                {g.itens.map(i => (
                  <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
        {(status || estado || segmento) && (
          <Button variant="ghost" size="sm" onClick={() => { setStatus(""); setEstado(""); setSegmento(""); }}>Limpar</Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Prestador</TableHead>
              <TableHead>Segmento</TableHead>
              <TableHead>Cidade/UF</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Google</TableHead>
              <TableHead>Aval. Google</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : data?.oficinas.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum prestador encontrado</TableCell></TableRow>
            ) : (
              data?.oficinas.map(oficina => (
                <TableRow key={oficina.id} className="hover:bg-muted/20">
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{oficina.nomeFantasia}</p>
                      <p className="text-xs text-muted-foreground">{oficina.cnpj}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">{segmentoLabel(oficina.segmento)}</TableCell>
                  <TableCell className="text-sm">{oficina.cidade}/{oficina.estado}</TableCell>
                  <TableCell>
                    <span className="text-xs capitalize font-medium">{oficina.categoria}</span>
                  </TableCell>
                  <TableCell>{statusBadge(oficina.status)}</TableCell>
                  <TableCell className="text-sm font-medium">{Number(oficina.scoreReputacao).toFixed(1)}</TableCell>
                  <TableCell className="text-sm">{oficina.totalAvaliacoes ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/oficinas/${oficina.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      {oficina.status === "pendente" && (
                        <Button
                          variant="ghost" size="sm" className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                          onClick={() => alterarStatus.mutate({ id: oficina.id, status: "ativa" })}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                      )}
                      {oficina.status === "ativa" && (
                        <Button
                          variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          onClick={() => alterarStatus.mutate({ id: oficina.id, status: "bloqueada" })}
                        >
                          <Ban className="w-4 h-4" />
                        </Button>
                      )}
                      {oficina.status === "bloqueada" && (
                        <Button
                          variant="ghost" size="sm" className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                          onClick={() => alterarStatus.mutate({ id: oficina.id, status: "ativa" })}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
