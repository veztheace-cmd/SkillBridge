"""Recruiter workflow routes: Job management, candidate ranking, pipeline transitions, hiring feedback."""
import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User, JobPosting, Application, StudentProfile, HiringFeedback
from backend.auth import require_role

router = APIRouter(prefix="/api/recruiters", tags=["Recruiter Workflow"])

class CreateJobRequest(BaseModel):
    title: str
    job_type: str = "internship"  # internship, full_time
    description: str
    required_skills: List[str]
    stipend_or_ctc: str
    location: str
    deadline_days: int = 30

class UpdateStatusRequest(BaseModel):
    status: str  # applied, shortlisted, interview, offer, closed
    recruiter_notes: Optional[str] = None

class FeedbackRequest(BaseModel):
    rating: int  # 1 to 5
    match_accuracy_comment: Optional[str] = None

@router.get("/postings")
def get_recruiter_postings(
    current_user: User = Depends(require_role(["recruiter", "admin"])),
    db: Session = Depends(get_db)
):
    if current_user.role == "admin":
        postings = db.query(JobPosting).order_by(JobPosting.created_at.desc()).all()
    else:
        postings = db.query(JobPosting).filter(JobPosting.recruiter_id == current_user.id).order_by(JobPosting.created_at.desc()).all()

    results = []
    for job in postings:
        try:
            req_skills = json.loads(job.required_skills)
        except Exception:
            req_skills = [s.strip() for s in job.required_skills.split(",") if s.strip()]

        # Pipeline breakdown counts
        app_counts = {"applied": 0, "shortlisted": 0, "interview": 0, "offer": 0, "closed": 0}
        for a in job.applications:
            if a.status in app_counts:
                app_counts[a.status] += 1

        results.append({
            "id": job.id,
            "title": job.title,
            "company_name": job.company_name,
            "job_type": job.job_type,
            "required_skills": req_skills,
            "stipend_or_ctc": job.stipend_or_ctc,
            "location": job.location,
            "status": job.status,
            "created_at": job.created_at.isoformat(),
            "pipeline_counts": app_counts,
            "total_applicants": len(job.applications)
        })
    return results

@router.post("/postings")
def create_job_posting(
    req: CreateJobRequest,
    current_user: User = Depends(require_role(["recruiter", "admin"])),
    db: Session = Depends(get_db)
):
    company_name = "Tech Enterprise"
    if current_user.company_profile:
        company_name = current_user.company_profile.company_name

    job = JobPosting(
        recruiter_id=current_user.id,
        title=req.title,
        company_name=company_name,
        job_type=req.job_type,
        description=req.description,
        required_skills=json.dumps([s.strip() for s in req.required_skills if s.strip()]),
        stipend_or_ctc=req.stipend_or_ctc,
        location=req.location,
        status="open"
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    return {"message": "Job posting created successfully.", "job_id": job.id}

@router.get("/postings/{job_id}/candidates")
def get_ranked_candidates(
    job_id: int,
    current_user: User = Depends(require_role(["recruiter", "admin"])),
    db: Session = Depends(get_db)
):
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job posting not found.")

    if current_user.role != "admin" and job.recruiter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view candidates for this job.")

    applications = db.query(Application).filter(Application.job_id == job_id).order_by(Application.match_score.desc()).all()

    candidates = []
    for app in applications:
        student = app.student
        user = student.user
        breakdown = {}
        if app.match_breakdown:
            try:
                breakdown = json.loads(app.match_breakdown)
            except Exception:
                pass

        feedback_data = None
        if app.hiring_feedback:
            feedback_data = {
                "rating": app.hiring_feedback.rating,
                "comment": app.hiring_feedback.match_accuracy_comment,
                "created_at": app.hiring_feedback.created_at.isoformat()
            }

        candidates.append({
            "application_id": app.id,
            "student_id": student.id,
            "candidate_name": user.full_name,
            "candidate_email": user.email,
            "college_name": student.college_name,
            "branch": student.branch,
            "graduation_year": student.graduation_year,
            "cgpa": student.cgpa,
            "resume_filename": student.resume_filename,
            "status": app.status,
            "match_score": app.match_score,
            "match_breakdown": breakdown,
            "recruiter_notes": app.recruiter_notes,
            "applied_at": app.applied_at.isoformat(),
            "updated_at": app.updated_at.isoformat() if app.updated_at else None,
            "hiring_feedback": feedback_data
        })

    return {
        "job_id": job.id,
        "job_title": job.title,
        "company_name": job.company_name,
        "total_candidates": len(candidates),
        "candidates": candidates
    }

@router.put("/applications/{application_id}/status")
def update_application_status(
    application_id: int,
    req: UpdateStatusRequest,
    current_user: User = Depends(require_role(["recruiter", "admin"])),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    valid_statuses = ["applied", "shortlisted", "interview", "offer", "closed"]
    if req.status.lower() not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Choose from: {valid_statuses}")

    app.status = req.status.lower()
    if req.recruiter_notes is not None:
        app.recruiter_notes = req.recruiter_notes
    app.updated_at = datetime.utcnow()

    db.commit()
    return {"message": f"Application status updated to '{app.status}'.", "status": app.status}

@router.post("/applications/{application_id}/feedback")
def submit_hiring_feedback(
    application_id: int,
    req: FeedbackRequest,
    current_user: User = Depends(require_role(["recruiter", "admin"])),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    if not (1 <= req.rating <= 5):
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5.")

    existing_feedback = db.query(HiringFeedback).filter(HiringFeedback.application_id == application_id).first()
    if existing_feedback:
        existing_feedback.rating = req.rating
        existing_feedback.match_accuracy_comment = req.match_accuracy_comment
        db.commit()
        return {"message": "Hiring feedback updated successfully."}

    feedback = HiringFeedback(
        application_id=application_id,
        recruiter_id=current_user.id,
        rating=req.rating,
        match_accuracy_comment=req.match_accuracy_comment
    )
    db.add(feedback)
    db.commit()
    return {"message": "Skill match accuracy feedback recorded successfully."}
