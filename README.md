# Movies Recommend

Sistema de recomendação de filmes baseado em modelo neural e busca vetorial. O usuário curte filmes e recebe sugestões personalizadas com base em gênero, classificação etária, diretor e perfil de idade dos usuários que curtiram cada filme.

## O que o projeto faz

- **Treino de modelo neural** (TensorFlow.js) no browser via Web Worker
- **Encoding de filmes** em vetores usando: gênero (40%), classificação etária (30%), diretor (20%), idade média dos usuários (10%)
- **Armazenamento de vetores** na tabela `movie_vectors` (PostgreSQL + pgvector)
- **Recomendações** via similaridade de cosseno entre vetores ou predição do modelo neural
- **Interface** para selecionar usuário, curtir filmes e visualizar recomendações

## Tecnologias

| Stack | Tecnologia |
|-------|------------|
| Frontend | Next.js 16, React 19, Tailwind CSS |
| Backend | Next.js API Routes (Node.js) |
| Banco de dados | PostgreSQL + pgvector |
| ML | TensorFlow.js (browser + Node) |
| Linguagem | TypeScript |

## Estrutura do projeto

```
movies-recommend/
├── app/
│   ├── api/
│   │   ├── movies/
│   │   │   ├── route.ts          # GET filmes (listagem, busca)
│   │   │   ├── vectors/route.ts  # POST vetores do modelo
│   │   │   └── similar/route.ts  # GET filmes similares (por movieId)
│   │   └── users/
│   │       ├── route.ts          # GET/POST usuários
│   │       ├── [id]/like/route.ts
│   │       └── [id]/recommendations/route.ts  # GET recomendações
│   ├── page.tsx                  # Página principal
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── MovieCard.tsx
│   ├── MovieGrid.tsx
│   ├── RecommendationPanel.tsx
│   └── UserSelector.tsx
├── controller/
│   └── WorkerController.ts        # Orquestra worker e eventos
├── worker/
│   └── modelTrainingWorker.ts    # Treino + encoding + recommend
├── lib/
│   ├── db.ts                     # Pool PostgreSQL
│   └── helpers.ts                # normalize, averageVectors
├── types/
│   ├── constants.ts
│   ├── Events.ts
│   └── schemas.ts
├── db/
│   └── migrations/               # SQL migrations
├── scripts/
│   ├── create-database.ts
│   ├── run-migrations.ts
│   ├── reset-db.ts
│   └── ingest-users.ts
└── data/
    ├── user.json                 # Dados de usuários (ingest)
    └── tmdb_5000_credits.csv     # Dados de filmes
```

## Como rodar

### 1. Pré-requisitos

- Node.js 18+
- PostgreSQL com extensão [pgvector](https://github.com/pgvector/pgvector)

### 2. Variáveis de ambiente

Copie o arquivo de exemplo e preencha:

```bash
cp .env.example .env
```

Edite `.env` com suas credenciais do PostgreSQL.

### 3. Banco de dados

```bash
# Criar banco (se não existir)
npm run db:create

# Executar migrations
npm run db:migrate

# (Opcional) Resetar e rodar migrations
npm run db:reset
```

### 4. Popular dados

```bash
# Ingerir usuários e filmes de data/user.json
npm run ingest
```

### 5. Aplicação

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

Acesse [http://localhost:3000](http://localhost:3000).

### 6. Fluxo de uso

1. Abra o app no navegador
2. O treino do modelo inicia automaticamente ao carregar usuários
3. Selecione um usuário e curta filmes
4. As recomendações aparecem no painel (3 filmes mais similares aos curtidos)

## APIs

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/users` | Lista usuários com filmes curtidos |
| POST | `/api/users` | Cria usuário |
| POST | `/api/users/[id]/like` | Toggle like em filme |
| GET | `/api/users/[id]/recommendations` | Recomendações (vetores) |
| GET | `/api/movies` | Lista filmes |
| POST | `/api/movies/vectors` | Salva vetores do modelo |
| GET | `/api/movies/similar?movieId=X` | Filmes similares a X |
