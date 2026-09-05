"""Server startup script for SIH26044 Portal."""
import uvicorn
import webbrowser
import sys

def main():
    print("=" * 70)
    print("  Smart India Hackathon 2026 — Problem Statement SIH26044")
    print("  SkillBridge India: Academia-Industry Skill Mapping & Placement")
    print("=" * 70)
    print("\nStarting server on http://localhost:8000 ...")
    print("REST API & Swagger Docs: http://localhost:8000/docs")
    print("Interactive Web App:     http://localhost:8000\n")
    print("Demo Personas available via 1-Click Switcher in UI:")
    print("  1. Student:     student@demo.edu        (Arjun Sharma - IIT Delhi)")
    print("  2. Institution: tpo@iitd.ac.in          (Prof. Ramanujan - T&P Cell)")
    print("  3. Recruiter:   recruiter@techcorp.in   (Priya Verma - TechCorp)")
    print("  4. Admin:       admin@aicte.gov.in      (Dr. Mittal - AICTE)")
    print("=" * 70 + "\n")

    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)

if __name__ == "__main__":
    main()
