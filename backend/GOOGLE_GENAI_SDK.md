# Google Generative AI SDK Integration

## Overview

RAGIFY now uses the official Google Generative AI Python SDK for embeddings instead of the Langchain wrapper. This provides:

- **Direct API access** to Gemini models
- **Better performance** and control
- **Official Google support** and updates
- **Simplified configuration**

## Installation

The Google Generative AI SDK is included in `requirements.txt`:

```bash
pip install google-generativeai==0.3.2
```

## Configuration

### Environment Variables

The service uses Google Cloud service account credentials. Ensure your `.env` file has:

```env
GOOGLE_APPLICATION_CREDENTIALS=../src/config/gcp.json
```

### Service Account Setup

1. **Create a service account** in Google Cloud Console
2. **Download the JSON credentials file** and place it in your project
3. **Update the path** in your `.env` file to point to the credentials file
4. **Enable the Gemini API** for your project

### Required Permissions

Your service account needs the following roles:
- `roles/aiplatform.user` - For accessing Gemini models
- `roles/generativelanguage.user` - For using the Generative AI API

## Usage

### Embedding Service

The `GoogleEmbeddingService` class provides a clean interface for generating embeddings:

```python
from services.embedding_service import embedding_service

# Generate embedding for a single text
embedding = embedding_service.embed_text("Your text here")

# Generate embeddings for multiple documents
embeddings = embedding_service.embed_documents([
    "Document 1 content",
    "Document 2 content"
])

# Generate embedding for a search query
query_embedding = embedding_service.embed_query("Search query")
```

### API Reference

#### `embed_text(text, task_type="RETRIEVAL_DOCUMENT", title=None)`

Generate embedding for a single text.

**Parameters:**
- `text` (str): The text to embed
- `task_type` (str): Task type ("RETRIEVAL_DOCUMENT", "RETRIEVAL_QUERY", etc.)
- `title` (str, optional): Title for the content

**Returns:**
- `List[float]`: Embedding vector

#### `embed_documents(texts, task_type="RETRIEVAL_DOCUMENT", titles=None)`

Generate embeddings for multiple texts.

**Parameters:**
- `texts` (List[str]): List of texts to embed
- `task_type` (str): Task type
- `titles` (List[str], optional): Titles for each text

**Returns:**
- `List[List[float]]`: List of embedding vectors

#### `embed_query(query)`

Generate embedding for a search query.

**Parameters:**
- `query` (str): Search query

**Returns:**
- `List[float]`: Query embedding vector

## Model Configuration

The service uses the `models/embedding-001` model with 768 dimensions by default. You can modify these in `services/embedding_service.py`:

```python
self.model = "models/embedding-001"  # Model name
self.dimension = 768                 # Embedding dimension
```

## Task Types

The SDK supports different task types for embeddings:

- `RETRIEVAL_DOCUMENT`: For document content
- `RETRIEVAL_QUERY`: For search queries
- `SEMANTIC_SIMILARITY`: For similarity tasks
- `CLASSIFICATION`: For classification tasks
- `CLUSTERING`: For clustering tasks

## Error Handling

The service includes comprehensive error handling:

```python
try:
    embedding = embedding_service.embed_text("Your text")
except Exception as e:
    print(f"Embedding error: {e}")
```

Common errors:
- `API_KEY_INVALID`: Check your Google API key
- `QUOTA_EXCEEDED`: API quota limit reached
- `INVALID_ARGUMENT`: Invalid input parameters

## Performance

The direct SDK approach provides:

- **Faster response times** compared to Langchain wrapper
- **Lower latency** for embedding generation
- **Better error handling** and debugging
- **Direct access** to all SDK features

## Migration from Langchain

The migration is transparent - the document processor automatically uses the new service. No changes needed to your existing code.

## Testing

Test the embedding service:

```python
from services.embedding_service import embedding_service

# Test single embedding
embedding = embedding_service.embed_text("Test text")
print(f"Embedding dimension: {len(embedding)}")

# Test multiple embeddings
embeddings = embedding_service.embed_documents(["Text 1", "Text 2"])
print(f"Generated {len(embeddings)} embeddings")
```

## Troubleshooting

### Credentials Issues

1. Verify your service account credentials file exists and is valid
2. Check that the service account has the required permissions
3. Ensure the Gemini API is enabled for your project
4. Verify the credentials path in `.env` is correct

### Authentication Errors

1. Check service account permissions in Google Cloud Console
2. Verify the credentials file is not corrupted
3. Ensure the service account has access to the Gemini API
4. Check that the project has billing enabled

### Rate Limiting

1. Monitor your API usage in Google Cloud Console
2. Implement retry logic if needed
3. Consider caching embeddings for repeated content

### Model Issues

1. Verify the model name is correct
2. Check Google AI Studio for model availability
3. Ensure your service account has access to the model 