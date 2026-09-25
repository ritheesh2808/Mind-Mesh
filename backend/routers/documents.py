from fastapi import APIRouter, Query
from typing import List, Optional
from backend.schemas import DocumentResponse, DocumentCreate
from backend.repository import Repository

router = APIRouter(prefix="/documents", tags=["Shared Documents"])

@router.get("", response_model=List[DocumentResponse])
def get_all_documents(project_id: Optional[str] = Query(None)):
    """Retrieve documents, optionally filtered by project"""
    return Repository.get_documents(project_id)

@router.get("/project/{project_id}", response_model=List[DocumentResponse])
def get_project_documents(project_id: str):
    """Retrieve shared documents and authored artifacts for a project"""
    return Repository.get_documents(project_id)

@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(document_id: str):
    """Retrieve a single document by ID"""
    from fastapi import HTTPException
    doc = Repository.get_document_by_id(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@router.post("", response_model=DocumentResponse)
def create_document(document: DocumentCreate):
    """Upload and register a new shared project document"""
    return Repository.create_document(document.model_dump())

@router.delete("/{document_id}")
def delete_document(document_id: str):
    """Delete a document by ID"""
    from fastapi import HTTPException
    deleted = Repository.delete_document(document_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"success": True, "id": document_id}



