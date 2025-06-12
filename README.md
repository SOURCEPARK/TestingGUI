# Express + PostgreSQL Docker-Setup

## Voraussetzungen

- Docker & Docker Compose sind installiert

## .env Configuration

Please create a `.env` file in the root directory with the following environment variables:

```
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_DB
PORT
GITHUB_TOKEN
```

## Start

```bash
docker-compose up --build
```