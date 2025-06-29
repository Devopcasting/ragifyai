from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from database import get_db
from services.chat_history_service import ChatHistoryService
from models.chat import ChatSession, ChatMessage

router = APIRouter(prefix="/api/chat-history", tags=["chat-history"])

# Pydantic models for API


class ChatSessionCreate(BaseModel):
    title: str


class ChatSessionResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChatMessageCreate(BaseModel):
    role: str
    content: str
    sources: Optional[List] = None
    confidence: Optional[float] = None


class ChatMessageResponse(BaseModel):
    id: int
    session_id: int
    role: str
    content: str
    sources: Optional[List] = None
    confidence: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ChatSessionWithMessages(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageResponse]

    class Config:
        from_attributes = True


@router.post("/sessions", response_model=ChatSessionResponse)
def create_chat_session(session_data: ChatSessionCreate, db: Session = Depends(get_db)):
    """Create a new chat session"""
    service = ChatHistoryService(db)
    session = service.create_chat_session(session_data.title)
    return session


@router.get("/sessions", response_model=List[ChatSessionResponse])
def get_chat_sessions(db: Session = Depends(get_db)):
    """Get all chat sessions"""
    service = ChatHistoryService(db)
    sessions = service.get_chat_sessions()
    return sessions


@router.get("/sessions/{session_id}", response_model=ChatSessionWithMessages)
def get_chat_session(session_id: int, db: Session = Depends(get_db)):
    """Get a specific chat session with messages"""
    service = ChatHistoryService(db)
    session = service.get_chat_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return session


@router.post("/sessions/{session_id}/messages", response_model=ChatMessageResponse)
def add_message(session_id: int, message_data: ChatMessageCreate, db: Session = Depends(get_db)):
    """Add a message to a chat session"""
    service = ChatHistoryService(db)
    message = service.add_message(
        session_id=session_id,
        role=message_data.role,
        content=message_data.content,
        sources=message_data.sources,
        confidence=message_data.confidence
    )
    return message


@router.delete("/sessions/{session_id}")
def delete_chat_session(session_id: int, db: Session = Depends(get_db)):
    """Delete a chat session"""
    service = ChatHistoryService(db)
    success = service.delete_chat_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return {"message": "Chat session deleted successfully"}


@router.put("/sessions/{session_id}/title")
def update_session_title(session_id: int, title_data: ChatSessionCreate, db: Session = Depends(get_db)):
    """Update the title of a chat session"""
    service = ChatHistoryService(db)
    success = service.update_session_title(session_id, title_data.title)
    if not success:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return {"message": "Title updated successfully"}
