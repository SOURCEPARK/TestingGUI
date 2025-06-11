# Express + PostgreSQL Docker-Setup

## Voraussetzungen

- Docker & Docker Compose sind installiert

## Start

```bash
docker-compose up --build
```

## Database Setup

```bash
docker-compose exec backend node models/schema.js
docker-compose exec backend node seed/seed.js
```


