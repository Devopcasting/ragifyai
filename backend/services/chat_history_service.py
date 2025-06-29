from sqlalchemy.orm import Session
from models.chat import ChatSession, ChatMessage
from typing import List, Optional
from datetime import datetime


class ChatHistoryService:
    def __init__(self, db: Session):
        self.db = db

    def create_chat_session(self, title: str) -> ChatSession:
        """Create a new chat session"""
        session = ChatSession(title=title)
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def get_chat_sessions(self) -> List[ChatSession]:
        """Get all chat sessions ordered by most recent"""
        return self.db.query(ChatSession).order_by(ChatSession.updated_at.desc()).all()

    def get_chat_session(self, session_id: int) -> Optional[ChatSession]:
        """Get a specific chat session with messages"""
        return self.db.query(ChatSession).filter(ChatSession.id == session_id).first()

    def add_message(self, session_id: int, role: str, content: str, sources: Optional[List] = None, confidence: Optional[float] = None) -> ChatMessage:
        """Add a message to a chat session"""
        message = ChatMessage(
            session_id=session_id,
            role=role,
            content=content,
            sources=sources,
            # Convert to percentage
            confidence=int(confidence * 100) if confidence else None
        )
        self.db.add(message)

        # Update session timestamp
        session = self.get_chat_session(session_id)
        if session:
            session.updated_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(message)
        return message

    def delete_chat_session(self, session_id: int) -> bool:
        """Delete a chat session and all its messages"""
        session = self.get_chat_session(session_id)
        if session:
            # Delete all messages for this session first
            deleted_messages = self.db.query(ChatMessage).filter(
                ChatMessage.session_id == session_id).delete()
            print(
                f"DEBUG: Deleted {deleted_messages} messages for session {session_id}")

            # Delete the session
            self.db.delete(session)
            self.db.commit()
            return True
        return False

    def update_session_title(self, session_id: int, title: str) -> bool:
        """Update the title of a chat session"""
        session = self.get_chat_session(session_id)
        if session:
            session.title = title
            session.updated_at = datetime.utcnow()
            self.db.commit()
            return True
        return False

    def clear_all_sessions(self) -> bool:
        """Clear all chat sessions and their messages"""
        try:
            print("DEBUG: Starting to clear all chat sessions...")

            # Count sessions and messages before deletion
            session_count = self.db.query(ChatSession).count()
            message_count = self.db.query(ChatMessage).count()
            print(
                f"DEBUG: Found {session_count} sessions and {message_count} messages to delete")

            # Delete all messages first (explicitly)
            deleted_messages = self.db.query(ChatMessage).delete()
            print(f"DEBUG: Deleted {deleted_messages} messages")

            # Delete all chat sessions
            deleted_sessions = self.db.query(ChatSession).delete()
            print(f"DEBUG: Deleted {deleted_sessions} sessions")

            self.db.commit()

            print(
                f"DEBUG: Successfully deleted {deleted_sessions} sessions and {deleted_messages} messages")
            return True
        except Exception as e:
            self.db.rollback()
            print(f"ERROR: Error clearing all sessions: {e}")
            return False
