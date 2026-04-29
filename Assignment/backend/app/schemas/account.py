from pydantic import BaseModel
from uuid import UUID

class AccountCreate(BaseModel):
    name: str

class AccountOut(BaseModel):
    id: UUID
    name: str

    class Config:
        from_attributes = True
