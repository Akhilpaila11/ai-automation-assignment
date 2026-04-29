from pydantic import BaseModel
from uuid import UUID
from typing import Optional

class DealershipCreate(BaseModel):
    name: str
    brand: Optional[str] = None
    account_id: UUID

class DealershipOut(BaseModel):
    id: UUID
    name: str
    brand: Optional[str]
    logo_url: Optional[str]
    panel_url: Optional[str]
    account_id: UUID

    class Config:
        from_attributes = True
