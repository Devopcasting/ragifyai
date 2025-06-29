# RAGIFY FastAPI Backend

A FastAPI backend for intelligent document analysis using Langchain, NLTK, ChromaDB, GCP Gemini embeddings, and Ollama with Mistral model for chat.

## Features

- **Document Processing**: Upload and process PDF, TXT, and DOCX files
- **Text Extraction**: Extract text from various document formats
- **Text Chunking**: Split documents into manageable chunks using Langchain
- **Stop Word Removal**: Clean text using NLTK for better processing
- **Embeddings**: Generate high-quality embeddings using GCP Gemini embedding-001
- **Vector Storage**: Store embeddings in ChromaDB for semantic search
- **RAG Chat**: Chat with documents using Retrieval-Augmented Generation with Ollama Mistral
- **Semantic Search**: Search documents using semantic similarity

## Prerequisites

- Python 3.8+
- Google Cloud Platform account with Gemini API access
- GCP service account credentials (JSON file)
- Ollama installed and running locally
- Mistral model available in Ollama (`ollama pull mistral`)

## Installation

1. **Install Ollama and Mistral:**
   ```bash
   # Install Ollama (if not already installed)
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Start Ollama service
   ollama serve
   
   # Pull Mistral model
   ollama pull mistral
   ```

2. **Configure GCP Credentials:**
   - Place your GCP service account JSON file somewhere safe (e.g., `backend/credentials.json`).
   - Create a `.env` file in the `backend` directory with the following content:
     ```env
     GOOGLE_APPLICATION_CREDENTIALS=./credentials.json
     GOOGLE_CLOUD_PROJECT=your_google_cloud_project_id
     GOOGLE_CLOUD_LOCATION=global
     GOOGLE_GENAI_USE_VERTEXAI=True
     ```
   - (You can use any path for your credentials file, just update the `.env` accordingly.)
   
   **To get your Google Cloud Project ID:**
   1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
   2. Select your project or create a new one
   3. Copy the Project ID from the project selector at the top of the page
   4. Add it to the `GOOGLE_CLOUD_PROJECT` field in your `.env` file
   
   **Service Account Setup:**
   1. Create a service account in Google Cloud Console
   2. Download the JSON credentials file
   3. Enable the Gemini API for your project
   4. Assign the required roles: `roles/aiplatform.user` and `roles/generativelanguage.user`

3. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

4. **Create a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

5. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

6. **Download NLTK data:**
   ```bash
   python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"
   ```

## Configuration

The backend uses a hybrid approach:
- **Google Generative AI SDK**: For high-quality text embeddings using the official Python SDK
- **Ollama Mistral**: For local chat and text generation
- **ChromaDB**: For vector storage and similarity search

Make sure both GCP credentials and Ollama are properly configured. The new Google Generative AI SDK provides direct access to Gemini embeddings with better performance and control.

### Environment Variables (.env)

- `GOOGLE_APPLICATION_CREDENTIALS`: Path to your GCP service account JSON file (required for Gemini embeddings)
- `GOOGLE_CLOUD_PROJECT`: Your Google Cloud Project ID
- `GOOGLE_CLOUD_LOCATION`: Google Cloud location (default: global)
- `GOOGLE_GENAI_USE_VERTEXAI`: Enable Vertex AI integration (default: False)
- `CHUNK_SIZE`: Text chunk size (default: 1000)
- `CHUNK_OVERLAP`: Chunk overlap (default: 200)
- `MAX_TOKENS`: Maximum tokens for AI responses (default: 4096)
- `OLLAMA_BASE_URL`: Ollama service URL (default: http://localhost:11434)
- `OLLAMA_MODEL`: Ollama model name (default: mistral)

## Running the Server

### Easy Start (Recommended)
```bash
./start.sh
```

### Manual Start
```bash
# Development Mode
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production Mode
uvicorn main:app --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, you can access:
- **Interactive API docs**: http://localhost:8000/docs
- **ReDoc documentation**: http://localhost:8000/redoc

## API Endpoints

### Documents

- `POST /api/documents/upload` - Upload and process a document (legacy endpoint)
- `POST /api/documents/upload-to-public` - Upload file to public/documents folder and process it (recommended)
- `POST /api/documents/process` - Process a document from a file path (new architecture)
- `GET /api/documents/path-info/{filename}` - Get suggested path and document type for a filename
- `GET /api/documents/` - List all documents
- `GET /api/documents/{document_id}` - Get document details
- `DELETE /api/documents/{document_id}` - Delete a document
- `GET /api/documents/{document_id}/download` - Download a document

### Chat

- `POST /api/chat/` - Send a message and get AI response
- `GET /api/chat/suggestions` - Get suggested questions

### Search

- `POST /api/search/` - Search documents using semantic similarity
- `GET /api/search/` - Search documents (GET method)

## Project Structure

```
backend/
├── main.py                 # FastAPI application entry point
├── requirements.txt        # Python dependencies
├── README.md              # This file
├── start.sh               # Easy startup script
├── .env                   # Environment variables (GCP credentials path)
├── credentials.json        # (Example) GCP service account file
├── models/
│   ├── __init__.py
│   └── document.py        # Pydantic models
├── routes/
│   ├── __init__.py
│   ├── document_routes.py # Document management endpoints
│   ├── chat_routes.py     # Chat endpoints
│   └── search_routes.py   # Search endpoints
├── services/
│   ├── __init__.py
│   ├── document_processor.py # Document processing logic
│   └── chat_service.py    # Chat/RAG logic
├── utils/
│   ├── __init__.py
│   ├── config.py          # Configuration management
│   └── text_processing.py # NLTK text processing
├── uploads/               # Uploaded files (created automatically)
└── chroma_db/            # ChromaDB storage (created automatically)
```

## Usage Examples

### Upload a Document
```bash
curl -X POST "http://localhost:8000/api/documents/upload" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@document.pdf"
```

### Upload to Public Folder (Recommended)
```bash
curl -X POST "http://localhost:8000/api/documents/upload-to-public" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@document.pdf"
```

### Process Document from Path (New Architecture)
```bash
# First, get path information
curl -X GET "http://localhost:8000/api/documents/path-info/document.pdf"

# Then process the document
curl -X POST "http://localhost:8000/api/documents/process" \
     -H "Content-Type: application/json" \
     -d '{
       "file_path": "../public/documents/pdf/document.pdf",
       "filename": "document.pdf",
       "document_type": "PDF"
     }'
```

### Chat with Documents
```bash
curl -X POST "http://localhost:8000/api/chat/" \
     -H "Content-Type: application/json" \
     -d '{
       "message": "What are the main topics in the documents?",
       "document_ids": ["doc1", "doc2"]
     }'
```

### Search Documents
```bash
curl -X GET "http://localhost:8000/api/search/?query=artificial intelligence&limit=5"
```

## Architecture

### Hybrid AI Stack

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Google GenAI  │    │   Ollama        │    │   ChromaDB      │
│   SDK           │    │   Mistral       │    │   Vector Store  │
│                 │    │                 │    │                 │
│ • Direct API    │    │ • Local LLM     │    │ • Fast similarity│
│   access        │    │ • No API costs  │    │   search        │
│ • 768 dimensions│    │ • Privacy       │    │ • Persistent    │
│ • Better perf   │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RAGIFY Backend                              │
│                                                                 │
│  Document Upload → Text Extraction → Chunking → Embeddings     │
│                              ↓                                  │
│  User Query → Embedding → Vector Search → Context → LLM        │
└─────────────────────────────────────────────────────────────────┘
```

## Troubleshooting

### Common Issues

1. **GCP Credentials Error**: Ensure `.env` is set and the credentials file exists
2. **Ollama Not Running**: Start Ollama with `ollama serve`
3. **Mistral Model Missing**: Install with `ollama pull mistral`
4. **NLTK Data Missing**: Run the NLTK download commands in the installation section
5. **ChromaDB Issues**: Delete the `chroma_db` directory to reset the vector database
6. **Port Already in Use**: Change the port in the uvicorn command

### Ollama Commands

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# List available models
ollama list

# Pull Mistral model
ollama pull mistral

# Test Mistral
ollama run mistral "Hello, how are you?"
```

### GCP Setup

```bash
# Verify GCP credentials
python -c "from utils.config import config; print(config.get_project_id())"

# Test Gemini API access
python -c "from langchain_google_genai import GoogleGenerativeAIEmbeddings; e = GoogleGenerativeAIEmbeddings(model='models/embedding-001', credentials_path=os.getenv('GOOGLE_APPLICATION_CREDENTIALS')); print(e.embed_query('test'))"
```

### Logs

Check the console output for detailed error messages and processing logs.

## Development

### Adding New Document Types

1. Update the `DocumentType` enum in `models/document.py`
2. Add extraction logic in `services/document_processor.py`
3. Update the allowed types in `routes/document_routes.py`

### Extending Search Functionality

1. Modify the search logic in `services/document_processor.py`
2. Add new endpoints in `routes/search_routes.py`
3. Update the search models in `models/document.py`

### Using Different Models

To use a different Ollama model, update the configuration in `utils/config.py`:

```python
self.ollama_model = "llama2"  # or any other model
```

Then pull the model:
```bash
ollama pull llama2
```

## License

This project is part of the RAGIFY application.

## Document Processing Architecture

### New Architecture (Recommended)

The backend now supports a new architecture where documents are uploaded to organized folders in the `public` directory:

```
public/
└── documents/
    ├── pdf/     # PDF documents
    ├── txt/     # Text documents  
    └── docx/    # Word documents
```

#### Workflow:

1. **Frontend uploads documents** to the appropriate folder in `public/documents/`
2. **Frontend calls backend** with the file path and metadata
3. **Backend processes the document** from the specified path
4. **Document is indexed** in ChromaDB for search and chat

#### API Usage:

**Get path information for a document:**
```bash
GET /api/documents/path-info/document.pdf
```

**Process a document from path:**
```bash
POST /api/documents/process
{
  "file_path": "../public/documents/pdf/document.pdf",
  "filename": "document.pdf", 
  "document_type": "PDF"
}
```

### Legacy Architecture

The original upload endpoint (`POST /api/documents/upload`) is still available for backward compatibility.