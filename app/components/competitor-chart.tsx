
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Users } from 'lucide-react';
import { VoCAnalysis } from '@/lib/types';

interface CompetitorChartProps {
  analysis: VoCAnalysis;
}

export default function CompetitorChart({ analysis }: CompetitorChartProps) {
  // Incluir a empresa atual nos dados de comparação
  const competitorData = [
    {
      name: analysis.company.name,
      sentimentScore: analysis.sentimentScore * 100,
      totalMentions: analysis.totalTweets,
      engagementRate: analysis.engagementRate * 100,
      isCurrentCompany: true
    },
    ...analysis.competitors.map((comp: any) => ({
      name: comp.name,
      sentimentScore: comp.sentimentScore * 100,
      totalMentions: comp.totalMentions,
      engagementRate: comp.engagementRate * 100,
      isCurrentCompany: false
    }))
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">
            {label} {data.isCurrentCompany && '(Sua empresa)'}
          </p>
          <p className="text-sm text-blue-600">
            Score de Sentimento: {data.sentimentScore.toFixed(1)}%
          </p>
          <p className="text-sm text-purple-600">
            Total de Menções: {data.totalMentions}
          </p>
          <p className="text-sm text-orange-600">
            Taxa de Engajamento: {data.engagementRate.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomBar = (props: any) => {
    const { fill, payload } = props;
    return (
      <Bar 
        {...props} 
        fill={payload.isCurrentCompany ? '#3b82f6' : fill}
        opacity={payload.isCurrentCompany ? 1 : 0.7}
      />
    );
  };

  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-blue-600" />
          <span>Comparação com Concorrentes</span>
        </CardTitle>
        <CardDescription>
          Benchmarking de sentimento e engajamento no mercado
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={competitorData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tickLine={false}
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={60}
                interval={0}
              />
              <YAxis 
                tickLine={false}
                tick={{ fontSize: 10 }}
                label={{ 
                  value: 'Score (%)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fontSize: 11 }
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top"
                wrapperStyle={{ fontSize: 11 }}
              />
              <Bar 
                dataKey="sentimentScore" 
                fill="#60B5FF" 
                name="Score de Sentimento (%)"
                radius={[4, 4, 0, 0]}
                shape={<CustomBar />}
              />
              <Bar 
                dataKey="engagementRate" 
                fill="#FF9149" 
                name="Taxa de Engajamento (%)"
                radius={[4, 4, 0, 0]}
                shape={<CustomBar />}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Insights da comparação */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Insights da Comparação</h4>
          <div className="space-y-2 text-sm text-gray-700">
            {analysis.sentimentScore > 0.6 && (
              <p>• Sua empresa tem um dos melhores scores de sentimento do mercado</p>
            )}
            {analysis.sentimentScore < 0.4 && (
              <p>• Há oportunidade de melhoria no sentimento comparado aos concorrentes</p>
            )}
            {analysis.engagementRate > 0.05 && (
              <p>• Taxa de engajamento acima da média do setor</p>
            )}
            <p>• Monitore regularmente a posição competitiva da sua marca</p>
            <p>• Analise as estratégias dos concorrentes com melhor performance</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
