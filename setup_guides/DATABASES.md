# Database Setup Guide - STORM ENGINE

This document explains how to set up the required databases for the Storm Engine platform.

## 1. Qdrant (Vector Database)

Qdrant is used for the dual-layer RAG system to store both base plugin knowledge and evolutionary user context.

### Local Setup (PowerShell)
The easiest way to run Qdrant on Windows:
```powershell
docker run -p 6333:6333 -p 6334:6334 `
    -v ${PWD}/qdrant_storage:/qdrant/storage `
    qdrant/qdrant
```

### Local Setup (Docker Compose - Recommended)
Create a `docker-compose.yml` in the project root:
```yaml
services:
  qdrant:
    image: qdrant/qdrant
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - ./qdrant_storage:/qdrant/storage
```
Then run `docker-compose up -d`.

### In-Memory (Development)
The current implementation is set to `:memory:`. To switch to a persistent local instance, update `backend/app/knowledge/rag.py`:
```python
# Change this:
self.client = QdrantClient(location=":memory:")
# To this:
self.client = QdrantClient(url="http://localhost:6333")
```

---

## 2. PostgreSQL (Metadata & History)

PostgreSQL is used to store user sessions, storm history, and agent metadata.

### Local Setup (PowerShell)
```powershell
docker run --name storm-postgres `
    -e POSTGRES_USER=postgres `
    -e POSTGRES_PASSWORD=postgres `
    -e POSTGRES_DB=storm_engine `
    -p 5432:5432 `
    -d postgres
```

### Connection String
Update your `.env` file or `backend/app/core/config.py`:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/storm_engine
```

---

## 3. Gemini API Configuration

To enable real conversations with the collaborators, you must provide a Google Gemini API Key.

1. Get a key from [Google AI Studio](https://aistudio.google.com/).
2. Create a `.env` file in the `backend/` directory:
```env
GEMINI_API_KEY=your_actual_key_here
```

---

## 4. Running the Migration (Future)
Once the SQLAlchemy models are finalized, you can initialize the database using:
```bash
# Example (once implemented)
python -m backend.app.models.init_db
```
