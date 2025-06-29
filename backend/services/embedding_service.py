import os
from typing import List, Optional
from google.genai import Client
from utils.config import config


class GeminiEmbeddingService:
    def __init__(self):
        """Initialize Google Generative AI client for embeddings using service account credentials"""
        # Check if we should use Vertex AI
        if config.google_genai_use_vertexai:
            # Use Vertex AI with service account credentials
            project_id = config.google_cloud_project
            location = config.google_cloud_location

            if not project_id:
                raise ValueError(
                    "GOOGLE_CLOUD_PROJECT environment variable is required for Vertex AI")

            # Initialize the client with Vertex AI configuration
            self.client = Client(
                vertexai=True,
                project=project_id,
                location=location
            )
        else:
            # Use API key (fallback)
            api_key = config.google_api_key
            if not api_key:
                raise ValueError(
                    "GOOGLE_API_KEY environment variable is required for API key authentication")

            self.client = Client(api_key=api_key)

        # Model configuration
        self.model = "text-embedding-005"
        self.dimension = 768  # Default dimension for text-embedding-005

    def embed_text(self, text: str, task_type: str = "RETRIEVAL_DOCUMENT", title: Optional[str] = None) -> List[float]:
        """Generate embedding for a single text using text-embedding-005"""
        try:
            # Use the google-genai client for embeddings
            response = self.client.models.embed_content(
                model=self.model,
                contents=[text],
                config={
                    'task_type': task_type,
                    'title': title
                } if title else {
                    'task_type': task_type
                }
            )

            # Extract embedding from response
            embedding = response.embeddings[0].values
            return list(embedding)

        except Exception as e:
            raise Exception(f"Gemini embedding error: {str(e)}")

    def embed_documents(self, texts: List[str], task_type: str = "RETRIEVAL_DOCUMENT", titles: Optional[List[str]] = None) -> List[List[float]]:
        """Generate embeddings for multiple texts using Gemini embedding-001"""
        try:
            embeddings = []

            for i, text in enumerate(texts):
                title = titles[i] if titles and i < len(titles) else None
                embedding = self.embed_text(text, task_type, title)
                embeddings.append(embedding)

            return embeddings

        except Exception as e:
            raise Exception(f"Gemini batch embedding error: {str(e)}")

    def embed_query(self, query: str) -> List[float]:
        """Generate embedding for a search query"""
        return self.embed_text(query, task_type="RETRIEVAL_QUERY")

    def get_embedding_dimension(self) -> int:
        """Get the embedding dimension"""
        return self.dimension


embedding_service = GeminiEmbeddingService()
