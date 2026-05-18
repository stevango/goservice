import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Users, CheckCircle2, Ban } from "lucide-react";
import { toast } from "sonner";

export default function AdminB2B() {
  const { data: clientes, isLoading, refetch } = trpc.b2b.listar.useQuery();
  const alterarStatus = trpc.b2b.alterarStatus.useMutation({
    onSuccess: () => { toast.success("Status atualizado"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Clientes B2B</h1>
        <p className="text-muted-foreground">Seguradoras, associações e cooperativas</p>
      </div>

      {isLoading ? (
        <div className="h-48 rounded-xl bg-muted animate-pulse" />
      ) : !clientes || clientes.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-2">Nenhum cliente B2B cadastrado</h3>
          <p className="text-sm text-muted-foreground">Quando seguradoras se cadastrarem, aparecerão aqui.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Empresa</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.map(cliente => (
                <TableRow key={cliente.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{cliente.nomeFantasia}</p>
                      <p className="text-xs text-muted-foreground">{cliente.razaoSocial}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{cliente.cnpj}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize text-xs">{cliente.tipo}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    <p>{cliente.contatoNome || "—"}</p>
                    <p className="text-xs text-muted-foreground">{cliente.contatoEmail || ""}</p>
                  </TableCell>
                  <TableCell>
                    <Badge className={`border-0 ${
                      cliente.status === "ativo" ? "bg-green-100 text-green-700" :
                      cliente.status === "pendente" ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {cliente.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {cliente.status !== "ativo" && (
                        <Button
                          variant="ghost" size="sm" className="h-8 w-8 p-0 text-green-600"
                          onClick={() => alterarStatus.mutate({ id: cliente.id, status: "ativo" })}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                      )}
                      {cliente.status === "ativo" && (
                        <Button
                          variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600"
                          onClick={() => alterarStatus.mutate({ id: cliente.id, status: "inativo" })}
                        >
                          <Ban className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminLayout>
  );
}
