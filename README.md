# Lembrancas - Habit Tracker

Aplicativo de rastreamento de hábitos com calendário e integração ao WhatsApp.

## Estrutura do Projeto

Este repositório contém dois projetos principais:

- **`lembrancas/`** - Frontend React Native/Expo
- **`lembrancas-api/`** - Backend API em Go

## Pré-requisitos

- Node.js 20+ (para o frontend)
- Go 1.25+ (para o backend)
- Docker e Docker Compose (opcional, para desenvolvimento)

## Desenvolvimento Local

### Backend (API)

```bash
cd lembrancas-api
go mod download
go run ./cmd
```

A API estará disponível em `http://localhost:8080`

### Frontend

```bash
cd lembrancas
npm install
npm start
```

O frontend estará disponível nas portas padrão do Expo.

## Docker Compose

Para facilitar o desenvolvimento, você pode usar Docker Compose para rodar ambos os serviços:

```bash
docker-compose up
```

Veja [README-DOCKER.md](./README-DOCKER.md) para mais detalhes.

## API

A documentação da API está disponível em [lembrancas/API.md](./lembrancas/API.md).

## Tecnologias

### Frontend
- React Native
- Expo
- TypeScript
- React Native Paper

### Backend
- Go
- Chi Router
- GORM
- SQLite

## Licença

Este projeto é privado.

