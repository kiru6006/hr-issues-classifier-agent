# Deployment Guide

## 1. Quick Start with Docker Compose

Ensure Docker and Docker Compose are installed and running.

```bash
# Clone the repository
git clone <repo-url>
cd hr-issues-classifier-agent

# Create environment configuration
cp .env.example .env

# Start all full-stack services (PostgreSQL, Redis, Ollama, Backend, Celery, Frontend)
docker-compose up -d

# Check service logs
docker-compose logs -f backend
```

Access Points:
- **Frontend Web UI**: `http://localhost:5173`
- **FastAPI OpenAPI Interactive Docs**: `http://localhost:8000/docs`
- **Ollama LLM Engine**: `http://localhost:11434`
- **PostgreSQL Database**: `localhost:5432`

---

## 2. Pre-loading Ollama Models (Optional)

If running Ollama locally:
```bash
docker exec -it hr_ollama ollama pull llama2:7b
# or
docker exec -it hr_ollama ollama pull mistral:7b
```

---

## 3. Standalone Local Development (Without Docker)

### Backend:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run migrations / auto-seed & start server
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Frontend:
```bash
cd frontend
npm install
npm run dev
```
