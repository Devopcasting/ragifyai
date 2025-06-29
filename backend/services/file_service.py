from sqlalchemy.orm import Session
from models.file import FileRecord
from typing import List, Optional, Dict, Any
from datetime import datetime
import json


class FileService:
    def __init__(self, db: Session):
        self.db = db

    def create_file_record(self, file_data: Dict[str, Any]) -> FileRecord:
        """Create a new file record"""
        file_record = FileRecord(
            id=file_data['id'],
            name=file_data['name'],
            type=file_data['type'],
            size=file_data['size'],
            status=file_data['status'],
            progress=file_data.get('progress', 0.0),
            file_path=file_data.get('file_path'),
            document_type=file_data.get('document_type')
        )
        self.db.add(file_record)
        self.db.commit()
        self.db.refresh(file_record)
        return file_record

    def get_all_files(self) -> List[FileRecord]:
        """Get all file records ordered by upload date"""
        return self.db.query(FileRecord).order_by(FileRecord.uploaded_at.desc()).all()

    def get_file_by_id(self, file_id: str) -> Optional[FileRecord]:
        """Get a specific file record by ID"""
        return self.db.query(FileRecord).filter(FileRecord.id == file_id).first()

    def update_file_status(self, file_id: str, status: str, progress: float | None = None,
                           error_message: str | None = None) -> bool:
        """Update file status and progress"""
        file_record = self.get_file_by_id(file_id)
        if file_record:
            file_record.status = status
            if progress is not None:
                file_record.progress = progress
            if error_message:
                file_record.error_message = error_message
            if status == 'ready':
                file_record.processed_at = datetime.utcnow()
            self.db.commit()
            return True
        return False

    def update_file_processing_results(self, file_id: str, chunks_count: int,
                                       total_tokens: int, keywords: List[str]) -> bool:
        """Update file with processing results"""
        file_record = self.get_file_by_id(file_id)
        if file_record:
            file_record.chunks_count = chunks_count
            file_record.total_tokens = total_tokens
            file_record.keywords = json.dumps(keywords)
            self.db.commit()
            return True
        return False

    def delete_file(self, file_id: str) -> bool:
        """Delete a file record"""
        file_record = self.get_file_by_id(file_id)
        if file_record:
            self.db.delete(file_record)
            self.db.commit()
            return True
        return False

    def get_file_stats(self) -> Dict[str, Any]:
        """Get file statistics"""
        total_files = self.db.query(FileRecord).count()
        ready_files = self.db.query(FileRecord).filter(
            FileRecord.status == 'ready').count()
        processing_files = self.db.query(FileRecord).filter(
            FileRecord.status == 'processing').count()
        error_files = self.db.query(FileRecord).filter(
            FileRecord.status == 'error').count()

        # Get type breakdown
        type_counts = {}
        files = self.db.query(FileRecord).all()
        for file in files:
            file_type = file.type
            type_counts[file_type] = type_counts.get(file_type, 0) + 1

        return {
            'total_files': total_files,
            'ready_files': ready_files,
            'processing_files': processing_files,
            'error_files': error_files,
            'type_breakdown': type_counts
        }

    def update_file_record(self, file_data: Dict[str, Any]) -> bool:
        """Update a complete file record"""
        file_record = self.get_file_by_id(file_data['id'])
        if file_record:
            file_record.name = file_data['name']
            file_record.type = file_data['type']
            file_record.size = file_data['size']
            file_record.status = file_data['status']
            file_record.progress = file_data.get('progress', 0.0)
            file_record.file_path = file_data.get('file_path')
            file_record.document_type = file_data.get('document_type')
            if file_data.get('chunks_count'):
                file_record.chunks_count = file_data['chunks_count']
            if file_data.get('total_tokens'):
                file_record.total_tokens = file_data['total_tokens']
            if file_data.get('keywords'):
                file_record.keywords = json.dumps(file_data['keywords'])
            if file_data.get('error_message'):
                file_record.error_message = file_data['error_message']
            if file_data['status'] == 'ready':
                file_record.processed_at = datetime.utcnow()
            self.db.commit()
            return True
        return False
