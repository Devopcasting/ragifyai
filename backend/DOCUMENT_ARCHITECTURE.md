# Document Processing Architecture

## Overview

RAGIFY now supports a new document processing architecture where documents are organized in the `public` folder and processed by the backend based on file paths rather than direct uploads.

## Folder Structure

```
ragify/
├── public/
│   └── documents/
│       ├── pdf/     # PDF documents
│       ├── txt/     # Text documents
│       └── docx/    # Word documents
├── backend/
│   ├── routes/
│   │   └── document_routes.py  # API endpoints
│   └── services/
│       └── document_processor.py  # Processing logic
└── frontend/
    └── ...  # React frontend
```

## Workflow

### 1. Document Upload (Frontend)
- User selects a document in the frontend
- Frontend uploads the document to the appropriate folder in `public/documents/`
- Example: `document.pdf` → `public/documents/pdf/document.pdf`

### 2. Path Information (Optional)
- Frontend can call `/api/documents/path-info/{filename}` to get:
  - Suggested file path
  - Detected document type
  - Available folder structure

### 3. Document Processing (Backend)
- Frontend calls `/api/documents/process` with:
  - `file_path`: Path to the uploaded document
  - `filename`: Original filename
  - `document_type`: Document type (PDF, TEXT, DOCX)

### 4. Background Processing
- Backend processes the document in the background:
  - Text extraction
  - Chunking
  - Embedding generation
  - Storage in ChromaDB

## API Endpoints

### Get Path Information
```http
GET /api/documents/path-info/{filename}
```

**Response:**
```json
{
  "suggested_path": "../public/documents/pdf/document.pdf",
  "document_type": "PDF",
  "folder_structure": {
    "pdf": "../public/documents/pdf/",
    "txt": "../public/documents/txt/",
    "docx": "../public/documents/docx/",
    "other": "../public/documents/other/"
  }
}
```

### Process Document
```http
POST /api/documents/process
Content-Type: application/json

{
  "file_path": "../public/documents/pdf/document.pdf",
  "filename": "document.pdf",
  "document_type": "PDF"
}
```

**Response:**
```json
{
  "id": "uuid-here",
  "filename": "document.pdf",
  "document_type": "PDF",
  "size": 12345,
  "status": "UPLOADING",
  "uploaded_at": "2024-01-01T12:00:00"
}
```

## Benefits

1. **Organized Storage**: Documents are automatically organized by type
2. **Separation of Concerns**: Upload and processing are separate operations
3. **Flexibility**: Frontend can handle uploads however it wants
4. **Scalability**: Easy to add new document types
5. **Backward Compatibility**: Original upload endpoint still works

## Frontend Integration

### Example Frontend Flow

```javascript
// 1. Upload file to public folder
const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  // Upload to your preferred method (e.g., direct file system write)
  // This could be handled by your frontend framework or a separate service
  
  return filePath; // e.g., "../public/documents/pdf/document.pdf"
};

// 2. Get path information (optional)
const getPathInfo = async (filename) => {
  const response = await fetch(`/api/documents/path-info/${filename}`);
  return response.json();
};

// 3. Process document
const processDocument = async (filePath, filename, documentType) => {
  const response = await fetch('/api/documents/process', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      file_path: filePath,
      filename: filename,
      document_type: documentType
    })
  });
  
  return response.json();
};
```

## Migration from Legacy

The original `/api/documents/upload` endpoint is still available for backward compatibility. You can gradually migrate to the new architecture by:

1. Updating frontend to use the new workflow
2. Testing with the new endpoints
3. Eventually deprecating the old upload endpoint

## Configuration

The folder structure is defined in `utils/config.py`:

```python
def get_public_documents_path(self, document_type: str) -> str:
    type_mapping = {
        "pdf": "pdf",
        "txt": "txt", 
        "docx": "docx"
    }
    folder_name = type_mapping.get(document_type.lower(), "other")
    return f"../public/documents/{folder_name}"
```

You can modify this mapping to add new document types or change folder names. 