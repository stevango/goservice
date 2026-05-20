import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Search, MapPin, Shield, Star, Building2, Wrench, LifeBuoy, Home as HomeIcon, PawPrint, Sun, Car, ArrowRight, CheckCircle2, Headphones } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { SEGMENTOS } from "@shared/types";

const GRUPO_ICON: Record<string, typeof Wrench> = {
  "Automotivo": Wrench,
  "Assistência Veicular 24h": LifeBuoy,
  "Apoio ao Motorista": Headphones,
  "Assistência Residencial": HomeIcon,
  "Pet": PawPrint,
  "Energia Solar": Sun,
  "Veículos — Lojas e Agências": Car,
};

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/buscar");
    }
  };

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/30" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent/20 rounded-full blur-3xl" />
        
        <div className="container relative py-24 md:py-32 lg:py-40">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
              <Shield className="w-3.5 h-3.5" />
              Rede credenciada para seguradoras e associações
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1] mb-6">
              Encontre o serviço ideal{" "}
              <span className="text-primary">mais próximo</span> de você
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
              A maior rede multisegmento de prestadores credenciados do Brasil —
              oficinas, assistência veicular 24h, residencial, pet, energia solar e mais.
              Classificados por segmento, cidade e reputação, para seguradoras, associações
              e clientes finais.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl">
              <div className="relative flex-1">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
                <Input
                  placeholder="Digite CEP, cidade ou estado..."
                  className="pl-10 h-12 text-base rounded-xl border-border/60 shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-6 rounded-xl shadow-md">
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border/50 bg-muted/20">
        <div className="container py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "5.000+", label: "Prestadores Credenciados" },
              { value: "27", label: "Estados Cobertos" },
              { value: "4.8", label: "Avaliação Média" },
              { value: "150+", label: "Seguradoras Parceiras" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Por que usar a GO SERVICE?
            </h2>
            <p className="text-muted-foreground text-lg">
              Resolvemos o gargalo logístico entre seguradoras e prestadores no interior do Brasil — em todos os segmentos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: MapPin,
                title: "Geolocalização Inteligente",
                description: "Encontre o prestador credenciado mais próximo do atendimento, evitando deslocamentos desnecessários.",
              },
              {
                icon: Shield,
                title: "Organizado por Segmento",
                description: "Prestadores em 7 grupos: automotivo, assistência 24h, apoio ao motorista, residencial, pet, energia solar e lojas de veículos.",
              },
              {
                icon: Star,
                title: "Reputação Verificada",
                description: "Score baseado em avaliações reais de clientes pós-atendimento, garantindo qualidade e confiança.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl border border-border/60 bg-card hover:shadow-lg hover:border-primary/20 transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Groups */}
      <section className="py-16 bg-muted/20 border-y border-border/50">
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-3">
            Tudo o que você precisa, num lugar só
          </h2>
          <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
            Sete grupos de serviços com prestadores avaliados e geolocalizados.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {SEGMENTOS.map(g => {
              const Icon = GRUPO_ICON[g.grupo] ?? Wrench;
              return (
                <Link
                  key={g.grupo}
                  href={`/buscar?grupo=${encodeURIComponent(g.grupo)}`}
                  className="flex flex-col items-center text-center p-5 rounded-xl border border-border/60 bg-card hover:shadow-md hover:border-primary/20 transition-all"
                >
                  <Icon className="w-8 h-8 text-primary mb-3" />
                  <span className="font-medium text-sm">{g.grupo}</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {g.itens.length} segmento{g.itens.length > 1 ? "s" : ""}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* For Businesses */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
                Para Seguradoras e Associações
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
                Acesse a rede completa para seus segurados
              </h2>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                Ofereça uma logística melhor para seus clientes. Direcione cada
                atendimento para o prestador credenciado mais próximo, com
                informações completas sobre estrutura, serviços e reputação.
              </p>
              <div className="space-y-3 mb-8">
                {[
                  "Filtros avançados por região, segmento e especialidade",
                  "Dados completos: franquia, parcelamento, peças (quando se aplica)",
                  "Exportação de dados para integração com seus sistemas",
                  "Score de reputação verificado (Google + avaliações internas)",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
              <Button asChild size="lg" className="rounded-xl">
                <Link href="/b2b">
                  Acessar Área B2B
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-primary/10 to-accent/20 border border-border/60 flex items-center justify-center">
                <div className="text-center p-8">
                  <Building2 className="w-16 h-16 text-primary/40 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Painel B2B com acesso completo à rede</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA prestadores */}
      <section className="py-16 bg-primary text-white">
        <div className="container text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Tem um negócio? Faça parte da GO SERVICE.
          </h2>
          <p className="text-white/80 max-w-lg mx-auto mb-8">
            Cadastre seu negócio gratuitamente e receba clientes de seguradoras e associações de todo o Brasil.
          </p>
          <Button asChild size="lg" variant="secondary" className="rounded-xl">
            <Link href="/cadastro">
              Cadastrar meu Negócio
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
