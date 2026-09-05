"""Explainable Candidate-Job Matching Engine for SIH26044.

Features:
- TF-IDF vectorization & Cosine Similarity
- Weighted exact & fuzzy skill tag overlap
- Faculty Endorsement Bonus (1.25x boost)
- Human-readable explainable 'Why Matched' breakdown
- Targeted learning recommendations for missing skill gaps
"""
from typing import List, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

SKILL_LEARNING_CATALOG: Dict[str, Dict[str, str]] = {
    "python": {"course": "Python for Everybody (Coursera / Michigan)", "url": "https://www.coursera.org/specializations/python"},
    "fastapi": {"course": "FastAPI Official Interactive Tutorial & OpenAPI Docs", "url": "https://fastapi.tiangolo.com/tutorial/"},
    "docker": {"course": "Docker & Containers Fundamentals (Docker Captains)", "url": "https://docs.docker.com/get-started/"},
    "kubernetes": {"course": "Kubernetes for Beginners (CNCF / edX)", "url": "https://www.edx.org/learn/kubernetes"},
    "react": {"course": "Full Modern React & Hooks Guide (react.dev)", "url": "https://react.dev/learn"},
    "typescript": {"course": "TypeScript in 50 Lessons (TypeScript Official)", "url": "https://www.typescriptlang.org/docs/"},
    "postgresql": {"course": "PostgreSQL Tutorial & High-Performance SQL", "url": "https://www.postgresqltutorial.com/"},
    "machine learning": {"course": "Machine Learning Specialization (DeepLearning.AI / Andrew Ng)", "url": "https://www.deeplearning.ai/courses/machine-learning-specialization/"},
    "deep learning": {"course": "Deep Learning Specialization (Andrew Ng)", "url": "https://www.deeplearning.ai/courses/deep-learning-specialization/"},
    "pytorch": {"course": "Deep Learning with PyTorch: A 60 Minute Blitz", "url": "https://pytorch.org/tutorials/beginner/deep_learning_60min_blitz.html"},
    "aws": {"course": "AWS Cloud Practitioner Essentials (AWS Skill Builder)", "url": "https://explore.skillbuilder.aws/"},
    "git": {"course": "Pro Git Book & GitHub Skills Interactive Lab", "url": "https://git-scm.com/book/en/v2"},
    "cybersecurity": {"course": "Google Cybersecurity Professional Certificate", "url": "https://grow.google/certificates/cybersecurity/"},
    "data structures": {"course": "Algorithms & Data Structures in Python (MIT OpenCourseWare)", "url": "https://ocw.mit.edu/"},
    "sql": {"course": "Complete SQL Mastery (Kaggle Learn / Mode Analytics)", "url": "https://www.kaggle.com/learn/intro-to-sql"},
    "tailwind css": {"course": "Tailwind CSS from Scratch (Tailwind Labs)", "url": "https://tailwindcss.com/docs"},
    "node.js": {"course": "Node.js Developer Roadmap & FreeCodeCamp Labs", "url": "https://www.freecodecamp.org/"},
    "java": {"course": "Java Programming Masterclass (Oracle University)", "url": "https://education.oracle.com/"},
    "c++": {"course": "Modern C++ Programming (learncpp.com)", "url": "https://www.learncpp.com/"},
    "rest api": {"course": "RESTful API Architectural Style & Design Best Practices", "url": "https://restfulapi.net/"},
}

def get_recommendation_for_skill(skill_name: str) -> Dict[str, str]:
    key = skill_name.strip().lower()
    if key in SKILL_LEARNING_CATALOG:
        return SKILL_LEARNING_CATALOG[key]
    for cat_key, info in SKILL_LEARNING_CATALOG.items():
        if cat_key in key or key in cat_key:
            return info
    return {
        "course": f"Mastering {skill_name}: Concepts, Hands-on Projects & Best Practices",
        "url": f"https://www.google.com/search?q=learn+{skill_name}+course+documentation"
    }

def calculate_match(
    student_skills: List[Dict[str, Any]],
    job_required_skills: List[str],
    job_title: str = "",
    job_description: str = "",
    student_branch: str = "",
    student_bio: str = ""
) -> Dict[str, Any]:
    student_skill_map = {}
    weighted_student_tokens = []

    for s in student_skills:
        name = s.get("skill_name", "").strip()
        if not name:
            continue
        key = name.lower()
        prof = s.get("proficiency", "Intermediate").lower()
        endorsed = bool(s.get("endorsed", False))

        prof_weight = 1.0
        if prof == "expert":
            prof_weight = 1.5
        elif prof == "intermediate":
            prof_weight = 1.2
        elif prof == "beginner":
            prof_weight = 0.9

        if endorsed:
            prof_weight *= 1.25

        student_skill_map[key] = {
            "original_name": name,
            "proficiency": s.get("proficiency", "Intermediate"),
            "endorsed": endorsed,
            "weight": prof_weight
        }

        repeat_count = max(1, int(round(prof_weight * 2)))
        weighted_student_tokens.extend([key] * repeat_count)

    normalized_req_skills = [req.strip().lower() for req in job_required_skills if req.strip()]

    matched_skills = []
    missing_skills = []
    endorsed_count = 0

    for req_key in normalized_req_skills:
        found = False
        for stu_key, stu_meta in student_skill_map.items():
            if req_key == stu_key or req_key in stu_key or stu_key in req_key:
                matched_skills.append({
                    "skill": stu_meta["original_name"],
                    "required_skill": req_key,
                    "proficiency": stu_meta["proficiency"],
                    "endorsed": stu_meta["endorsed"]
                })
                if stu_meta["endorsed"]:
                    endorsed_count += 1
                found = True
                break
        if not found:
            rec = get_recommendation_for_skill(req_key)
            missing_skills.append({
                "skill": req_key.title(),
                "suggested_resource": rec["course"],
                "resource_link": rec["url"]
            })

    req_total = max(1, len(normalized_req_skills))
    overlap_ratio = len(matched_skills) / req_total

    # Cosine Similarity over skills and contextual descriptions
    student_skills_text = " ".join(weighted_student_tokens)
    job_skills_text = " ".join(normalized_req_skills)

    student_corpus = f"{student_skills_text} {student_branch} {student_bio}"
    job_corpus = f"{job_skills_text} {job_title} {job_description}"

    try:
        vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words="english")
        tfidf_matrix = vectorizer.fit_transform([student_corpus, job_corpus])
        cos_sim = float(cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0])
    except Exception:
        cos_sim = overlap_ratio

    endorsement_ratio = (endorsed_count / req_total) if req_total > 0 else 0.0

    # Composite Explainable Score
    # 60% skill coverage overlap, 25% semantic cosine similarity, 15% faculty endorsement
    raw_score = (0.60 * overlap_ratio + 0.25 * max(cos_sim, overlap_ratio * 0.8) + 0.15 * endorsement_ratio) * 100.0
    final_score = round(min(100.0, max(5.0, raw_score)), 1)

    if final_score >= 70:
        tier = "Strong Match"
        tier_color = "emerald"
    elif final_score >= 45:
        tier = "Moderate Match"
        tier_color = "amber"
    else:
        tier = "Development Opportunity"
        tier_color = "slate"

    explanation = (
        f"Matches {len(matched_skills)} of {req_total} required skills ({int(overlap_ratio * 100)}% coverage). "
        f"{endorsed_count} skill(s) verified by institutional faculty endorsement. "
        f"Contextual similarity: {round(cos_sim * 100, 1)}%."
    )

    return {
        "score": final_score,
        "tier": tier,
        "tier_color": tier_color,
        "overlap_ratio": round(overlap_ratio * 100, 1),
        "cosine_similarity": round(cos_sim * 100, 1),
        "endorsed_count": endorsed_count,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "explanation": explanation
    }
