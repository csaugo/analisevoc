
# 📦 Guia de Instalação - Voz do Cliente

## Pré-requisitos

### Software Necessário

1. **Node.js 18.0.0+**
   ```bash
   # Verificar versão instalada
   node --version
   npm --version
   
   # Instalar via NodeSource (Ubuntu/Debian)
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Instalar via nvm (recomendado)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18
   nvm use 18
   ```

2. **PostgreSQL 12.0+**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   
   # CentOS/RHEL
   sudo yum install postgresql-server postgresql-contrib
   sudo postgresql-setup initdb
   sudo systemctl enable postgresql
   sudo systemctl start postgresql
   ```

3. **Git**
   ```bash
   # Ubuntu/Debian
   sudo apt install git
   
   # CentOS/RHEL
   sudo yum install git
   ```

## Instalação Passo a Passo

### 1. Clonar o Repositório

```bash
# Clonar o projeto
git clone <URL_DO_REPOSITORIO>
cd voc-analyzer

# Verificar estrutura
ls -la
```

### 2. Configurar o Banco de Dados

```bash
# Acessar PostgreSQL como superusuário
sudo -u postgres psql

# Criar banco de dados e usuário
CREATE DATABASE voz_cliente;
CREATE USER voc_user WITH ENCRYPTED PASSWORD 'senha_segura_aqui';
GRANT ALL PRIVILEGES ON DATABASE voz_cliente TO voc_user;
ALTER USER voc_user CREATEDB;
\q
```

### 3. Configurar Variáveis de Ambiente

```bash
# Navegar para o diretório da aplicação
cd app

# Copiar arquivo de exemplo
cp .env.example .env

# Editar variáveis de ambiente
nano .env
```

**Configurar o arquivo `.env`:**
```env
# Database
DATABASE_URL="postgresql://voc_user:senha_segura_aqui@localhost:5432/voz_cliente"

# Twitter API (opcional para desenvolvimento)
TWITTER_BEARER_TOKEN=your_twitter_bearer_token_here

# Reddit API (opcional para desenvolvimento)
REDDIT_CLIENT_ID=your_reddit_client_id_here
REDDIT_CLIENT_SECRET=your_reddit_client_secret_here
REDDIT_USER_AGENT=VozDoCliente/1.0

# Next.js
NEXTAUTH_SECRET=gere_uma_chave_secreta_aleatoria_aqui
NEXTAUTH_URL=http://localhost:3000
```

### 4. Instalar Dependências

```bash
# Instalar dependências do projeto
npm install

# Verificar se todas as dependências foram instaladas
npm list --depth=0
```

### 5. Configurar o Banco de Dados

```bash
# Gerar cliente Prisma
npx prisma generate

# Executar migrações
npx prisma db push

# Verificar conexão com o banco
npx prisma db pull
```

### 6. Compilar a Aplicação

```bash
# Compilar para produção
npm run build

# Verificar se a compilação foi bem-sucedida
ls -la .next/
```

### 7. Testar a Instalação

```bash
# Executar em modo de desenvolvimento
npm run dev

# Ou executar em modo de produção
npm run start
```

Acesse `http://localhost:3000` para verificar se a aplicação está funcionando.

## Instalação com Docker (Alternativa)

### 1. Criar Dockerfile

```dockerfile
# Criar arquivo Dockerfile na raiz do projeto app/
FROM node:18-alpine

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Gerar cliente Prisma
RUN npx prisma generate

# Compilar aplicação
RUN npm run build

# Expor porta
EXPOSE 3000

# Comando de inicialização
CMD ["npm", "start"]
```

### 2. Criar docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://voc_user:senha_segura@db:5432/voz_cliente
      - NEXTAUTH_SECRET=sua_chave_secreta_aqui
      - NEXTAUTH_URL=http://localhost:3000
    depends_on:
      - db
    volumes:
      - .:/app
      - /app/node_modules

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=voz_cliente
      - POSTGRES_USER=voc_user
      - POSTGRES_PASSWORD=senha_segura
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### 3. Executar com Docker

```bash
# Construir e executar
docker-compose up -d

# Verificar logs
docker-compose logs -f app

# Executar migrações
docker-compose exec app npx prisma db push
```

## Verificação da Instalação

### 1. Verificar Serviços

```bash
# Verificar se o PostgreSQL está rodando
sudo systemctl status postgresql

# Verificar se a aplicação está respondendo
curl http://localhost:3000

# Verificar logs da aplicação
npm run dev # e verificar saída no terminal
```

### 2. Verificar Banco de Dados

```bash
# Conectar ao banco
psql -h localhost -U voc_user -d voz_cliente

# Verificar tabelas criadas
\dt

# Verificar se as tabelas estão corretas
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
\q
```

### 3. Teste Funcional

1. Acesse `http://localhost:3000`
2. Tente fazer uma análise de teste
3. Verifique se os dados são salvos no banco
4. Teste a geração de relatórios

## Solução de Problemas Comuns

### Erro de Conexão com Banco

```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Verificar configurações de conexão
sudo -u postgres psql -c "SELECT version();"

# Verificar se o usuário tem permissões
sudo -u postgres psql -c "\du"
```

### Erro de Dependências

```bash
# Limpar cache do npm
npm cache clean --force

# Remover node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Erro de Compilação

```bash
# Verificar versão do Node.js
node --version

# Verificar se todas as dependências estão instaladas
npm list

# Recompilar
rm -rf .next
npm run build
```

## Próximos Passos

Após a instalação bem-sucedida:

1. Consulte o [Guia de Configuração](./CONFIGURATION.md) para configurar APIs externas
2. Veja o [Guia de Deploy](./DEPLOY.md) para colocar em produção
3. Leia o [Guia do Usuário](./USER_GUIDE.md) para entender como usar a aplicação

## Suporte

Se encontrar problemas durante a instalação:

1. Consulte o [Troubleshooting](./TROUBLESHOOTING.md)
2. Verifique os logs da aplicação
3. Entre em contato com a equipe de desenvolvimento
