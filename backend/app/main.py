from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.storm import router as storm_router

from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(title="STORM ENGINE API", version="0.1.0")

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
    allow_origins=["http://localhost:3000"],  # Next.js default
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to STORM ENGINE API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
