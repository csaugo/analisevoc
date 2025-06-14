
# 🔌 Guia de APIs Externas - Voz do Cliente

## Visão Geral

A aplicação Voz do Cliente integra-se com as APIs do Twitter e Reddit para coletar dados em tempo real sobre menções de empresas. Este guia detalha como obter credenciais, configurar as integrações e entender as limitações de cada plataforma.

## Twitter API v2

### 1. Obtendo Credenciais

#### Passo 1: Criar Conta de Desenvolvedor

1. Acesse [Twitter Developer Portal](https://developer.twitter.com/)
2. Clique em "Sign up" ou "Apply for a developer account"
3. Faça login com sua conta do Twitter
4. Complete o formulário de aplicação:
   - **Use case**: Academic research, Business, ou Student
   - **Description**: Descreva que será usado para análise de sentimento empresarial
   - **Country**: Brasil
   - **Will you make Twitter content available to a government entity?**: No

#### Passo 2: Criar um Projeto/App

1. No dashboard, clique em "Create Project"
2. Preencha as informações:
   - **Project name**: "Voz do Cliente"
   - **Use case**: "Making a bot" ou "Analyzing Tweets"
   - **Description**: "Sistema de análise de sentimento para monitoramento de marca"

#### Passo 3: Obter Bearer Token

1. No projeto criado, vá para "Keys and tokens"
2. Na seção "Bearer Token", clique em "Generate"
3. **IMPORTANTE**: Copie e salve o Bearer Token imediatamente
4. Configure no arquivo `.env`:

```env
TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAAA%2FAAAAAAAAAAAAAAAAAAAAAA
```

### 2. Configuração da API

#### Limites e Quotas

**Twitter API v2 - Essential (Gratuito):**
- 500.000 tweets por mês
- 300 requests por 15 minutos (rate limit)
- Apenas tweets dos últimos 7 dias
- Sem acesso a métricas históricas

**Twitter API v2 - Elevated (Pago):**
- 2 milhões de tweets por mês
- 300 requests por 15 minutos
- Acesso a tweets históricos (até 30 dias)
- Métricas avançadas

#### Parâmetros de Busca

A aplicação utiliza os seguintes parâmetros:

```typescript
const searchParams = {
  query: `${companyName} lang:pt -is:retweet place_country:BR`,
  max_results: 10,
  start_time: twoHoursAgo.toISOString(),
  'tweet.fields': 'created_at,public_metrics,author_id',
  'user.fields': 'username,name',
  expansions: 'author_id'
};
```

**Explicação dos parâmetros:**
- `lang:pt`: Apenas tweets em português
- `-is:retweet`: Exclui retweets
- `place_country:BR`: Apenas tweets do Brasil
- `max_results: 10`: Máximo 10 tweets por request
- `start_time`: Tweets das últimas 2 horas

### 3. Tratamento de Erros

#### Rate Limiting (429)

```typescript
if (response.status === 429) {
  const retryAfter = response.headers.get('retry-after');
  const retrySeconds = retryAfter ? parseInt(retryAfter) : 900; // 15 min default
  
  console.log(`Rate limit atingido. Retry em: ${retrySeconds} segundos`);
  // Aplicação automaticamente usa dados simulados
}
```

#### Outros Erros Comuns

- **401 Unauthorized**: Bearer Token inválido ou expirado
- **403 Forbidden**: Acesso negado (conta suspensa ou app não aprovado)
- **404 Not Found**: Endpoint não encontrado
- **500+ Server Error**: Problemas no servidor do Twitter

### 4. Boas Práticas

1. **Respeitar Rate Limits**: A aplicação implementa controle automático
2. **Cache de Resultados**: Dados são cacheados por 15 minutos
3. **Fallback para Dados Simulados**: Quando API não está disponível
4. **Monitoramento de Uso**: Acompanhar quotas mensais

## Reddit API

### 1. Obtendo Credenciais

#### Passo 1: Criar Aplicação Reddit

1. Acesse [Reddit Apps](https://www.reddit.com/prefs/apps)
2. Faça login com sua conta Reddit
3. Clique em "Create App" ou "Create Another App"
4. Preencha o formulário:
   - **Name**: "Voz do Cliente"
   - **App type**: "script"
   - **Description**: "Sistema de análise de sentimento empresarial"
   - **About URL**: (deixe em branco)
   - **Redirect URI**: `http://localhost:8080` (obrigatório, mas não usado)

#### Passo 2: Obter Credenciais

1. Após criar, você verá:
   - **Client ID**: String abaixo do nome da app (ex: `abc123def456`)
   - **Client Secret**: String longa na seção "secret"

2. Configure no arquivo `.env`:

```env
REDDIT_CLIENT_ID=abc123def456
REDDIT_CLIENT_SECRET=xyz789uvw012-AbCdEfGhIjKlMnOp
REDDIT_USER_AGENT=VozDoCliente/1.0
```

### 2. Configuração da API

#### Autenticação OAuth2

A aplicação usa Client Credentials flow:

```typescript
const authResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': userAgent,
  },
  body: 'grant_type=client_credentials',
});
```

#### Limites e Quotas

**Reddit API - Gratuito:**
- 60 requests por minuto
- 600 requests por 10 minutos
- Sem limite mensal oficial
- Acesso a posts públicos

#### Parâmetros de Busca

```typescript
const searchParams = {
  q: companyName,
  sort: 'new',
  limit: 25,
  t: 'day',  // últimas 24 horas
  type: 'link,sr'
};
```

### 3. Tratamento de Dados

#### Estrutura de Resposta

```json
{
  "data": {
    "children": [
      {
        "data": {
          "id": "abc123",
          "title": "Título do post",
          "selftext": "Conteúdo do post",
          "author": "username",
          "subreddit": "brasil",
          "score": 15,
          "ups": 20,
          "downs": 5,
          "num_comments": 8,
          "created_utc": 1640995200,
          "url": "https://reddit.com/r/brasil/comments/abc123"
        }
      }
    ]
  }
}
```

#### Conversão para Formato Padrão

```typescript
const formattedPosts = apiResponse.data.children.map(child => {
  const post = child.data;
  return {
    id: `reddit_${post.id}`,
    content: post.title + (post.selftext ? ` ${post.selftext}` : ''),
    author: post.author,
    likes: post.ups,
    retweets: 0, // Reddit não tem retweets
    replies: post.num_comments,
    created_at: new Date(post.created_utc * 1000).toISOString(),
    platform: 'reddit',
    subreddit: post.subreddit
  };
});
```

### 4. Tratamento de Erros

#### Rate Limiting (429)

```typescript
if (response.status === 429) {
  const retryAfter = response.headers.get('retry-after');
  const retrySeconds = retryAfter ? parseInt(retryAfter) : 60;
  
  console.log(`Rate limit Reddit. Retry em: ${retrySeconds} segundos`);
  // Usar dados simulados automaticamente
}
```

#### Outros Erros

- **401 Unauthorized**: Credenciais inválidas
- **403 Forbidden**: App não autorizada ou suspensa
- **404 Not Found**: Subreddit ou post não encontrado

## Configuração de Desenvolvimento vs Produção

### Desenvolvimento

Para desenvolvimento, você pode deixar as credenciais vazias no `.env`:

```env
# Deixar vazio para usar dados simulados
TWITTER_BEARER_TOKEN=
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
```

A aplicação automaticamente detectará e usará dados simulados realísticos.

### Produção

Para produção, configure todas as credenciais:

```env
# Credenciais reais para produção
TWITTER_BEARER_TOKEN=seu_bearer_token_real
REDDIT_CLIENT_ID=seu_client_id_real
REDDIT_CLIENT_SECRET=seu_client_secret_real
REDDIT_USER_AGENT=VozDoCliente/1.0
```

## Monitoramento de APIs

### 1. Logs de Integração

A aplicação registra automaticamente:

```typescript
// Sucesso
console.log(`Encontrados ${tweets.length} tweets reais da API v2`);
console.log(`Encontrados ${posts.length} posts reais da API do Reddit`);

// Erros
console.error('Erro na busca do Twitter API v2:', error);
console.error('Erro na busca do Reddit API:', error);

// Rate limits
console.log(`Rate limit ativo. Retry after: ${retryAfter} segundos`);
```

### 2. Métricas de Uso

Monitore o uso das APIs através dos logs:

```bash
# Verificar logs de rate limit
grep "Rate limit" /var/log/voz-cliente/app.log

# Verificar uso de dados reais vs simulados
grep "dados reais\|dados simulados" /var/log/voz-cliente/app.log

# Verificar erros de API
grep "Erro na busca" /var/log/voz-cliente/app.log
```

## Limitações e Considerações

### Twitter API

**Limitações Técnicas:**
- Apenas tweets dos últimos 7 dias (plano gratuito)
- Máximo 10 tweets por busca
- Rate limit de 300 requests/15min
- Sem acesso a tweets privados

**Limitações de Conteúdo:**
- Tweets deletados não aparecem
- Contas privadas são excluídas
- Retweets são filtrados automaticamente

### Reddit API

**Limitações Técnicas:**
- 60 requests por minuto
- Apenas posts públicos
- Sem acesso a comentários em threads privadas

**Limitações de Conteúdo:**
- Posts deletados/removidos não aparecem
- Subreddits privados são inacessíveis
- Conteúdo NSFW pode ser filtrado

## Alternativas e Fallbacks

### 1. Dados Simulados

Quando as APIs não estão disponíveis, a aplicação gera dados simulados realísticos:

```typescript
const twitterTemplates = [
  `Acabei de usar o ${companyName} e fiquei impressionado! 👏`,
  `${companyName} superou minhas expectativas. Recomendo! ⭐⭐⭐⭐⭐`,
  // ... mais templates
];
```

### 2. Cache Inteligente

- **TTL**: 15 minutos para dados reais
- **Invalidação**: Automática após expiração
- **Fallback**: Dados simulados quando cache expira e API falha

### 3. Estratégias de Retry

```typescript
// Retry automático com backoff exponencial
const retryWithBackoff = async (fn: Function, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
};
```

## Custos e Planejamento

### Twitter API

**Plano Gratuito (Essential):**
- $0/mês
- 500.000 tweets/mês
- Adequado para testes e desenvolvimento

**Plano Pago (Elevated):**
- $100/mês
- 2 milhões de tweets/mês
- Recomendado para produção

### Reddit API

**Plano Gratuito:**
- $0/mês
- 60 requests/minuto
- Sem limite mensal oficial
- Adequado para a maioria dos casos

## Troubleshooting

### Problemas Comuns

#### Twitter: "Invalid Bearer Token"

```bash
# Verificar se o token está correto
curl -H "Authorization: Bearer $TWITTER_BEARER_TOKEN" \
  "https://api.twitter.com/2/tweets/search/recent?query=test&max_results=10"
```

#### Reddit: "401 Unauthorized"

```bash
# Testar autenticação
curl -X POST https://www.reddit.com/api/v1/access_token \
  -H "Authorization: Basic $(echo -n 'client_id:client_secret' | base64)" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials"
```

#### Rate Limit Excessivo

1. Verificar frequência de requests
2. Implementar cache mais agressivo
3. Reduzir número de análises simultâneas
4. Considerar upgrade de plano

### Logs de Debug

Ativar logs detalhados:

```env
DEBUG=api:twitter,api:reddit npm run dev
```

## Próximos Passos

### Expansão de Plataformas

1. **Instagram Basic Display API**
2. **LinkedIn API**
3. **TikTok Research API**
4. **YouTube Data API**

### Melhorias de Integração

1. **Webhook para dados em tempo real**
2. **Análise de imagens/vídeos**
3. **Detecção de influenciadores**
4. **Análise de hashtags trending**

## Suporte

Para problemas com APIs externas:

1. Consulte [Troubleshooting](./TROUBLESHOOTING.md)
2. Verifique status das APIs:
   - [Twitter API Status](https://api.twitterstat.us/)
   - [Reddit Status](https://www.redditstatus.com/)
3. Entre em contato com a equipe de desenvolvimento

## Referências

- [Twitter API v2 Documentation](https://developer.twitter.com/en/docs/twitter-api)
- [Reddit API Documentation](https://www.reddit.com/dev/api/)
- [OAuth 2.0 RFC](https://tools.ietf.org/html/rfc6749)
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)
