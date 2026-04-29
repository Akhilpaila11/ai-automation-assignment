from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import List
import shutil, os, uuid

from app.database import get_db
from app.models.asset import Asset, AssetType
from app.models.job import JobAsset
from app.schemas.asset import AssetOut
from app.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/assets", tags=["Assets"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=AssetOut)
def upload_asset(
    asset_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    if asset_type not in AssetType.__members__:
        raise HTTPException(status_code=400, detail=f"Invalid asset_type: {asset_type}")

    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    asset = Asset(
        uploaded_by=user.id,
        asset_type=asset_type,
        file_path=file_path,
        original_name=file.filename
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset

@router.get("", response_model=List[AssetOut])
def list_assets(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Asset).filter(Asset.uploaded_by == user.id).all()

@router.delete("/{asset_id}")
def delete_asset(asset_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    asset = db.query(Asset).filter(Asset.id == asset_id, Asset.uploaded_by == user.id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    if os.path.exists(asset.file_path):
        os.remove(asset.file_path)

    db.query(JobAsset).filter(JobAsset.asset_id == asset.id).delete(synchronize_session=False)
    db.delete(asset)
    db.commit()
    return {"detail": "Deleted"}
