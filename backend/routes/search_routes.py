from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional

from models.document import SearchRequest, SearchResponse, SearchResult
from services.document_processor import document_processor

router = APIRouter()


@router.post("/", response_model=SearchResponse)
async def search_documents(request: SearchRequest):
    """Search documents using semantic similarity"""
    try:
        if not request.query.strip():
            raise HTTPException(
                status_code=400, detail="Search query cannot be empty")

        # Convert None to empty list for document_ids
        document_ids = request.document_ids if request.document_ids is not None else []

        results = document_processor.search_documents(
            query=request.query,
            document_ids=document_ids,
            limit=request.limit
        )

        # Convert to SearchResult objects
        search_results = []
        for result in results:
            search_results.append(SearchResult(
                id=result["id"],
                document_id=result["source"],
                document_name=result["source"],
                content=result["content"],
                score=result["score"],
                metadata=result["metadata"]
            ))

        return SearchResponse(
            results=search_results,
            total_count=len(search_results),
            query=request.query
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=SearchResponse)
async def search_documents_get(
    query: str = Query(..., description="Search query"),
    document_ids: Optional[List[str]] = Query(
        None, description="Filter by document IDs"),
    limit: int = Query(10, description="Maximum number of results")
):
    """Search documents using GET method"""
    try:
        if not query.strip():
            raise HTTPException(
                status_code=400, detail="Search query cannot be empty")

        # Convert None to empty list for document_ids
        doc_ids = document_ids if document_ids is not None else []

        results = document_processor.search_documents(
            query=query,
            document_ids=doc_ids,
            limit=limit
        )

        # Convert to SearchResult objects
        search_results = []
        for result in results:
            search_results.append(SearchResult(
                id=result["id"],
                document_id=result["source"],
                document_name=result["source"],
                content=result["content"],
                score=result["score"],
                metadata=result["metadata"]
            ))

        return SearchResponse(
            results=search_results,
            total_count=len(search_results),
            query=query
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
