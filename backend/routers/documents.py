from fastapi import APIRouter
from typing import List
from backend.schemas import DocumentResponse, DocumentCreate
from backend.repository import Repository

router = APIRouter(prefix="/documents", tags=["Shared Documents"])

@router.get("/project/{project_id}", response_model=List[DocumentResponse])
def get_project_documents(project_id: str):
    """Retrieve shared documents and authored artifacts for a project"""
    return Repository.get_documents(project_id)

@router.post("", response_model=DocumentResponse)
def create_document(document: DocumentCreate):
    """Upload and register a new shared project document"""
    return Repository.create_document(document.model_dump())

