from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from routes import document_routes, chat_routes, search_routes, chat_history, file_routes, log_routes
from database import engine
from models import chat, file
from middleware.logging_middleware import LoggingMiddleware
from utils.logger import get_logger

# Initialize logger
logger = get_logger("ragify")

# Create database tables
chat.Base.metadata.create_all(bind=engine)
file.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RAGIFY API",
    description="Intelligent Document Analysis API using Langchain and ChromaDB",
    version="1.0.0"
)

# Add logging middleware
app.add_middleware(LoggingMiddleware)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000",
                   "http://127.0.0.1:5173", "http://127.0.0.1:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Create uploads directory if it doesn't exist
os.makedirs("uploads", exist_ok=True)
os.makedirs("chroma_db", exist_ok=True)

# Mount static files for uploaded documents
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routes
app.include_router(document_routes.router,
                   prefix="/api/documents", tags=["documents"])
app.include_router(chat_routes.router, prefix="/api/chat", tags=["chat"])
app.include_router(search_routes.router, prefix="/api/search", tags=["search"])
app.include_router(chat_history.router)  # Chat history routes
app.include_router(file_routes.router, prefix="/api/files",
                   tags=["files"])  # File management routes
app.include_router(log_routes.router, prefix="/api/logs",
                   tags=["logs"])  # Log management routes


@app.get("/")
async def root():
    logger.info("Root endpoint accessed")
    return {
        "message": "RAGIFY API is running",
        "version": "1.0.0",
        "status": "healthy"
    }


@app.get("/health")
async def health_check():
    logger.info("Health check endpoint accessed")
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting RAGIFY FastAPI server")
    uvicorn.run(app, host="0.0.0.0", port=8000)
