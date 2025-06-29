from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from enum import Enum


class DocumentType(str, Enum):
    PDF = "pdf"
    TEXT = "text"
    DOCX = "docx"


class DocumentStatus(str, Enum):
    UPLOADING = "uploading"
    PROCESSING = "processing"
    READY = "ready"
    ERROR = "error"


class Timing(BaseModel):
    document_analysis: float
    response_generation: float
    total_time: float


class DocumentUpload(BaseModel):
    filename: str
    content_type: str
    size: int


class DocumentResponse(BaseModel):
    id: str
    filename: str
    document_type: DocumentType
    size: int
    status: DocumentStatus
    uploaded_at: datetime
    chunks_count: Optional[int] = None
    error_message: Optional[str] = None


class ChatMessage(BaseModel):
    id: str
    content: str
    role: str  # "user" or "assistant"
    timestamp: datetime
    sources: Optional[List[str]] = None


class ChatRequest(BaseModel):
    message: str
    document_ids: Optional[List[str]] = None  # If None, search all documents


class ChatResponse(BaseModel):
    message: str
    sources: List[dict]
    confidence: float
    session_id: Optional[int] = None
    timing: Optional[Timing] = None  # Use proper Timing model


class SearchRequest(BaseModel):
    query: str
    document_ids: Optional[List[str]] = None
    limit: int = 10


class SearchResult(BaseModel):
    id: str
    document_id: str
    document_name: str
    content: str
    score: float
    metadata: dict


class SearchResponse(BaseModel):
    results: List[SearchResult]
    total_count: int
    query: str
