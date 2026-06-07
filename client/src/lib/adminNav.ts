import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Headphones,
  Users,
  Store,
  Download,
  Star,
  Bell,
  Activity,
  FileSearch,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  Receipt,
  FileText,
  UserCog,
  Shield,
  ClipboardList,
  UserPlus,
  Package,
  Boxes,
  BarChart3,
  ArrowLeftRight,
  TrendingUp,
  LineChart,
  Calculator,
  FileBarChart,
  DollarSign,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  // Item ainda não implementado — rota é gerada automaticamente para a
  // tela AdminEmConstrucao usando descricao/titulo.
  emBreve?: boolean;
  // Texto curto exibido na página em construção.
  descricao?: string;
};

export type AdminNavSection = {
  id: string;
  titulo: string;
  icon: LucideIcon;
  itens: AdminNavItem[];
};

// Fonte única do menu administrativo. Alimenta a sidebar (AdminLayout)
// e gera as rotas dos itens em breve (App.tsx), garantindo que ambos
// fiquem em sincronia. Para ativar uma área futura, troque emBreve para
// false e crie a tela real apontando para o mesmo href.
export const ADMIN_NAV: AdminNavSection[] = [
  {
    id: "conversao",
    titulo: "Conversão",
    icon: TrendingUp,
    itens: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/atendimento", label: "Atendimento", icon: Headphones },
    ],
  },
  {
    id: "clientes",
    titulo: "Clientes",
    icon: Users,
    itens: [{ href: "/admin/b2b", label: "Clientes B2B", icon: Users }],
  },
  {
    id: "rede",
    titulo: "Rede",
    icon: Store,
    itens: [
      { href: "/admin/oficinas", label: "Prestadores", icon: Store },
      { href: "/admin/importar", label: "Importar", icon: Download },
      { href: "/admin/avaliacoes", label: "Avaliações", icon: Star },
    ],
  },
  {
    id: "monitoramento",
    titulo: "Monitoramento",
    icon: Activity,
    itens: [
      { href: "/admin/notificacoes", label: "Notificações", icon: Bell },
      {
        href: "/admin/monitoramento/operacao",
        label: "Operação",
        icon: Activity,
        emBreve: true,
        descricao:
          "Saúde dos jobs em background, SLAs, fila de eventos e dashboards de operação em tempo real.",
      },
      {
        href: "/admin/monitoramento/logs",
        label: "Logs do sistema",
        icon: FileSearch,
        emBreve: true,
        descricao:
          "Auditoria de ações, logs de erro e busca por requisições para investigação de incidentes.",
      },
    ],
  },
  {
    id: "financeiro",
    titulo: "Financeiro",
    icon: DollarSign,
    itens: [
      {
        href: "/admin/financeiro/contas-pagar",
        label: "Contas a pagar",
        icon: ArrowUpFromLine,
        emBreve: true,
        descricao:
          "Compromissos a pagar, agenda de vencimentos e aprovação de pagamentos.",
      },
      {
        href: "/admin/financeiro/contas-receber",
        label: "Contas a receber",
        icon: ArrowDownToLine,
        emBreve: true,
        descricao:
          "Recebíveis de clientes B2B, cobrança automatizada e inadimplência.",
      },
      {
        href: "/admin/financeiro/repasses",
        label: "Repasses",
        icon: Wallet,
        emBreve: true,
        descricao:
          "Repasses aos prestadores da rede por acionamento, com extrato e comprovantes.",
      },
      {
        href: "/admin/financeiro/conciliacao",
        label: "Conciliação",
        icon: Receipt,
        emBreve: true,
        descricao:
          "Conciliação bancária e de meios de pagamento com lançamentos do sistema.",
      },
      {
        href: "/admin/financeiro/relatorios",
        label: "Relatórios",
        icon: FileText,
        emBreve: true,
        descricao: "DRE, fluxo de caixa e relatórios financeiros gerenciais.",
      },
    ],
  },
  {
    id: "rh",
    titulo: "RH",
    icon: UserCog,
    itens: [
      {
        href: "/admin/rh/equipe",
        label: "Equipe interna",
        icon: Users,
        emBreve: true,
        descricao: "Colaboradores da GO SERVICE, cargos e dados cadastrais.",
      },
      {
        href: "/admin/rh/cargos",
        label: "Cargos & permissões",
        icon: Shield,
        emBreve: true,
        descricao:
          "Definição de papéis e permissões granulares por área e funcionalidade.",
      },
      {
        href: "/admin/rh/folha",
        label: "Folha de pagamento",
        icon: ClipboardList,
        emBreve: true,
        descricao:
          "Folha mensal, encargos, holerites e integração com financeiro.",
      },
      {
        href: "/admin/rh/recrutamento",
        label: "Recrutamento",
        icon: UserPlus,
        emBreve: true,
        descricao: "Vagas abertas, pipeline de candidatos e onboarding.",
      },
    ],
  },
  {
    id: "estoque",
    titulo: "Estoque",
    icon: Package,
    itens: [
      {
        href: "/admin/estoque/catalogo",
        label: "Catálogo de peças",
        icon: Boxes,
        emBreve: true,
        descricao:
          "Cadastro de peças, insumos e SKUs usados pela rede de prestadores.",
      },
      {
        href: "/admin/estoque/posicao",
        label: "Posição de estoque",
        icon: BarChart3,
        emBreve: true,
        descricao: "Saldo por prestador e por unidade, com alertas de ruptura.",
      },
      {
        href: "/admin/estoque/movimentacoes",
        label: "Movimentações",
        icon: ArrowLeftRight,
        emBreve: true,
        descricao: "Entradas, saídas e transferências entre prestadores.",
      },
      {
        href: "/admin/estoque/inventario",
        label: "Inventário",
        icon: ClipboardList,
        emBreve: true,
        descricao: "Contagens cíclicas e ajustes de inventário.",
      },
    ],
  },
  {
    id: "investidor",
    titulo: "Investidor",
    icon: LineChart,
    itens: [
      {
        href: "/admin/investidor/kpis",
        label: "KPIs do negócio",
        icon: TrendingUp,
      },
      {
        href: "/admin/investidor/growth",
        label: "Growth & funil",
        icon: LineChart,
        emBreve: true,
        descricao:
          "Aquisição, ativação, retenção, receita e referência (AARRR).",
      },
      {
        href: "/admin/investidor/unit-economics",
        label: "Unit economics",
        icon: Calculator,
        emBreve: true,
        descricao: "CAC, LTV, margem de contribuição e payback por segmento.",
      },
      {
        href: "/admin/investidor/relatorios",
        label: "Relatórios mensais",
        icon: FileBarChart,
        emBreve: true,
        descricao:
          "Pacotes mensais para investidores e board com narrativa e métricas.",
      },
    ],
  },
];

// Lista plana de itens em breve — usada para gerar rotas automáticas.
export function adminEmBreveItens(): Array<
  AdminNavItem & { sectionTitle: string }
> {
  const out: Array<AdminNavItem & { sectionTitle: string }> = [];
  for (const section of ADMIN_NAV) {
    for (const item of section.itens) {
      if (item.emBreve) out.push({ ...item, sectionTitle: section.titulo });
    }
  }
  return out;
}

// Encontra a seção que contém uma URL — usada para auto-expandir o grupo
// no menu quando a rota muda.
export function adminSecaoDaRota(pathname: string): string | null {
  for (const section of ADMIN_NAV) {
    if (section.itens.some(i => i.href === pathname)) return section.id;
  }
  return null;
}

// Encontra a seção + item para uma URL. Usada pelos breadcrumbs.
export function adminLocalizar(
  pathname: string
): { section: AdminNavSection; item: AdminNavItem } | null {
  for (const section of ADMIN_NAV) {
    const item = section.itens.find(i => i.href === pathname);
    if (item) return { section, item };
  }
  return null;
}
