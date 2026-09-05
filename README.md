# SkillBridge India: Portal for Academia–Industry Collaboration
**Smart India Hackathon 2026 — Problem Statement SIH26044 (Software, Theme: Miscellaneous)**  
*Skill Mapping, Internships & Explainable AI Placement Engine*

---

## 🚀 Overview

SkillBridge India is a full-stack academia-industry bridge connecting **Students**, **Academic Institutions (Training & Placement Cells)**, **Corporate Recruiters**, and **Government/Accreditation Admins (AICTE)**. 

Unlike traditional placement boards, this platform treats skills as dynamic, verifiable vectors. It features an **Explainable AI Matching Engine** (TF-IDF + Cosine Similarity + Faculty Verification Multiplier) and an automated **NLP Resume Skill Extractor** that transparently shows *why* candidates match job requirements, isolates missing skill gaps, and recommends curated learning roadmaps.

---

## 🌟 Key Features by Role

### 1. Student Persona (`student@demo.edu` — Arjun Sharma)
- **Profile & Competency Matrix**: View and manage self-declared competencies with proficiency tiers (Beginner, Intermediate, Expert).
- **Automated Resume NLP Parser**: Drag-and-drop PDF/text resume to extract contact info (Email, Phone, GitHub, LinkedIn) and auto-populate skill tags against an ontology of 160+ industry skills.
- **Faculty Endorsement Badges**: Green shield badges indicate skills officially verified by college faculty or TPO assessments.
- **Internship & Job Explorer**: Filter positions by keyword, required skill, location, and stipend.
- **Explainable Skill-Gap Report**: Compares student profile against any target role, generating:
  - Overall match score (0–100%) and match tier (*Strong Match*, *Moderate Match*, *Development Opportunity*).
  - List of matched skills (with endorsement boost indicators).
  - Missing skills gap with direct links to learning resources (Coursera, deeplearning.ai, documentation).
- **Application Pipeline Tracker**: Interactive 5-stage stepper tracking status: `Applied` → `Shortlisted` → `Interview` → `Offer` → `Closed`.

### 2. Academic Institution Persona (`tpo@iitd.ac.in` — Prof. S. Ramanujan, IIT Delhi)
- **Cohort Analytics & Placement %**: Live KPI cards tracking cohort size, placement rate (%), total offers issued, and interview pipeline.
- **Cohort Skill-Gap Heatmap**: Table contrasting current industry demand against cohort supply and faculty verification rate, pinpointing high-urgency curriculum deficit areas.
- **Faculty Endorsement Workflow**: Review student-declared skills and endorse them with a single click, instantly conferring a 1.25x verification boost in the matching engine.
- **Bulk CSV Roster Import**: Batch-upload entire student cohorts with automated account provisioning and skill tag initialization.
- **Campus Placement Drives**: Schedule and track on-campus recruitment drives with corporate partners.

### 3. Corporate Recruiter Persona (`recruiter@techcorp.in` — Priya Verma, TechCorp)
- **Job & Internship Creation**: Publish structured postings with tagged skill requirements, stipend/CTC, and location.
- **Ranked Candidate Evaluation**: View applicant lists ranked in real time by the Explainable Matching Engine.
- **Transparent Match Breakdown**: Inspect *Why Matched* reasoning, matching skills, missing skills, and faculty endorsement badges for each candidate.
- **Pipeline Progression**: Advance candidates through stages: `Shortlist` → `Interview` → `Offer` → `Closed`.
- **Post-Hire Accuracy Feedback**: Submit a 1–5 star rating and evaluator feedback on how accurately the platform's match score predicted the candidate's actual capability.

### 4. National Admin Persona (`admin@aicte.gov.in` — Dr. A. K. Mittal, AICTE)
- **Cross-Institution Macro Analytics**: National placement rates, participating university tallies, and active hiring enterprises.
- **Skill Demand Trends vs Academic Supply**: Dual progress visualizations tracking supply vs demand growth YoY.
- **Exportable AICTE Reports**: 1-click generation and download of complete cohort placement and skill-mapping CSV audits.

---

## 🧠 Explainable Matching Engine Architecture

The core differentiator is an explainable matching algorithm:
1. **Vector Representation**: The student's competencies and job requirements are converted into TF-IDF vector representations. Proficiency weights scale token importance (Beginner: 1.0x, Intermediate: 1.3x, Expert: 1.6x).
2. **Faculty Verification Multiplier**: Skills verified by institutional faculty receive a **1.25x weight multiplier**, rewarding academic rigor.
3. **Composite Scoring Formula**:
   $$\text{Final Score} = \left(0.60 \times \text{Overlap Ratio} + 0.25 \times \max(\text{Cosine Similarity}, \text{Overlap} \times 0.8) + 0.15 \times \text{Endorsement Ratio}\right) \times 100$$
4. **Transparent Explainability**: Every score outputs an intelligible explanation (e.g., *"Matches 4 of 5 required skills (80% coverage). 3 skills verified by institutional faculty endorsement. Contextual similarity: 78.5%."*).

---

## 🛠️ Tech Stack & Architecture

- **Backend**: Python 3.13, FastAPI, SQLAlchemy ORM, Pydantic v2.
- **Security & RBAC**: JWT Bearer authentication, PBKDF2-HMAC-SHA256 password hashing, role-based access control.
- **NLP & AI**: Scikit-Learn TF-IDF Vectorizer, Cosine Similarity, PyPDF resume extractor, custom 160+ skill keyword taxonomy.
- **Database**: Zero-config SQLite default (`portal.db`) with relational integrity; seamlessly switches to PostgreSQL when `DATABASE_URL` is set.
- **Frontend**: Single-port React 18 SPA with Tailwind CSS, Lucide icons, and Chart.js, served directly from FastAPI static assets.

---

## ⚡ Quickstart Guide

### 1. Prerequisites
- Python 3.10+ (tested on Python 3.13)

### 2. Setup Virtual Environment
```bash
# Clone or navigate to the project directory
cd sih26044-portal

# Activate the existing virtual environment
# On Windows:
.\.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies (already completed in this repo)
pip install -r requirements.txt
```

### 3. Run the Server
```bash
python run.py
```
Open your browser and navigate to:
- **Interactive Web App**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger REST API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

### 4. Run Automated Test Suite
```bash
python -m unittest backend/test_portal.py
```

---

## 🎭 Demo Personas (1-Click Header Switcher)

The application includes an instant 1-click persona switcher at the top of the screen:
- **Student**: `student@demo.edu` / `Student@123` (Arjun Sharma, IIT Delhi)
- **Institution TPO**: `tpo@iitd.ac.in` / `Tpo@123` (Prof. S. Ramanujan, IIT Delhi)
- **Recruiter**: `recruiter@techcorp.in` / `Recruiter@123` (Priya Verma, TechCorp India)
- **Admin**: `admin@aicte.gov.in` / `Admin@123` (Dr. A. K. Mittal, AICTE)

---

## ⏱️ 3–5 Minute Live Hackathon Walkthrough Script

### Minute 1: The Problem & Student Experience
1. Start on the **Student View** as *Arjun Sharma*.
2. Highlight the student profile showing CGPA 8.9 and verified skills (Docker, FastAPI, Python with green shield icons).
3. Demonstrate the **Resume NLP Extractor**: Upload a sample PDF or text resume. Show how technical skills are identified and auto-populated.
4. Click **Job & Internship Board** and select the **Full-Stack Software Engineering Intern** posting at TechCorp.
5. Click **View Skill-Gap Report**: Point to the **88.5% Match Score** and the transparent reasoning. Show the side-by-side comparison: matching skills (with faculty endorsements) vs missing skills with direct links to learning modules.
6. Click **Apply Now**.

### Minute 2: The Recruiter & Explainable Candidate Ranking
1. Click **Recruiter (Priya - TechCorp)** in the top demo switcher.
2. Go to **Ranked Candidates & Pipeline**. Select the *Full-Stack Software Engineering Intern* posting.
3. Show that *Arjun Sharma* is visibly ranked at the top (#1) with an **88.5% Match Score**.
4. Expand the **Why Matched** explanation card to demonstrate the explainable breakdown to the judges (not a black-box score).
5. Click **Interview** and then **Offer** to advance Arjun through the pipeline.
6. Click **⭐ Rate Match** and submit a 5-star rating with feedback on score accuracy.

### Minute 3: Institution TPO (Faculty Endorsement & Heatmap)
1. Click **Institution (Prof. Ramanujan - IIT Delhi)** in the switcher.
2. Highlight the **Cohort Analytics**: Placement rate, total offers, and cohort size.
3. Scroll to the **Cohort Skill-Gap Heatmap**: Show how the TPO identifies curriculum deficits (e.g. Kubernetes having a 37% deficit vs market demand).
4. Click **Faculty Endorsements**: Show student-claimed skills. Click **🛡️ Verify & Endorse Skill** on a student's self-declared skill, showing the instant verification update.
5. Point out the **CSV Roster Bulk Import** tab and the **Placement Drives** calendar.

### Minute 4: National Admin & AICTE Compliance
1. Click **Admin (Dr. Mittal - AICTE)** in the switcher.
2. Showcase the **National Skill Demand vs Academic Supply** trends across India.
3. Click **📥 Download Official CSV Report** to demonstrate exportable, audit-ready data.

---

## 🔒 Compliance, Data Handling & Future Work

### Implemented for MVP:
- Secure PBKDF2 password hashing and JWT claims-based authorization.
- Role-based route protection across all endpoints.
- Relational schema modeling student competencies, faculty endorsements, and hiring logs.

### Future Work & Digital Personal Data Protection (DPDP) Act Compliance:
- **Consent Artifacts**: Explicit consent notices before student resumes and academic transcripts are vectorized and shared with recruiting entities.
- **Right to Erasure / Data Portability**: Self-service endpoints allowing students to purge stored resume text and export complete skill dossiers in accordance with the Indian DPDP Act 2023.
- **Bi-directional Feedback Loop**: Machine learning model fine-tuning where historical recruiter post-hire ratings dynamically update skill importance weights over successive hiring cycles.
