# Docker Compose Setup - Lembrancas

Este projeto usa Docker Compose para facilitar o desenvolvimento e execução de ambos os serviços (backend Go e frontend Expo).

## Pré-requisitos

- Docker
- Docker Compose

## Estrutura

- **Backend API (Go)**: Roda na porta `8080`
- **Frontend (Expo)**: Roda nas portas `19000`, `19001`, `19002`, `8081`

## Como usar

### Iniciar todos os serviços

```bash
docker-compose up
```

Para rodar em background (detached mode):

```bash
docker-compose up -d
```

### Parar os serviços

```bash
docker-compose down
```

### Rebuild das imagens

Se você fez mudanças nos Dockerfiles ou precisa reconstruir:

```bash
docker-compose build
docker-compose up
```

Ou em um comando:

```bash
docker-compose up --build
```

### Ver logs

Ver logs de todos os serviços:

```bash
docker-compose logs -f
```

Ver logs de um serviço específico:

```bash
docker-compose logs -f api
docker-compose logs -f frontend
```

### Acessar os serviços

- **API Backend**: http://localhost:8080
- **API Health Check**: http://localhost:8080/
- **Frontend Expo**: http://localhost:19000 (Metro bundler)
- **Frontend Web**: http://localhost:8081 (se configurado)

### Comandos úteis

**Entrar no container do backend:**
```bash
docker-compose exec api sh
```

**Entrar no container do frontend:**
```bash
docker-compose exec frontend sh
```

**Reiniciar um serviço específico:**
```bash
docker-compose restart api
docker-compose restart frontend
```

**Ver status dos containers:**
```bash
docker-compose ps
```

## Desenvolvimento

### Hot Reload

O frontend está configurado com volumes para permitir hot reload. Qualquer mudança nos arquivos do frontend será refletida automaticamente.

### Database

O arquivo `habits.db` é persistido através de volumes Docker. Ele fica em `./lembrancas-api/habits.db` no host.

### Variáveis de Ambiente

As variáveis de ambiente podem ser configuradas no arquivo `docker-compose.yml` ou através de um arquivo `.env`.

## Troubleshooting

### Porta já em uso

Se alguma porta estiver em uso, você pode alterar as portas no `docker-compose.yml`:

```yaml
ports:
  - "8081:8080"  # Muda a porta externa
```

### Limpar tudo e começar do zero

```bash
docker-compose down -v  # Remove volumes também
docker-compose build --no-cache
docker-compose up
```

### Reinstalar dependências do frontend

```bash
docker-compose exec frontend npm install
```

### Reinstalar dependências do backend

```bash
docker-compose exec api go mod download
```

