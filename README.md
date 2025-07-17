# Express + PostgreSQL Docker-Setup

## Requirementes 

- Docker & Docker Compose are installed

## .env Configuration

Please create a `.env` file in the root directory with the following environment variables:

```
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_DB
PORT
GITHUB_TOKEN
```
GITHUB_TOKEN is a personal access token that is needed to synchronize the test descriptors from the repo

## Start

```bash
docker compose up --build
```

## In casse of errors: 

Always use the following command before using the Start command if there are errors in the building process:

```
docker compose down -v
```
