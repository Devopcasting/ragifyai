from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
import os
import uuid
from datetime import datetime
from typing import List, Optional
import aiofiles
import shutil
import time

from models.document import DocumentType, DocumentResponse, DocumentStatus
from services.document_processor import document_processor
from services.file_service import FileService
from database import get_db, SessionLocal
from utils.config import config
from utils.logger import log_document_upload, log_document_processing, log_error

router = APIRouter()

# In-memory storage for document metadata (in production, use a database)
documents_db = {}


class ProcessDocumentRequest(BaseModel):
    file_path: str
    filename: str
    document_type: DocumentType


class DocumentPathInfo(BaseModel):
    suggested_path: str
    document_type: DocumentType
    folder_structure: dict


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload and process a document"""
    try:
        # Validate file type
        allowed_types = {
            "application/pdf": DocumentType.PDF,
            "text/plain": DocumentType.TEXT,
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": DocumentType.DOCX
        }

        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file.content_type}. Supported types: PDF, TXT, DOCX"
            )

        # Generate unique filename
        file_id = str(uuid.uuid4())
        file_extension = os.path.splitext(file.filename or "unknown")[1]
        safe_filename = f"{file_id}{file_extension}"
        file_path = os.path.join(config.uploads_path, safe_filename)

        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)

        # Create document record
        document_type = allowed_types[file.content_type]
        document_record = {
            "id": file_id,
            "filename": file.filename or "unknown",
            "document_type": document_type,
            "size": len(content),
            "status": DocumentStatus.UPLOADING,
            "uploaded_at": datetime.now(),
            "file_path": file_path,
            "safe_filename": safe_filename
        }

        documents_db[file_id] = document_record

        # Create file record in database
        file_service = FileService(db)
        file_data = {
            "id": file_id,
            "name": file.filename or "unknown",
            "type": document_type.value,
            "size": len(content),
            "status": "uploading",
            "progress": 0.0,
            "file_path": file_path,
            "document_type": document_type.value
        }
        file_service.create_file_record(file_data)

        # Log document upload
        log_document_upload(
            filename=file.filename or "unknown",
            file_size=len(content),
            file_type=file.content_type,
            status="uploaded"
        )

        # Process document in background
        background_tasks.add_task(
            process_document_background,
            file_id,
            file_path,
            file.filename or "unknown",
            document_type
        )

        return DocumentResponse(
            id=file_id,
            filename=file.filename or "unknown",
            document_type=document_type,
            size=len(content),
            status=DocumentStatus.UPLOADING,
            uploaded_at=document_record["uploaded_at"]
        )

    except Exception as e:
        log_error(
            e, f"Document upload failed for {file.filename if file else 'unknown'}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/process", response_model=DocumentResponse)
async def process_document_from_path(
    background_tasks: BackgroundTasks,
    request: ProcessDocumentRequest,
    db: Session = Depends(get_db)
):
    """Process a document from a file path"""
    try:
        # Validate file exists
        if not os.path.exists(request.file_path):
            raise HTTPException(
                status_code=404,
                detail=f"File not found at path: {request.file_path}"
            )

        # Validate file type
        allowed_types = [DocumentType.PDF,
                         DocumentType.TEXT, DocumentType.DOCX]
        if request.document_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported document type: {request.document_type}. Supported types: PDF, TEXT, DOCX"
            )

        # Generate unique document ID
        file_id = str(uuid.uuid4())

        # Get file size
        file_size = os.path.getsize(request.file_path)

        # Create document record
        document_record = {
            "id": file_id,
            "filename": request.filename,
            "document_type": request.document_type,
            "size": file_size,
            "status": DocumentStatus.UPLOADING,
            "uploaded_at": datetime.now(),
            "file_path": request.file_path
        }

        documents_db[file_id] = document_record

        # Create file record in database
        file_service = FileService(db)
        file_data = {
            "id": file_id,
            "name": request.filename,
            "type": request.document_type.value,
            "size": file_size,
            "status": "uploading",
            "progress": 0.0,
            "file_path": request.file_path,
            "document_type": request.document_type.value
        }
        file_service.create_file_record(file_data)

        # Process document in background
        background_tasks.add_task(
            process_document_background,
            file_id,
            request.file_path,
            request.filename,
            request.document_type
        )

        return DocumentResponse(
            id=file_id,
            filename=request.filename,
            document_type=request.document_type,
            size=file_size,
            status=DocumentStatus.UPLOADING,
            uploaded_at=document_record["uploaded_at"]
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[DocumentResponse])
async def list_documents():
    """List all uploaded documents"""
    try:
        documents = []
        for doc_id, doc in documents_db.items():
            documents.append(DocumentResponse(
                id=doc_id,
                filename=doc["filename"],
                document_type=doc["document_type"],
                size=doc["size"],
                status=doc["status"],
                uploaded_at=doc["uploaded_at"],
                chunks_count=doc.get("chunks_count"),
                error_message=doc.get("error_message")
            ))

        return documents

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: str):
    """Get a specific document"""
    try:
        if document_id not in documents_db:
            raise HTTPException(status_code=404, detail="Document not found")

        doc = documents_db[document_id]
        return DocumentResponse(
            id=document_id,
            filename=doc["filename"],
            document_type=doc["document_type"],
            size=doc["size"],
            status=doc["status"],
            uploaded_at=doc["uploaded_at"],
            chunks_count=doc.get("chunks_count"),
            error_message=doc.get("error_message")
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{document_id}")
async def delete_document(document_id: str, db: Session = Depends(get_db)):
    """Delete a document and its embeddings"""
    try:
        if document_id not in documents_db:
            raise HTTPException(status_code=404, detail="Document not found")

        doc = documents_db[document_id]

        # Delete from ChromaDB
        try:
            document_processor.delete_document(doc["filename"])
        except Exception as e:
            print(f"Error deleting from ChromaDB: {e}")

        # Delete file from filesystem
        try:
            if os.path.exists(doc["file_path"]):
                os.remove(doc["file_path"])
        except Exception as e:
            print(f"Error deleting file: {e}")

        # Delete from database
        try:
            file_service = FileService(db)
            file_service.delete_file(document_id)
        except Exception as e:
            print(f"Error deleting from database: {e}")

        # Remove from memory database
        del documents_db[document_id]

        return {"message": "Document deleted successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{document_id}/download")
async def download_document(document_id: str):
    """Download a document file"""
    try:
        if document_id not in documents_db:
            raise HTTPException(status_code=404, detail="Document not found")

        doc = documents_db[document_id]
        file_path = doc["file_path"]

        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=404, detail="File not found on disk")

        return FileResponse(
            path=file_path,
            filename=doc["filename"],
            media_type="application/octet-stream"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/path-info/{filename}", response_model=DocumentPathInfo)
async def get_document_path_info(filename: str):
    """Get suggested path and document type for a filename"""
    try:
        # Determine document type from extension
        ext = filename.lower().split('.')[-1] if '.' in filename else ''

        type_mapping = {
            "pdf": DocumentType.PDF,
            "txt": DocumentType.TEXT,
            "docx": DocumentType.DOCX
        }

        document_type = type_mapping.get(ext, DocumentType.TEXT)

        # Get suggested path
        folder_name = ext if ext in ["pdf", "txt", "docx"] else "other"
        suggested_path = f"../public/documents/{folder_name}/{filename}"

        # Return folder structure info
        folder_structure = {
            "pdf": "../public/documents/pdf/",
            "txt": "../public/documents/txt/",
            "docx": "../public/documents/docx/",
            "other": "../public/documents/other/"
        }

        return DocumentPathInfo(
            suggested_path=suggested_path,
            document_type=document_type,
            folder_structure=folder_structure
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-to-public", response_model=DocumentResponse)
async def upload_to_public_folder(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload file to public/documents folder and process it"""
    try:
        # Validate file type
        allowed_types = {
            "application/pdf": DocumentType.PDF,
            "text/plain": DocumentType.TEXT,
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": DocumentType.DOCX
        }

        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file.content_type}. Supported types: PDF, TXT, DOCX"
            )

        # Determine folder based on file type
        folder_mapping = {
            "application/pdf": "pdf",
            "text/plain": "txt",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx"
        }

        folder = folder_mapping[file.content_type]
        public_folder = f"../public/documents/{folder}"

        # Create folder if it doesn't exist
        os.makedirs(public_folder, exist_ok=True)

        # Save file to public folder
        file_path = os.path.join(public_folder, file.filename or "unknown")

        # Check if file already exists and create unique name if needed
        if os.path.exists(file_path):
            name, ext = os.path.splitext(file.filename or "unknown")
            counter = 1
            while os.path.exists(file_path):
                file_path = os.path.join(
                    public_folder, f"{name}_{counter}{ext}")
                counter += 1

        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)

        # Generate unique document ID
        file_id = str(uuid.uuid4())

        # Get the filename that was actually saved
        actual_filename = os.path.basename(file_path)

        # Create document record
        document_type = allowed_types[file.content_type]
        document_record = {
            "id": file_id,
            "filename": actual_filename,
            "document_type": document_type,
            "size": len(content),
            "status": DocumentStatus.UPLOADING,
            "uploaded_at": datetime.now(),
            "file_path": file_path
        }

        documents_db[file_id] = document_record

        # Create file record in database
        file_service = FileService(db)
        file_data = {
            "id": file_id,
            "name": actual_filename,
            "type": document_type.value,
            "size": len(content),
            "status": "uploading",
            "progress": 0.0,
            "file_path": file_path,
            "document_type": document_type.value
        }
        file_service.create_file_record(file_data)

        # Process document in background
        background_tasks.add_task(
            process_document_background,
            file_id,
            file_path,
            actual_filename,
            document_type
        )

        return DocumentResponse(
            id=file_id,
            filename=actual_filename,
            document_type=document_type,
            size=len(content),
            status=DocumentStatus.UPLOADING,
            uploaded_at=document_record["uploaded_at"]
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def process_document_background(
    file_id: str,
    file_path: str,
    filename: str,
    document_type: DocumentType
):
    """Background task to process document"""
    start_time = time.time()
    try:
        # Update status to processing in database
        db = SessionLocal()
        try:
            file_service = FileService(db)
            file_service.update_file_status(file_id, "processing", 0.0)
        finally:
            db.close()

        # Update in-memory status
        if file_id in documents_db:
            documents_db[file_id]["status"] = DocumentStatus.PROCESSING

        # Process document
        result = document_processor.process_document(
            file_path, filename, document_type)

        # Update document record in memory
        if file_id in documents_db:
            documents_db[file_id]["status"] = DocumentStatus.READY
            documents_db[file_id]["chunks_count"] = result["chunks_count"]
            documents_db[file_id]["keywords"] = result["keywords"]

        # Update file record in database using a new session
        db = SessionLocal()
        try:
            file_service = FileService(db)
            file_data = {
                "id": file_id,
                "name": filename,
                "type": document_type.value,
                "size": result.get("total_tokens", 0),
                "status": "ready",
                "progress": 1.0,
                "file_path": file_path,
                "document_type": document_type.value,
                "chunks_count": result["chunks_count"],
                "total_tokens": result.get("total_tokens", 0),
                "keywords": result["keywords"]
            }
            file_service.update_file_record(file_data)
        finally:
            db.close()

        # Log processing completion
        processing_time = time.time() - start_time
        log_document_processing(filename, result.get(
            "chunks_count", 0), processing_time)

    except Exception as e:
        # Update status to error in database
        db = SessionLocal()
        try:
            file_service = FileService(db)
            file_service.update_file_status(file_id, "error", 0.0, str(e))
        finally:
            db.close()

        # Update in-memory status
        if file_id in documents_db:
            documents_db[file_id]["status"] = DocumentStatus.ERROR
            documents_db[file_id]["error_message"] = str(e)

        # Log error
        log_error(e, f"Document processing failed for {filename}")
        print(f"Error processing document {filename}: {e}")


@router.post("/clear-all")
async def clear_all_documents(db: Session = Depends(get_db)):
    """Clear all documents from both the public folder and ChromaDB"""
    try:
        # Clear all documents from ChromaDB
        try:
            # Get all document IDs first
            all_docs = document_processor.collection.get()
            if all_docs['ids']:
                # Delete all documents by their IDs
                document_processor.collection.delete(ids=all_docs['ids'])
                print(
                    f"ChromaDB cleared successfully - deleted {len(all_docs['ids'])} documents")
            else:
                print("ChromaDB was already empty")
        except Exception as e:
            print(f"Error clearing ChromaDB: {e}")

        # Clear all files from the public documents folder
        public_docs_path = "../public/documents"
        if os.path.exists(public_docs_path):
            for folder in ["pdf", "txt", "docx", "other"]:
                folder_path = os.path.join(public_docs_path, folder)
                if os.path.exists(folder_path):
                    try:
                        # Remove all files in the folder
                        for filename in os.listdir(folder_path):
                            file_path = os.path.join(folder_path, filename)
                            if os.path.isfile(file_path):
                                os.remove(file_path)
                                print(f"Deleted file: {file_path}")
                    except Exception as e:
                        print(f"Error deleting files from {folder}: {e}")

        # Clear file records from database
        try:
            file_service = FileService(db)
            # Get all file records and delete them
            all_files = file_service.get_all_files()
            for file_record in all_files:
                file_service.delete_file(file_record.id)
            print(
                f"Database cleared successfully - deleted {len(all_files)} file records")
        except Exception as e:
            print(f"Error clearing database: {e}")

        # Clear the in-memory documents database
        documents_db.clear()

        return {"message": "All documents and embeddings cleared successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reset-collection")
async def reset_chromadb_collection():
    """Reset the ChromaDB collection with optimized parameters"""
    try:
        success = document_processor.reset_collection()
        if success:
            return {"message": "ChromaDB collection reset successfully"}
        else:
            raise HTTPException(
                status_code=500, detail="Failed to reset ChromaDB collection")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/collection-stats")
async def get_collection_stats():
    """Get ChromaDB collection statistics"""
    try:
        stats = document_processor.get_collection_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/collection-status")
async def get_collection_status():
    """Check if the collection has sufficient data for searching"""
    try:
        has_data = document_processor.has_sufficient_data()
        stats = document_processor.get_collection_stats()
        return {
            "has_sufficient_data": has_data,
            "stats": stats,
            "message": "Collection has sufficient data for searching" if has_data else "Collection needs more documents for searching"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
