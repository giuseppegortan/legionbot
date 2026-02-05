# 🌪️ STORM ENGINE

STORM ENGINE is a professional multi-agent orchestration platform designed to facilitate high-level technical collaboration between specialized AI agents (Architect, Developer, and Secretary). It produces comprehensive project blueprints and software architectures.

## 🚀 Quick Start

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- **Docker & Docker Compose**
- **Supabase Account** (for Authentication)
- **Gemini API Key** (Google AI Studio)

### 2. Infrastructure Setup (Docker)
The engine requires PostgreSQL and Qdrant. Spin them up using the provided configuration:
```powershell
docker-compose up -d
```
*Wait for containers to be healthy at `127.0.0.1:5433` (Postgres) and `127.0.0.1:6333` (Qdrant).*

### 3. Backend Setup
1. Navigate to the backend directory:
   ```powershell
   cd backend
   ```
2. Create and activate a virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```
3. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
4. Configure `.env` in `backend/`:
   ```env
   GEMINI_API_KEY=your_gemini_key
   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/storm_engine
   QDRANT_URL=http://127.0.0.1:6333
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
5. Run the API:
   ```powershell
   python -m backend.app.main
   ```

### 4. Frontend Setup
1. Navigate to the frontend directory:
   ```powershell
   cd frontend
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Configure `.env.local` in `frontend/`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Start the development server:
   ```powershell
   npm run dev
   ```

---

## 🛠️ Architecture

- **Orchestration**: LangGraph-based state machine managing Agent transitions.
- **Agents**:
  - **Architect**: Logic and structural design.
  - **Developer**: Implementation patterns and optimization.
  - **Secretary**: Documentation, RAG management, and ZIP blueprint export.
- **RAG Layer**: Dual-layer Qdrant implementation (Global Plugins + Evolutionary User Knowledge).
- **Auth**: Google OAuth via Supabase integration.
- **Database**: PostgreSQL for session persistence and chat history.

## 📁 Project Structure
- `/backend`: FastAPI server, agent logic, and database models.
- `/frontend`: Next.js 14 dashboard and real-time chat interface.
- `/exports`: Storage for generated project blueprints.

---
*STORM ENGINE // Empowering Collective Intelligence*
