"""SQLAlchemy database models for SIH26044 Portal."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # student, institution, recruiter, admin
    phone = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student_profile = relationship("StudentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    institution_profile = relationship("InstitutionProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    company_profile = relationship("CompanyProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    job_postings = relationship("JobPosting", back_populates="recruiter", cascade="all, delete-orphan")

class InstitutionProfile(Base):
    __tablename__ = "institution_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    institution_name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    state = Column(String(100), nullable=False)
    city = Column(String(100), nullable=True)
    tpo_name = Column(String(255), nullable=False)
    contact_email = Column(String(255), nullable=False)

    user = relationship("User", back_populates="institution_profile")
    students = relationship("StudentProfile", back_populates="institution")
    placement_drives = relationship("PlacementDrive", back_populates="institution", cascade="all, delete-orphan")

class CompanyProfile(Base):
    __tablename__ = "company_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    company_name = Column(String(255), nullable=False)
    industry_sector = Column(String(100), nullable=False)
    website = Column(String(255), nullable=True)
    location = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    user = relationship("User", back_populates="company_profile")

class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    institution_id = Column(Integer, ForeignKey("institution_profiles.id", ondelete="SET NULL"), nullable=True)
    college_name = Column(String(255), nullable=False)
    roll_number = Column(String(100), nullable=True)
    branch = Column(String(100), nullable=False)
    graduation_year = Column(Integer, nullable=False)
    cgpa = Column(Float, nullable=False, default=7.5)
    bio = Column(Text, nullable=True)
    target_role = Column(String(150), nullable=True)
    resume_filename = Column(String(255), nullable=True)
    raw_resume_text = Column(Text, nullable=True)

    user = relationship("User", back_populates="student_profile")
    institution = relationship("InstitutionProfile", back_populates="students")
    skills = relationship("Skill", back_populates="student", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="student", cascade="all, delete-orphan")

class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False)
    skill_name = Column(String(100), nullable=False, index=True)
    proficiency = Column(String(50), default="Intermediate")  # Beginner, Intermediate, Expert
    endorsed = Column(Boolean, default=False)
    endorsed_by = Column(String(255), nullable=True)
    endorsed_at = Column(DateTime, nullable=True)

    student = relationship("StudentProfile", back_populates="skills")

class JobPosting(Base):
    __tablename__ = "job_postings"

    id = Column(Integer, primary_key=True, index=True)
    recruiter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    company_name = Column(String(255), nullable=False)
    job_type = Column(String(50), default="internship")  # internship, full_time
    description = Column(Text, nullable=False)
    required_skills = Column(Text, nullable=False)  # JSON array string e.g. ["Python", "FastAPI"]
    stipend_or_ctc = Column(String(100), nullable=False)
    location = Column(String(150), nullable=False)
    deadline = Column(DateTime, nullable=True)
    status = Column(String(50), default="open")  # open, closed
    created_at = Column(DateTime, default=datetime.utcnow)

    recruiter = relationship("User", back_populates="job_postings")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("job_postings.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="applied")  # applied, shortlisted, interview, offer, closed
    match_score = Column(Float, default=0.0)
    match_breakdown = Column(Text, nullable=True)  # JSON string
    recruiter_notes = Column(Text, nullable=True)
    applied_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    job = relationship("JobPosting", back_populates="applications")
    student = relationship("StudentProfile", back_populates="applications")
    hiring_feedback = relationship("HiringFeedback", back_populates="application", uselist=False, cascade="all, delete-orphan")

class PlacementDrive(Base):
    __tablename__ = "placement_drives"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institution_profiles.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    target_batch = Column(Integer, nullable=False)
    drive_date = Column(DateTime, nullable=False)
    companies_invited = Column(Text, nullable=False)  # JSON string array
    status = Column(String(50), default="upcoming")  # upcoming, ongoing, completed
    created_at = Column(DateTime, default=datetime.utcnow)

    institution = relationship("InstitutionProfile", back_populates="placement_drives")

class HiringFeedback(Base):
    __tablename__ = "hiring_feedback"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), unique=True, nullable=False)
    recruiter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1 to 5 stars
    match_accuracy_comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="hiring_feedback")
