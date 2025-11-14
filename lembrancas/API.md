# API Documentation - Habit Tracker

**Base URL:** `http://localhost:8080`

## Endpoints

### 1. Criar um hábito
```http
POST /api/habits
Content-Type: application/json

{
  "name": "Beber água",
  "description": "Beber 2L de água por dia",
  "frequency": "daily",
  "color": "#3B82F6",
  "category": "Saúde"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid-here",
  "name": "Beber água",
  "description": "Beber 2L de água por dia",
  "frequency": "daily",
  "color": "#3B82F6",
  "category": "Saúde",
  "created_at": "2025-11-17T20:00:00Z",
  "updated_at": "2025-11-17T20:00:00Z"
}
```

---

### 2. Listar todos os hábitos
```http
GET /api/habits
```

**Response:** `200 OK`
```json
[
  {
    "id": "uuid-here",
    "name": "Beber água",
    "description": "Beber 2L de água por dia",
    "frequency": "daily",
    "color": "#3B82F6",
    "category": "Saúde",
    "created_at": "2025-11-17T20:00:00Z",
    "updated_at": "2025-11-17T20:00:00Z"
  }
]
```

---

### 3. Buscar um hábito específico
```http
GET /api/habits/{id}
```

**Response:** `200 OK`
```json
{
  "id": "uuid-here",
  "name": "Beber água",
  "description": "Beber 2L de água por dia",
  "frequency": "daily",
  "color": "#3B82F6",
  "category": "Saúde",
  "created_at": "2025-11-17T20:00:00Z",
  "updated_at": "2025-11-17T20:00:00Z"
}
```

---

### 4. Atualizar um hábito
```http
PUT /api/habits/{id}
Content-Type: application/json

{
  "name": "Beber água - Atualizado",
  "color": "#FF0000"
}
```

**Response:** `200 OK` (retorna o hábito atualizado)

---

### 5. Deletar um hábito
```http
DELETE /api/habits/{id}
```

**Response:** `200 OK`
```json
{
  "message": "habit deleted successfully"
}
```

---

### 6. Marcar hábito como completo
```http
POST /api/habits/{id}/complete
Content-Type: application/json

{
  "date": "2025-11-17"
}
```

**Nota:** O campo `date` é opcional. Se não enviado, usa a data de hoje.

**Response:** `200 OK`
```json
{
  "message": "habit marked as complete"
}
```

---

### 7. Remover conclusão de um dia
```http
DELETE /api/habits/{id}/complete/2025-11-17
```

**Response:** `200 OK`
```json
{
  "message": "completion removed"
}
```

---

### 8. Ver estatísticas do hábito
```http
GET /api/habits/{id}/statistics
```

**Response:** `200 OK`
```json
{
  "total_completions": 15,
  "current_streak": 5,
  "longest_streak": 10,
  "completion_rate": 75.5,
  "completions": [
    "2025-11-17T00:00:00Z",
    "2025-11-16T00:00:00Z",
    "2025-11-15T00:00:00Z"
  ]
}
```

**Campos:**
- `total_completions`: Total de vezes que o hábito foi completado
- `current_streak`: Sequência atual de dias consecutivos
- `longest_streak`: Maior sequência de dias consecutivos
- `completion_rate`: Taxa de conclusão em porcentagem
- `completions`: Array com todas as datas de conclusão

---

### 9. Ver histórico de conclusões
```http
GET /api/habits/{id}/completions
```

**Response:** `200 OK`
```json
[
  {
    "id": "uuid-here",
    "habit_id": "uuid-here",
    "completed_at": "2025-11-17T00:00:00Z",
    "notes": "",
    "created_at": "2025-11-17T20:00:00Z"
  }
]
```

---

## Tipos e Validações

### Frequency (Frequência)
Valores aceitos:
- `daily` - Diário
- `weekly` - Semanal
- `custom` - Customizado

### Formato de Datas
Todas as datas devem estar no formato: `YYYY-MM-DD`

Exemplo: `2025-11-17`

### IDs
Todos os IDs são UUIDs no formato: `123e4567-e89b-12d3-a456-426614174000`

---

## Códigos de Status HTTP

- `200 OK` - Requisição bem-sucedida
- `201 Created` - Recurso criado com sucesso
- `400 Bad Request` - Dados inválidos
- `404 Not Found` - Recurso não encontrado
- `409 Conflict` - Conflito (ex: hábito já completado naquele dia)
- `500 Internal Server Error` - Erro no servidor

---

## Erros

Todas as respostas de erro seguem o formato:

```json
{
  "error": "mensagem do erro"
}
```

**Exemplos:**
- `"error": "invalid habit ID"` - ID inválido
- `"error": "habit not found"` - Hábito não encontrado
- `"error": "name is required"` - Nome é obrigatório
- `"error": "habit already completed for this date"` - Hábito já foi marcado como completo nesse dia


