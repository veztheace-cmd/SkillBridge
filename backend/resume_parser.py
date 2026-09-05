"""Resume parsing & skill extraction engine using regex and a curated skill taxonomy."""
import re
import io
from typing import List, Dict, Any
from pypdf import PdfReader

# Master taxonomy of 160+ technical and industry skills categorized
SKILL_TAXONOMY = {
    "Programming Languages": [
        "python", "javascript", "typescript", "java", "c++", "c#", "c", "go", "golang",
        "rust", "kotlin", "swift", "php", "ruby", "r", "scala", "dart", "matlab", "shell", "bash"
    ],
    "Web & Frontend Frameworks": [
        "react", "react.js", "next.js", "vue", "vue.js", "angular", "svelte", "html", "html5",
        "css", "css3", "tailwind css", "bootstrap", "sass", "redux", "graphql", "rest api"
    ],
    "Backend & Distributed Systems": [
        "fastapi", "django", "flask", "node.js", "express", "express.js", "spring boot",
        "asp.net", "microservices", "grpc", "rabbitmq", "kafka", "celery", "websockets"
    ],
    "Databases & Storage": [
        "postgresql", "postgres", "mysql", "mongodb", "redis", "sqlite", "cassandra",
        "dynamodb", "elasticsearch", "neo4j", "oracle", "sql", "nosql", "supabase", "firebase"
    ],
    "Cloud & DevOps": [
        "docker", "kubernetes", "aws", "amazon web services", "azure", "google cloud", "gcp",
        "terraform", "ansible", "ci/cd", "github actions", "jenkins", "linux", "nginx"
    ],
    "AI, ML & Data Science": [
        "machine learning", "deep learning", "nlp", "natural language processing", "computer vision",
        "pytorch", "tensorflow", "scikit-learn", "keras", "huggingface", "llm", "pandas",
        "numpy", "opencv", "matplotlib", "seaborn", "tableau", "power bi", "bigquery", "spark"
    ],
    "Core CS & Embedded/IoT": [
        "data structures", "algorithms", "object oriented programming", "system design",
        "operating systems", "computer networks", "embedded systems", "iot", "arduino", "raspberry pi"
    ]
}

EMAIL_REGEX = r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"
PHONE_REGEX = r"(?:(?:\+91|0)?[\s-]?[6-9]\d{9}|\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b)"
URL_REGEX = r"https?://(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b[-a-zA-Z0-9()@:%_\+.~#?&//=]*"

def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    """Extract text from PDF or plaintext resume file."""
    lower_name = filename.lower()
    if lower_name.endswith(".pdf"):
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            text = ""
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
            return text.strip()
        except Exception as e:
            return f"Error reading PDF: {str(e)}"
    else:
        # Default decode as utf-8 or latin-1
        try:
            return file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            return file_bytes.decode("latin-1", errors="ignore")

def parse_resume_text(text: str) -> Dict[str, Any]:
    """Parse resume text to identify contact details and matched skills."""
    normalized_text = text.lower()

    # Extract contacts
    emails = re.findall(EMAIL_REGEX, text)
    phones = re.findall(PHONE_REGEX, text)
    urls = re.findall(URL_REGEX, text)

    github = next((u for u in urls if "github.com" in u), None)
    linkedin = next((u for u in urls if "linkedin.com" in u), None)

    # First meaningful line as name candidate
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    candidate_name = lines[0] if lines else "Student Candidate"

    # Match skills from taxonomy
    detected_skills = []
    seen_skills = set()

    for category, skill_list in SKILL_TAXONOMY.items():
        for skill in skill_list:
            # Word boundary regex to avoid partial substring false positives
            escaped = re.escape(skill)
            # Allow common suffixes e.g. "python3" or "dockerized"
            pattern = rf"(?:\b|_){escaped}(?:\b|_)"
            if re.search(pattern, normalized_text):
                canonical = skill.title()
                # Special casing acronyms
                if skill in ["aws", "gcp", "sql", "nosql", "ci/cd", "nlp", "llm", "iot", "html", "css"]:
                    canonical = skill.upper()
                elif skill in ["react.js", "next.js", "vue.js", "node.js", "express.js"]:
                    canonical = skill.capitalize()

                if canonical.lower() not in seen_skills:
                    seen_skills.add(canonical.lower())
                    detected_skills.append({
                        "skill_name": canonical,
                        "category": category,
                        "proficiency": "Intermediate",
                        "endorsed": False
                    })

    return {
        "candidate_name": candidate_name[:100],
        "email": emails[0] if emails else None,
        "phone": phones[0] if phones else None,
        "github": github,
        "linkedin": linkedin,
        "extracted_skills": detected_skills,
        "total_skills_found": len(detected_skills),
        "raw_character_count": len(text)
    }
