"""Realistic seed dataset for SIH26044 Academia-Industry Collaboration Portal."""
import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from backend.database import SessionLocal, Base, engine
from backend.models import (
    User, StudentProfile, InstitutionProfile, CompanyProfile,
    Skill, JobPosting, Application, PlacementDrive, HiringFeedback
)
from backend.auth import hash_password
from backend.matching import calculate_match

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    # Check if already seeded
    if db.query(User).filter(User.email == "student@demo.edu").first():
        print("Database already seeded with demo data.")
        db.close()
        return

    print("Seeding fresh demo database...")

    # 1. Create Core Users
    # -------------------------------------------------------------
    # Student Demo
    student_user = User(
        email="student@demo.edu",
        password_hash=hash_password("Student@123"),
        full_name="Arjun Sharma",
        role="student",
        phone="+91 98765 43210"
    )
    db.add(student_user)

    # Institution Demo
    tpo_user = User(
        email="tpo@iitd.ac.in",
        password_hash=hash_password("Tpo@123"),
        full_name="Prof. S. Ramanujan",
        role="institution",
        phone="+91 11 2659 1000"
    )
    db.add(tpo_user)

    # Recruiter Demo
    recruiter_user = User(
        email="recruiter@techcorp.in",
        password_hash=hash_password("Recruiter@123"),
        full_name="Priya Verma",
        role="recruiter",
        phone="+91 80 4567 8900"
    )
    db.add(recruiter_user)

    # Admin Demo
    admin_user = User(
        email="admin@aicte.gov.in",
        password_hash=hash_password("Admin@123"),
        full_name="Dr. A. K. Mittal",
        role="admin",
        phone="+91 11 2958 1000"
    )
    db.add(admin_user)
    db.commit()

    # 2. Profiles for Institutions
    # -------------------------------------------------------------
    iitd = InstitutionProfile(
        user_id=tpo_user.id,
        institution_name="Indian Institute of Technology Delhi",
        code="IITD",
        state="Delhi",
        city="New Delhi",
        tpo_name="Prof. S. Ramanujan",
        contact_email="tpo@iitd.ac.in"
    )
    db.add(iitd)
    db.commit()

    # 3. Profiles for Recruiters
    # -------------------------------------------------------------
    techcorp = CompanyProfile(
        user_id=recruiter_user.id,
        company_name="TechCorp India Solutions",
        industry_sector="Information Technology & Cloud",
        website="https://techcorp.in",
        location="Bengaluru, Karnataka",
        description="Pioneering enterprise AI and distributed cloud applications across Asia-Pacific."
    )
    db.add(techcorp)

    # Additional Recruiter: DeepMind Labs
    recruiter2_user = User(
        email="talent@deepmindlabs.in",
        password_hash=hash_password("Recruiter@123"),
        full_name="Dr. Sunita Rao",
        role="recruiter"
    )
    db.add(recruiter2_user)
    db.commit()

    deepmind_comp = CompanyProfile(
        user_id=recruiter2_user.id,
        company_name="DeepMind Intelligence Labs",
        industry_sector="AI & Machine Learning",
        website="https://deepmindlabs.in",
        location="Pune, Maharashtra",
        description="Cutting-edge foundation models and applied robotics research."
    )
    db.add(deepmind_comp)
    db.commit()

    # 4. Create Students and Skills
    # -------------------------------------------------------------
    students_data = [
        {
            "user": student_user,
            "college": "Indian Institute of Technology Delhi",
            "branch": "Computer Science & Engineering",
            "cgpa": 8.9,
            "target": "Full Stack & Distributed Systems",
            "bio": "Passionate backend engineer with experience building scalable REST microservices and async data pipelines.",
            "skills": [
                ("Python", "Expert", True),
                ("FastAPI", "Expert", True),
                ("Docker", "Intermediate", True),
                ("React", "Intermediate", False),
                ("PostgreSQL", "Intermediate", True),
                ("Data Structures", "Expert", True)
            ]
        },
        {
            "email": "ananya.iyer@demo.edu",
            "name": "Ananya Iyer",
            "college": "Indian Institute of Technology Delhi",
            "branch": "Artificial Intelligence & Data Science",
            "cgpa": 9.4,
            "target": "AI/ML Research Engineer",
            "bio": "AI researcher specializing in transformer architectures and NLP. Published at IEEE Student Symposium.",
            "skills": [
                ("Python", "Expert", True),
                ("PyTorch", "Expert", True),
                ("Machine Learning", "Expert", True),
                ("NLP", "Expert", True),
                ("Docker", "Intermediate", False),
                ("PostgreSQL", "Beginner", False)
            ]
        },
        {
            "email": "rohan.mehta@demo.edu",
            "name": "Rohan Mehta",
            "college": "BITS Pilani",
            "branch": "Information Systems",
            "cgpa": 8.4,
            "target": "Frontend Architect",
            "bio": "Modern web enthusiast specializing in responsive React applications, TypeScript, and state management.",
            "skills": [
                ("React", "Expert", True),
                ("TypeScript", "Intermediate", True),
                ("JavaScript", "Expert", True),
                ("Tailwind CSS", "Expert", True),
                ("Node.js", "Intermediate", False),
                ("Git", "Intermediate", True)
            ]
        },
        {
            "email": "sneha.patel@demo.edu",
            "name": "Sneha Patel",
            "college": "Indian Institute of Technology Delhi",
            "branch": "Computer Science",
            "cgpa": 9.1,
            "target": "DevOps & Cloud Engineer",
            "bio": "Certified Kubernetes administrator, AWS enthusiast, and automated CI/CD pipeline designer.",
            "skills": [
                ("Docker", "Expert", True),
                ("Kubernetes", "Expert", True),
                ("AWS", "Intermediate", True),
                ("Linux", "Expert", True),
                ("Python", "Intermediate", True),
                ("CI/CD", "Intermediate", False)
            ]
        },
        {
            "email": "vikram.singh@demo.edu",
            "name": "Vikram Singh",
            "college": "NIT Trichy",
            "branch": "Electronics & Communication",
            "cgpa": 8.1,
            "target": "Embedded Systems Engineer",
            "bio": "Hardware-software integration specialist working with microcontrollers, RTOS, and modern C++.",
            "skills": [
                ("C++", "Expert", True),
                ("Embedded Systems", "Expert", True),
                ("IoT", "Intermediate", True),
                ("Linux", "Intermediate", False),
                ("Python", "Intermediate", False)
            ]
        },
        {
            "email": "kavita.nair@demo.edu",
            "name": "Kavita Nair",
            "college": "BITS Pilani",
            "branch": "Computer Science",
            "cgpa": 8.7,
            "target": "Data Engineer",
            "bio": "Data pipelines, warehousing, and SQL performance tuning specialist.",
            "skills": [
                ("SQL", "Expert", True),
                ("PostgreSQL", "Expert", True),
                ("Python", "Intermediate", True),
                ("Docker", "Intermediate", False),
                ("FastAPI", "Beginner", False)
            ]
        }
    ]

    student_profiles = []

    for sdata in students_data:
        if "user" in sdata:
            s_user = sdata["user"]
        else:
            s_user = User(
                email=sdata["email"],
                password_hash=hash_password("Student@123"),
                full_name=sdata["name"],
                role="student"
            )
            db.add(s_user)
            db.commit()

        sprof = StudentProfile(
            user_id=s_user.id,
            institution_id=iitd.id if "Delhi" in sdata["college"] else None,
            college_name=sdata["college"],
            branch=sdata["branch"],
            graduation_year=2026,
            cgpa=sdata["cgpa"],
            bio=sdata["bio"],
            target_role=sdata["target"],
            resume_filename=f"{s_user.full_name.replace(' ', '_')}_Resume_2026.pdf"
        )
        db.add(sprof)
        db.commit()
        db.refresh(sprof)
        student_profiles.append(sprof)

        for s_name, prof_lvl, endorsed in sdata["skills"]:
            skill_obj = Skill(
                student_id=sprof.id,
                skill_name=s_name,
                proficiency=prof_lvl,
                endorsed=endorsed,
                endorsed_by="Prof. S. Ramanujan (TPO IIT Delhi)" if endorsed else None,
                endorsed_at=datetime.utcnow() - timedelta(days=10) if endorsed else None
            )
            db.add(skill_obj)
        db.commit()

    # 5. Job Postings
    # -------------------------------------------------------------
    jobs_data = [
        {
            "recruiter_id": recruiter_user.id,
            "title": "Full-Stack Software Engineering Intern",
            "company_name": "TechCorp India Solutions",
            "job_type": "internship",
            "description": "Build high-throughput REST APIs and real-time dashboard components using FastAPI, React, Docker, and PostgreSQL.",
            "required_skills": ["Python", "FastAPI", "Docker", "React", "PostgreSQL"],
            "stipend_or_ctc": "₹45,000 / month",
            "location": "Bengaluru (Hybrid)"
        },
        {
            "recruiter_id": recruiter2_user.id,
            "title": "AI & Machine Learning Graduate Engineer",
            "company_name": "DeepMind Intelligence Labs",
            "job_type": "full_time",
            "description": "Train and evaluate large language models and multi-modal neural network architectures using PyTorch and distributed GPU clusters.",
            "required_skills": ["Python", "PyTorch", "Machine Learning", "NLP", "Docker"],
            "stipend_or_ctc": "₹22 - 26 LPA",
            "location": "Pune (Remote)"
        },
        {
            "recruiter_id": recruiter_user.id,
            "title": "Cloud Platform & DevOps Intern",
            "company_name": "TechCorp India Solutions",
            "job_type": "internship",
            "description": "Design resilient container deployments, monitor Kubernetes clusters, and automate multi-region CI/CD pipelines.",
            "required_skills": ["Docker", "Kubernetes", "AWS", "Linux", "Python"],
            "stipend_or_ctc": "₹42,000 / month",
            "location": "Bengaluru"
        },
        {
            "recruiter_id": recruiter_user.id,
            "title": "Frontend UI/UX Architect (React)",
            "company_name": "TechCorp India Solutions",
            "job_type": "full_time",
            "description": "Develop high-performance, accessible enterprise web portals with React, TypeScript, and modern component design systems.",
            "required_skills": ["React", "TypeScript", "Tailwind CSS", "JavaScript"],
            "stipend_or_ctc": "₹15 - 19 LPA",
            "location": "Hyderabad"
        }
    ]

    job_records = []
    for jdata in jobs_data:
        job = JobPosting(
            recruiter_id=jdata["recruiter_id"],
            title=jdata["title"],
            company_name=jdata["company_name"],
            job_type=jdata["job_type"],
            description=jdata["description"],
            required_skills=json.dumps(jdata["required_skills"]),
            stipend_or_ctc=jdata["stipend_or_ctc"],
            location=jdata["location"],
            status="open"
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        job_records.append(job)

    # 6. Seed Applications with Explainable Match Scores
    # -------------------------------------------------------------
    # Full-Stack Job (job_records[0]) applications
    # Student 0 (Arjun) applies -> Strong Match
    fullstack_job = job_records[0]
    ai_job = job_records[1]
    devops_job = job_records[2]

    # Map student skills for matching engine
    for s_idx, student in enumerate(student_profiles):
        s_skills = [
            {"skill_name": sk.skill_name, "proficiency": sk.proficiency, "endorsed": sk.endorsed}
            for sk in student.skills
        ]

        # Apply Arjun to FullStack Job (Status: Shortlisted)
        if s_idx == 0:
            match_res = calculate_match(
                student_skills=s_skills,
                job_required_skills=json.loads(fullstack_job.required_skills),
                job_title=fullstack_job.title,
                job_description=fullstack_job.description,
                student_branch=student.branch,
                student_bio=student.bio or ""
            )
            app1 = Application(
                job_id=fullstack_job.id,
                student_id=student.id,
                status="shortlisted",
                match_score=match_res["score"],
                match_breakdown=json.dumps(match_res),
                recruiter_notes="Strong profile with 3 faculty-endorsed backend skills. Recommended for technical round.",
                applied_at=datetime.utcnow() - timedelta(days=5)
            )
            db.add(app1)

        # Apply Ananya to AI Job (Status: Offer)
        elif s_idx == 1:
            match_res = calculate_match(
                student_skills=s_skills,
                job_required_skills=json.loads(ai_job.required_skills),
                job_title=ai_job.title,
                job_description=ai_job.description,
                student_branch=student.branch,
                student_bio=student.bio or ""
            )
            app2 = Application(
                job_id=ai_job.id,
                student_id=student.id,
                status="offer",
                match_score=match_res["score"],
                match_breakdown=json.dumps(match_res),
                recruiter_notes="Outstanding research foundation and PyTorch proficiency. Offer issued.",
                applied_at=datetime.utcnow() - timedelta(days=12)
            )
            db.add(app2)
            db.commit()

            # Add post-hire skill match accuracy feedback
            fb = HiringFeedback(
                application_id=app2.id,
                recruiter_id=recruiter2_user.id,
                rating=5,
                match_accuracy_comment="Accurate match score: candidate demonstrated phenomenal mastery of NLP and PyTorch in live pairing."
            )
            db.add(fb)

        # Apply Sneha to DevOps Job (Status: Interview)
        elif s_idx == 3:
            match_res = calculate_match(
                student_skills=s_skills,
                job_required_skills=json.loads(devops_job.required_skills),
                job_title=devops_job.title,
                job_description=devops_job.description,
                student_branch=student.branch,
                student_bio=student.bio or ""
            )
            app3 = Application(
                job_id=devops_job.id,
                student_id=student.id,
                status="interview",
                match_score=match_res["score"],
                match_breakdown=json.dumps(match_res),
                recruiter_notes="Impressive Kubernetes and Docker expertise. Scheduled system architecture interview.",
                applied_at=datetime.utcnow() - timedelta(days=3)
            )
            db.add(app3)

        # Also have Arjun apply to DevOps (Status: Applied)
        elif s_idx == 2:
            match_res = calculate_match(
                student_skills=s_skills,
                job_required_skills=json.loads(fullstack_job.required_skills),
                job_title=fullstack_job.title,
                job_description=fullstack_job.description,
                student_branch=student.branch,
                student_bio=student.bio or ""
            )
            app4 = Application(
                job_id=fullstack_job.id,
                student_id=student.id,
                status="applied",
                match_score=match_res["score"],
                match_breakdown=json.dumps(match_res),
                applied_at=datetime.utcnow() - timedelta(days=2)
            )
            db.add(app4)

    db.commit()

    # 7. Placement Drives
    # -------------------------------------------------------------
    drive1 = PlacementDrive(
        institution_id=iitd.id,
        title="Annual Autumn Cloud & AI Placement Drive 2026",
        target_batch=2026,
        drive_date=datetime.utcnow() + timedelta(days=14),
        companies_invited=json.dumps(["TechCorp India Solutions", "DeepMind Intelligence Labs", "Google India", "Microsoft IDC"]),
        status="upcoming"
    )
    db.add(drive1)
    db.commit()

    print("Demo database seeded successfully with 4 roles, 6 students, 4 job postings, applications, and analytics!")
    db.close()

if __name__ == "__main__":
    seed_database()
