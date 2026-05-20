import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Search, MapPin, Star, Phone, Filter, X, Building2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  TIPOS_VEICULOS,
  TIPOS_SERVICOS,
  ESTADOS_BRASIL,
  SEGMENTOS,
  SEGMENTO_INFO,
  segmentoLabel,
} from "@shared/types";

export default function BuscarOficinas() {
  const initial = useMemo(() => {
    const sp = new URLSearchParams(window.location.search);
    const seg = sp.get("segmento") ?? "";
    return {
      q: sp.get("q") ?? "",
      grupo: sp.get("grupo") ?? (seg ? SEGMENTO_INFO[seg]?.grupo ?? "" : ""),
      segmento: seg && SEGMENTO_INFO[seg] ? seg : "",
      estado: (sp.get("estado") ?? "").toUpperCase().slice(0, 2),
    };
  }, []);

  const [search, setSearch] = useState(initial.q);
  const [grupo, setGrupo] = useState(initial.grupo);
  const [segmento, setSegmento] = useState(initial.segmento);
  const [estado, setEstado] = useState(initial.estado);
  const [tipoVeiculo, setTipoVeiculo] = useState("");
  const [tipoServico, setTipoServico] = useState("");
  const [showFilters, setShowFilters] = useState(
    !!(initial.grupo || initial.segmento || initial.estado)
  );

  const segmentosDoGrupo =
    SEGMENTOS.find(g => g.grupo === grupo)?.itens ?? [];

  const { data, isLoading } = trpc.oficinas.buscar.useQuery({
    search: search || undefined,
    grupo: !segmento && grupo ? grupo : undefined,
    segmento: segmento || undefined,
    estado: estado || undefined,
    tipoVeiculo: tipoVeiculo || undefined,
    tipoServico: tipoServico || undefined,
    limit: 50,
  });

  const hasFilters = !!(grupo || segmento || estado || tipoVeiculo || tipoServico);
  const clearFilters = () => {
    setGrupo("");
    setSegmento("");
    setEstado("");
    setTipoVeiculo("");
    setTipoServico("");
  };

  const filtroResumo = grupo
    ? segmento
      ? segmentoLabel(segmento)
      : `Grupo: ${grupo}`
    : null;

  return (
    <PublicLayout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
            Buscar Serviços
          </h1>
          <p className="text-muted-foreground">
            Encontre prestadores credenciados em todo o Brasil — em todos os segmentos.
          </p>
          {filtroResumo && (
            <div className="mt-3 inline-flex items-center gap-2 text-sm">
              <Badge variant="secondary">{filtroResumo}</Badge>
              <button
                onClick={() => {
                  setGrupo("");
                  setSegmento("");
                }}
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <X className="w-3 h-3" /> remover
              </button>
            </div>
          )}
        </div>

        {/* Search bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, cidade ou CEP..."
              className="pl-10 h-11 rounded-xl"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            className="h-11 rounded-xl gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {hasFilters && (
              <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                {[grupo, segmento, estado, tipoVeiculo, tipoServico].filter(Boolean).length}
              </span>
            )}
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="p-5 rounded-xl border border-border/60 bg-card mb-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Filtros</h3>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs gap-1">
                  <X className="w-3 h-3" /> Limpar
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Select
                value={grupo}
                onValueChange={v => {
                  setGrupo(v);
                  setSegmento("");
                }}
              >
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="Grupo de Serviço" />
                </SelectTrigger>
                <SelectContent>
                  {SEGMENTOS.map(g => (
                    <SelectItem key={g.grupo} value={g.grupo}>{g.grupo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={segmento}
                onValueChange={setSegmento}
                disabled={!grupo}
              >
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder={grupo ? "Segmento" : "Escolha o grupo antes"} />
                </SelectTrigger>
                <SelectContent>
                  {segmentosDoGrupo.map(it => (
                    <SelectItem key={it.value} value={it.value}>{it.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_BRASIL.map(e => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={tipoVeiculo} onValueChange={setTipoVeiculo}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="Tipo de Veículo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Quando se aplica (automotivo)</SelectLabel>
                    {TIPOS_VEICULOS.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select value={tipoServico} onValueChange={setTipoServico}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="Tipo de Serviço" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_SERVICOS.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Buscando..."
              : `${data?.oficinas.length || 0} prestador(es) encontrado(s)`}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : data?.oficinas.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="font-medium text-lg mb-2">Nenhum prestador encontrado</h3>
            <p className="text-sm text-muted-foreground">
              Tente ajustar os filtros ou buscar por outra região.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.oficinas.map(oficina => (
              <Link key={oficina.id} href={`/oficina/${oficina.id}`}>
                <div className="group p-5 rounded-xl border border-border/60 bg-card hover:shadow-lg hover:border-primary/20 transition-all duration-300 cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                        {oficina.nomeFantasia}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="text-xs truncate">{oficina.cidade}/{oficina.estado}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs flex-shrink-0 bg-primary/5 text-primary border-primary/20">
                      {segmentoLabel(oficina.segmento)}
                    </Badge>
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="font-semibold text-sm">{Number(oficina.scoreReputacao).toFixed(1)}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">({oficina.totalAvaliacoes} avaliações)</span>
                  </div>

                  {/* Services */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {(oficina.tiposServicos as string[] || []).slice(0, 3).map(s => {
                      const label = TIPOS_SERVICOS.find(t => t.value === s)?.label || s;
                      return (
                        <span key={s} className="px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground">
                          {label}
                        </span>
                      );
                    })}
                    {(oficina.tiposServicos as string[] || []).length > 3 && (
                      <span className="px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground">
                        +{(oficina.tiposServicos as string[]).length - 3}
                      </span>
                    )}
                  </div>

                  {/* Contact */}
                  {oficina.telefone && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      <span>{oficina.telefone}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
