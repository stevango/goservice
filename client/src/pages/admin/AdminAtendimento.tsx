import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Phone, MapPin, FileText, Upload, Image as ImageIcon } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

export default function AdminAtendimento() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedOficina, setSelectedOficina] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Redirecionar se não for admin
  if (user?.role !== 'admin') {
    navigate('/');
    return null;
  }

  // Buscar todas as oficinas (leads)
  const { data: result, isLoading } = trpc.oficinas.listarAdmin.useQuery(undefined, {
    enabled: user?.role === 'admin',
  });

  const oficinas = result?.oficinas || [];

  // Filtrar por termo de busca
  const filteredOficinas = oficinas.filter((o: any) =>
    o.nomeFantasia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.razaoSocial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.cidade?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const oficinaSelecionada = oficinas?.find(o => o.id === selectedOficina);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Painel de Atendimento</h1>
        <p className="text-gray-600 mb-6">Gerenciar leads de oficinas e enviar convites</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Oficinas */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4">Leads de Oficinas</h2>
              
              <Input
                placeholder="Buscar por nome, cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-4"
              />

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin" />
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filteredOficinas.map((oficina: any) => (
                    <button
                      key={oficina.id}
                      onClick={() => setSelectedOficina(oficina.id)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition ${
                        selectedOficina === oficina.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-sm">{oficina.nomeFantasia}</div>
                      <div className="text-xs text-gray-600">{oficina.cidade}/{oficina.estado}</div>
                      <div className="flex gap-2 mt-1">
                        {oficina.categoria === 'premium' && (
                          <Badge variant="default" className="text-xs">Premium</Badge>
                        )}
                        {oficina.categoria === 'concessionaria' && (
                          <Badge variant="secondary" className="text-xs">Concessionária</Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Detalhes da Oficina */}
          <div className="lg:col-span-2">
            {oficinaSelecionada ? (
              <div className="space-y-4">
                {/* Header */}
                <Card className="p-6 border-2 border-blue-200 bg-blue-50">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{oficinaSelecionada.nomeFantasia}</h2>
                      <p className="text-gray-600">{oficinaSelecionada.razaoSocial}</p>
                    </div>
                    <Badge className="text-lg px-3 py-1">
                      {oficinaSelecionada.categoria === 'premium' ? '⭐ Premium' : 'Padrão'}
                    </Badge>
                  </div>

                  {/* Score de Reputação */}
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-yellow-500">
                      {oficinaSelecionada.scoreReputacao || '-'}
                    </span>
                    <span className="text-gray-600">
                      ({oficinaSelecionada.totalAvaliacoes || 0} avaliações)
                    </span>
                  </div>
                </Card>

                {/* Dados Cadastrais */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Dados Cadastrais
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">CNPJ</label>
                      <p className="font-medium">{oficinaSelecionada.cnpj || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Razão Social</label>
                      <p className="font-medium">{oficinaSelecionada.razaoSocial || '-'}</p>
                    </div>
                  </div>
                </Card>

                {/* Contato */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Contato
                  </h3>
                  <div className="space-y-3">
                    {oficinaSelecionada.telefone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <a href={`tel:${oficinaSelecionada.telefone}`} className="text-blue-600 hover:underline">
                          {oficinaSelecionada.telefone}
                        </a>
                      </div>
                    )}
                    {oficinaSelecionada.whatsapp && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-green-400" />
                        <a href={`https://wa.me/${oficinaSelecionada.whatsapp.replace(/\D/g, '')}`} 
                           target="_blank" rel="noopener noreferrer" 
                           className="text-green-600 hover:underline">
                          WhatsApp: {oficinaSelecionada.whatsapp}
                        </a>
                      </div>
                    )}
                    {oficinaSelecionada.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <a href={`mailto:${oficinaSelecionada.email}`} className="text-blue-600 hover:underline">
                          {oficinaSelecionada.email}
                        </a>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Endereço */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Endereço
                  </h3>
                  <div className="space-y-2">
                    <p className="font-medium">
                      {oficinaSelecionada.logradouro}, {oficinaSelecionada.numero}
                    </p>
                    <p className="text-gray-600">
                      {oficinaSelecionada.bairro} - {oficinaSelecionada.cidade}/{oficinaSelecionada.estado}
                    </p>
                    <p className="text-gray-600">CEP: {oficinaSelecionada.cep}</p>
                  </div>
                </Card>

                {/* Serviços e Veículos */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-6">
                    <h3 className="font-semibold mb-3">Serviços Oferecidos</h3>
                    <div className="flex flex-wrap gap-2">
                      {oficinaSelecionada.tiposServicos && oficinaSelecionada.tiposServicos.length > 0 ? (
                        (oficinaSelecionada.tiposServicos as string[]).map((s: string) => (
                          <Badge key={s} variant="secondary">{s}</Badge>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">Não informado</p>
                      )}
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="font-semibold mb-3">Veículos Atendidos</h3>
                    <div className="flex flex-wrap gap-2">
                      {oficinaSelecionada.tiposVeiculos && oficinaSelecionada.tiposVeiculos.length > 0 ? (
                        (oficinaSelecionada.tiposVeiculos as string[]).map((v: string) => (
                          <Badge key={v} variant="outline">{v}</Badge>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">Não informado</p>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Informações Comerciais */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Informações Comerciais</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Franquia</label>
                      <p className="font-medium">
                        {oficinaSelecionada.franquiaAntes ? 'Antes do serviço' : 
                         oficinaSelecionada.franquiaDepois ? 'Depois do serviço' : 
                         'Não informado'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Parcelamento</label>
                      <p className="font-medium">
                        {oficinaSelecionada.parcelamentoFranquia ? `Até ${oficinaSelecionada.parcelamentoFranquia}x` : 'Não informado'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Fornecimento de Peças</label>
                      <p className="font-medium">{oficinaSelecionada.fornecePecas || 'Não informado'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Garantia</label>
                      <p className="font-medium">{oficinaSelecionada.garantiaServico || 'Não informado'}</p>
                    </div>
                  </div>
                </Card>

                {/* Galeria de Fotos */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Galeria de Fotos
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Clique para fazer upload de fotos da fachada</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-4">Você pode fazer upload de fotos quando entrar em contato com a oficina</p>
                </Card>

                {/* Observações */}
                {oficinaSelecionada.observacoesAdmin && (
                  <Card className="p-6 bg-yellow-50 border-yellow-200">
                    <h3 className="font-semibold mb-2">Observações Internas</h3>
                    <p className="text-gray-700">{oficinaSelecionada.observacoesAdmin}</p>
                  </Card>
                )}

                {/* Ações */}
                <div className="flex gap-3">
                  <Button 
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      const subject = `Convite para participar da Rede de Oficinas Brasil`;
                      const body = `Olá ${oficinaSelecionada.nomeFantasia},\n\nVocê foi pré-selecionada para participar da Rede de Oficinas Brasil!\n\nNosso objetivo é conectar seguradoras, associações e clientes finais às melhores oficinas do país.\n\nPara saber mais e se cadastrar, acesse: [LINK DO CADASTRO]\n\nAtenciosamente,\nRede de Oficinas Brasil`;
                      window.location.href = `mailto:${oficinaSelecionada.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                    }}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar Email de Convite
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      if (oficinaSelecionada.whatsapp) {
                        const message = `Olá! Você foi pré-selecionada para participar da Rede de Oficinas Brasil. Clique aqui para saber mais: [LINK]`;
                        window.open(`https://wa.me/${oficinaSelecionada.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                      } else {
                        toast.error('WhatsApp não informado para esta oficina');
                      }
                    }}
                  >
                    Enviar WhatsApp
                  </Button>
                </div>
              </div>
            ) : (
              <Card className="p-12 text-center">
                <p className="text-gray-500">Selecione uma oficina para ver os detalhes</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
