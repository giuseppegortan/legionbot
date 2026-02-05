from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.storm import router as storm_router

from fastapi.staticfiles import StaticFiles
import os

from contextlib import asynccontextmanager
from backend.app.knowledge.rag import knowledge_manager
from backend.app.models.storm import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure DB tables exist
    print("🗄️ Initializing database tables...")
    init_db()
    # Seed base knowledge on startup
    print("🌱 Seeding base knowledge...")
    await knowledge_manager.seed_base_knowledge()
    yield

app = FastAPI(title="STORM ENGINE API", version="0.1.0", lifespan=lifespan)

# Ensure exports directory exists
if not os.path.exists("exports"):
    os.makedirs("exports")

# Mount exports directory
app.mount("/export", StaticFiles(directory="exports"), name="export")

# Register routers
app.include_router(storm_router)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request, call_next):
    if "/storm/" in request.url.path:
        print(f"🔍 Incoming request: {request.method} {request.url.path}")
    response = await call_next(request)
    if "/storm/" in request.url.path:
        print(f"🏁 Response status: {response.status_code}")
    return response

@app.get("/")
async def root():
    return {"message": "Welcome to STORM ENGINE API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
