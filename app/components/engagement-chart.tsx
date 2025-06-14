
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { VoCAnalysis } from '@/lib/types';

interface EngagementChartProps {
  analysis: VoCAnalysis;
}

export default function EngagementChart({ analysis }: EngagementChartProps) {
  // Calcular métricas de engajamento por sentimento
  const positiveEngagement = analysis.tweets
    .filter(t => t.sentiment === 'positive')
    .reduce((sum, t) => sum + t.likes + t.retweets + t.replies, 0);
  
  const negativeEngagement = analysis.tweets
    .filter(t => t.sentiment === 'negative')
    .reduce((sum, t) => sum + t.likes + t.retweets + t.replies, 0);
  
  const neutralEngagement = analysis.tweets
    .filter(t => t.sentiment === 'neutral')
    .reduce((sum, t) => sum + t.likes + t.retweets + t.replies, 0);

  const data = [
    {
      sentiment: 'Positivos',
      tweets: analysis.positiveTweets,
      engajamento: positiveEngagement,
      media: analysis.positiveTweets > 0 ? Math.round(positiveEngagement / analysis.positiveTweets) : 0
    },
    {
      sentiment: 'Negativos',
      tweets: analysis.negativeTweets,
      engajamento: negativeEngagement,
      media: analysis.negativeTweets > 0 ? Math.round(negativeEngagement / analysis.negativeTweets) : 0
    },
    {
      sentiment: 'Neutros',
      tweets: analysis.neutralTweets,
      engajamento: neutralEngagement,
      media: analysis.neutralTweets > 0 ? Math.round(neutralEngagement / analysis.neutralTweets) : 0
    }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-blue-600">
            Tweets: {data.tweets}
          </p>
          <p className="text-sm text-purple-600">
            Engajamento Total: {data.engajamento}
          </p>
          <p className="text-sm text-gray-600">
            Média por Tweet: {data.media}
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
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <span>Engajamento por Sentimento</span>
        </CardTitle>
        <CardDescription>
          Análise do engajamento (likes, retweets, replies) por tipo de sentimento
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="sentiment" 
                tickLine={false}
                tick={{ fontSize: 10 }}
              />
              <YAxis 
                tickLine={false}
                tick={{ fontSize: 10 }}
                label={{ 
                  value: 'Quantidade', 
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
                dataKey="tweets" 
                fill="#60B5FF" 
                name="Número de Tweets"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="media" 
                fill="#FF9149" 
                name="Engajamento Médio"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Métricas adicionais */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg text-center">
            <div className="text-lg font-bold text-blue-600">
              {(analysis.engagementRate * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-600">Taxa de Engajamento</div>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg text-center">
            <div className="text-lg font-bold text-purple-600">
              {analysis.reachEstimate.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600">Alcance Estimado</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
