import time
from typing import List, Dict, Any
from langchain_community.llms import Ollama
from langchain.schema import HumanMessage, SystemMessage
from langchain.prompts import PromptTemplate

from services.document_processor import document_processor
from services.chat_history_service import ChatHistoryService
from utils.config import config
from models.document import ChatRequest, ChatResponse, Timing


class ChatService:
    def __init__(self):
        # Initialize Ollama with Mistral model
        self.chat_model = Ollama(
            model=config.ollama_model,
            base_url=config.ollama_base_url,
            temperature=0.7
        )

        # System prompt for RAG
        self.system_prompt = """You are an intelligent document analysis assistant. You help users understand and extract insights from their uploaded documents.

When responding to user questions:
1. Use only the information provided in the context from the user's documents
2. Be accurate and factual based on the document content
3. If the information is not available in the documents, clearly state that
4. Provide specific references to document sources when possible
5. Give comprehensive but concise answers
6. If asked for summaries, provide key points and main themes

Always be helpful, professional, and accurate in your responses."""

        # RAG prompt template
        self.rag_prompt = PromptTemplate(
            input_variables=["context", "question"],
            template="""Context from documents:
{context}

User Question: {question}

Please provide a comprehensive answer based on the context above. If the context doesn't contain enough information to answer the question, please state that clearly."""
        )

    async def generate_response(self, request: ChatRequest, chat_history_service: ChatHistoryService | None = None, session_id: int | None = None) -> ChatResponse:
        """Generate a response using RAG approach"""
        start_time = time.time()
        search_start_time = None
        search_end_time = None
        llm_start_time = None
        llm_end_time = None

        try:
            # If no session exists but we have chat history service, create a new session
            if chat_history_service and session_id is None:
                # Create a new session with the first message as title
                title = request.message[:50] + \
                    "..." if len(request.message) > 50 else request.message
                session = chat_history_service.create_chat_session(title)
                session_id = session.id

            # Search for relevant document chunks
            document_ids = request.document_ids if request.document_ids is not None else []
            search_start_time = time.time()
            try:
                search_results = document_processor.search_documents(
                    query=request.message,
                    document_ids=document_ids,
                    limit=5  # Get top 5 most relevant chunks
                )
                search_end_time = time.time()
            except Exception as search_error:
                search_end_time = time.time()
                error_msg = str(search_error)
                if "insufficient data" in error_msg.lower() or "insufficient data in the search index" in error_msg:
                    response_text = "I don't have enough documents to search through yet. Please upload more documents first, then I'll be able to help you with your questions."
                elif "Cannot return the results in a contigious 2D array" in error_msg:
                    response_text = "The search index needs to be rebuilt. You can try the 'Reset Index' button in the File Manager, or upload more documents to improve the search capability."
                else:
                    response_text = f"I encountered an error while searching your documents: {error_msg}. Please try again or contact support if the issue persists."

                # Save to chat history if service is provided
                if chat_history_service and session_id:
                    chat_history_service.add_message(
                        session_id=session_id,
                        role="user",
                        content=request.message
                    )
                    chat_history_service.add_message(
                        session_id=session_id,
                        role="assistant",
                        content=response_text,
                        sources=[],
                        confidence=0.0
                    )

                return ChatResponse(
                    message=response_text,
                    sources=[],
                    confidence=0.0,
                    session_id=session_id,
                    timing=Timing(
                        document_analysis=search_end_time -
                        search_start_time if search_start_time and search_end_time else 0,
                        response_generation=0,
                        total_time=time.time() - start_time
                    )
                )

            if not search_results:
                response_text = "I don't have enough information in the uploaded documents to answer your question. Please make sure you have uploaded relevant documents or try rephrasing your question."

                # Save to chat history if service is provided
                if chat_history_service and session_id:
                    chat_history_service.add_message(
                        session_id=session_id,
                        role="user",
                        content=request.message
                    )
                    chat_history_service.add_message(
                        session_id=session_id,
                        role="assistant",
                        content=response_text,
                        sources=[],
                        confidence=0.0
                    )

                return ChatResponse(
                    message=response_text,
                    sources=[],
                    confidence=0.0,
                    session_id=session_id,
                    timing=Timing(
                        document_analysis=search_end_time -
                        search_start_time if search_start_time and search_end_time else 0,
                        response_generation=0,
                        total_time=time.time() - start_time
                    )
                )

            # Prepare context from search results
            context_parts = []
            sources = []

            for result in search_results:
                source_name = result['source']
                # Remove page number from source display
                source_display = source_name

                context_parts.append(
                    f"Source: {source_display}\nContent: {result['content']}\n")

                # Add to sources list without page info
                source_info = {
                    "name": source_name,
                    "display": source_display
                }
                if source_info not in sources:
                    sources.append(source_info)

            context = "\n".join(context_parts)

            # Generate response using the RAG prompt
            formatted_prompt = self.rag_prompt.format(
                context=context,
                question=request.message
            )

            # Create messages for the chat model
            messages = [
                SystemMessage(content=self.system_prompt),
                HumanMessage(content=formatted_prompt)
            ]

            # Generate response using Ollama
            llm_start_time = time.time()
            response_text = self.chat_model.invoke(formatted_prompt)
            llm_end_time = time.time()

            # Calculate confidence based on search scores
            avg_score = sum(result['score']
                            for result in search_results) / len(search_results)

            # Calculate timing information
            total_time = time.time() - start_time
            search_time = search_end_time - \
                search_start_time if search_start_time and search_end_time else 0
            llm_time = llm_end_time - llm_start_time if llm_start_time and llm_end_time else 0

            print(
                f"DEBUG: Timing info - search: {search_time:.2f}s, llm: {llm_time:.2f}s, total: {total_time:.2f}s")

            # Save to chat history if service is provided
            if chat_history_service and session_id:
                chat_history_service.add_message(
                    session_id=session_id,
                    role="user",
                    content=request.message
                )
                chat_history_service.add_message(
                    session_id=session_id,
                    role="assistant",
                    content=response_text,
                    sources=sources,
                    confidence=avg_score
                )

            timing_data = Timing(
                document_analysis=search_time,
                response_generation=llm_time,
                total_time=total_time
            )
            print(f"DEBUG: Timing data being returned: {timing_data}")

            return ChatResponse(
                message=response_text,
                sources=sources,
                confidence=avg_score,
                session_id=session_id,
                timing=timing_data
            )

        except Exception as e:
            total_time = time.time() - start_time
            error_message = f"I encountered an error while processing your request: {str(e)}. Please try again.\n\n---\n*Total time: {total_time:.2f}s*"

            # Save error to chat history if service is provided
            if chat_history_service and session_id:
                chat_history_service.add_message(
                    session_id=session_id,
                    role="user",
                    content=request.message
                )
                chat_history_service.add_message(
                    session_id=session_id,
                    role="assistant",
                    content=error_message,
                    sources=[],
                    confidence=0.0
                )

            return ChatResponse(
                message=error_message,
                sources=[],
                confidence=0.0,
                session_id=session_id,
                timing=Timing(
                    document_analysis=0,
                    response_generation=0,
                    total_time=total_time
                )
            )

    async def get_suggested_questions(self, document_ids: List[str] | None = None) -> List[str]:
        """Generate suggested questions based on available documents"""
        try:
            # Get some document chunks to understand the content
            doc_ids = document_ids if document_ids is not None else []
            try:
                search_results = document_processor.search_documents(
                    query="main topics themes key points",
                    document_ids=doc_ids,
                    limit=3
                )
            except Exception as search_error:
                # If search fails, return default questions
                return [
                    "What are the main topics covered in your documents?",
                    "Can you summarize the key findings?",
                    "What insights can you extract from the content?",
                    "Are there any patterns or trends in the documents?"
                ]

            if not search_results:
                return [
                    "What are the main topics covered in your documents?",
                    "Can you summarize the key findings?",
                    "What insights can you extract from the content?",
                    "Are there any patterns or trends in the documents?"
                ]

            # Create a prompt for generating questions
            context = "\n".join([result['content']
                                for result in search_results])

            question_prompt = f"""Based on the following document content, generate 4 relevant questions that users might ask:

Content:
{context}

Generate 4 specific, relevant questions that would help users understand this content better. Return only the questions, one per line."""

            # Generate questions using Ollama
            questions_text = self.chat_model.invoke(question_prompt)

            # Parse the questions
            questions = [q.strip() for q in questions_text.split(
                '\n') if q.strip() and '?' in q]

            # Fallback questions if parsing fails
            if len(questions) < 4:
                questions = [
                    "What are the main topics covered in your documents?",
                    "Can you summarize the key findings?",
                    "What insights can you extract from the content?",
                    "Are there any patterns or trends in the documents?"
                ]

            return questions[:4]  # Return max 4 questions

        except Exception as e:
            # Return default questions if there's an error
            return [
                "What are the main topics covered in your documents?",
                "Can you summarize the key findings?",
                "What insights can you extract from the content?",
                "Are there any patterns or trends in the documents?"
            ]


# Global chat service instance
chat_service = ChatService()
