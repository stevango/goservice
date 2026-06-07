import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Bell, Check, Store, Star, AlertCircle, FileText } from "lucide-react";
import { toast } from "sonner";

export default function AdminNotificacoes() {
  const { data: notificacoes, isLoading, refetch } = trpc.notificacoes.listar.useQuery({ limit: 50 });
  const utils = trpc.useUtils();

  const marcarLida = trpc.notificacoes.marcarLida.useMutation({
    onSuccess: () => { refetch(); utils.notificacoes.contarNaoLidas.invalidate(); },
  });

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case "novo_cadastro": return <Store className="w-5 h-5 text-blue-500" />;
      case "nova_avaliacao": return <Star className="w-5 h-5 text-amber-500" />;
      case "status_alterado": return <AlertCircle className="w-5 h-5 text-green-500" />;
      case "documento_enviado": return <FileText className="w-5 h-5 text-purple-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Notificações</h1>
        <p className="text-muted-foreground">Acompanhe as atividades da plataforma</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : !notificacoes || notificacoes.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-2">Nenhuma notificação</h3>
          <p className="text-sm text-muted-foreground">Quando houver atividade, as notificações aparecerão aqui.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notificacoes.map(n => (
            <Card key={n.id} className={`transition-colors ${!n.lida ? "border-primary/20 bg-primary/[0.02]" : ""}`}>
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5">{getIcon(n.tipo)}</div>
                  <div className="flex-1">
                    <p className={`text-sm ${!n.lida ? "font-semibold" : "font-medium"}`}>{n.titulo}</p>
                    {n.mensagem && <p className="text-xs text-muted-foreground mt-0.5">{n.mensagem}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(n.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {!n.lida && (
                    <Button
                      variant="ghost" size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                      onClick={() => marcarLida.mutate({ id: n.id })}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
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
