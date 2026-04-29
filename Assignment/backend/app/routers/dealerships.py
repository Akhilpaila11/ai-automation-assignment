from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import shutil, os, uuid

from app.database import get_db
from app.models.dealership import Dealership
from app.schemas.dealership import DealershipCreate, DealershipOut
from app.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/dealerships", tags=["Dealerships"])

UPLOAD_DIR = "uploads"

@router.post("", response_model=DealershipOut)
def create_dealership(data: DealershipCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    dealership = Dealership(**data.model_dump())
    db.add(dealership)
    db.commit()
    db.refresh(dealership)
    return dealership

@router.get("", response_model=List[DealershipOut])
def list_dealerships(account_id: str = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    query = db.query(Dealership)
    if account_id:
        query = query.filter(Dealership.account_id == account_id)
    return query.all()

@router.get("/{dealership_id}", response_model=DealershipOut)
def get_dealership(dealership_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    d = db.query(Dealership).filter(Dealership.id == dealership_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dealership not found")
    return d

def _save_file(file: UploadFile) -> str:
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    path = os.path.join(UPLOAD_DIR, filename)
    with open(path, "wb") as buf:
        shutil.copyfileobj(file.file, buf)
    return path

@router.post("/{dealership_id}/upload-logo", response_model=DealershipOut)
def upload_logo(dealership_id: str, file: UploadFile = File(...), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    d = db.query(Dealership).filter(Dealership.id == dealership_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dealership not found")
    d.logo_url = _save_file(file)
    db.commit()
    db.refresh(d)
    return d

@router.post("/{dealership_id}/upload-panel", response_model=DealershipOut)
def upload_panel(dealership_id: str, file: UploadFile = File(...), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    d = db.query(Dealership).filter(Dealership.id == dealership_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dealership not found")
    d.panel_url = _save_file(file)
    db.commit()
    db.refresh(d)
    return d
