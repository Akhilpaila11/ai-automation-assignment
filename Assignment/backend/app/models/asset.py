from sqlalchemy import Column, String, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum

from app.database import Base

class AssetType(str, enum.Enum):
    background = "background"
    panel = "panel"
    logo = "logo"

class Asset(Base):
    __tablename__ = "assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    asset_type = Column(Enum(AssetType), nullable=False)
    file_path = Column(String, nullable=False)
    original_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
