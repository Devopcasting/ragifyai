import os
import json
from pathlib import Path
from typing import Dict, Any
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    def __init__(self):
        self.chroma_db_path = "chroma_db"
        self.uploads_path = "uploads"
        self.chunk_size = 1000
        self.chunk_overlap = 200
        self.max_tokens = 4096

        # GCP configuration for embeddings
        self.gcp_credentials_path = os.getenv(
            "GOOGLE_APPLICATION_CREDENTIALS", "../src/config/gcp.json")

        # Google API key
        self.google_api_key = os.getenv("GOOGLE_API_KEY", "")

        # Google Cloud Project configuration
        self.google_cloud_project = os.getenv("GOOGLE_CLOUD_PROJECT", "")
        self.google_cloud_location = os.getenv(
            "GOOGLE_CLOUD_LOCATION", "global")
        self.google_genai_use_vertexai = os.getenv(
            "GOOGLE_GENAI_USE_VERTEXAI", "False").lower() == "true"

        # Ollama configuration for chat
        self.ollama_base_url = "http://localhost:11434"
        self.ollama_model = "mistral"

        # Embedding configuration
        self.embedding_model = "sentence-transformers/all-MiniLM-L6-v2"
        self.embedding_dimension = 384

    def get_gcp_credentials(self) -> Dict[str, Any]:
        """Load GCP credentials from the config file"""
        try:
            gcp_path = Path(self.gcp_credentials_path)
            with open(gcp_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            raise FileNotFoundError(
                f"GCP credentials file not found at {gcp_path}")
        except json.JSONDecodeError:
            raise ValueError("Invalid JSON in GCP credentials file")

    def get_project_id(self) -> str:
        """Get GCP project ID from credentials"""
        credentials = self.get_gcp_credentials()
        return credentials.get('project_id', '')

    def get_service_account_email(self) -> str:
        """Get GCP service account email from credentials"""
        credentials = self.get_gcp_credentials()
        return credentials.get('client_email', '')

    def get_public_documents_path(self, document_type: str) -> str:
        """Get the public documents path for a specific document type"""
        type_mapping = {
            "pdf": "pdf",
            "txt": "txt",
            "docx": "docx"
        }
        folder_name = type_mapping.get(document_type.lower(), "other")
        return f"../public/documents/{folder_name}"

    def get_document_type_from_extension(self, filename: str) -> str:
        """Get document type from file extension"""
        ext = filename.lower().split('.')[-1] if '.' in filename else ''
        type_mapping = {
            "pdf": "pdf",
            "txt": "txt",
            "docx": "docx"
        }
        return type_mapping.get(ext, "other")


# Global config instance
config = Config()
