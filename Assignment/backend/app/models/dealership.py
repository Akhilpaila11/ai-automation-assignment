from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.database import Base

class Dealership(Base):
    __tablename__ = "dealerships"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    brand = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)   # default logo file path
    panel_url = Column(String, nullable=True)  # default panel file path
    account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id"), nullable=False)

    account = relationship("Account", back_populates="dealerships")
