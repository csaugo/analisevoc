
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, TrendingUp, BarChart3, Users, ArrowRight, Twitter, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [companyName, setCompanyName] = useState('');
  const [platform, setPlatform] = useState<'twitter' | 'reddit'>('twitter');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleAnalysis = async () => {
    if (!companyName.trim()) {
      toast({
        title: "Nome da empresa obrigatório",
        description: "Por favor, insira o nome da empresa ou produto para análise.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          companyName: companyName.trim(),
          platform: platform 
        }),
      });

      if (!response.ok) {
        throw new Error('Erro na análise');
      }

      const result = await response.json();
      
      toast({
        title: "Análise concluída!",
        description: "Redirecionando para os resultados...",
      });

      router.push(`/analysis/${result.analysisId}`);
    } catch (error) {
      console.error('Erro na análise:', error);
      toast({
        title: "Erro na análise",
        description: "Ocorreu um erro ao processar a análise. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const features = [
    {
      icon: Search,
      title: "Coleta Inteligente",
      description: "Análise automática de menções no Twitter e Reddit das últimas horas"
    },
    {
      icon: TrendingUp,
      title: "Análise de Sentimento",
      description: "Classificação precisa de sentimentos positivos, negativos e neutros"
    },
    {
      icon: BarChart3,
      title: "Relatórios Visuais",
      description: "Gráficos interativos e métricas detalhadas de engajamento"
    },
    {
      icon: Users,
      title: "Comparação Competitiva",
      description: "Benchmarking automático com principais concorrentes do mercado"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">Voz do Cliente</span>
            </div>
            <Button 
              variant="outline" 
              onClick={() => router.push('/history')}
              className="hidden sm:flex"
            >
              Histórico de Análises
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto max-w-6xl px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Análise de <span className="text-blue-600">Voz do Cliente</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Descubra o que seus clientes realmente pensam sobre sua marca através de análise 
            inteligente de dados em tempo real.
          </p>

          {/* Analysis Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl text-center">Iniciar Análise</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Platform Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Escolha a rede social para análise:
                  </label>
                  <Select value={platform} onValueChange={(value: 'twitter' | 'reddit') => setPlatform(value)}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Selecione a plataforma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="twitter">
                        <div className="flex items-center space-x-2">
                          <Twitter className="w-4 h-4 text-blue-500" />
                          <span>X (Twitter)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="reddit">
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="w-4 h-4 text-orange-500" />
                          <span>Reddit</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Company Input and Analysis Button */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Input
                    placeholder="Ex: Nubank, Magazine Luiza, Spotify..."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="flex-1 h-12 text-lg"
                    onKeyPress={(e) => e.key === 'Enter' && handleAnalysis()}
                  />
                  <Button
                    onClick={handleAnalysis}
                    disabled={isAnalyzing}
                    className="h-12 px-8 bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    {isAnalyzing ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Analisando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span>Analisar {platform === 'twitter' ? 'Twitter' : 'Reddit'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </Button>
                </div>
                
                <p className="text-sm text-gray-500 text-center">
                  A análise pode levar alguns minutos para ser concluída
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto max-w-6xl px-4 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Funcionalidades Principais
          </h2>
          <p className="text-xl text-gray-600">
            Tudo que você precisa para entender a percepção da sua marca
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
            >
              <Card className="h-full text-center hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <feature.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto max-w-6xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pronto para conhecer sua reputação online?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Comece sua primeira análise Voz do Cliente agora mesmo
            </p>
            <Button
              onClick={() => document.querySelector('input')?.focus()}
              variant="secondary"
              size="lg"
              className="h-12 px-8"
            >
              Começar Análise Gratuita
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto max-w-6xl px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <TrendingUp className="h-6 w-6 text-blue-400" />
            <span className="text-xl font-bold">Voz do Cliente</span>
          </div>
          <p className="text-gray-400">
            Análise inteligente de Voz do Cliente para empresas modernas
          </p>
        </div>
      </footer>
    </div>
  );
}
