
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  BarChart3,
  Users,
  MessageCircle,
  Heart,
  Repeat2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { VoCAnalysis } from '@/lib/types';
import SentimentChart from '@/components/sentiment-chart';
import EngagementChart from '@/components/engagement-chart';
import CompetitorChart from '@/components/competitor-chart';
import TweetsList from '@/components/tweets-list';

export default function AnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<VoCAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalysis();
  }, [params.id]);

  const fetchAnalysis = async () => {
    try {
      const response = await fetch(`/api/analysis/${params.id}`);
      if (!response.ok) {
        throw new Error('Análise não encontrada');
      }
      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Erro ao carregar análise:', error);
      toast({
        title: "Erro ao carregar análise",
        description: "Não foi possível carregar os dados da análise.",
        variant: "destructive",
      });
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/analysis/${params.id}/pdf`);
      if (!response.ok) {
        throw new Error('Erro ao gerar PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-voc-${analysis?.company.name}-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download iniciado",
        description: "O relatório está sendo baixado.",
      });
    } catch (error) {
      console.error('Erro no download:', error);
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar o relatório.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Análise Voz do Cliente - ${analysis?.company.name}`,
          text: `Confira a análise de Voz do Cliente da ${analysis?.company.name}`,
          url: url,
        });
      } catch (error) {
        console.error('Erro ao compartilhar:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Link copiado",
          description: "O link da análise foi copiado para a área de transferência.",
        });
      } catch (error) {
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar o link.",
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">Carregando análise...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">Análise não encontrada</p>
          <Button onClick={() => router.push('/')}>
            Voltar ao início
          </Button>
        </div>
      </div>
    );
  }

  const sentimentPercentage = (analysis.sentimentScore * 100).toFixed(1);
  const positivePercentage = ((analysis.positiveTweets / analysis.totalTweets) * 100).toFixed(1);
  const negativePercentage = ((analysis.negativeTweets / analysis.totalTweets) * 100).toFixed(1);
  const neutralPercentage = ((analysis.neutralTweets / analysis.totalTweets) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto max-w-7xl px-4 py-4">
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
                  Análise Voz do Cliente - {analysis.company.name}
                </h1>
                <p className="text-sm text-gray-500">
                  Gerado em {new Date(analysis.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex items-center space-x-2"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Compartilhar</span>
              </Button>
              <Button
                size="sm"
                onClick={handleDownloadPDF}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download PDF</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Resumo Executivo */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                <span>Resumo Executivo</span>
              </CardTitle>
              <CardDescription>
                Principais métricas da análise de Voz do Cliente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {analysis.totalTweets}
                  </div>
                  <div className="text-sm text-gray-600">Total de Menções</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {analysis.positiveTweets}
                  </div>
                  <div className="text-sm text-gray-600">Positivas ({positivePercentage}%)</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 mb-1">
                    {analysis.negativeTweets}
                  </div>
                  <div className="text-sm text-gray-600">Negativas ({negativePercentage}%)</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-600 mb-1">
                    {analysis.neutralTweets}
                  </div>
                  <div className="text-sm text-gray-600">Neutras ({neutralPercentage}%)</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {sentimentPercentage}%
                  </div>
                  <div className="text-sm text-gray-600">Score de Sentimento</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-1">
                    {(analysis.engagementRate * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Taxa de Engajamento</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <SentimentChart analysis={analysis} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <EngagementChart analysis={analysis} />
          </motion.div>
        </div>

        {/* Comparação com Concorrentes */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <CompetitorChart analysis={analysis} />
        </motion.section>

        {/* Principais Tópicos e Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm h-full">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                  <span>Principais Tópicos</span>
                </CardTitle>
                <CardDescription>
                  Temas mais mencionados nas conversas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.topTopics.slice(0, 8).map((topic, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        {topic}
                      </span>
                      <div className="w-24 h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-blue-600 rounded-full"
                          style={{ width: `${Math.max(20, 100 - index * 10)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm h-full">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <span>Insights e Recomendações</span>
                </CardTitle>
                <CardDescription>
                  Análises e sugestões baseadas nos dados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.insights.map((insight, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {insight}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Lista de Tweets */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <TweetsList tweets={analysis.tweets} />
        </motion.section>
      </div>
    </div>
  );
}
