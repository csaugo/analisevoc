
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { analyzeSentiment, extractTopics } from '@/lib/sentiment-analyzer';

// Interface para dados do Twitter API v2
interface TwitterTweet {
  id: string;
  content: string;
  author: string;
  likes: number;
  retweets: number;
  replies: number;
  created_at: string;
}

// Interface para dados do Reddit API
interface RedditPost {
  id: string;
  title: string;
  content: string;
  author: string;
  subreddit: string;
  score: number;
  upvotes: number;
  downvotes: number;
  comments: number;
  created_at: string;
}

// Interface unificada para dados de plataforma
interface PlatformData {
  id: string;
  content: string;
  author: string;
  likes: number;
  retweets: number;
  replies: number;
  created_at: string;
  platform: 'twitter' | 'reddit';
  subreddit?: string;
}

interface TwitterAPIResponse {
  data?: Array<{
    id: string;
    text: string;
    author_id: string;
    created_at: string;
    public_metrics: {
      like_count: number;
      retweet_count: number;
      reply_count: number;
      quote_count: number;
    };
  }>;
  includes?: {
    users: Array<{
      id: string;
      username: string;
      name: string;
    }>;
  };
  meta: {
    result_count: number;
    newest_id?: string;
    oldest_id?: string;
  };
}

interface RedditAPIResponse {
  data: {
    children: Array<{
      data: {
        id: string;
        title: string;
        selftext: string;
        author: string;
        subreddit: string;
        score: number;
        ups: number;
        downs: number;
        num_comments: number;
        created_utc: number;
        url: string;
      };
    }>;
    after?: string;
    before?: string;
  };
}

interface CacheEntry {
  data: PlatformData[];
  timestamp: number;
  isRealData: boolean;
  platform: 'twitter' | 'reddit';
}

interface RateLimitInfo {
  requestCount: number;
  windowStart: number;
  retryAfter?: number;
}

// Cache em memória para buscas recentes (TTL: 15 minutos)
const searchCache = new Map<string, CacheEntry>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutos

// Rate limiting separado para cada plataforma
// Twitter: 180 requests por 15 minutos
const twitterRateLimitInfo: RateLimitInfo = {
  requestCount: 0,
  windowStart: Date.now()
};
const TWITTER_RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutos
const TWITTER_RATE_LIMIT_MAX = 180;

// Reddit: 60 requests por minuto
const redditRateLimitInfo: RateLimitInfo = {
  requestCount: 0,
  windowStart: Date.now()
};
const REDDIT_RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const REDDIT_RATE_LIMIT_MAX = 60;

// Função para verificar e atualizar rate limit por plataforma
function checkRateLimit(platform: 'twitter' | 'reddit'): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  
  const rateLimitInfo = platform === 'twitter' ? twitterRateLimitInfo : redditRateLimitInfo;
  const window = platform === 'twitter' ? TWITTER_RATE_LIMIT_WINDOW : REDDIT_RATE_LIMIT_WINDOW;
  const maxRequests = platform === 'twitter' ? TWITTER_RATE_LIMIT_MAX : REDDIT_RATE_LIMIT_MAX;
  
  // Reset da janela se passou o tempo limite
  if (now - rateLimitInfo.windowStart > window) {
    rateLimitInfo.requestCount = 0;
    rateLimitInfo.windowStart = now;
    rateLimitInfo.retryAfter = undefined;
  }
  
  // Verificar se ainda há rate limit ativo
  if (rateLimitInfo.retryAfter && now < rateLimitInfo.retryAfter) {
    return { 
      allowed: false, 
      retryAfter: Math.ceil((rateLimitInfo.retryAfter - now) / 1000) 
    };
  }
  
  // Verificar limite de requests
  if (rateLimitInfo.requestCount >= maxRequests) {
    const timeUntilReset = window - (now - rateLimitInfo.windowStart);
    return { 
      allowed: false, 
      retryAfter: Math.ceil(timeUntilReset / 1000) 
    };
  }
  
  return { allowed: true };
}

// Função para buscar dados do Reddit API
async function searchRedditData(companyName: string): Promise<{ posts: PlatformData[]; isRealData: boolean; errorMessage?: string }> {
  const cacheKey = `reddit_${companyName.toLowerCase().trim()}`;
  
  // Verificar cache primeiro
  const cached = searchCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL && cached.platform === 'reddit') {
    console.log(`Cache hit para Reddit ${companyName}: ${cached.data.length} posts`);
    return { posts: cached.data, isRealData: cached.isRealData };
  }
  
  // Verificar rate limit
  const rateLimitCheck = checkRateLimit('reddit');
  if (!rateLimitCheck.allowed) {
    console.log(`Rate limit ativo para Reddit. Retry after: ${rateLimitCheck.retryAfter} segundos`);
    const fallbackData = await generateFallbackData(companyName, 'reddit');
    return { 
      posts: fallbackData, 
      isRealData: false,
      errorMessage: `Limite temporário da API do Reddit atingido. Tente novamente em ${rateLimitCheck.retryAfter} segundos.`
    };
  }
  
  // Verificar se credenciais estão configuradas
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  const userAgent = process.env.REDDIT_USER_AGENT || 'VozDoCliente/1.0';
  
  if (!clientId || !clientSecret) {
    console.log('Credenciais do Reddit não configuradas, usando dados simulados');
    const fallbackData = await generateFallbackData(companyName, 'reddit');
    searchCache.set(cacheKey, { data: fallbackData, timestamp: Date.now(), isRealData: false, platform: 'reddit' });
    return { 
      posts: fallbackData, 
      isRealData: false,
      errorMessage: 'Configuração da API do Reddit não encontrada. Usando dados simulados.'
    };
  }
  
  try {
    // Obter token de acesso do Reddit
    const authResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': userAgent,
      },
      body: 'grant_type=client_credentials',
    });
    
    if (!authResponse.ok) {
      throw new Error(`Erro na autenticação Reddit: ${authResponse.status}`);
    }
    
    const authData = await authResponse.json();
    const accessToken = authData.access_token;
    
    // Incrementar contador de requests
    redditRateLimitInfo.requestCount++;
    
    // Buscar posts no Reddit
    const searchQuery = encodeURIComponent(companyName);
    const url = `https://oauth.reddit.com/search?q=${searchQuery}&sort=new&limit=25&t=day&type=link,sr`;
    
    console.log(`Buscando posts no Reddit para: ${companyName}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': userAgent,
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Tratar erro 429 (Rate Limit)
    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after');
      const retrySeconds = retryAfter ? parseInt(retryAfter) : 60; // Default 1 min
      
      redditRateLimitInfo.retryAfter = Date.now() + (retrySeconds * 1000);
      
      console.log(`Rate limit 429 recebido do Reddit. Retry after: ${retrySeconds} segundos`);
      const fallbackData = await generateFallbackData(companyName, 'reddit');
      searchCache.set(cacheKey, { data: fallbackData, timestamp: Date.now(), isRealData: false, platform: 'reddit' });
      
      return { 
        posts: fallbackData, 
        isRealData: false,
        errorMessage: `Limite da API do Reddit atingido. Tente novamente em ${Math.ceil(retrySeconds / 60)} minutos.`
      };
    }
    
    // Tratar outros erros HTTP
    if (!response.ok) {
      let errorMessage = 'Erro na API do Reddit';
      
      if (response.status === 401) {
        errorMessage = 'Token de acesso inválido ou expirado';
      } else if (response.status === 403) {
        errorMessage = 'Acesso negado pela API do Reddit';
      } else if (response.status >= 500) {
        errorMessage = 'Serviço do Reddit temporariamente indisponível';
      }
      
      console.log(`Erro HTTP ${response.status}: ${errorMessage}`);
      const fallbackData = await generateFallbackData(companyName, 'reddit');
      searchCache.set(cacheKey, { data: fallbackData, timestamp: Date.now(), isRealData: false, platform: 'reddit' });
      
      return { 
        posts: fallbackData, 
        isRealData: false,
        errorMessage
      };
    }
    
    const apiResponse: RedditAPIResponse = await response.json();
    
    // Verificar se há dados
    if (!apiResponse.data || !apiResponse.data.children || apiResponse.data.children.length === 0) {
      console.log('Nenhum post encontrado no Reddit nas últimas 24 horas');
      const fallbackData = await generateFallbackData(companyName, 'reddit');
      searchCache.set(cacheKey, { data: fallbackData, timestamp: Date.now(), isRealData: false, platform: 'reddit' });
      
      return { 
        posts: fallbackData, 
        isRealData: false,
        errorMessage: 'Nenhum post encontrado no Reddit nas últimas 24 horas. Mostrando dados simulados.'
      };
    }
    
    // Converter para formato padrão
    const formattedPosts: PlatformData[] = apiResponse.data.children.map((child, index) => {
      const post = child.data;
      const content = post.title + (post.selftext ? ` ${post.selftext}` : '');
      
      return {
        id: `reddit_${post.id}`,
        content: content.substring(0, 500), // Limitar tamanho do conteúdo
        author: post.author,
        likes: post.ups,
        retweets: 0, // Reddit não tem retweets
        replies: post.num_comments,
        created_at: new Date(post.created_utc * 1000).toISOString(),
        platform: 'reddit' as const,
        subreddit: post.subreddit
      };
    });
    
    console.log(`Encontrados ${formattedPosts.length} posts reais da API do Reddit`);
    
    // Salvar no cache
    searchCache.set(cacheKey, { 
      data: formattedPosts, 
      timestamp: Date.now(), 
      isRealData: true,
      platform: 'reddit'
    });
    
    return { posts: formattedPosts, isRealData: true };
    
  } catch (error) {
    console.error('Erro na busca do Reddit API:', error);
    
    let errorMessage = 'Erro de conexão com a API do Reddit';
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Timeout na conexão com o Reddit. Tente novamente.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Timeout na conexão com o Reddit. Tente novamente.';
      } else if (error.message.includes('fetch') || error.message.includes('network')) {
        errorMessage = 'Erro de rede. Verifique sua conexão.';
      }
    }
    
    // Fallback para dados simulados
    const fallbackData = await generateFallbackData(companyName, 'reddit');
    searchCache.set(cacheKey, { data: fallbackData, timestamp: Date.now(), isRealData: false, platform: 'reddit' });
    
    return { 
      posts: fallbackData, 
      isRealData: false,
      errorMessage
    };
  }
}

// Função para buscar dados reais do Twitter API v2
async function searchTwitterData(companyName: string): Promise<{ tweets: PlatformData[]; isRealData: boolean; errorMessage?: string }> {
  const cacheKey = `twitter_${companyName.toLowerCase().trim()}`;
  
  // Verificar cache primeiro
  const cached = searchCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL && cached.platform === 'twitter') {
    console.log(`Cache hit para Twitter ${companyName}: ${cached.data.length} tweets`);
    return { tweets: cached.data, isRealData: cached.isRealData };
  }
  
  // Verificar rate limit
  const rateLimitCheck = checkRateLimit('twitter');
  if (!rateLimitCheck.allowed) {
    console.log(`Rate limit ativo para Twitter. Retry after: ${rateLimitCheck.retryAfter} segundos`);
    const fallbackData = await generateFallbackData(companyName, 'twitter');
    return { 
      tweets: fallbackData, 
      isRealData: false,
      errorMessage: `Limite temporário da API atingido. Tente novamente em ${rateLimitCheck.retryAfter} segundos.`
    };
  }
  
  // Verificar se Bearer Token está configurado
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  if (!bearerToken) {
    console.log('Bearer Token não configurado, usando dados simulados');
    const fallbackData = await generateFallbackData(companyName, 'twitter');
    searchCache.set(cacheKey, { data: fallbackData, timestamp: Date.now(), isRealData: false, platform: 'twitter' });
    return { 
      tweets: fallbackData, 
      isRealData: false,
      errorMessage: 'Configuração da API do Twitter não encontrada. Usando dados simulados.'
    };
  }
  
  try {
    // Construir query de busca para últimas 2 horas, Brasil + DF
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const startTime = twoHoursAgo.toISOString();
    
    const query = `${companyName} lang:pt -is:retweet place_country:BR`;
    
    console.log(`Buscando tweets para: ${query} desde ${startTime}`);
    
    // Incrementar contador de requests
    twitterRateLimitInfo.requestCount++;
    
    // Fazer chamada para Twitter API v2 com timeout
    const url = new URL('https://api.twitter.com/2/tweets/search/recent');
    url.searchParams.append('query', query);
    url.searchParams.append('max_results', '10');
    url.searchParams.append('start_time', startTime);
    url.searchParams.append('tweet.fields', 'created_at,public_metrics,author_id');
    url.searchParams.append('user.fields', 'username,name');
    url.searchParams.append('expansions', 'author_id');
    
    // Implementar timeout com AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Tratar erro 429 (Rate Limit)
    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after');
      const retrySeconds = retryAfter ? parseInt(retryAfter) : 900; // Default 15 min
      
      twitterRateLimitInfo.retryAfter = Date.now() + (retrySeconds * 1000);
      
      console.log(`Rate limit 429 recebido. Retry after: ${retrySeconds} segundos`);
      const fallbackData = await generateFallbackData(companyName, 'twitter');
      searchCache.set(cacheKey, { data: fallbackData, timestamp: Date.now(), isRealData: false, platform: 'twitter' });
      
      return { 
        tweets: fallbackData, 
        isRealData: false,
        errorMessage: `Limite da API do Twitter atingido. Tente novamente em ${Math.ceil(retrySeconds / 60)} minutos.`
      };
    }
    
    // Tratar outros erros HTTP
    if (!response.ok) {
      let errorMessage = 'Erro na API do Twitter';
      
      if (response.status === 401) {
        errorMessage = 'Token de acesso inválido ou expirado';
      } else if (response.status === 403) {
        errorMessage = 'Acesso negado pela API do Twitter';
      } else if (response.status >= 500) {
        errorMessage = 'Serviço do Twitter temporariamente indisponível';
      }
      
      console.log(`Erro HTTP ${response.status}: ${errorMessage}`);
      const fallbackData = await generateFallbackData(companyName, 'twitter');
      searchCache.set(cacheKey, { data: fallbackData, timestamp: Date.now(), isRealData: false, platform: 'twitter' });
      
      return { 
        tweets: fallbackData, 
        isRealData: false,
        errorMessage
      };
    }
    
    const apiResponse: TwitterAPIResponse = await response.json();
    
    // Verificar se há dados
    if (!apiResponse.data || apiResponse.data.length === 0) {
      console.log('Nenhum tweet encontrado nas últimas 2 horas');
      const fallbackData = await generateFallbackData(companyName, 'twitter');
      searchCache.set(cacheKey, { data: fallbackData, timestamp: Date.now(), isRealData: false, platform: 'twitter' });
      
      return { 
        tweets: fallbackData, 
        isRealData: false,
        errorMessage: 'Nenhum tweet encontrado nas últimas 2 horas. Mostrando dados simulados.'
      };
    }
    
    // Criar mapa de usuários para lookup
    const usersMap = new Map();
    if (apiResponse.includes?.users) {
      apiResponse.includes.users.forEach(user => {
        usersMap.set(user.id, user);
      });
    }
    
    // Converter para formato padrão
    const formattedTweets: PlatformData[] = apiResponse.data.map((tweet, index) => {
      const user = usersMap.get(tweet.author_id);
      
      return {
        id: `real_${tweet.id}`,
        content: tweet.text,
        author: user?.username || `user_${index}`,
        likes: tweet.public_metrics.like_count,
        retweets: tweet.public_metrics.retweet_count,
        replies: tweet.public_metrics.reply_count,
        created_at: tweet.created_at,
        platform: 'twitter' as const
      };
    });
    
    console.log(`Encontrados ${formattedTweets.length} tweets reais da API v2`);
    
    // Salvar no cache
    searchCache.set(cacheKey, { 
      data: formattedTweets, 
      timestamp: Date.now(), 
      isRealData: true,
      platform: 'twitter'
    });
    
    return { tweets: formattedTweets, isRealData: true };
    
  } catch (error) {
    console.error('Erro na busca do Twitter API v2:', error);
    
    let errorMessage = 'Erro de conexão com a API do Twitter';
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Timeout na conexão com o Twitter. Tente novamente.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Timeout na conexão com o Twitter. Tente novamente.';
      } else if (error.message.includes('fetch') || error.message.includes('network')) {
        errorMessage = 'Erro de rede. Verifique sua conexão.';
      }
    }
    
    // Fallback para dados simulados
    const fallbackData = await generateFallbackData(companyName, 'twitter');
    searchCache.set(cacheKey, { data: fallbackData, timestamp: Date.now(), isRealData: false, platform: 'twitter' });
    
    return { 
      tweets: fallbackData, 
      isRealData: false,
      errorMessage
    };
  }
}

// Função de fallback com dados simulados realísticos
async function generateFallbackData(companyName: string, platform: 'twitter' | 'reddit'): Promise<PlatformData[]> {
  const twitterTemplates = [
    // Positivos
    `Acabei de usar o ${companyName} e fiquei impressionado com a qualidade! 👏`,
    `${companyName} superou minhas expectativas. Recomendo muito! ⭐⭐⭐⭐⭐`,
    `Atendimento do ${companyName} foi excepcional hoje. Parabéns! 🙌`,
    `Produto do ${companyName} chegou antes do prazo. Muito satisfeito! 📦✨`,
    `${companyName} sempre inovando. Adoro essa empresa! 💙`,
    `Melhor experiência que já tive com ${companyName}. Top demais! 🔥`,
    `${companyName} tem o melhor custo-benefício do mercado 💰`,
    `Interface do app do ${companyName} está linda! Parabéns ao time de design 🎨`,
    
    // Negativos
    `${companyName} me decepcionou hoje. Esperava mais... 😞`,
    `Suporte do ${companyName} demorou 3 horas para responder. Inaceitável! 😡`,
    `Produto do ${companyName} veio com defeito. Que frustração! 😤`,
    `${companyName} aumentou os preços sem avisar. Não gostei nada 📈💸`,
    `App do ${companyName} travou 3 vezes hoje. Precisa melhorar urgente! 📱❌`,
    `${companyName} perdeu um cliente. Serviço péssimo! 👎`,
    `Entrega do ${companyName} atrasou 1 semana. Sem comunicação nenhuma 📦⏰`,
    
    // Neutros
    `Alguém já usou o ${companyName}? Como foi a experiência? 🤔`,
    `${companyName} lançou um produto novo. Vou testar e depois conto 👀`,
    `Comparando ${companyName} com outras opções do mercado 📊`,
    `${companyName} está com promoção. Vale a pena? 🏷️`,
    `Tutorial de como usar o ${companyName}: [link] 📚`,
    `${companyName} vai participar da feira de tecnologia este ano 🏢`,
    `Pesquisando sobre ${companyName} para um projeto da faculdade 🎓`,
    `${companyName} anunciou parceria com outra empresa 🤝`
  ];

  const redditTemplates = [
    // Positivos
    `Experiência incrível com ${companyName} - Review completo`,
    `${companyName} vale a pena? Minha análise após 6 meses de uso`,
    `Por que ${companyName} é a melhor opção do mercado [Discussão]`,
    `${companyName} resolveu meu problema em minutos - Muito satisfeito!`,
    `Comparação: ${companyName} vs concorrentes - ${companyName} ganhou`,
    `${companyName} superou todas as expectativas - AMA`,
    `Dica: Como aproveitar melhor o ${companyName}`,
    `${companyName} tem o melhor atendimento que já vi`,
    
    // Negativos
    `${companyName} me decepcionou - Alguém mais passou por isso?`,
    `Problemas com ${companyName} - Preciso de ajuda`,
    `${companyName} piorou muito nos últimos meses`,
    `Cancelei minha conta no ${companyName} - Motivos`,
    `${companyName} vs [Concorrente] - Por que mudei`,
    `Cuidado com ${companyName} - Minha experiência ruim`,
    `${companyName} não cumpriu o prometido - Frustrado`,
    `Alguém mais teve problemas com ${companyName}?`,
    
    // Neutros
    `Dúvidas sobre ${companyName} - Alguém pode ajudar?`,
    `${companyName} lançou novidade - O que acham?`,
    `Pesquisa sobre ${companyName} para TCC`,
    `${companyName} está com promoção - Vale a pena?`,
    `Tutorial: Como usar ${companyName} [Guia Completo]`,
    `${companyName} vs outras opções - Discussão`,
    `Opinião imparcial sobre ${companyName}`,
    `${companyName} anunciou parceria - Thoughts?`
  ];

  const templates = platform === 'twitter' ? twitterTemplates : redditTemplates;

  // Simular variação realística no número de posts encontrados
  const minPosts = 8;
  const maxPosts = Math.min(20, templates.length);
  const numPosts = Math.floor(Math.random() * (maxPosts - minPosts + 1)) + minPosts;
  
  // Selecionar posts aleatórios
  const selectedTemplates = templates
    .sort(() => Math.random() - 0.5)
    .slice(0, numPosts);

  const now = Date.now();
  const posts: PlatformData[] = selectedTemplates.map((content, index) => {
    // Gerar dados realísticos de engajamento baseados na plataforma
    const baseEngagement = Math.random() * 100;
    const isViral = Math.random() < 0.1; // 10% chance de ser viral
    
    let likes, retweets, replies;
    let subreddit;
    
    if (platform === 'twitter') {
      likes = isViral 
        ? Math.floor(baseEngagement * 10 + Math.random() * 500)
        : Math.floor(baseEngagement + Math.random() * 50);
      
      retweets = Math.floor(likes * (0.1 + Math.random() * 0.3));
      replies = Math.floor(likes * (0.05 + Math.random() * 0.15));
    } else {
      // Reddit: upvotes são mais conservadores, sem retweets
      likes = isViral 
        ? Math.floor(baseEngagement * 5 + Math.random() * 200)
        : Math.floor(baseEngagement * 0.5 + Math.random() * 25);
      
      retweets = 0; // Reddit não tem retweets
      replies = Math.floor(likes * (0.2 + Math.random() * 0.4)); // Reddit tem mais comentários
      
      // Gerar subreddit realístico
      const subreddits = ['brasil', 'investimentos', 'tecnologia', 'startups', 'financas', 'reviews', 'consumidores'];
      subreddit = subreddits[Math.floor(Math.random() * subreddits.length)];
    }

    const post: PlatformData = {
      id: `fallback_${platform}_${now}_${index}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      author: `user_${Math.random().toString(36).substr(2, 8)}`,
      likes,
      retweets,
      replies,
      created_at: new Date(now - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      platform
    };

    if (platform === 'reddit' && subreddit) {
      post.subreddit = subreddit;
    }

    return post;
  });

  return posts;
}

function generateCompetitorData(companyName: string) {
  // Gerar nomes de concorrentes mais realistas baseados no setor
  const competitorSuffixes = ['Tech', 'Pro', 'Plus', 'Digital', 'Solutions', 'Corp', 'Group'];
  const competitorPrefixes = ['Smart', 'Quick', 'Easy', 'Fast', 'Best', 'Top', 'Prime'];
  
  const competitors = Array.from({ length: 3 }, (_, i) => {
    const prefix = competitorPrefixes[Math.floor(Math.random() * competitorPrefixes.length)];
    const suffix = competitorSuffixes[Math.floor(Math.random() * competitorSuffixes.length)];
    return `${prefix}${suffix}`;
  });

  return competitors.map(name => ({
    name,
    sentimentScore: Math.random() * 0.6 + 0.2, // 0.2 to 0.8
    totalMentions: Math.floor(Math.random() * 500) + 100,
    engagementRate: Math.random() * 0.1 + 0.02 // 2% to 12%
  }));
}

function generateInsights(analysis: any, platform: 'twitter' | 'reddit', isRealData: boolean = false, errorMessage?: string) {
  const insights = [];
  const { sentimentScore, engagementRate, negativeTweets, positiveTweets, totalTweets } = analysis;
  
  const platformName = platform === 'twitter' ? 'Twitter' : 'Reddit';
  const timeFrame = platform === 'twitter' ? 'últimas 2 horas (Brasil + DF)' : 'últimas 24 horas';
  
  // Indicar fonte dos dados com informações específicas
  if (!isRealData) {
    if (errorMessage) {
      insights.push(`ℹ️ ${errorMessage}`);
    } else {
      insights.push(`ℹ️ Dados simulados devido a limitações da API do ${platformName}`);
    }
  } else {
    insights.push(`✅ Análise baseada em dados reais do ${platformName} das ${timeFrame}`);
  }
  
  // Análise de sentimento
  if (sentimentScore > 0.7) {
    insights.push(`🎉 Excelente! Sua marca tem uma percepção muito positiva no ${platformName}`);
  } else if (sentimentScore > 0.6) {
    insights.push('👍 Boa percepção da marca, com predominância de comentários positivos');
  } else if (sentimentScore < 0.4) {
    insights.push('⚠️ Atenção: há oportunidades significativas de melhoria na percepção da marca');
  } else if (sentimentScore < 0.3) {
    insights.push('🚨 Crítico: a percepção da marca está predominantemente negativa');
  }
  
  // Análise de engajamento
  if (engagementRate > 0.08) {
    insights.push('🔥 Excelente engajamento! Sua audiência está muito ativa');
  } else if (engagementRate > 0.05) {
    insights.push('📈 Bom nível de engajamento, indicando conexão com o público');
  } else if (engagementRate < 0.02) {
    insights.push('📊 Engajamento baixo - considere estratégias para aumentar a interação');
  }
  
  // Análise comparativa
  if (negativeTweets > positiveTweets) {
    insights.push('🎯 Priorize melhorar a experiência do cliente para reverter sentimentos negativos');
  } else if (positiveTweets > negativeTweets * 2) {
    insights.push('✨ Ótimo! Comentários positivos superam significativamente os negativos');
  }
  
  // Análise de volume específica para dados reais vs simulados
  if (isRealData) {
    const threshold = platform === 'twitter' ? 5 : 3; // Reddit tem menos volume
    const goodThreshold = platform === 'twitter' ? 8 : 5;
    
    if (totalTweets < threshold) {
      insights.push(`📢 Poucas menções nas ${timeFrame} - considere horários de maior atividade`);
    } else if (totalTweets >= goodThreshold) {
      insights.push(`🌟 Boa atividade de menções nas ${timeFrame}`);
    }
  } else {
    if (totalTweets < 10) {
      insights.push('📢 Volume baixo de menções - considere aumentar a presença digital');
    } else if (totalTweets > 20) {
      insights.push('🌟 Alto volume de menções indica boa visibilidade da marca');
    }
  }
  
  // Recomendações estratégicas específicas por plataforma
  if (isRealData) {
    insights.push('📱 Dados atualizados em tempo real - monitore tendências emergentes');
  } else {
    insights.push(`📱 Configure a API do ${platformName} para análises em tempo real`);
  }
  
  // Insights específicos por plataforma
  if (platform === 'reddit') {
    insights.push('💬 Reddit oferece discussões mais aprofundadas - analise os comentários para insights detalhados');
    if (positiveTweets > 0) {
      insights.push('🏆 Posts positivos no Reddit tendem a gerar mais engajamento orgânico');
    }
  } else {
    insights.push('🔄 Twitter permite resposta rápida - monitore menções para engajamento imediato');
  }
  
  if (negativeTweets > 0) {
    insights.push('💬 Responda proativamente aos comentários negativos para demonstrar cuidado');
  }
  
  if (positiveTweets > 0) {
    insights.push('🙏 Agradeça e interaja com comentários positivos para fortalecer relacionamentos');
  }
  
  return insights;
}

export async function POST(request: NextRequest) {
  let isRealData = false;
  let errorMessage: string | undefined;
  
  try {
    const { companyName, platform = 'twitter' } = await request.json();

    if (!companyName) {
      return NextResponse.json(
        { error: 'Nome da empresa é obrigatório' },
        { status: 400 }
      );
    }

    if (!['twitter', 'reddit'].includes(platform)) {
      return NextResponse.json(
        { error: 'Plataforma deve ser "twitter" ou "reddit"' },
        { status: 400 }
      );
    }

    console.log(`Iniciando análise para: ${companyName} na plataforma: ${platform}`);

    // Buscar ou criar empresa
    let company = await prisma.company.findUnique({
      where: { name: companyName }
    });

    if (!company) {
      company = await prisma.company.create({
        data: { name: companyName }
      });
    }

    // Buscar dados da plataforma selecionada (com fallback automático)
    let platformData: PlatformData[];
    
    if (platform === 'twitter') {
      const searchResult = await searchTwitterData(companyName);
      platformData = searchResult.tweets;
      isRealData = searchResult.isRealData;
      errorMessage = searchResult.errorMessage;
    } else {
      const searchResult = await searchRedditData(companyName);
      platformData = searchResult.posts;
      isRealData = searchResult.isRealData;
      errorMessage = searchResult.errorMessage;
    }
    
    console.log(`Dados obtidos: ${platformData.length} ${platform === 'twitter' ? 'tweets' : 'posts'}, Reais: ${isRealData}`);
    if (errorMessage) {
      console.log(`Mensagem de erro/aviso: ${errorMessage}`);
    }
    
    // Verificar se há dados suficientes para análise
    if (platformData.length === 0) {
      const contentType = platform === 'twitter' ? 'tweets' : 'posts';
      return NextResponse.json({
        error: `Nenhum ${contentType} encontrado para análise`,
        suggestion: 'Tente novamente mais tarde ou verifique se o nome da empresa está correto'
      }, { status: 404 });
    }
    
    // Analisar sentimentos
    const analyzedData = platformData.map(item => {
      const sentiment = analyzeSentiment(item.content);
      return {
        ...item,
        sentiment: sentiment.sentiment,
        score: sentiment.score
      };
    });

    // Calcular métricas
    const totalTweets = analyzedData.length;
    const positiveTweets = analyzedData.filter(t => t.sentiment === 'positive').length;
    const negativeTweets = analyzedData.filter(t => t.sentiment === 'negative').length;
    const neutralTweets = analyzedData.filter(t => t.sentiment === 'neutral').length;
    
    const sentimentScore = (positiveTweets - negativeTweets) / totalTweets + 0.5;
    const engagementRate = analyzedData.reduce((sum, t) => sum + t.likes + t.retweets + t.replies, 0) / totalTweets / 100;
    const reachEstimate = analyzedData.reduce((sum, t) => sum + t.likes + t.retweets * 10, 0);

    // Extrair tópicos
    const topTopics = extractTopics(analyzedData.map(t => t.content));
    
    // Gerar dados de concorrentes (sempre simulados por enquanto)
    const competitors = generateCompetitorData(companyName);

    // Gerar insights com informação sobre fonte dos dados e mensagens específicas
    const insights = generateInsights({
      sentimentScore,
      engagementRate,
      negativeTweets,
      positiveTweets,
      totalTweets
    }, platform, isRealData, errorMessage);

    // Criar análise no banco
    const analysis = await prisma.analysis.create({
      data: {
        companyId: company.id,
        totalTweets,
        positiveTweets,
        negativeTweets,
        neutralTweets,
        sentimentScore,
        engagementRate,
        reachEstimate,
        topTopics,
        competitors,
        insights
      }
    });

    // Salvar tweets/posts
    await Promise.all(
      analyzedData.map(item =>
        prisma.tweet.create({
          data: {
            analysisId: analysis.id,
            tweetId: item.id,
            content: item.content,
            author: item.author,
            sentiment: item.sentiment,
            score: item.score,
            likes: item.likes,
            retweets: item.retweets,
            replies: item.replies
          }
        })
      )
    );

    const contentType = platform === 'twitter' ? 'tweets' : 'posts';
    console.log(`Análise concluída: ID ${analysis.id}, ${totalTweets} ${contentType}, Plataforma: ${platform}, Dados reais: ${isRealData}`);

    // Preparar mensagem de resposta baseada no status da API
    const platformName = platform === 'twitter' ? 'Twitter' : 'Reddit';
    let responseMessage = 'Análise concluída com sucesso';
    if (isRealData) {
      responseMessage = `Análise concluída com dados reais da API do ${platformName}`;
    } else if (errorMessage) {
      responseMessage = `Análise concluída com dados simulados: ${errorMessage}`;
    } else {
      responseMessage = 'Análise concluída com dados simulados';
    }

    return NextResponse.json({
      success: true,
      analysisId: analysis.id,
      message: responseMessage,
      platform: platform,
      dataSource: isRealData ? 'real' : 'simulated',
      totalTweets,
      apiStatus: isRealData ? 'active' : 'fallback',
      errorMessage: !isRealData ? errorMessage : undefined
    });

  } catch (error) {
    console.error('Erro na análise:', error);
    
    // Tentar fornecer informação mais específica sobre o erro
    let errorMsg = 'Erro interno do servidor';
    if (error instanceof Error) {
      if (error.message.includes('429')) {
        errorMsg = 'API temporariamente indisponível (rate limit). Tente novamente em alguns minutos.';
      } else if (error.message.includes('fetch')) {
        errorMsg = 'Erro de conexão com a API. Verifique sua conexão.';
      } else if (error.message.includes('timeout')) {
        errorMsg = 'Timeout na conexão com a API. Tente novamente.';
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMsg,
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}
