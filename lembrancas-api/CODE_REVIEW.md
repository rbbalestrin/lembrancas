# Code Review - Lembrancas API

## 📊 Resumo Executivo

**Avaliação Geral:** ⭐⭐⭐⭐ (4/5)

O código demonstra uma boa estruturação e organização, seguindo padrões comuns de arquitetura em Go. Há uma separação clara de responsabilidades (handlers, services, models), uso adequado de bibliotecas modernas (Chi, GORM) e implementação funcional completa. No entanto, existem várias oportunidades de melhoria em aspectos de segurança, validação, tratamento de erros, testes e configuração.

---

## ✅ Pontos Positivos

### 1. **Arquitetura e Organização**
- ✅ Separação clara de responsabilidades (handlers → services → models)
- ✅ Estrutura de diretórios bem organizada seguindo padrões Go
- ✅ Uso adequado de interfaces implícitas
- ✅ Injeção de dependências através de construtores

### 2. **Tecnologias e Bibliotecas**
- ✅ Uso do Chi router (leve e performático)
- ✅ GORM para ORM (produtivo)
- ✅ UUID para identificadores únicos
- ✅ Structured logging com slog

### 3. **Funcionalidades**
- ✅ CRUD completo de hábitos
- ✅ Sistema de completions com estatísticas
- ✅ Cálculo de streaks (atual e maior)
- ✅ Taxa de conclusão

### 4. **Middleware**
- ✅ RequestID, RealIP, Logger, Recoverer
- ✅ Timeout configurado
- ✅ Timeouts no servidor HTTP

---

## ⚠️ Áreas de Melhoria Críticas

### 1. **Segurança**

#### 🔴 **CRÍTICO: Falta de Validação de Input**
```go
// handlers/habit.go:48-58
// Validação manual apenas do campo "name"
if req.Name == "" {
    respondError(w, http.StatusBadRequest, "name is required")
    return
}
```

**Problema:** 
- Validação manual e incompleta
- Não valida formato de email, tamanho de strings, valores de enum
- Campo `validate:"required"` no struct não é usado

**Solução:**
```go
import "github.com/go-playground/validator/v10"

var validate = validator.New()

func (h *HabitHandler) CreateHabit(w http.ResponseWriter, r *http.Request) {
    var req CreateHabitRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        respondError(w, http.StatusBadRequest, "invalid request body")
        return
    }
    
    if err := validate.Struct(req); err != nil {
        respondError(w, http.StatusBadRequest, err.Error())
        return
    }
    // ...
}
```

#### 🔴 **CRÍTICO: SQL Injection Potencial**
```go
// services/habit.go:88
err = s.db.Where("habit_id = ? AND DATE(completed_at) = DATE(?)", habitID, date).First(&existing).Error
```

**Problema:** Uso de `DATE()` do SQLite pode não funcionar em todos os bancos. Melhor normalizar em Go.

**Solução:** Já está sendo feito parcialmente (linha 84), mas a query ainda usa DATE().

#### 🟡 **MÉDIO: Falta de Rate Limiting**
- Comentário no código menciona rate limiting, mas não está implementado
- API exposta sem proteção contra abuso

**Solução:**
```go
import "github.com/go-chi/httprate"

r.Use(httprate.LimitByIP(100, 1*time.Minute))
```

#### 🟡 **MÉDIO: CORS não configurado**
- API pode não funcionar corretamente com frontend em domínio diferente

**Solução:**
```go
import "github.com/go-chi/cors"

r.Use(cors.Handler(cors.Options{
    AllowedOrigins: []string{"https://*", "http://localhost:*"},
    AllowedMethods: []string{"GET", "POST", "PUT", "DELETE"},
    AllowedHeaders: []string{"Accept", "Authorization", "Content-Type"},
}))
```

### 2. **Tratamento de Erros**

#### 🔴 **CRÍTICO: Comparação de Strings para Erros**
```go
// handlers/habit.go:99
if err.Error() == "habit not found" {
    respondError(w, http.StatusNotFound, "habit not found")
    return
}
```

**Problema:** 
- Comparar strings de erro é frágil e não escalável
- Se a mensagem mudar, o código quebra
- Não funciona com erros wrapped

**Solução:** Usar sentinel errors ou error types:
```go
// services/habit.go
var (
    ErrHabitNotFound = errors.New("habit not found")
    ErrAlreadyCompleted = errors.New("habit already completed for this date")
)

// handlers/habit.go
if errors.Is(err, services.ErrHabitNotFound) {
    respondError(w, http.StatusNotFound, "habit not found")
    return
}
```

#### 🟡 **MÉDIO: Logs de Erro Expõem Detalhes Internos**
```go
// handlers/habit.go:69
slog.Error("failed to create habit", "error", err)
respondError(w, http.StatusInternalServerError, "failed to create habit")
```

**Problema:** Logs podem conter informações sensíveis que não devem ser expostas ao cliente.

**Solução:** Separar erros internos de erros do cliente, usar níveis de log apropriados.

### 3. **Validação de Dados**

#### 🟡 **MÉDIO: Validação Incompleta**
- Campo `Frequency` não valida valores permitidos
- Campo `Color` não valida formato hexadecimal
- Campos podem ter valores vazios quando não deveriam
- Tamanho máximo de strings não definido

**Solução:**
```go
type CreateHabitRequest struct {
    Name        string           `json:"name" validate:"required,min=1,max=100"`
    Description string           `json:"description" validate:"max=500"`
    Frequency   models.Frequency `json:"frequency" validate:"oneof=daily weekly custom"`
    Color       string           `json:"color" validate:"hexcolor"`
    Category    string           `json:"category" validate:"max=50"`
}
```

### 4. **Performance**

#### 🟡 **MÉDIO: N+1 Query Potencial**
```go
// services/habit.go:32-35
func (s *HabitService) GetAll() ([]models.Habit, error) {
    var habits []models.Habit
    err := s.db.Find(&habits).Error
    return habits, err
}
```

**Problema:** Se `Completions` forem carregadas depois, pode causar N+1 queries.

**Solução:** Usar `Preload` quando necessário:
```go
err := s.db.Preload("Completions").Find(&habits).Error
```

#### 🟡 **MÉDIO: Cálculo de Estatísticas Ineficiente**
```go
// services/habit.go:133-228
// GetStatistics carrega todas as completions e calcula em memória
```

**Problema:** Para hábitos com muitas completions, pode ser lento.

**Solução:** Considerar cache ou cálculos incrementais.

### 5. **Configuração**

#### 🟡 **MÉDIO: Hardcoded Values**
```go
// cmd/api.go:29
addr: ":8080",
```

**Problema:** Porta hardcoded, não usa variáveis de ambiente.

**Solução:**
```go
addr := os.Getenv("PORT")
if addr == "" {
    addr = ":8080"
}
```

#### 🟡 **MÉDIO: Falta de Configuração Centralizada**
- Configurações espalhadas pelo código
- Sem validação de configuração na inicialização

**Solução:** Criar struct de configuração centralizada.

### 6. **Qualidade do Código**

#### 🟡 **MÉDIO: Código Duplicado**
```go
// handlers/habit.go:91-95, 113-117, 156-160, etc.
id, err := uuid.Parse(chi.URLParam(r, "id"))
if err != nil {
    respondError(w, http.StatusBadRequest, "invalid habit ID")
    return
}
```

**Problema:** Código repetido em múltiplos handlers.

**Solução:** Criar middleware ou helper function:
```go
func parseUUIDParam(r *http.Request, param string) (uuid.UUID, error) {
    idStr := chi.URLParam(r, param)
    return uuid.Parse(idStr)
}
```

#### 🟡 **MÉDIO: Comentários em Português**
```go
// cmd/api.go:24
//middleware
```

**Problema:** Mistura de idiomas (código em inglês, comentários em português).

**Solução:** Padronizar para inglês ou português.

#### 🟡 **MÉDIO: Mensagens de Erro Inconsistentes**
- Algumas em inglês, outras em português
- Formato não padronizado

### 7. **Testes**

#### 🔴 **CRÍTICO: Ausência Total de Testes**
- Nenhum teste unitário encontrado
- Nenhum teste de integração
- Sem testes de handlers, services ou models

**Solução:** Implementar testes:
```go
// handlers/habit_test.go
func TestCreateHabit(t *testing.T) {
    // ...
}

// services/habit_test.go
func TestHabitService_Create(t *testing.T) {
    // ...
}
```

### 8. **Database**

#### 🟡 **MÉDIO: AutoMigrate em Produção**
```go
// database/db.go:22
if err := db.AutoMigrate(&models.Habit{}, &models.HabitCompletion{}); err != nil {
    return nil, err
}
```

**Problema:** AutoMigrate pode ser perigoso em produção.

**Solução:** Usar migrations (golang-migrate ou similar) ou pelo menos adicionar flag para desabilitar.

#### 🟡 **MÉDIO: Sem Pool de Conexões Configurado**
- SQLite não precisa de pool, mas se migrar para PostgreSQL, será necessário

### 9. **Logging**

#### 🟡 **MÉDIO: Logging Básico**
```go
// cmd/main.go:12
logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
```

**Problema:** 
- Sem níveis de log configuráveis
- Sem formatação JSON para produção
- Sem contexto estruturado

**Solução:**
```go
opts := &slog.HandlerOptions{
    Level: slog.LevelInfo,
}
if os.Getenv("ENV") == "production" {
    handler := slog.NewJSONHandler(os.Stdout, opts)
    logger := slog.New(handler)
} else {
    handler := slog.NewTextHandler(os.Stdout, opts)
    logger := slog.New(handler)
}
```

### 10. **Documentação**

#### 🟡 **MÉDIO: Falta de Documentação de Código**
- Poucos comentários explicativos
- Sem documentação de funções públicas
- API.md existe mas poderia ser mais completo

**Solução:** Adicionar godoc comments:
```go
// CreateHabit creates a new habit in the system.
// It validates the request, creates the habit via the service layer,
// and returns the created habit with a 201 status code.
func (h *HabitHandler) CreateHabit(w http.ResponseWriter, r *http.Request) {
    // ...
}
```

---

## 📋 Recomendações Prioritárias

### 🔥 **Alta Prioridade (Fazer Agora)**

1. **Implementar validação adequada de input**
   - Usar validator/v10
   - Validar todos os campos
   - Validar formatos (hex color, frequency enum)

2. **Corrigir tratamento de erros**
   - Usar sentinel errors
   - Não comparar strings de erro
   - Criar tipos de erro customizados

3. **Adicionar testes básicos**
   - Testes unitários para services
   - Testes de handlers com httptest
   - Testes de integração

4. **Configurar CORS**
   - Permitir requisições do frontend
   - Configurar origens permitidas

### ⚡ **Média Prioridade (Próximas Sprints)**

5. **Melhorar configuração**
   - Centralizar configuração
   - Usar variáveis de ambiente
   - Validar configuração na inicialização

6. **Adicionar rate limiting**
   - Proteger endpoints públicos
   - Configurar limites apropriados

7. **Refatorar código duplicado**
   - Extrair helpers comuns
   - Criar middleware para parsing de UUID

8. **Melhorar logging**
   - Níveis configuráveis
   - Formato JSON para produção
   - Contexto estruturado

### 📝 **Baixa Prioridade (Melhorias Contínuas)**

9. **Otimizar queries**
   - Usar Preload quando necessário
   - Considerar índices adicionais
   - Cache para estatísticas

10. **Documentação**
    - Adicionar godoc comments
    - Melhorar README
    - Adicionar exemplos de uso

11. **Padronizar idioma**
    - Decidir entre inglês ou português
    - Aplicar consistentemente

---

## 🎯 Conclusão

O código demonstra uma base sólida e funcional, com boa arquitetura e organização. As principais áreas de melhoria são:

1. **Segurança**: Validação de input e tratamento de erros
2. **Qualidade**: Testes e documentação
3. **Robustez**: Configuração e logging

Com as melhorias sugeridas, especialmente nas áreas críticas, o código estará pronto para produção.

**Próximos Passos Sugeridos:**
1. Implementar validação de input
2. Corrigir tratamento de erros
3. Adicionar testes básicos
4. Configurar CORS e rate limiting

---

**Revisado em:** 2025-01-27
**Revisor:** AI Code Reviewer (Senior Developer Perspective)
