# recruteV0

A recruitment platform: Angular frontend, Spring Boot backend, MySQL database, and a Python AI service for CV parsing/matching — all orchestrated with Docker Compose behind a Caddy HTTPS reverse proxy.

## Stack

| Service | Tech | Container | Internal port |
|---|---|---|---|
| `frontend` | Angular (`ng serve`, hot reload) | `recrute-frontend` | 4200 |
| `backend` | Spring Boot 3 / Java 17, JWT auth | `recrute-backend` | 8080 |
| `python-ai` | Flask, CV parsing/scoring (sentence-transformers + FAISS) | `recrutev0-python-ai` | 5000 |
| `mysql` | MySQL 8 | `recrute-mysql` | 3306 |
| `caddy` | Caddy 2 reverse proxy, local HTTPS | `recrute-caddy` | 443 / 80 |

Caddy is the single entry point: it terminates TLS and routes by path to `backend`, `python-ai`, or `frontend` (see [Caddyfile](Caddyfile)).

## Setup

1. **Create `.env`** at the repo root with a random JWT signing secret (the backend refuses to start without one):
   ```bash
   echo "JWT_SECRET=$(openssl rand -hex 32)" > .env
   ```
2. **Start everything**:
   ```bash
   docker compose up -d
   ```
3. **Trust the local HTTPS certificate** (one-time per machine — browsers won't trust Caddy's self-signed cert otherwise):
   ```bash
   ./setup-https-trust.sh
   ```
   Firefox uses its own certificate store and needs a manual import — see the script header for instructions.

4. Open **https://localhost**.

## Project structure

```
recrute/        Spring Boot backend + Angular frontend (see Dockerfile.backend / Dockerfile.frontend)
python/         Flask AI service for CV parsing & job matching (see README_PYTHON.md)
schema.sql      MySQL schema, auto-loaded on first mysql container start
Caddyfile       Reverse proxy routing rules
docker-compose.yml
setup-https-trust.sh   Installs Caddy's local CA into your OS trust store
```

For details on the Python CV-matching service (embeddings, FAISS, GUI test tool), see [README_PYTHON.md](README_PYTHON.md).

## Common tasks

Rebuild a single service after code changes (frontend has hot reload, backend/python-ai do not):
```bash
docker compose build backend && docker compose up -d backend
```

View logs:
```bash
docker logs -f recrute-backend
```

Stop everything:
```bash
docker compose down
```

## Notes

- The frontend's `ng serve` runs with file polling (`--poll=2000`) so container volume mounts pick up local edits without a rebuild.
- `JWT_SECRET` must be at least 32 bytes; the backend fails fast at startup otherwise (see `JwtService.validateSecret`).
- MySQL data persists in the `mysql_data` named volume; Caddy's generated certs/CA persist in `caddy_data`/`caddy_config`.
