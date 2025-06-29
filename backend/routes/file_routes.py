from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import json

from database import get_db
from services.file_service import FileService
from services.document_processor import document_processor
from models.document import DocumentType

router = APIRouter()

# Pydantic models for API


class FileRecordResponse(BaseModel):
    id: str
    name: str
    type: str
    size: int
    status: str
    progress: float
    uploaded_at: datetime
    processed_at: Optional[datetime] = None
    chunks_count: int
    total_tokens: int
    keywords: Optional[str] = None
    error_message: Optional[str] = None
    document_type: Optional[str] = None

    class Config:
        from_attributes = True


class FileStatsResponse(BaseModel):
    total_files: int
    ready_files: int
    processing_files: int
    error_files: int
    type_breakdown: dict


@router.get("/", response_model=List[FileRecordResponse])
def get_all_files(db: Session = Depends(get_db)):
    """Get all uploaded files"""
    try:
        file_service = FileService(db)
        files = file_service.get_all_files()
        return files
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats", response_model=FileStatsResponse)
def get_file_stats(db: Session = Depends(get_db)):
    """Get file statistics"""
    try:
        file_service = FileService(db)
        stats = file_service.get_file_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{file_id}", response_model=FileRecordResponse)
def get_file(file_id: str, db: Session = Depends(get_db)):
    """Get a specific file by ID"""
    try:
        file_service = FileService(db)
        file_record = file_service.get_file_by_id(file_id)
        if not file_record:
            raise HTTPException(status_code=404, detail="File not found")
        return file_record
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
def create_file_record(file_data: dict, db: Session = Depends(get_db)):
    """Create a new file record"""
    try:
        file_service = FileService(db)
        file_record = file_service.create_file_record(file_data)
        return {"message": "File record created successfully", "file_id": file_record.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{file_id}/status")
def update_file_status(file_id: str, status: str, progress: Optional[float] = None,
                       error_message: Optional[str] = None, db: Session = Depends(get_db)):
    """Update file status"""
    try:
        file_service = FileService(db)
        success = file_service.update_file_status(
            file_id, status, progress, error_message)
        if not success:
            raise HTTPException(status_code=404, detail="File not found")
        return {"message": "File status updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{file_id}/processing-results")
def update_processing_results(file_id: str, chunks_count: int, total_tokens: int,
                              keywords: List[str], db: Session = Depends(get_db)):
    """Update file processing results"""
    try:
        file_service = FileService(db)
        success = file_service.update_file_processing_results(
            file_id, chunks_count, total_tokens, keywords)
        if not success:
            raise HTTPException(status_code=404, detail="File not found")
        return {"message": "Processing results updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{file_id}")
def delete_file(file_id: str, db: Session = Depends(get_db)):
    """Delete a file record"""
    try:
        file_service = FileService(db)
        success = file_service.delete_file(file_id)
        if not success:
            raise HTTPException(status_code=404, detail="File not found")
        return {"message": "File deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
