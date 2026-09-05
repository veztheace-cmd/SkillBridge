"""Student workflow routes: Profile builder, resume upload, skill gap analysis, applications."""
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User, StudentProfile, Skill, JobPosting, Application
from backend.auth import require_role
from backend.resume_parser import extract_text_from_file, parse_resume_text
from backend.matching import calculate_match

router = APIRouter(prefix="/api/students", tags=["Students"])

class UpdateProfileRequest(BaseModel):
    college_name: Optional[str] = None
    branch: Optional[str] = None
    graduation_year: Optional[int] = None
    cgpa: Optional[float] = None
    bio: Optional[str] = None
    target_role: Optional[str] = None

class AddSkillRequest(BaseModel):
    skill_name: str
    proficiency: str = "Intermediate"  # Beginner, Intermediate, Expert

@router.get("/profile")
def get_student_profile(current_user: User = Depends(require_role(["student", "admin", "institution"])), db: Session = Depends(get_db)):
    profile = current_user.student_profile
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")
    return {
        "id": profile.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "college_name": profile.college_name,
        "roll_number": profile.roll_number,
        "branch": profile.branch,
        "graduation_year": profile.graduation_year,
        "cgpa": profile.cgpa,
        "bio": profile.bio,
        "target_role": profile.target_role,
        "resume_filename": profile.resume_filename,
        "skills": [
            {
                "id": s.id,
                "skill_name": s.skill_name,
                "proficiency": s.proficiency,
                "endorsed": s.endorsed,
                "endorsed_by": s.endorsed_by,
                "endorsed_at": s.endorsed_at.isoformat() if s.endorsed_at else None
            }
            for s in profile.skills
        ]
    }

@router.put("/profile")
def update_student_profile(
    req: UpdateProfileRequest,
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    profile = current_user.student_profile
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    if req.college_name is not None:
        profile.college_name = req.college_name
    if req.branch is not None:
        profile.branch = req.branch
    if req.graduation_year is not None:
        profile.graduation_year = req.graduation_year
    if req.cgpa is not None:
        profile.cgpa = req.cgpa
    if req.bio is not None:
        profile.bio = req.bio
    if req.target_role is not None:
        profile.target_role = req.target_role

    db.commit()
    return {"message": "Profile updated successfully."}

@router.post("/skills")
def add_skill(
    req: AddSkillRequest,
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    profile = current_user.student_profile
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    clean_name = req.skill_name.strip()
    if not clean_name:
        raise HTTPException(status_code=400, detail="Skill name cannot be empty.")

    # Check duplicate
    existing = db.query(Skill).filter(
        Skill.student_id == profile.id,
        Skill.skill_name.ilike(clean_name)
    ).first()

    if existing:
        existing.proficiency = req.proficiency
        db.commit()
        return {"message": "Skill proficiency updated.", "skill_id": existing.id}

    skill = Skill(
        student_id=profile.id,
        skill_name=clean_name,
        proficiency=req.proficiency,
        endorsed=False
    )
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return {"message": "Skill added successfully.", "skill_id": skill.id}

@router.delete("/skills/{skill_id}")
def delete_skill(
    skill_id: int,
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    profile = current_user.student_profile
    skill = db.query(Skill).filter(Skill.id == skill_id, Skill.student_id == profile.id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found.")
    db.delete(skill)
    db.commit()
    return {"message": "Skill deleted successfully."}

@router.post("/resume-upload")
async def upload_resume(
    file: UploadFile = File(...),
    auto_add_skills: bool = Form(True),
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    profile = current_user.student_profile
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    contents = await file.read()
    raw_text = extract_text_from_file(contents, file.filename)
    parsed = parse_resume_text(raw_text)

    # Save to profile
    profile.resume_filename = file.filename
    profile.raw_resume_text = raw_text[:5000]

    added_skills = []
    if auto_add_skills:
        existing_names = {s.skill_name.lower() for s in profile.skills}
        for item in parsed["extracted_skills"]:
            sname = item["skill_name"]
            if sname.lower() not in existing_names:
                new_skill = Skill(
                    student_id=profile.id,
                    skill_name=sname,
                    proficiency="Intermediate",
                    endorsed=False
                )
                db.add(new_skill)
                added_skills.append(sname)
                existing_names.add(sname.lower())

    db.commit()

    return {
        "filename": file.filename,
        "extracted_skills": parsed["extracted_skills"],
        "added_to_profile": added_skills,
        "candidate_info": {
            "name": parsed["candidate_name"],
            "email": parsed["email"],
            "phone": parsed["phone"],
            "github": parsed["github"],
            "linkedin": parsed["linkedin"]
        }
    }

@router.get("/skill-gap/{job_id}")
def analyze_skill_gap(
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

    try:
        required_skills = json.loads(job.required_skills)
    except Exception:
        required_skills = [s.strip() for s in job.required_skills.split(",") if s.strip()]

    student_skills = [
        {"skill_name": s.skill_name, "proficiency": s.proficiency, "endorsed": s.endorsed}
        for s in profile.skills
    ]

    analysis = calculate_match(
        student_skills=student_skills,
        job_required_skills=required_skills,
        job_title=job.title,
        job_description=job.description,
        student_branch=profile.branch,
        student_bio=profile.bio or ""
    )

    return {
        "job": {
            "id": job.id,
            "title": job.title,
            "company_name": job.company_name,
            "required_skills": required_skills,
            "stipend_or_ctc": job.stipend_or_ctc,
            "location": job.location
        },
        "analysis": analysis
    }

@router.get("/applications")
def get_student_applications(
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    profile = current_user.student_profile
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    apps = db.query(Application).filter(Application.student_id == profile.id).order_by(Application.applied_at.desc()).all()
    results = []
    for app in apps:
        breakdown = {}
        if app.match_breakdown:
            try:
                breakdown = json.loads(app.match_breakdown)
            except Exception:
                pass

        results.append({
            "application_id": app.id,
            "job_id": app.job.id,
            "job_title": app.job.title,
            "company_name": app.job.company_name,
            "location": app.job.location,
            "stipend_or_ctc": app.job.stipend_or_ctc,
            "status": app.status,
            "match_score": app.match_score,
            "match_breakdown": breakdown,
            "applied_at": app.applied_at.isoformat(),
            "updated_at": app.updated_at.isoformat() if app.updated_at else None
        })
    return results
