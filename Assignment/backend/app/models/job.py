from sqlalchemy import Column, String, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum

from app.database import Base

class JobStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    done = "done"
    failed = "failed"

class Job(Base):
    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    status = Column(Enum(JobStatus), default=JobStatus.pending)
    output_format = Column(String, default="post_square")
    zip_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class JobDealership(Base):
    __tablename__ = "job_dealerships"

    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"), primary_key=True)
    dealership_id = Column(UUID(as_uuid=True), ForeignKey("dealerships.id"), primary_key=True)

class JobAsset(Base):
    __tablename__ = "job_assets"

    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"), primary_key=True)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id"), primary_key=True)

class JobOutput(Base):
    __tablename__ = "job_outputs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=False)
    dealership_id = Column(UUID(as_uuid=True), ForeignKey("dealerships.id"), nullable=False)
    file_path = Column(String, nullable=False)
