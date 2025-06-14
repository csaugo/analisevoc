
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { VoCAnalysis } from '@/lib/types';

interface SentimentChartProps {
  analysis: VoCAnalysis;
}

const COLORS = ['#10b981', '#ef4444', '#6b7280'];

export default function SentimentChart({ analysis }: SentimentChartProps) {
  const data = [
    {
      name: 'Positivos',
      value: analysis.positiveTweets,
      percentage: ((analysis.positiveTweets / analysis.totalTweets) * 100).toFixed(1)
    },
    {
      name: 'Negativos',
      value: analysis.negativeTweets,
      percentage: ((analysis.negativeTweets / analysis.totalTweets) * 100).toFixed(1)
    },
    {
      name: 'Neutros',
      value: analysis.neutralTweets,
      percentage: ((analysis.neutralTweets / analysis.totalTweets) * 100).toFixed(1)
    }
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-gray-600">
            {data.value} menções ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm h-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <span>Distribuição de Sentimentos</span>
        </CardTitle>
        <CardDescription>
          Análise dos sentimentos expressos nas menções
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top"
                wrapperStyle={{ fontSize: 11 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Resumo textual */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Score de Sentimento:</strong> {(analysis.sentimentScore * 100).toFixed(1)}%
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {analysis.sentimentScore > 0.6 
              ? 'Percepção predominantemente positiva da marca'
              : analysis.sentimentScore < 0.4
              ? 'Há oportunidades de melhoria na percepção'
              : 'Percepção equilibrada da marca'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
