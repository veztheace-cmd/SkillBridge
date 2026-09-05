"""Authentication and user session routes."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User, StudentProfile, CompanyProfile, InstitutionProfile
from backend.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str  # student, institution, recruiter, admin
    phone: Optional[str] = None
    # Conditional fields
    college_name: Optional[str] = "IIT Delhi"
    branch: Optional[str] = "Computer Science & Engineering"
    graduation_year: Optional[int] = 2026
    company_name: Optional[str] = None
    industry_sector: Optional[str] = None
    institution_name: Optional[str] = None
    institution_code: Optional[str] = None
    state: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    # Check if user exists
    existing = db.query(User).filter(User.email == req.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    user = User(
        email=req.email.lower(),
        password_hash=hash_password(req.password),
        full_name=req.full_name,
        role=req.role,
        phone=req.phone
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Automatically create sub-profile based on role
    if req.role == "student":
        student_prof = StudentProfile(
            user_id=user.id,
            college_name=req.college_name or "Engineering College",
            branch=req.branch or "Computer Science",
            graduation_year=req.graduation_year or 2026,
            cgpa=8.5,
            bio=f"Pre-final year student at {req.college_name or 'college'} passionate about software and innovation."
        )
        db.add(student_prof)
    elif req.role == "recruiter":
        company_prof = CompanyProfile(
            user_id=user.id,
            company_name=req.company_name or f"{req.full_name}'s Enterprise",
            industry_sector=req.industry_sector or "Information Technology",
            location="Bengaluru, Karnataka",
            description="Leading technology innovation firm."
        )
        db.add(company_prof)
    elif req.role == "institution":
        inst_prof = InstitutionProfile(
            user_id=user.id,
            institution_name=req.institution_name or f"{req.full_name} Institute",
            code=req.institution_code or f"INST-{user.id}",
            state=req.state or "Delhi",
            tpo_name=req.full_name,
            contact_email=req.email
        )
        db.add(inst_prof)

    db.commit()

    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    }

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    }

@router.get("/me")
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile_data = {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "phone": current_user.phone
    }

    if current_user.role == "student" and current_user.student_profile:
        profile_data["student_profile"] = {
            "id": current_user.student_profile.id,
            "college_name": current_user.student_profile.college_name,
            "branch": current_user.student_profile.branch,
            "graduation_year": current_user.student_profile.graduation_year,
            "cgpa": current_user.student_profile.cgpa,
            "bio": current_user.student_profile.bio,
            "target_role": current_user.student_profile.target_role,
            "resume_filename": current_user.student_profile.resume_filename,
            "skills": [
                {
                    "id": s.id,
                    "skill_name": s.skill_name,
                    "proficiency": s.proficiency,
                    "endorsed": s.endorsed,
                    "endorsed_by": s.endorsed_by
                }
                for s in current_user.student_profile.skills
            ]
        }
    elif current_user.role == "institution" and current_user.institution_profile:
        profile_data["institution_profile"] = {
            "id": current_user.institution_profile.id,
            "institution_name": current_user.institution_profile.institution_name,
            "code": current_user.institution_profile.code,
            "state": current_user.institution_profile.state,
            "tpo_name": current_user.institution_profile.tpo_name,
            "contact_email": current_user.institution_profile.contact_email
        }
    elif current_user.role == "recruiter" and current_user.company_profile:
        profile_data["company_profile"] = {
            "id": current_user.company_profile.id,
            "company_name": current_user.company_profile.company_name,
            "industry_sector": current_user.company_profile.industry_sector,
            "website": current_user.company_profile.website,
            "location": current_user.company_profile.location
        }

    return profile_data

@router.post("/demo-login/{role}")
def demo_login(role: str, db: Session = Depends(get_db)):
    """Instant 1-click login for demonstration purposes during hackathon presentations."""
    role_email_map = {
        "student": "student@demo.edu",
        "institution": "tpo@iitd.ac.in",
        "recruiter": "recruiter@techcorp.in",
        "admin": "admin@aicte.gov.in"
    }
    target_email = role_email_map.get(role.lower())
    if not target_email:
        raise HTTPException(status_code=400, detail=f"Invalid demo role: {role}")

    user = db.query(User).filter(User.email == target_email).first()
    if not user:
        # Fallback to any user with that role
        user = db.query(User).filter(User.role == role.lower()).first()

    if not user:
        raise HTTPException(status_code=404, detail=f"No seeded user found for role {role}. Please seed database.")

    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    }
