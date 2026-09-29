import os
from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

load_dotenv()

from app.database import engine, Base, SessionLocal
from app.routers import auth, users, settings, meetings, participants, messages, signaling
from app import crud


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize SQLite database schema
    Base.metadata.create_all(bind=engine)
    
    # 2. Seed initial realistic data if DB is newly initialized
    db = SessionLocal()
    try:
        crud.seed_database_if_empty(db)
    finally:
        db.close()

    yield


app = FastAPI(
    title="MeetSpace API - Zoom Clone",
    description="Backend REST API for Zoom Clone video conferencing platform",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
cors_origins_env = os.getenv("CORS_ORIGINS", "")
default_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://zoom-clone-pink-phi.vercel.app",
]

# Starlette/Browsers reject Access-Control-Allow-Origin: * when credentials are true
env_origins = [
    origin.strip()
    for origin in cors_origins_env.split(",")
    if origin.strip() and origin.strip() != "*"
]
origins = list(dict.fromkeys(default_origins + env_origins))

from app.middleware import InMemoryRateLimiterMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(InMemoryRateLimiterMiddleware)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Ensure internal errors return clean user-friendly JSON rather than stack traces."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred. Please try again later.",
        },
    )


# Include Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(settings.router)
app.include_router(meetings.router)
app.include_router(participants.router)
app.include_router(messages.router)
app.include_router(signaling.router)


@app.get("/")
def root():
    return {
        "app": "MeetSpace API",
        "description": "Production-Ready Zoom Clone Fullstack Backend",
        "version": "1.0.0",
        "docs_url": "/docs",
    }


@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "connected",
        "version": "1.0.0",
    }
