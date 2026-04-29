from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class AssetOut(BaseModel):
    id: UUID
    asset_type: str
    original_name: str
    created_at: datetime

    class Config:
        from_attributes = True
