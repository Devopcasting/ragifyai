from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
import time

from models.document import ChatRequest, ChatResponse
from services.chat_service import chat_service
from services.chat_history_service import ChatHistoryService
from database import get_db
from utils.logger import log_chat_message, log_error

router = APIRouter()


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest, session_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Send a message and get AI response"""
    start_time = time.time()
    try:
        print(f"DEBUG: Chat route - received session_id: {session_id}")
        print(
            f"DEBUG: Chat route - request message: {request.message[:50]}...")

        if not request.message.strip():
            raise HTTPException(
                status_code=400, detail="Message cannot be empty")

        # Always initialize chat history service for auto-saving
        chat_history_service = ChatHistoryService(db)

        response = await chat_service.generate_response(request, chat_history_service, session_id)

        # Log chat message
        processing_time = time.time() - start_time
        log_chat_message(
            session_id=session_id or 0,
            message=request.message,
            response_length=len(response.message),
            processing_time=processing_time
        )

        return response

    except Exception as e:
        log_error(e, f"Chat request failed for session {session_id}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/suggestions", response_model=List[str])
async def get_suggested_questions(document_ids: List[str] | None = None):
    """Get suggested questions based on available documents"""
    try:
        suggestions = await chat_service.get_suggested_questions(document_ids)
        return suggestions

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
