# RAGIFY - Intelligent Document Analysis Platform

<div align="center">

![RAGIFY Logo](https://img.shields.io/badge/RAGIFY-Intelligent%20Document%20Analysis-blue?style=for-the-badge&logo=react)

**A powerful RAG (Retrieval-Augmented Generation) platform for intelligent document analysis, processing, and AI-powered conversations.**

[![React](https://img.shields.io/badge/React-18.3.1-blue?logo=react)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-green?logo=fastapi)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.1-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-0.4.18-purple?logo=vector-database)](https://www.trychroma.com/)
[![LangChain](https://img.shields.io/badge/LangChain-0.0.350-orange?logo=langchain)](https://www.langchain.com/)

</div>

## 🚀 Features

### 📄 **Document Processing**
- **Multi-format Support**: PDF, DOCX, TXT, Images, Audio, Video
- **Intelligent Text Extraction**: Advanced OCR and content parsing
- **Chunking & Embedding**: Semantic document segmentation
- **Vector Storage**: ChromaDB for efficient similarity search

### 🤖 **AI-Powered Analysis**
- **RAG Implementation**: Retrieval-Augmented Generation
- **Semantic Search**: Find relevant content across documents
- **Intelligent Q&A**: Ask questions about your documents
- **Context-Aware Responses**: AI understands document context

### 💬 **Chat Interface**
- **Conversation History**: Persistent chat sessions
- **Session Management**: Create, save, and manage conversations
- **Real-time Processing**: Live document analysis
- **Source Attribution**: See which documents inform responses

### 📊 **File Management**
- **Visual File Browser**: Grid and list view options
- **Search & Filter**: Find files by type, name, or content
- **Progress Tracking**: Real-time upload and processing status
- **Bulk Operations**: Clear all, reset index, batch processing

### 🔧 **Developer Tools**
- **API Logging**: Comprehensive request/response logging
- **Log Viewer**: Real-time log monitoring interface
- **Health Monitoring**: System status and performance metrics
- **Error Handling**: Robust error management and reporting

## 🏗️ Architecture

```
RAGIFY/
├── frontend/                 # React TypeScript Frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── types/          # TypeScript type definitions
│   │   └── config/         # Configuration files
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── backend/                # FastAPI Python Backend
│   ├── routes/            # API endpoints
│   ├── services/          # Business logic
│   ├── models/            # Data models
│   ├── utils/             # Utility functions
│   └── requirements.txt   # Python dependencies
└── public/documents/      # Document storage
    ├── pdf/              # PDF documents
    ├── txt/              # Text documents
    ├── docx/             # Word documents
    └── other/            # Other file types
```

## 🛠️ Technology Stack

### **Frontend**
- **React 18.3.1** - Modern UI framework
- **TypeScript 5.5.3** - Type-safe development
- **Tailwind CSS 3.4.1** - Utility-first styling
- **Vite 5.4.2** - Fast build tool
- **Lucide React** - Beautiful icons

### **Backend**
- **FastAPI 0.104.1** - Modern Python web framework
- **LangChain 0.0.350** - LLM framework
- **ChromaDB 0.4.18** - Vector database
- **SQLAlchemy 2.0.23** - Database ORM
- **Google Generative AI** - AI/ML capabilities

### **AI & ML**
- **Google Cloud AI Platform** - Cloud AI services
- **Sentence Transformers** - Text embeddings
- **NLTK** - Natural language processing
- **PyPDF2 & python-docx** - Document parsing

## 📦 Installation

### Prerequisites
- **Node.js 18+** and **npm**
- **Python 3.8+** and **pip**
- **Git**

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ragify
```

### 2. Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### 3. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
python main.py
```

The backend API will be available at `http://localhost:8000`

### 4. Environment Configuration

Create a `.env` file in the backend directory:
```env
# Google Cloud Configuration
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/gcp-credentials.json
GOOGLE_CLOUD_PROJECT=your-project-id

# Database Configuration
DATABASE_URL=sqlite:///./ragify.db

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
```

## 🚀 Quick Start

1. **Start Both Services**
   ```bash
   # Terminal 1 - Frontend
   npm run dev
   
   # Terminal 2 - Backend
   cd backend && python main.py
   ```

2. **Upload Documents**
   - Navigate to the Upload tab
   - Drag and drop or select files
   - Watch real-time processing progress

3. **Ask Questions**
   - Go to the Chat tab
   - Start a conversation about your documents
   - Get AI-powered responses with source citations

4. **Manage Files**
   - Use the File Manager to view all documents
   - Search, filter, and organize your knowledge base
   - Monitor processing status and file statistics

## 📚 API Documentation

### Core Endpoints

#### Documents
- `POST /api/documents/upload-to-public` - Upload documents
- `POST /api/documents/process` - Process documents
- `GET /api/documents/` - List all documents
- `DELETE /api/documents/{id}` - Delete document

#### Chat
- `POST /api/chat/generate` - Generate AI responses
- `GET /api/chat-history/sessions` - Get chat sessions
- `POST /api/chat-history/sessions` - Create new session

#### Files
- `GET /api/files/` - Get all files
- `PUT /api/files/{id}/status` - Update file status
- `DELETE /api/files/{id}` - Delete file

#### Search
- `POST /api/search/semantic` - Semantic search
- `GET /api/search/documents` - Search documents

#### Logs
- `GET /api/logs/` - Get application logs
- `DELETE /api/logs/clear` - Clear logs

### Interactive API Docs
Visit `http://localhost:8000/docs` for interactive API documentation powered by Swagger UI.

## 🎯 Usage Examples

### Upload and Process Documents
```bash
# Upload a PDF document
curl -X POST "http://localhost:8000/api/documents/upload-to-public" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@document.pdf"
```

### Chat with Documents
```bash
# Ask a question about your documents
curl -X POST "http://localhost:8000/api/chat/generate" \
     -H "Content-Type: application/json" \
     -d '{
       "message": "What are the main points in the budget document?",
       "session_id": 1
     }'
```

### Search Documents
```bash
# Perform semantic search
curl -X POST "http://localhost:8000/api/search/semantic" \
     -H "Content-Type: application/json" \
     -d '{
       "query": "budget allocation",
       "limit": 5
     }'
```

## 🔧 Configuration

### Frontend Configuration
Edit `src/config/` files for frontend settings:
- API endpoints
- Feature flags
- UI preferences

### Backend Configuration
Modify `backend/utils/config.py` for:
- Database settings
- AI model parameters
- File storage paths
- Logging configuration

### Environment Variables
Key environment variables:
- `GOOGLE_APPLICATION_CREDENTIALS` - GCP service account
- `DATABASE_URL` - Database connection string
- `API_HOST` - Backend host address
- `API_PORT` - Backend port number

## 🧪 Development

### Frontend Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Preview production build
npm run preview
```

### Backend Development
```bash
# Start with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Run tests
python -m pytest

# Format code
black .

# Lint code
flake8 .
```

### Database Management
```bash
# Create database tables
python -c "from database import engine; from models import chat, file; chat.Base.metadata.create_all(engine); file.Base.metadata.create_all(engine)"

# Reset database
rm ragify.db
```

## 📊 Monitoring & Logging

### Log Viewer
Access the built-in log viewer at the Logs tab to monitor:
- API requests and responses
- Document processing status
- Error messages and debugging info
- System performance metrics

### Health Checks
```bash
# Check API health
curl http://localhost:8000/health

# Check root endpoint
curl http://localhost:8000/
```

## 🔒 Security

### File Security
- Documents are stored locally in the `public/documents/` directory
- No sensitive data is transmitted to external services
- File access is controlled through the application

### API Security
- CORS is configured for local development
- Input validation on all endpoints
- Error handling prevents information leakage

### Credentials
- GCP credentials are stored securely
- Environment variables for sensitive configuration
- `.gitignore` excludes credential files

## 🐛 Troubleshooting

### Common Issues

**Frontend not connecting to backend:**
- Ensure backend is running on port 8000
- Check CORS configuration
- Verify API endpoints in frontend config

**Document processing fails:**
- Check file format support
- Verify GCP credentials
- Monitor logs for specific errors

**ChromaDB errors:**
- Reset the index using "Reset Index" button
- Check disk space for vector storage
- Verify ChromaDB installation

**Upload issues:**
- Check file size limits
- Verify folder permissions
- Monitor upload progress in UI

### Debug Mode
Enable debug logging in `backend/utils/logger.py`:
```python
logging.basicConfig(level=logging.DEBUG)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **LangChain** for the RAG framework
- **ChromaDB** for vector storage
- **FastAPI** for the backend framework
- **React** for the frontend framework
- **Google Cloud AI** for AI capabilities

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation
- Monitor the application logs

---

<div align="center">

**Built with ❤️ for intelligent document analysis**

[![GitHub stars](https://img.shields.io/github/stars/your-username/ragify?style=social)](https://github.com/your-username/ragify)
[![GitHub forks](https://img.shields.io/github/forks/your-username/ragify?style=social)](https://github.com/your-username/ragify)

</div> 