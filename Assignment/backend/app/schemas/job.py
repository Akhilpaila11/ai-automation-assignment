from pydantic import BaseModel
from uuid import UUID
from typing import List, Optional
from datetime import datetime

class JobCreate(BaseModel):
    dealership_ids: List[UUID]
    asset_ids: List[UUID]
    output_format: str = "post_square"   # post_square | post_portrait | story
    use_logo: bool = True                # allow frontend to toggle logo on/off

class JobOut(BaseModel):
    id: UUID
    status: str
    output_format: str
    zip_path: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class JobOutputOut(BaseModel):
    id: UUID
    dealership_id: UUID
    file_path: str

    class Config:
        from_attributes = True
