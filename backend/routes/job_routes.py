"""Job and internship listing & application endpoints."""
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User, JobPosting, Application, StudentProfile
from backend.auth import get_current_user, require_role
from backend.matching import calculate_match

router = APIRouter(prefix="/api/jobs", tags=["Jobs & Internships"])

@router.get("")
def list_jobs(
    skill: Optional[str] = Query(None, description="Filter by required skill"),
    location: Optional[str] = Query(None, description="Filter by location or 'Remote'"),
    job_type: Optional[str] = Query(None, description="Filter by 'internship' or 'full_time'"),
    search: Optional[str] = Query(None, description="Keyword search title/company"),
    db: Session = Depends(get_db)
):
    query = db.query(JobPosting).filter(JobPosting.status == "open")

    if job_type:
        query = query.filter(JobPosting.job_type == job_type)

    if location:
        query = query.filter(JobPosting.location.ilike(f"%{location}%"))

    if search:
        query = query.filter(
            (JobPosting.title.ilike(f"%{search}%")) |
            (JobPosting.company_name.ilike(f"%{search}%")) |
            (JobPosting.description.ilike(f"%{search}%"))
        )

    postings = query.order_by(JobPosting.created_at.desc()).all()

    results = []
    for job in postings:
        try:
            req_skills = json.loads(job.required_skills)
        except Exception:
            req_skills = [s.strip() for s in job.required_skills.split(",") if s.strip()]

        if skill:
            lower_skill = skill.lower()
            if not any(lower_skill in s.lower() for s in req_skills):
                continue

        results.append({
            "id": job.id,
            "title": job.title,
            "company_name": job.company_name,
            "job_type": job.job_type,
            "description": job.description,
            "required_skills": req_skills,
            "stipend_or_ctc": job.stipend_or_ctc,
            "location": job.location,
            "deadline": job.deadline.isoformat() if job.deadline else None,
            "created_at": job.created_at.isoformat(),
            "applicant_count": len(job.applications)
        })

    return results

@router.get("/{job_id}")
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job posting not found.")

    try:
        req_skills = json.loads(job.required_skills)
    except Exception:
        req_skills = [s.strip() for s in job.required_skills.split(",") if s.strip()]

    return {
        "id": job.id,
        "title": job.title,
        "company_name": job.company_name,
        "job_type": job.job_type,
        "description": job.description,
        "required_skills": req_skills,
        "stipend_or_ctc": job.stipend_or_ctc,
        "location": job.location,
        "deadline": job.deadline.isoformat() if job.deadline else None,
        "status": job.status,
        "created_at": job.created_at.isoformat(),
        "applicant_count": len(job.applications)
    }

@router.post("/{job_id}/apply")
def apply_for_job(
    job_id: int,
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    profile = current_user.student_profile
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job posting not found.")

    # Check if already applied
    existing = db.query(Application).filter(
        Application.job_id == job_id,
        Application.student_id == profile.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already applied to this position.")

    try:
        req_skills = json.loads(job.required_skills)
    except Exception:
        req_skills = [s.strip() for s in job.required_skills.split(",") if s.strip()]

    student_skills = [
        {"skill_name": s.skill_name, "proficiency": s.proficiency, "endorsed": s.endorsed}
        for s in profile.skills
    ]

    # Run explainable matching engine
    match_result = calculate_match(
        student_skills=student_skills,
        job_required_skills=req_skills,
        job_title=job.title,
        job_description=job.description,
        student_branch=profile.branch,
        student_bio=profile.bio or ""
    )

    application = Application(
        job_id=job_id,
        student_id=profile.id,
        status="applied",
        match_score=match_result["score"],
        match_breakdown=json.dumps(match_result)
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    return {
        "message": "Application submitted successfully!",
        "application_id": application.id,
        "match_score": match_result["score"],
        "match_tier": match_result["tier"],
        "match_breakdown": match_result
    }
