import AdminLayout from "@/components/AdminLayout";
import { Construction } from "lucide-react";

// Placeholder para áreas planejadas que ainda não têm funcionalidade
// implementada. Mantém o esqueleto de navegação consistente e deixa
// óbvio onde a próxima rodada de trabalho deve aterrissar.
export default function AdminEmConstrucao({
  titulo,
  descricao,
}: {
  titulo: string;
  descricao: string;
}) {
  return (
    <AdminLayout>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight">{titulo}</h1>
        <p className="text-muted-foreground">{descricao}</p>

        <div className="mt-8 rounded-2xl border border-dashed bg-card p-10 text-center">
          <Construction className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <h2 className="mt-3 text-base font-semibold">Em construção</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Esta área está reservada no menu e pronta para receber as telas.
            Vamos construí-la na próxima rodada.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
