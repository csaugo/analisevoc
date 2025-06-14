
# Voz do Cliente - Sistema de Análise de Sentimento

## 📋 Visão Geral

O **Voz do Cliente** é uma aplicação web moderna desenvolvida em Next.js que realiza análise de sentimento em tempo real de menções de empresas nas redes sociais Twitter e Reddit. A aplicação coleta, processa e apresenta insights valiosos sobre a percepção da marca no ambiente digital.

## 🚀 Funcionalidades Principais

- **Análise de Sentimento Multi-Plataforma**: Integração com APIs do Twitter e Reddit
- **Dashboard Interativo**: Visualizações em tempo real com gráficos e métricas
- **Relatórios em PDF**: Geração automática de relatórios executivos
- **Histórico de Análises**: Armazenamento e consulta de análises anteriores
- **Interface Responsiva**: Design moderno e adaptável para diferentes dispositivos

## 🛠️ Tecnologias Utilizadas

### Frontend
- **Next.js 14.2.28** - Framework React para produção
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS utilitário
- **Radix UI** - Componentes acessíveis
- **React Query** - Gerenciamento de estado servidor
- **Plotly.js** - Visualizações de dados
- **Framer Motion** - Animações

### Backend
- **Node.js** - Runtime JavaScript
- **Prisma** - ORM para banco de dados
- **PostgreSQL** - Banco de dados relacional
- **Next.js API Routes** - Endpoints da API

### Integrações Externas
- **Twitter API v2** - Coleta de tweets
- **Reddit API** - Coleta de posts
- **Análise de Sentimento** - Processamento de linguagem natural

## 📋 Requisitos do Sistema

### Requisitos Mínimos
- **Node.js**: 18.0.0 ou superior
- **npm**: 8.0.0 ou superior
- **PostgreSQL**: 12.0 ou superior
- **Memória RAM**: 2GB mínimo, 4GB recomendado
- **Espaço em Disco**: 1GB para aplicação + espaço para banco de dados
- **Sistema Operacional**: Linux (Ubuntu 20.04+), macOS, Windows 10+

### Requisitos de Produção
- **CPU**: 2 cores mínimo, 4 cores recomendado
- **Memória RAM**: 4GB mínimo, 8GB recomendado
- **Espaço em Disco**: 10GB mínimo
- **Largura de Banda**: Conexão estável com internet
- **SSL/TLS**: Certificado válido para HTTPS

## 📁 Estrutura do Projeto

```
voc-analyzer/
└── app/
    ├── app/                    # Páginas e rotas da aplicação
    │   ├── analysis/          # Página de análise
    │   ├── api/               # Endpoints da API
    │   ├── history/           # Histórico de análises
    │   ├── layout.tsx         # Layout principal
    │   └── page.tsx           # Página inicial
    ├── components/            # Componentes React reutilizáveis
    │   ├── ui/               # Componentes de interface
    │   ├── competitor-chart.tsx
    │   ├── engagement-chart.tsx
    │   ├── sentiment-chart.tsx
    │   └── tweets-list.tsx
    ├── lib/                   # Utilitários e configurações
    │   ├── db/               # Configurações do banco
    │   ├── db.ts             # Cliente Prisma
    │   ├── sentiment-analyzer.ts
    │   ├── pdf-generator.ts
    │   └── utils.ts
    ├── prisma/               # Schema e migrações do banco
    │   └── schema.prisma
    ├── package.json          # Dependências do projeto
    └── .env.example          # Exemplo de variáveis de ambiente
```

## 🔗 Links da Documentação

Para informações detalhadas sobre instalação, configuração e deploy, consulte:

- [📦 Guia de Instalação](./docs/INSTALLATION.md)
- [⚙️ Guia de Configuração](./docs/CONFIGURATION.md)
- [🚀 Guia de Deploy](./docs/DEPLOY.md)
- [🏗️ Documentação Técnica](./docs/TECHNICAL.md)
- [🔌 APIs Externas](./docs/EXTERNAL_APIS.md)
- [🔧 Troubleshooting](./docs/TROUBLESHOOTING.md)
- [👤 Guia do Usuário](./docs/USER_GUIDE.md)

## 🤝 Suporte

Para suporte técnico ou dúvidas sobre a implementação, entre em contato com a equipe de desenvolvimento.

## 📄 Licença

Este projeto é propriedade da empresa e destinado ao uso interno.
