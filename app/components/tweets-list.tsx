
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Heart, Repeat2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { TweetData } from '@/lib/types';

interface TweetsListProps {
  tweets: TweetData[];
}

export default function TweetsList({ tweets }: TweetsListProps) {
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all');
  const [showCount, setShowCount] = useState(10);

  const filteredTweets = tweets.filter(tweet => {
    if (filter === 'all') return true;
    return tweet.sentiment === filter;
  });

  const displayedTweets = filteredTweets.slice(0, showCount);

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'negative':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800';
      case 'negative':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSentimentLabel = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'Positivo';
      case 'negative':
        return 'Negativo';
      default:
        return 'Neutro';
    }
  };

  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5 text-blue-600" />
          <span>Menções Analisadas</span>
        </CardTitle>
        <CardDescription>
          Tweets e comentários coletados com análise de sentimento
        </CardDescription>
        
        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="text-xs"
          >
            Todos ({tweets.length})
          </Button>
          <Button
            variant={filter === 'positive' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('positive')}
            className="text-xs"
          >
            Positivos ({tweets.filter(t => t.sentiment === 'positive').length})
          </Button>
          <Button
            variant={filter === 'negative' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('negative')}
            className="text-xs"
          >
            Negativos ({tweets.filter(t => t.sentiment === 'negative').length})
          </Button>
          <Button
            variant={filter === 'neutral' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('neutral')}
            className="text-xs"
          >
            Neutros ({tweets.filter(t => t.sentiment === 'neutral').length})
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayedTweets.map((tweet) => (
            <div
              key={tweet.id}
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">@{tweet.author}</span>
                  <Badge className={`text-xs ${getSentimentColor(tweet.sentiment)}`}>
                    <span className="flex items-center space-x-1">
                      {getSentimentIcon(tweet.sentiment)}
                      <span>{getSentimentLabel(tweet.sentiment)}</span>
                    </span>
                  </Badge>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(tweet.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
              
              <p className="text-gray-700 mb-3 leading-relaxed">
                {tweet.content}
              </p>
              
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Heart className="w-4 h-4" />
                  <span>{tweet.likes}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Repeat2 className="w-4 h-4" />
                  <span>{tweet.retweets}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{tweet.replies}</span>
                </div>
                <div className="ml-auto">
                  <span className="text-xs">
                    Score: {tweet.score > 0 ? '+' : ''}{tweet.score.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Botão para carregar mais */}
        {filteredTweets.length > showCount && (
          <div className="text-center mt-6">
            <Button
              variant="outline"
              onClick={() => setShowCount(prev => prev + 10)}
            >
              Carregar mais tweets ({filteredTweets.length - showCount} restantes)
            </Button>
          </div>
        )}

        {filteredTweets.length === 0 && (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">
              Nenhum tweet encontrado para o filtro selecionado.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
