import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import BuscarOficinas from "./pages/BuscarOficinas";
import CadastroOficina from "./pages/CadastroOficina";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOficinas from "./pages/admin/AdminOficinas";
import AdminOficinaDetalhe from "./pages/admin/AdminOficinaDetalhe";
import AdminAvaliacoes from "./pages/admin/AdminAvaliacoes";
import AdminB2B from "./pages/admin/AdminB2B";
import AdminNotificacoes from "./pages/admin/AdminNotificacoes";
import AreaB2B from "./pages/AreaB2B";
import OficinaDetalhe from "./pages/OficinaDetalhe";
import MinhaOficina from "./pages/MinhaOficina";
import AdminAtendimento from "./pages/admin/AdminAtendimento";
import AdminImportar from "./pages/admin/AdminImportar";
import AdminEmConstrucao from "./pages/admin/AdminEmConstrucao";
import PaginaParceiro from "./pages/PaginaParceiro";
import Login from "./pages/Login";
import { adminEmBreveItens } from "@/lib/adminNav";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/buscar" component={BuscarOficinas} />
      <Route path="/oficina/:id" component={OficinaDetalhe} />
      <Route path="/parceiro/:token" component={PaginaParceiro} />
      <Route path="/cadastro" component={CadastroOficina} />
      <Route path="/minha-oficina" component={MinhaOficina} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/oficinas" component={AdminOficinas} />
      <Route path="/admin/oficinas/:id" component={AdminOficinaDetalhe} />
      <Route path="/admin/avaliacoes" component={AdminAvaliacoes} />
      <Route path="/admin/b2b" component={AdminB2B} />
      <Route path="/admin/notificacoes" component={AdminNotificacoes} />
      <Route path="/admin/atendimento" component={AdminAtendimento} />
      <Route path="/admin/importar" component={AdminImportar} />
      {/* Rotas das áreas em construção são geradas a partir de adminNav,
          mantendo menu e rotas em sincronia. */}
      {adminEmBreveItens().map(item => (
        <Route key={item.href} path={item.href}>
          <AdminEmConstrucao
            titulo={`${item.sectionTitle} · ${item.label}`}
            descricao={item.descricao ?? "Área planejada — em construção."}
          />
        </Route>
      ))}
      <Route path="/b2b" component={AreaB2B} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
