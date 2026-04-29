from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
import os

from app.database import get_db, SessionLocal
from app.models.job import Job, JobDealership, JobAsset, JobOutput, JobStatus
from app.models.asset import Asset, AssetType
from app.models.dealership import Dealership
from app.schemas.job import JobCreate, JobOut, JobOutputOut
from app.auth import get_current_user
from app.models.user import User
from app.services.composer import compose_creative
from app.services.zip_builder import build_zip

router = APIRouter(prefix="/jobs", tags=["Jobs"])

def run_job(job_id: str, use_logo: bool):
    db = SessionLocal()
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        job.status = JobStatus.processing
        db.commit()

        job_asset_ids = [ja.asset_id for ja in db.query(JobAsset).filter(JobAsset.job_id == job_id).all()]
        assets = db.query(Asset).filter(Asset.id.in_(job_asset_ids)).all()
        asset_map = {a.asset_type: a.file_path for a in assets}

        job_dealership_ids = [jd.dealership_id for jd in db.query(JobDealership).filter(JobDealership.job_id == job_id).all()]
        dealerships = db.query(Dealership).filter(Dealership.id.in_(job_dealership_ids)).all()

        output_paths = []
        for dealership in dealerships:
            logo_path = None
            if use_logo:
                logo_path = asset_map.get(AssetType.logo) or dealership.logo_url

            panel_path = asset_map.get(AssetType.panel) or dealership.panel_url

            output_path = compose_creative(
                job_id=str(job_id),
                dealership_name=dealership.name,
                background_path=asset_map.get(AssetType.background),
                output_format=job.output_format,
                panel_path=panel_path,
                logo_path=logo_path,
            )

            db.add(JobOutput(job_id=job_id, dealership_id=dealership.id, file_path=output_path))
            output_paths.append(output_path)

        db.commit()

        zip_path = build_zip(job_id=str(job_id), file_paths=output_paths)
        job.zip_path = zip_path
        job.status = JobStatus.done
        db.commit()

    except Exception as e:
        job.status = JobStatus.failed
        print(f"Job {job_id} failed: {e}")
        db.commit()

    finally:
        db.close()


@router.post("", response_model=JobOut)
def create_job(
    data: JobCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    job = Job(created_by=user.id, output_format=data.output_format)
    db.add(job)
    db.flush()

    for d_id in data.dealership_ids:
        db.add(JobDealership(job_id=job.id, dealership_id=d_id))
    for a_id in data.asset_ids:
        db.add(JobAsset(job_id=job.id, asset_id=a_id))

    db.commit()
    db.refresh(job)

    background_tasks.add_task(run_job, str(job.id), data.use_logo)
    return job

@router.get("", response_model=List[JobOut])
def list_jobs(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Job).filter(Job.created_by == user.id).order_by(Job.created_at.desc()).all()

@router.get("/{job_id}", response_model=JobOut)
def get_job(job_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    job = db.query(Job).filter(Job.id == job_id, Job.created_by == user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.get("/{job_id}/outputs", response_model=List[JobOutputOut])
def list_outputs(job_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    job = db.query(Job).filter(Job.id == job_id, Job.created_by == user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return db.query(JobOutput).filter(JobOutput.job_id == job_id).all()

@router.get("/{job_id}/outputs/{output_id}/download")
def download_single(job_id: str, output_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    job = db.query(Job).filter(Job.id == job_id, Job.created_by == user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    output = db.query(JobOutput).filter(JobOutput.id == output_id, JobOutput.job_id == job_id).first()
    if not output or not os.path.exists(output.file_path):
        raise HTTPException(status_code=404, detail="Output not found")

    filename = os.path.basename(output.file_path)
    return FileResponse(path=output.file_path, filename=filename, media_type="image/jpeg")

def _delete_job_records(job, db: Session):
    for output in db.query(JobOutput).filter(JobOutput.job_id == job.id).all():
        if os.path.exists(output.file_path):
            os.remove(output.file_path)
    if job.zip_path and os.path.exists(job.zip_path):
        os.remove(job.zip_path)

    db.query(JobOutput).filter(JobOutput.job_id == job.id).delete(synchronize_session=False)
    db.query(JobAsset).filter(JobAsset.job_id == job.id).delete(synchronize_session=False)
    db.query(JobDealership).filter(JobDealership.job_id == job.id).delete(synchronize_session=False)
    db.delete(job)


@router.delete("/{job_id}")
def delete_job(job_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    job = db.query(Job).filter(Job.id == job_id, Job.created_by == user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    _delete_job_records(job, db)
    db.commit()
    return {"ok": True}


@router.delete("")
def delete_all_jobs(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    jobs = db.query(Job).filter(Job.created_by == user.id).all()
    for job in jobs:
        _delete_job_records(job, db)
    db.commit()
    return {"ok": True}


@router.get("/{job_id}/download")
def download_zip(job_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    job = db.query(Job).filter(Job.id == job_id, Job.created_by == user.id).first()
    if not job or job.status != JobStatus.done:
        raise HTTPException(status_code=400, detail="Job not ready or not found")

    return FileResponse(path=job.zip_path, filename=f"job_{job_id}.zip", media_type="application/zip")
