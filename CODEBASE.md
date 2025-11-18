# Guia Completo da Codebase - Lembrancas

Este documento fornece uma visão detalhada e completa da arquitetura, estrutura e funcionamento do projeto Lembrancas (Habit Tracker).

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura do Projeto](#estrutura-do-projeto)
3. [Backend (Go API)](#backend-go-api)
4. [Frontend (React Native/Expo)](#frontend-react-nativeexpo)
5. [Fluxo de Dados](#fluxo-de-dados)
6. [Configurações Importantes](#configurações-importantes)
7. [Debugging e Troubleshooting](#debugging-e-troubleshooting)
8. [Gitignore - Explicação Detalhada](#gitignore---explicação-detalhada)

---

## Visão Geral

**Lembrancas** é um aplicativo de rastreamento de hábitos com as seguintes características:

- **Backend**: API REST em Go usando Chi Router, GORM e SQLite
- **Frontend**: Aplicativo React Native com Expo, TypeScript e React Native Paper
- **Funcionalidades**: Criação de hábitos, marcação de conclusões por data, navegação por calendário, estatísticas

### Stack Tecnológico

**Backend:**
- Go 1.25+
- Chi Router (HTTP router)
- GORM (ORM para Go)
- SQLite (banco de dados)
- Google UUID

**Frontend:**
- React Native 0.81.5
- Expo ~54.0
- TypeScript 5.9
- React Native Paper (UI components)
- Expo Router (file-based routing)

---

## Estrutura do Projeto

```
mobile/
├── .gitignore              # Ignorar arquivos (raiz)
├── README.md               # Documentação principal
├── README-DOCKER.md        # Documentação Docker
├── CODEBASE.md            # Este arquivo
├── docker-compose.yml      # Orquestração Docker
├── .dockerignore          # Arquivos ignorados no Docker build
│
├── lembrancas-api/        # Backend Go
│   ├── cmd/
│   │   ├── main.go        # Ponto de entrada da aplicação
│   │   └── api.go         # Configuração do servidor HTTP
│   ├── internal/
│   │   ├── database/      # Configuração do banco de dados
│   │   ├── models/        # Modelos de dados (Habit, HabitCompletion)
│   │   ├── services/      # Lógica de negócio
│   │   ├── handlers/      # Handlers HTTP (controllers)
│   │   └── middleware/    # Middleware (CORS, etc)
│   ├── go.mod             # Dependências Go
│   ├── go.sum             # Checksums das dependências
│   ├── habits.db          # Banco de dados SQLite (não versionado)
│   └── Dockerfile         # Imagem Docker do backend
│
└── lembrancas/            # Frontend React Native
    ├── app/               # Rotas (Expo Router)
    │   ├── _layout.tsx    # Layout raiz
    │   └── (tabs)/        # Rotas com tabs
    │       ├── _layout.tsx
    │       ├── index.tsx  # Tela principal de hábitos
    │       └── explore.tsx
    ├── components/        # Componentes reutilizáveis
    ├── services/          # Serviços (API client)
    ├── types/             # Definições TypeScript
    ├── hooks/             # Custom hooks
    ├── constants/         # Constantes (tema, etc)
    ├── assets/            # Imagens, ícones
    ├── package.json       # Dependências Node.js
    └── Dockerfile         # Imagem Docker do frontend
```

---

## Backend (Go API)

### Arquitetura

O backend segue uma arquitetura em camadas:

```
HTTP Request
    ↓
Handlers (controllers) → Services (business logic) → Models (database)
    ↓
HTTP Response
```

### Componentes Principais

#### 1. `cmd/main.go` - Ponto de Entrada

**Responsabilidades:**
- Inicializa o logger
- Conecta ao banco de dados SQLite
- Configura a aplicação
- Inicia o servidor HTTP na porta 8080

**Fluxo:**
1. Cria logger com `slog`
2. Obtém DSN do banco (padrão: `habits.db` ou variável `DB_DSN`)
3. Conecta ao banco via `database.Connect()`
4. Cria instância da aplicação com config
5. Monta rotas e inicia servidor

**Variáveis de Ambiente:**
- `DB_DSN`: Caminho do arquivo SQLite (opcional, padrão: `habits.db`)

#### 2. `cmd/api.go` - Configuração do Servidor

**Responsabilidades:**
- Define rotas HTTP usando Chi Router
- Aplica middlewares (CORS, logging, recovery, timeout)
- Registra handlers

**Middlewares Aplicados:**
- `CORS`: Permite requisições cross-origin
- `RequestID`: Adiciona ID único a cada requisição
- `RealIP`: Obtém IP real do cliente
- `Logger`: Log de requisições
- `Recoverer`: Recupera de panics
- `Timeout`: Timeout de 60 segundos

**Rotas:**
```
GET    /                    → Health check
POST   /api/habits          → Criar hábito
GET    /api/habits          → Listar todos os hábitos
GET    /api/habits/:id      → Buscar hábito específico
PUT    /api/habits/:id      → Atualizar hábito
DELETE /api/habits/:id      → Deletar hábito
POST   /api/habits/:id/complete → Marcar como completo
DELETE /api/habits/:id/complete/:date → Remover conclusão
GET    /api/habits/:id/statistics → Estatísticas do hábito
GET    /api/habits/:id/completions → Histórico de conclusões
```

#### 3. `internal/models/habit.go` - Modelos de Dados

**Estruturas:**

**Habit:**
```go
type Habit struct {
    ID          uuid.UUID
    Name        string
    Description string
    Frequency   Frequency  // "daily", "weekly", "custom"
    Color       string     // Hex color (#3B82F6)
    Category    string
    CreatedAt   time.Time
    UpdatedAt   time.Time
    Completions []HabitCompletion
}
```

**HabitCompletion:**
```go
type HabitCompletion struct {
    ID          uuid.UUID
    HabitID     uuid.UUID
    CompletedAt time.Time
    Notes       string
    CreatedAt   time.Time
}
```

**Hooks GORM:**
- `BeforeCreate`: Gera UUID automaticamente se não existir

#### 4. `internal/database/db.go` - Conexão com Banco

**Responsabilidades:**
- Configura driver SQLite
- Conecta ao banco de dados
- Executa migrations automáticas (GORM AutoMigrate)

**Importante:**
- Usa `gorm.io/driver/sqlite` com `glebarez/sqlite` (pure Go)
- AutoMigrate cria/atualiza tabelas automaticamente
- Banco de dados é um arquivo SQLite (`habits.db`)

#### 5. `internal/services/habit.go` - Lógica de Negócio

**Classe:** `HabitService`

**Métodos Principais:**

**Create(habit)**
- Cria novo hábito
- Define valores padrão: Frequency="daily", Color="#3B82F6"
- Retorna erro se falhar

**GetAll()**
- Retorna todos os hábitos
- Ordenação padrão do GORM

**GetByID(id)**
- Busca hábito por UUID
- Retorna erro "habit not found" se não existir

**Update(id, habit)**
- Atualiza hábito existente
- Retorna erro se não encontrado

**Delete(id)**
- Deleta hábito (cascade deleta completions via GORM)
- Retorna erro se não encontrado

**MarkComplete(habitID, date)**
- Marca hábito como completo para uma data específica
- Normaliza data para início do dia (00:00:00)
- Verifica se já está completo (retorna erro 409 se sim)
- Cria registro em `HabitCompletion`

**UnmarkComplete(habitID, date)**
- Remove conclusão de uma data específica
- Retorna erro se não encontrado

**GetCompletions(habitID)**
- Retorna todas as conclusões de um hábito
- Ordenado por data DESC (mais recente primeiro)

**GetStatistics(habitID)**
- Calcula estatísticas do hábito:
  - `TotalCompletions`: Total de conclusões
  - `CurrentStreak`: Sequência atual de dias consecutivos
  - `LongestStreak`: Maior sequência de dias consecutivos
  - `CompletionRate`: Taxa de conclusão em porcentagem
  - `Completions`: Array de datas de conclusão

**Lógica de Streaks:**
- **Current Streak**: Conta dias consecutivos a partir de hoje para trás
- **Longest Streak**: Percorre todas as datas e encontra a maior sequência

#### 6. `internal/handlers/habit.go` - Controllers HTTP

**Classe:** `HabitHandler`

**Padrão de Resposta:**
- Sucesso: `respondJSON(w, status, data)`
- Erro: `respondError(w, status, message)`

**Handlers:**

**CreateHabit**
- Valida nome obrigatório
- Cria hábito via service
- Retorna 201 Created com hábito criado

**GetAllHabits**
- Retorna 200 OK com array de hábitos

**GetHabit**
- Valida UUID
- Retorna 404 se não encontrado
- Retorna 200 OK com hábito

**UpdateHabit**
- Valida UUID
- Atualiza hábito
- Retorna hábito atualizado

**DeleteHabit**
- Valida UUID
- Deleta hábito
- Retorna mensagem de sucesso

**MarkComplete**
- Valida UUID
- Aceita data opcional no body (formato YYYY-MM-DD)
- Se não fornecido, usa data atual
- Retorna 409 Conflict se já completo
- Retorna 200 OK com mensagem

**UnmarkComplete**
- Valida UUID e data (formato YYYY-MM-DD na URL)
- Remove conclusão
- Retorna 404 se não encontrado

**GetStatistics**
- Valida UUID
- Calcula e retorna estatísticas

**GetCompletions**
- Valida UUID
- Retorna array de conclusões

#### 7. `internal/middleware/cors.go` - CORS

**Configuração:**
- Permite todas as origens (`*`)
- Permite métodos: GET, POST, PUT, DELETE, OPTIONS
- Permite headers: Content-Type, Authorization
- Expõe headers: Content-Length

---

## Frontend (React Native/Expo)

### Arquitetura

```
User Interaction
    ↓
Components (UI)
    ↓
Services (API calls)
    ↓
Backend API
```

### Componentes Principais

#### 1. `app/(tabs)/index.tsx` - Tela Principal de Hábitos

**Estado:**
- `habits`: Array de hábitos
- `selectedDate`: Data selecionada (YYYY-MM-DD)
- `completedHabits`: Set de IDs de hábitos completos na data selecionada
- `loading`: Estado de carregamento inicial
- `refreshing`: Estado de pull-to-refresh
- `dialogVisible`: Visibilidade do diálogo de criar hábito
- `snackbarVisible`: Visibilidade do snackbar
- `snackbarMessage`: Mensagem do snackbar
- `togglingIds`: Set de IDs sendo processados (evita cliques duplos)

**Funções Utilitárias:**

**getTodayDate()**
- Retorna data atual em formato YYYY-MM-DD

**isDateToday(dateString)**
- Verifica se uma data é hoje

**formatDateForDisplay(dateString)**
- Formata data para exibição: "17 Nov 2025"
- Usa meses em português abreviados

**addDays(dateString, days)**
- Adiciona/subtrai dias de uma data
- Retorna string YYYY-MM-DD

**isCompletionForDate(completionDate, selectedDate)**
- Compara se uma conclusão corresponde à data selecionada
- Extrai YYYY-MM-DD da string ISO da API
- Compara diretamente as strings

**Funções Principais:**

**loadHabits(date)**
- Carrega todos os hábitos
- Para cada hábito, carrega conclusões
- Verifica quais estão completos para a data selecionada
- Atualiza `completedHabits`
- Logs detalhados para debugging

**handleToggleComplete(habitId)**
- Alterna estado de conclusão do hábito
- Se completo: remove conclusão via `removeCompletion()`
- Se incompleto: marca como completo via `completeHabit()` com data selecionada
- Trata erro 409 (já completo) graciosamente
- Atualiza estado local imediatamente

**handlePreviousDay()**
- Navega para dia anterior
- Atualiza `selectedDate`

**handleNextDay()**
- Navega para próximo dia
- Permite navegação para datas futuras

**handleGoToToday()**
- Volta para data atual

**Navegação de Data:**
- Header com botões anterior/próximo
- Exibe data formatada
- Botão "Hoje" aparece quando não está na data atual
- Divisor visual abaixo do header

**UI:**
- Lista de hábitos com checkbox
- Pull-to-refresh
- FAB (Floating Action Button) para criar hábito
- Snackbar para feedback
- Loading spinner durante carregamento inicial

#### 2. `services/api.ts` - Cliente API

**Base URL:** `http://localhost:8080/api`

**Funções:**

**handleResponse<T>(response)**
- Trata respostas HTTP
- Se erro, extrai mensagem do JSON
- Lança Error com mensagem

**getHabits()**
- GET `/api/habits`
- Retorna `Promise<Habit[]>`

**getHabit(id)**
- GET `/api/habits/:id`
- Retorna `Promise<Habit>`

**createHabit(data)**
- POST `/api/habits`
- Body: `CreateHabitRequest`
- Retorna `Promise<Habit>`

**updateHabit(id, data)**
- PUT `/api/habits/:id`
- Body: `Partial<CreateHabitRequest>`
- Retorna `Promise<Habit>`

**deleteHabit(id)**
- DELETE `/api/habits/:id`
- Retorna `Promise<void>`

**completeHabit(id, data?)**
- POST `/api/habits/:id/complete`
- Body opcional: `{ date?: string }`
- Se data não fornecida, usa hoje
- Retorna `Promise<void>`
- Preserva status code do erro (para tratar 409)

**getHabitCompletions(id)**
- GET `/api/habits/:id/completions`
- Retorna `Promise<HabitCompletion[]>`

**removeCompletion(id, date)**
- DELETE `/api/habits/:id/complete/:date`
- Retorna `Promise<void>`

#### 3. `types/habit.ts` - Definições TypeScript

**Tipos:**

```typescript
type HabitFrequency = 'daily' | 'weekly' | 'custom'

interface Habit {
  id: string
  name: string
  description?: string
  frequency: HabitFrequency
  color: string
  category?: string
  created_at: string
  updated_at: string
}

interface HabitCompletion {
  id: string
  habit_id: string
  completed_at: string
  notes?: string
  created_at: string
}

interface CreateHabitRequest {
  name: string
  description?: string
  frequency: HabitFrequency
  color: string
  category?: string
}

interface CompleteHabitRequest {
  date?: string  // YYYY-MM-DD
}

interface ApiError {
  error: string
}
```

#### 4. `components/AddHabitDialog.tsx` - Diálogo de Criar Hábito

**Props:**
- `visible`: boolean
- `onDismiss`: () => void
- `onSubmit`: (data) => void

**Campos:**
- Nome (obrigatório)
- Descrição (opcional)
- Frequência (daily/weekly/custom)
- Cor (color picker)
- Categoria (opcional)

#### 5. `app/_layout.tsx` - Layout Raiz

**Configurações:**
- PaperProvider (React Native Paper theme)
- ThemeProvider (dark/light mode)
- Stack Navigator (Expo Router)
- StatusBar

---

## Fluxo de Dados

### Criar Hábito

```
User → AddHabitDialog (form)
    → handleCreateHabit()
    → createHabit(api.ts)
    → POST /api/habits
    → HabitHandler.CreateHabit
    → HabitService.Create
    → Database (INSERT)
    → Response (Habit)
    → Update UI (add to habits array)
```

### Marcar Hábito como Completo

```
User → Checkbox click
    → handleToggleComplete()
    → completeHabit(api.ts, { date: selectedDate })
    → POST /api/habits/:id/complete
    → HabitHandler.MarkComplete
    → HabitService.MarkComplete
    → Database (INSERT HabitCompletion)
    → Response
    → Update UI (add to completedHabits Set)
```

### Navegar entre Datas

```
User → Previous/Next button
    → handlePreviousDay() / handleNextDay()
    → setSelectedDate(newDate)
    → useEffect triggers
    → loadHabits(newDate)
    → For each habit: getHabitCompletions()
    → Check isCompletionForDate()
    → Update completedHabits Set
    → Re-render UI
```

### Carregar Hábitos

```
Component mount / date change
    → loadHabits(selectedDate)
    → getHabits() (all habits)
    → For each habit:
        → getHabitCompletions(habit.id)
        → Filter completions for selectedDate
        → Build completedHabits Set
    → Update state
    → Render
```

---

## Configurações Importantes

### Backend

**Porta:** 8080 (hardcoded em `cmd/main.go`)

**Banco de Dados:**
- Arquivo: `habits.db` (padrão)
- Variável: `DB_DSN` (opcional)
- Driver: SQLite (gorm.io/driver/sqlite)

**CORS:**
- Permite todas as origens
- Configurado em `internal/middleware/cors.go`

### Frontend

**API URL:** `http://localhost:8080/api` (hardcoded em `services/api.ts`)

**Portas Expo:**
- 19000: Metro bundler
- 19001: Expo DevTools
- 19002: Expo DevTools (alternativa)
- 8081: Web (se habilitado)

**Navegação:**
- File-based routing (Expo Router)
- Tabs em `app/(tabs)/`

---

## Debugging e Troubleshooting

### Problemas Comuns

#### 1. Hábitos aparecem completos em datas erradas

**Sintoma:** Ao navegar para uma data passada, hábitos de outras datas aparecem como completos.

**Causa:** Função `isCompletionForDate` não está comparando corretamente.

**Solução:**
- Verificar logs do console: `[isCompletionForDate]`
- Garantir que `completionDate.split('T')[0]` extrai apenas YYYY-MM-DD
- Verificar que `selectedDate` está no formato YYYY-MM-DD

**Debug:**
```typescript
console.log('[isCompletionForDate]', {
  completionDate,
  completionDateStr,
  selectedDate,
  matches,
});
```

#### 2. API não responde

**Sintoma:** Frontend não consegue conectar à API.

**Verificações:**
1. Backend está rodando? `curl http://localhost:8080/`
2. Porta 8080 está livre?
3. CORS está configurado?
4. URL da API está correta em `services/api.ts`?

**Debug:**
```bash
# Verificar se backend está rodando
curl http://localhost:8080/

# Ver logs do backend
docker-compose logs api

# Verificar porta
lsof -i :8080
```

#### 3. Estado não atualiza após mudar data

**Sintoma:** Ao navegar entre datas, os hábitos não atualizam.

**Causa:** `useEffect` não está sendo disparado ou `loadHabits` não está sendo chamado.

**Solução:**
- Verificar logs: `[useEffect] selectedDate changed to:`
- Verificar se `completedHabits` está sendo limpo antes de carregar
- Verificar se `loadHabits` está na lista de dependências do `useEffect`

**Debug:**
```typescript
useEffect(() => {
  console.log('[useEffect] selectedDate changed to:', selectedDate);
  setCompletedHabits(new Set()); // Clear immediately
  loadHabits(selectedDate);
}, [loadHabits, selectedDate]);
```

#### 4. Erro 409 ao marcar hábito como completo

**Sintoma:** Ao tentar marcar hábito como completo, recebe erro 409.

**Causa:** Hábito já está completo para aquela data.

**Solução:**
- O código já trata isso graciosamente
- Verificar se o estado local está sincronizado
- Verificar se a data está correta

#### 5. Banco de dados não persiste

**Sintoma:** Dados são perdidos ao reiniciar.

**Causa:** Arquivo `habits.db` não está sendo persistido.

**Solução:**
- Verificar se volume Docker está montado
- Verificar permissões do arquivo
- Verificar se `DB_DSN` está apontando para o arquivo correto

### Logs Úteis

O código inclui logs detalhados para debugging:

**Frontend:**
- `[loadHabits]` - Carregamento de hábitos
- `[isCompletionForDate]` - Comparação de datas
- `[useEffect]` - Mudanças de estado
- `[handlePreviousDay/NextDay]` - Navegação de data
- `[Render]` - Renderização de componentes

**Backend:**
- Logs automáticos do Chi Router (middleware.Logger)
- Logs de erro via `slog.Error`

### Ferramentas de Debug

**Backend:**
```bash
# Ver logs em tempo real
docker-compose logs -f api

# Entrar no container
docker-compose exec api sh

# Ver banco de dados
sqlite3 lembrancas-api/habits.db
```

**Frontend:**
```bash
# Ver logs do Metro
npx expo start

# React Native Debugger
# Abrir DevTools no navegador

# Ver logs no console do navegador (web)
# Ou React Native Debugger (mobile)
```

---

## Gitignore - Explicação Detalhada

O arquivo `.gitignore` na raiz do projeto controla quais arquivos são ignorados pelo Git. Abaixo está uma explicação detalhada de cada seção:

### Dependencies

```gitignore
node_modules/
vendor/
```

- **`node_modules/`**: Pacotes npm instalados (podem ser reinstalados via `npm install`)
- **`vendor/`**: Dependências Go baixadas (equivalente ao node_modules para Go)

### Expo

```gitignore
.expo/
dist/
web-build/
expo-env.d.ts
```

- **`.expo/`**: Cache e arquivos temporários do Expo
- **`dist/`**: Build de distribuição
- **`web-build/`**: Build para web
- **`expo-env.d.ts`**: Arquivo TypeScript gerado automaticamente

### Native

```gitignore
.kotlin/
*.orig.*
*.jks
*.p8
*.p12
*.key
*.mobileprovision
```

- **`.kotlin/`**: Arquivos Kotlin temporários
- **`*.orig.*`**: Arquivos de backup de merge
- **`*.jks`**: Java KeyStore (certificados Android)
- **`*.p8`**: Certificado iOS (Apple)
- **`*.p12`**: Certificado iOS (PKCS#12)
- **`*.key`**: Chaves privadas
- **`*.mobileprovision`**: Perfis de provisionamento iOS

### Metro

```gitignore
.metro-health-check*
```

- Arquivos de health check do Metro bundler (React Native)

### Debug

```gitignore
npm-debug.*
yarn-debug.*
yarn-error.*
```

- Logs de erro do npm/yarn

### macOS

```gitignore
.DS_Store
*.pem
```

- **`.DS_Store`**: Arquivo de metadados do macOS
- **`*.pem`**: Certificados PEM

### Local env files

```gitignore
.env*.local
.env
```

- Arquivos de variáveis de ambiente locais (podem conter secrets)

### TypeScript

```gitignore
*.tsbuildinfo
```

- Arquivo de cache do TypeScript compiler

### Generated native folders

```gitignore
/ios
/android
app-example
```

- Pastas nativas geradas (podem ser regeneradas)
- **`app-example`**: Exemplo de código do Expo

### Go binaries

```gitignore
*.exe
*.exe~
*.dll
*.so
*.dylib
```

- Binários compilados do Go (Windows, Linux, macOS)

### Test binary

```gitignore
*.test
```

- Binários de teste compilados

### Code coverage

```gitignore
*.out
coverage.*
*.coverprofile
profile.cov
```

- Arquivos de cobertura de código (testes)

### Go workspace

```gitignore
go.work
go.work.sum
```

- Arquivos de workspace do Go (múltiplos módulos)

### Database files

```gitignore
*.db
*.db-shm
*.db-wal
```

- **`*.db`**: Arquivos SQLite (banco de dados)
- **`*.db-shm`**: Shared memory file do SQLite
- **`*.db-wal`**: Write-Ahead Log do SQLite

**⚠️ IMPORTANTE:** O banco de dados não é versionado porque:
- Pode conter dados sensíveis
- É específico do ambiente de desenvolvimento
- Pode ser grande
- Pode ser recriado via migrations

### Editor/IDE

```gitignore
.idea/
.vscode/
*.swp
*.swo
*~
```

- **`.idea/`**: Configurações do IntelliJ IDEA / WebStorm
- **`.vscode/`**: Configurações do VS Code
- **`*.swp`, `*.swo`, `*~`**: Arquivos temporários do Vim

### Docker

```gitignore
.docker/
```

- Arquivos temporários do Docker

### Logs

```gitignore
*.log
logs/
```

- Arquivos de log

### OS

```gitignore
Thumbs.db
```

- Arquivo de thumbnails do Windows

---

## Pontos Importantes para Manutenção

### Backend

1. **UUIDs**: Todos os IDs são UUIDs (não inteiros sequenciais)
2. **Datas**: Sempre normalizadas para início do dia (00:00:00)
3. **Erros**: Sempre retornam mensagens descritivas em JSON
4. **CORS**: Configurado para permitir todas as origens (ajustar em produção)
5. **Timeout**: 60 segundos para requisições

### Frontend

1. **Estado**: `completedHabits` é um `Set<string>` para lookup O(1)
2. **Datas**: Sempre no formato YYYY-MM-DD para consistência
3. **Logs**: Muitos logs para debugging (remover em produção)
4. **API URL**: Hardcoded como `localhost:8080` (usar variável de ambiente em produção)
5. **Loading States**: Múltiplos estados de loading para melhor UX

### Performance

1. **N+1 Problem**: `loadHabits` faz uma requisição por hábito para buscar conclusões
   - **Solução futura**: Endpoint que retorna hábitos com conclusões em uma única requisição

2. **Re-renders**: Componentes podem re-renderizar desnecessariamente
   - **Solução**: Usar `React.memo` ou `useMemo` onde apropriado

3. **Database**: SQLite é adequado para desenvolvimento, considerar PostgreSQL em produção

---

## Próximos Passos Sugeridos

1. **Otimizações:**
   - Endpoint para buscar hábitos com conclusões em batch
   - Cache de conclusões no frontend
   - Paginação de hábitos

2. **Features:**
   - Edição de hábitos
   - Notificações
   - Exportação de dados
   - Estatísticas visuais (gráficos)

3. **Melhorias:**
   - Variáveis de ambiente para configuração
   - Testes unitários e de integração
   - CI/CD pipeline
   - Documentação da API (Swagger/OpenAPI)

---

## Conclusão

Este guia fornece uma visão completa da codebase. Para questões específicas, consulte:

- **API**: `lembrancas/API.md`
- **Docker**: `README-DOCKER.md`
- **Geral**: `README.md`

Mantenha este documento atualizado conforme o projeto evolui!

