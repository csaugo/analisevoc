
// Análise de sentimento simples baseada em palavras-chave
const positiveWords = [
  'bom', 'ótimo', 'excelente', 'maravilhoso', 'fantástico', 'incrível', 'perfeito',
  'amor', 'adoro', 'gosto', 'recomendo', 'satisfeito', 'feliz', 'contente',
  'qualidade', 'eficiente', 'rápido', 'fácil', 'útil', 'prático', 'confiável',
  'good', 'great', 'excellent', 'amazing', 'fantastic', 'incredible', 'perfect',
  'love', 'like', 'recommend', 'satisfied', 'happy', 'pleased', 'awesome'
];

const negativeWords = [
  'ruim', 'péssimo', 'horrível', 'terrível', 'odioso', 'detesto', 'odeio',
  'problema', 'defeito', 'falha', 'erro', 'lento', 'difícil', 'complicado',
  'insatisfeito', 'decepcionado', 'frustrado', 'irritado', 'chateado',
  'bad', 'terrible', 'horrible', 'awful', 'hate', 'dislike', 'disappointed',
  'frustrated', 'annoyed', 'upset', 'problem', 'issue', 'bug', 'slow', 'difficult'
];

export interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  confidence: number;
}

export function analyzeSentiment(text: string): SentimentResult {
  const words = text.toLowerCase().split(/\s+/);
  let positiveScore = 0;
  let negativeScore = 0;
  
  words.forEach(word => {
    if (positiveWords.includes(word)) {
      positiveScore++;
    }
    if (negativeWords.includes(word)) {
      negativeScore++;
    }
  });
  
  const totalWords = words.length;
  const netScore = (positiveScore - negativeScore) / Math.max(totalWords, 1);
  
  let sentiment: 'positive' | 'negative' | 'neutral';
  let confidence = 0;
  
  if (netScore > 0.05) {
    sentiment = 'positive';
    confidence = Math.min(netScore * 10, 1);
  } else if (netScore < -0.05) {
    sentiment = 'negative';
    confidence = Math.min(Math.abs(netScore) * 10, 1);
  } else {
    sentiment = 'neutral';
    confidence = 0.5;
  }
  
  return {
    sentiment,
    score: netScore,
    confidence
  };
}

export function extractTopics(tweets: string[]): string[] {
  const topicKeywords = new Map<string, number>();
  
  tweets.forEach(tweet => {
    const words = tweet.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    words.forEach(word => {
      topicKeywords.set(word, (topicKeywords.get(word) || 0) + 1);
    });
  });
  
  return Array.from(topicKeywords.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}
