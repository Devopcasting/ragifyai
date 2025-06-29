#!/bin/bash

# RAGIFY FastAPI Backend Startup Script

echo "🚀 Starting RAGIFY FastAPI Backend..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install/upgrade dependencies
# echo "📥 Installing dependencies..."
# pip install --upgrade pip
# pip install -r requirements.txt

# Download NLTK data
# echo "📚 Downloading NLTK data..."
# python -c "import nltk; nltk.download('punkt', quiet=True); nltk.download('stopwords', quiet=True)"

# Create necessary directories
# echo "📁 Creating directories..."
# mkdir -p uploads
# mkdir -p chroma_db

# Check if GCP credentials exist
# echo "🔑 Checking GCP credentials..."
# if [ ! -f "../src/config/gcp.json" ]; then
#     echo "⚠️  Warning: GCP credentials not found at ../src/config/gcp.json"
#     echo "   Please ensure your GCP service account credentials are properly configured for embeddings."
#     echo ""
#     read -p "Do you want to continue anyway? (y/N): " -n 1 -r
#     echo
#     if [[ ! $REPLY =~ ^[Yy]$ ]]; then
#         echo "Exiting..."
#         exit 1
#     fi
# else
#     echo "✅ GCP credentials found"
# fi

# Check if Ollama is running
# echo "🤖 Checking Ollama service..."
# if ! curl -s http://localhost:11434/api/tags > /dev/null; then
#     echo "⚠️  Warning: Ollama is not running on http://localhost:11434"
#     echo "   Please start Ollama with: ollama serve"
#     echo "   And ensure Mistral model is available with: ollama pull mistral"
#     echo ""
#     read -p "Do you want to continue anyway? (y/N): " -n 1 -r
#     echo
#     if [[ ! $REPLY =~ ^[Yy]$ ]]; then
#         echo "Exiting..."
#         exit 1
#     fi
# else
#     echo "✅ Ollama is running"
# fi

# Check if Mistral model is available
# echo "🔍 Checking Mistral model..."
# if ! curl -s http://localhost:11434/api/tags | grep -q "mistral"; then
#     echo "⚠️  Warning: Mistral model not found in Ollama"
#     echo "   Please install it with: ollama pull mistral"
#     echo ""
#     read -p "Do you want to continue anyway? (y/N): " -n 1 -r
#     echo
#     if [[ ! $REPLY =~ ^[Yy]$ ]]; then
#         echo "Exiting..."
#         exit 1
#     fi
# else
#     echo "✅ Mistral model is available"
# fi

# Start the server
echo "🌐 Starting FastAPI server..."
echo "   API will be available at: http://localhost:8000"
echo "   API docs will be available at: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

uvicorn main:app --reload --host 0.0.0.0 --port 8000 