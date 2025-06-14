
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  BarChart3,
  Search,
  Filter,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { VoCAnalysis } from '@/lib/types';

export default function HistoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [analyses, setAnalyses] = useState<VoCAnalysis[]>([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState<VoCAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [analysisToDelete, setAnalysisToDelete] = useState<VoCAnalysis | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = analyses.filter(analysis =>
        analysis.company.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAnalyses(filtered);
    } else {
      setFilteredAnalyses(analyses);
    }
  }, [searchTerm, analyses]);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/history');
      if (!response.ok) {
        throw new Error('Erro ao carregar histórico');
      }
      const data = await response.json();
      setAnalyses(data);
      setFilteredAnalyses(data);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast({
        title: "Erro ao carregar histórico",
        description: "Não foi possível carregar o histórico de análises.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSentimentIcon = (score: number) => {
    if (score > 0.6) return <TrendingUp className="w-5 h-5 text-green-600" />;
    if (score < 0.4) return <TrendingDown className="w-5 h-5 text-red-600" />;
    return <Minus className="w-5 h-5 text-gray-600" />;
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.6) return 'text-green-600';
    if (score < 0.4) return 'text-red-600';
    return 'text-gray-600';
  };

  const getSentimentLabel = (score: number) => {
    if (score > 0.6) return 'Positivo';
    if (score < 0.4) return 'Negativo';
    return 'Neutro';
  };

  const handleDeleteClick = (e: React.MouseEvent, analysis: VoCAnalysis) => {
    e.stopPropagation(); // Evitar que o clique abra a análise
    setAnalysisToDelete(analysis);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!analysisToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/analysis/${analysisToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir análise');
      }

      // Remover a análise da lista local
      const updatedAnalyses = analyses.filter(a => a.id !== analysisToDelete.id);
      setAnalyses(updatedAnalyses);
      setFilteredAnalyses(updatedAnalyses.filter(analysis =>
        analysis.company.name.toLowerCase().includes(searchTerm.toLowerCase())
      ));

      toast({
        title: "Análise excluída",
        description: `A análise de ${analysisToDelete.company.name} foi excluída com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao excluir análise:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a análise. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setAnalysisToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">Carregando histórico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Histórico de Análises
                </h1>
                <p className="text-sm text-gray-500">
                  {analyses.length} análise{analyses.length !== 1 ? 's' : ''} realizadas
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Filtros */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-blue-600" />
                <span>Filtros</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por empresa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Lista de Análises */}
        {filteredAnalyses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center py-12"
          >
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {searchTerm ? 'Nenhuma análise encontrada' : 'Nenhuma análise realizada'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm 
                ? 'Tente buscar por outro termo ou limpe o filtro.'
                : 'Comece criando sua primeira análise Voz do Cliente.'
              }
            </p>
            <Button
              onClick={() => router.push('/')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {searchTerm ? 'Limpar Filtros' : 'Criar Primeira Análise'}
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAnalyses.map((analysis, index) => (
              <motion.div
                key={analysis.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group"
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 border-0 bg-white/90 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle 
                        className="text-lg truncate cursor-pointer flex-1"
                        onClick={() => router.push(`/analysis/${analysis.id}`)}
                      >
                        {analysis.company.name}
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        {getSentimentIcon(analysis.sentimentScore)}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-8 w-8"
                          onClick={(e) => handleDeleteClick(e, analysis)}
                          title="Excluir análise"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription 
                      className="flex items-center space-x-2 cursor-pointer"
                      onClick={() => router.push(`/analysis/${analysis.id}`)}
                    >
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(analysis.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent 
                    className="cursor-pointer"
                    onClick={() => router.push(`/analysis/${analysis.id}`)}
                  >
                    <div className="space-y-4">
                      {/* Métricas principais */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {analysis.totalTweets}
                          </div>
                          <div className="text-xs text-gray-600">Menções</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${getSentimentColor(analysis.sentimentScore)}`}>
                            {(analysis.sentimentScore * 100).toFixed(0)}%
                          </div>
                          <div className="text-xs text-gray-600">Sentimento</div>
                        </div>
                      </div>

                      {/* Distribuição de sentimentos */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600">Positivos</span>
                          <span>{analysis.positiveTweets}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-red-600">Negativos</span>
                          <span>{analysis.negativeTweets}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Neutros</span>
                          <span>{analysis.neutralTweets}</span>
                        </div>
                      </div>

                      {/* Status do sentimento */}
                      <div className="text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          analysis.sentimentScore > 0.6 
                            ? 'bg-green-100 text-green-800'
                            : analysis.sentimentScore < 0.4
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {getSentimentLabel(analysis.sentimentScore)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span>Confirmar Exclusão</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a análise de{' '}
              <span className="font-semibold text-gray-900">
                {analysisToDelete?.company.name}
              </span>
              ? Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Excluindo...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir</span>
                </div>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
