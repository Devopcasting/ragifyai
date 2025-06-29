from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Float
from sqlalchemy.sql import func
from database import Base
from datetime import datetime


class FileRecord(Base):
    __tablename__ = "file_records"

    # Use the same ID as frontend
    id = Column(String(255), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)  # pdf, text, docx, etc.
    size = Column(Integer, nullable=False)
    # uploading, processing, ready, error
    status = Column(String(50), nullable=False)
    progress = Column(Float, default=0.0)  # Upload/processing progress
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)
    file_path = Column(String(500), nullable=True)  # Path to the actual file
    chunks_count = Column(Integer, default=0)  # Number of chunks created
    total_tokens = Column(Integer, default=0)  # Total tokens in the document
    keywords = Column(Text, nullable=True)  # JSON string of extracted keywords
    # Error message if processing failed
    error_message = Column(Text, nullable=True)
    document_type = Column(String(50), nullable=True)  # pdf, docx, text
