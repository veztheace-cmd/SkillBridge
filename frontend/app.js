const { useState, useEffect, useRef } = React;

const API_BASE = "";

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [role, setRole] = useState("student");
  const [activeTab, setActiveTab] = useState("profile");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleDemoLogin = async (targetRole) => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/auth/demo-login/${targetRole}`, {
        method: "POST"
      });
      if (!resp.ok) throw new Error("Demo login failed");
      const data = await resp.json();
      localStorage.setItem("token", data.access_token);
      setToken(data.access_token);
      setUser(data.user);
      setRole(data.user.role);

      if (data.user.role === "student") setActiveTab("profile");
      else if (data.user.role === "institution") setActiveTab("analytics");
      else if (data.user.role === "recruiter") setActiveTab("postings");
      else if (data.user.role === "admin") setActiveTab("national_overview");

      showToast(`Switched to demo session as ${data.user.role.toUpperCase()}: ${data.user.full_name}`);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) throw new Error("Session expired");
          return res.json();
        })
        .then(data => {
          setUser(data);
          setRole(data.role);
          if (data.role === "student") setActiveTab("profile");
          else if (data.role === "institution") setActiveTab("analytics");
          else if (data.role === "recruiter") setActiveTab("postings");
          else if (data.role === "admin") setActiveTab("national_overview");
        })
        .catch(() => {
          handleDemoLogin("student");
        });
    } else {
      handleDemoLogin("student");
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium flex items-center space-x-3 transition-all ${
          toast.type === "error" ? "bg-rose-950/90 border-rose-600 text-rose-200" : "bg-emerald-950/90 border-emerald-600 text-emerald-200"
        }`}>
          <span>{toast.type === "error" ? "⚠️" : "✅"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Demo Quick Switcher Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/20">
              S
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold tracking-tight text-white text-base sm:text-lg">SkillBridge India</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-900/70 border border-indigo-700 text-indigo-300">
                  SIH26044
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Academia–Industry Collaboration & AI Skill Mapping Portal</p>
            </div>
          </div>

          {/* 1-Click Role Switcher */}
          <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-xl space-x-1 text-xs">
            <span className="px-2 text-slate-500 font-semibold uppercase text-[10px] hidden md:inline">Demo Persona:</span>
            {[
              { id: "student", label: "Student", desc: "Arjun (IITD)" },
              { id: "institution", label: "Institution", desc: "Prof. Ramanujan" },
              { id: "recruiter", label: "Recruiter", desc: "Priya (TechCorp)" },
              { id: "admin", label: "Admin", desc: "Dr. Mittal (AICTE)" }
            ].map(r => (
              <button
                key={r.id}
                onClick={() => handleDemoLogin(r.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex flex-col items-start ${
                  role === r.id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <span>{r.label}</span>
                <span className="text-[9px] opacity-75">{r.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Role-Specific Navigation Sub-Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60 py-2 flex items-center justify-between text-sm overflow-x-auto">
          <div className="flex space-x-2">
            {role === "student" && (
              <>
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${activeTab === "profile" ? "bg-slate-800 text-indigo-400 font-semibold" : "text-slate-400 hover:text-slate-200"}`}
                >
                  👤 Profile & Resume NLP
                </button>
                <button
                  onClick={() => setActiveTab("jobs")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${activeTab === "jobs" ? "bg-slate-800 text-indigo-400 font-semibold" : "text-slate-400 hover:text-slate-200"}`}
                >
                  💼 Job & Internship Board
                </button>
                <button
                  onClick={() => setActiveTab("skill_gap")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${activeTab === "skill_gap" ? "bg-slate-800 text-indigo-400 font-semibold" : "text-slate-400 hover:text-slate-200"}`}
                >
                  🎯 Skill-Gap Analyzer
                </button>
                <button
                  onClick={() => setActiveTab("applications")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${activeTab === "applications" ? "bg-slate-800 text-indigo-400 font-semibold" : "text-slate-400 hover:text-slate-200"}`}
                >
                  📊 My Applications
                </button>
              </>
            )}

            {role === "institution" && (
              <>
                <button
                  onClick={() => setActiveTab("analytics")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${activeTab === "analytics" ? "bg-slate-800 text-indigo-400 font-semibold" : "text-slate-400 hover:text-slate-200"}`}
                >
                  📈 Cohort Analytics & Heatmap
                </button>
                <button
                  onClick={() => setActiveTab("endorsements")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${activeTab === "endorsements" ? "bg-slate-800 text-indigo-400 font-semibold" : "text-slate-400 hover:text-slate-200"}`}
                >
                  🛡️ Faculty Endorsements
                </button>
                <button
                  onClick={() => setActiveTab("roster_import")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${activeTab === "roster_import" ? "bg-slate-800 text-indigo-400 font-semibold" : "text-slate-400 hover:text-slate-200"}`}
                >
                  📑 CSV Roster Bulk Import
                </button>
                <button
                  onClick={() => setActiveTab("drives")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${activeTab === "drives" ? "bg-slate-800 text-indigo-400 font-semibold" : "text-slate-400 hover:text-slate-200"}`}
                >
                  📅 Placement Drives
                </button>
              </>
            )}

            {role === "recruiter" && (
              <>
                <button
                  onClick={() => setActiveTab("postings")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${activeTab === "postings" ? "bg-slate-800 text-indigo-400 font-semibold" : "text-slate-400 hover:text-slate-200"}`}
                >
                  📋 Job Postings
                </button>
                <button
                  onClick={() => setActiveTab("candidates")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${activeTab === "candidates" ? "bg-slate-800 text-indigo-400 font-semibold" : "text-slate-400 hover:text-slate-200"}`}
                >
                  ⭐ Ranked Candidates & Pipeline
                </button>
              </>
            )}

            {role === "admin" && (
              <>
                <button
                  onClick={() => setActiveTab("national_overview")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${activeTab === "national_overview" ? "bg-slate-800 text-indigo-400 font-semibold" : "text-slate-400 hover:text-slate-200"}`}
                >
                  🌐 National Overview & Demand Trends
                </button>
                <button
                  onClick={() => setActiveTab("reports")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${activeTab === "reports" ? "bg-slate-800 text-indigo-400 font-semibold" : "text-slate-400 hover:text-slate-200"}`}
                >
                  📥 Exportable AICTE Reports
                </button>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Logged in as: <strong className="text-white">{user ? user.full_name : "Loading..."}</strong></span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 text-sm">Synchronizing role state...</p>
          </div>
        ) : (
          <>
            {role === "student" && <StudentDashboard tab={activeTab} token={token} showToast={showToast} setActiveTab={setActiveTab} />}
            {role === "institution" && <InstitutionDashboard tab={activeTab} token={token} showToast={showToast} />}
            {role === "recruiter" && <RecruiterDashboard tab={activeTab} token={token} showToast={showToast} />}
            {role === "admin" && <AdminDashboard tab={activeTab} token={token} showToast={showToast} />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/50 py-4 text-center text-xs text-slate-500">
        <p>Smart India Hackathon 2026 — Problem Statement SIH26044 | Explainable Skill Mapping & Placement Engine</p>
        <p className="mt-1 text-[11px] text-slate-600">Built with FastAPI, SQLAlchemy, TF-IDF Cosine Embedding Similarity & React 18</p>
      </footer>
    </div>
  );
}

// -------------------------------------------------------------
// STUDENT DASHBOARD
// -------------------------------------------------------------
function StudentDashboard({ tab, token, showToast, setActiveTab }) {
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedJobForGap, setSelectedJobForGap] = useState(null);
  const [gapAnalysis, setGapAnalysis] = useState(null);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillProficiency, setNewSkillProficiency] = useState("Intermediate");
  const [parsedSkillsCandidate, setParsedSkillsCandidate] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const fileInputRef = useRef(null);

  const fetchProfile = () => {
    fetch(`${API_BASE}/api/students/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setProfile(data))
      .catch(err => console.error(err));
  };

  const fetchJobs = () => {
    let url = `${API_BASE}/api/jobs?`;
    if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
    if (locationFilter) url += `location=${encodeURIComponent(locationFilter)}&`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setJobs(data);
        if (data.length > 0 && !selectedJobForGap) {
          setSelectedJobForGap(data[0].id);
        }
      })
      .catch(err => console.error(err));
  };

  const fetchApplications = () => {
    fetch(`${API_BASE}/api/students/applications`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setApplications(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchProfile();
    fetchJobs();
    fetchApplications();
  }, [token]);

  useEffect(() => {
    if (selectedJobForGap && token) {
      fetch(`${API_BASE}/api/students/skill-gap/${selectedJobForGap}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setGapAnalysis(data))
        .catch(err => console.error(err));
    }
  }, [selectedJobForGap, token]);

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    try {
      const resp = await fetch(`${API_BASE}/api/students/skills`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ skill_name: newSkillName, proficiency: newSkillProficiency })
      });
      if (!resp.ok) throw new Error("Failed to add skill");
      showToast(`Skill "${newSkillName}" added successfully.`);
      setNewSkillName("");
      fetchProfile();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDeleteSkill = async (id) => {
    try {
      const resp = await fetch(`${API_BASE}/api/students/skills/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!resp.ok) throw new Error("Failed to delete skill");
      showToast("Skill removed.");
      fetchProfile();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("auto_add_skills", true);

    showToast("Extracting skills via NLP taxonomy parser...", "info");
    try {
      const resp = await fetch(`${API_BASE}/api/students/resume-upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (!resp.ok) throw new Error("Resume parsing failed");
      const data = await resp.json();
      setParsedSkillsCandidate(data);
      showToast(`Extracted ${data.extracted_skills.length} skills from ${file.name}!`);
      fetchProfile();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleApply = async (jobId) => {
    try {
      const resp = await fetch(`${API_BASE}/api/jobs/${jobId}/apply`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.detail || "Application failed");
      showToast(`Application submitted! Match Score: ${data.match_score}% (${data.match_tier})`);
      fetchApplications();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  if (tab === "profile") {
    return (
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-bold text-white">{profile ? profile.full_name : "Arjun Sharma"}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-900/60 border border-indigo-700 text-indigo-300">
                  Batch 2026
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                {profile ? `${profile.branch} • ${profile.college_name}` : "Computer Science & Engineering • IIT Delhi"}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-300">
                <span className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                  ⭐ CGPA: <strong className="text-white">{profile ? profile.cgpa : "8.9"}</strong> / 10
                </span>
                <span className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                  🎯 Target: <strong className="text-indigo-300">{profile ? profile.target_role : "Full Stack & Distributed Systems"}</strong>
                </span>
              </div>
            </div>

            <div className="border-2 border-dashed border-indigo-500/30 hover:border-indigo-500/60 bg-indigo-950/20 rounded-xl p-4 text-center transition">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleResumeUpload}
                accept=".pdf,.txt,.docx"
                className="hidden"
              />
              <div className="text-indigo-400 text-2xl mb-1">📄</div>
              <h4 className="text-xs font-semibold text-white">Upload Resume for NLP Extraction</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Supports PDF or plain text resume</p>
              <button
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className="mt-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium shadow-md shadow-indigo-600/20 transition"
              >
                Choose File & Parse Skills
              </button>
            </div>
          </div>
        </div>

        {parsedSkillsCandidate && (
          <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-emerald-400 text-base font-bold">✨ Automated NLP Skill Extraction:</span>
                <span className="text-xs text-slate-300">Detected {parsedSkillsCandidate.extracted_skills.length} skills from <code className="text-emerald-300">{parsedSkillsCandidate.filename}</code></span>
              </div>
              <button onClick={() => setParsedSkillsCandidate(null)} className="text-slate-400 hover:text-white text-xs">Dismiss</button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {parsedSkillsCandidate.extracted_skills.map((s, idx) => (
                <span key={idx} className="bg-emerald-900/60 border border-emerald-700 text-emerald-200 text-xs px-2.5 py-1 rounded-lg">
                  {s.skill_name} <span className="text-[10px] opacity-75">({s.category})</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">My Verified & Declared Skills</h3>
                <p className="text-xs text-slate-400">Green shield denotes official faculty endorsement from your institution</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-medium">
                Total: {profile ? profile.skills.length : 0}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profile && profile.skills.length > 0 ? (
                profile.skills.map(skill => (
                  <div
                    key={skill.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                        skill.endorsed ? "bg-emerald-950 border border-emerald-600 text-emerald-300" : "bg-slate-800 text-slate-400"
                      }`}>
                        {skill.endorsed ? "🛡️" : "⚡"}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-sm font-semibold text-white">{skill.skill_name}</span>
                          {skill.endorsed && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-900/80 text-emerald-300 font-medium border border-emerald-700" title={`Endorsed by ${skill.endorsed_by}`}>
                              Faculty Verified
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 capitalize">{skill.proficiency}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSkill(skill.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded transition text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-2 py-8 text-center text-slate-500 text-sm">
                  No skills recorded yet. Upload your resume or add your skills below.
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-fit">
            <h3 className="text-lg font-bold text-white mb-1">Add Skill</h3>
            <p className="text-xs text-slate-400 mb-4">Declare new competencies to enhance matching accuracy</p>

            <form onSubmit={handleAddSkill} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Skill Name</label>
                <input
                  type="text"
                  placeholder="e.g. Docker, PyTorch, React"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Proficiency Level</label>
                <select
                  value={newSkillProficiency}
                  onChange={(e) => setNewSkillProficiency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="Beginner">Beginner (Foundational)</option>
                  <option value="Intermediate">Intermediate (Hands-on Projects)</option>
                  <option value="Expert">Expert (Production / Advanced)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/30 transition"
              >
                + Add to Skill Profile
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (tab === "jobs") {
    return (
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xl">
          <div className="flex-1 w-full flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
            <span className="text-slate-400 mr-2">🔍</span>
            <input
              type="text"
              placeholder="Search by role title or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-white w-full outline-none"
            />
          </div>
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="Location (e.g. Remote, Bengaluru)"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none w-full md:w-48"
            />
            <button
              onClick={fetchJobs}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-md transition"
            >
              Filter
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map(job => (
            <div key={job.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">{job.company_name}</span>
                    <h3 className="text-lg font-bold text-white mt-0.5">{job.title}</h3>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                    job.job_type === "internship" ? "bg-amber-950 text-amber-300 border border-amber-800" : "bg-cyan-950 text-cyan-300 border border-cyan-800"
                  }`}>
                    {job.job_type}
                  </span>
                </div>

                <div className="mt-2 flex items-center space-x-4 text-xs text-slate-400">
                  <span>📍 {job.location}</span>
                  <span>💰 {job.stipend_or_ctc}</span>
                  <span>👥 {job.applicant_count} applied</span>
                </div>

                <p className="mt-3 text-xs text-slate-300 line-clamp-2">{job.description}</p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {job.required_skills.map((s, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  onClick={() => {
                    setSelectedJobForGap(job.id);
                    setActiveTab("skill_gap");
                  }}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                >
                  <span>🎯 View Skill-Gap Report</span>
                </button>
                <button
                  onClick={() => handleApply(job.id)}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition"
                >
                  Apply Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tab === "skill_gap") {
    return (
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">AI Skill-Gap & Eligibility Report</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Explainable vector match score comparing your profile against industry requirements
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-xs text-slate-400 font-medium">Target Role:</label>
              <select
                value={selectedJobForGap || ""}
                onChange={(e) => setSelectedJobForGap(Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 text-sm text-white rounded-xl px-3 py-2 outline-none"
              >
                {jobs.map(j => (
                  <option key={j.id} value={j.id}>{j.company_name} — {j.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {gapAnalysis ? (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center space-x-5">
                <div className="relative flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 flex items-center justify-center">
                    <span className="text-2xl font-black text-white">{gapAnalysis.analysis.score}%</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Match Verdict</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      gapAnalysis.analysis.tier === "Strong Match"
                        ? "bg-emerald-950 border border-emerald-600 text-emerald-300"
                        : "bg-amber-950 border border-amber-600 text-amber-300"
                    }`}>
                      {gapAnalysis.analysis.tier}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">{gapAnalysis.job.title}</h3>
                  <p className="text-xs text-slate-400">{gapAnalysis.job.company_name} • {gapAnalysis.job.stipend_or_ctc}</p>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 max-w-md text-xs space-y-1.5">
                <div className="font-semibold text-indigo-300">💡 Match Reasoning (Explainable AI):</div>
                <p className="text-slate-300">{gapAnalysis.analysis.explanation}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-emerald-400 flex items-center space-x-2">
                    <span>✅ Matching Competencies</span>
                  </h4>
                  <span className="text-xs px-2 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-300 rounded-full font-bold">
                    {gapAnalysis.analysis.matched_skills.length} skills matched
                  </span>
                </div>

                <div className="space-y-2.5">
                  {gapAnalysis.analysis.matched_skills.map((m, idx) => (
                    <div key={idx} className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-emerald-400 font-semibold text-sm">{m.skill}</span>
                        {m.endorsed && (
                          <span className="text-[10px] bg-emerald-900/60 border border-emerald-700 text-emerald-300 px-1.5 py-0.5 rounded font-medium">
                            🛡️ Faculty Endorsed (+1.25x Boost)
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 capitalize">{m.proficiency}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-rose-400 flex items-center space-x-2">
                    <span>⚠️ Missing Skills (Skill-Gap)</span>
                  </h4>
                  <span className="text-xs px-2 py-0.5 bg-rose-950 border border-rose-800 text-rose-300 rounded-full font-bold">
                    {gapAnalysis.analysis.missing_skills.length} skills to acquire
                  </span>
                </div>

                <div className="space-y-3">
                  {gapAnalysis.analysis.missing_skills.length > 0 ? (
                    gapAnalysis.analysis.missing_skills.map((gap, idx) => (
                      <div key={idx} className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl">
                        <div className="flex items-center justify-between">
                          <span className="text-rose-300 font-bold text-sm">{gap.skill}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">Recommended Course</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">{gap.suggested_resource}</p>
                        <a
                          href={gap.resource_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-2 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 underline"
                        >
                          Access Learning Module ↗
                        </a>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-emerald-400 text-sm font-medium">
                      🎉 Outstanding! You possess all required technical skills for this role.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500">Loading skill gap calculation...</div>
        )}
      </div>
    );
  }

  if (tab === "applications") {
    const pipelineStages = ["applied", "shortlisted", "interview", "offer", "closed"];

    return (
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-white">Application Pipeline & Recruitment Status</h2>
          <p className="text-xs text-slate-400 mt-0.5">Track your candidacy stages from initial submission to final offer issuance</p>
        </div>

        <div className="space-y-4">
          {applications.length > 0 ? (
            applications.map(app => {
              const currentStageIndex = pipelineStages.indexOf(app.status);

              return (
                <div key={app.application_id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">{app.company_name}</span>
                      <h3 className="text-lg font-bold text-white">{app.job_title}</h3>
                      <div className="mt-1 flex items-center space-x-3 text-xs text-slate-400">
                        <span>📍 {app.location}</span>
                        <span>💰 {app.stipend_or_ctc}</span>
                        <span>Applied: {new Date(app.applied_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block">Match Score</span>
                        <span className="text-base font-black text-indigo-400">{app.match_score}%</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        app.status === "offer" ? "bg-emerald-950 border border-emerald-600 text-emerald-300 animate-pulse" :
                        app.status === "interview" ? "bg-blue-950 border border-blue-600 text-blue-300" :
                        app.status === "shortlisted" ? "bg-purple-950 border border-purple-600 text-purple-300" :
                        "bg-slate-800 border border-slate-700 text-slate-300"
                      }`}>
                        {app.status}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-800/80">
                    <div className="flex items-center justify-between relative">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-800 z-0"></div>
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 z-0 transition-all duration-500"
                        style={{ width: `${(Math.max(0, currentStageIndex) / (pipelineStages.length - 1)) * 100}%` }}
                      ></div>

                      {pipelineStages.map((st, idx) => {
                        const isReached = idx <= currentStageIndex;
                        const isCurrent = idx === currentStageIndex;
                        return (
                          <div key={st} className="relative z-10 flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition ${
                              isCurrent ? "bg-indigo-600 border-indigo-400 text-white ring-4 ring-indigo-500/20" :
                              isReached ? "bg-slate-900 border-indigo-500 text-indigo-400" :
                              "bg-slate-950 border-slate-800 text-slate-600"
                            }`}>
                              {idx + 1}
                            </div>
                            <span className={`mt-2 text-[11px] font-semibold uppercase tracking-wider ${
                              isCurrent ? "text-indigo-300" : isReached ? "text-slate-300" : "text-slate-600"
                            }`}>
                              {st}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
              You have not applied to any positions yet. Explore the Job Board to apply!
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

// -------------------------------------------------------------
// INSTITUTION (T&P CELL) DASHBOARD
// -------------------------------------------------------------
function InstitutionDashboard({ tab, token, showToast }) {
  const [analytics, setAnalytics] = useState(null);
  const [endorsements, setEndorsements] = useState([]);
  const [drives, setDrives] = useState([]);
  const [newDriveTitle, setNewDriveTitle] = useState("");
  const [newDriveDate, setNewDriveDate] = useState("2026-10-15");
  const [newDriveCompanies, setNewDriveCompanies] = useState("Google India, Microsoft, TechCorp");
  const rosterFileRef = useRef(null);

  const fetchAnalytics = () => {
    fetch(`${API_BASE}/api/institutions/analytics`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setAnalytics(data))
      .catch(err => console.error(err));
  };

  const fetchEndorsements = () => {
    fetch(`${API_BASE}/api/institutions/endorsements`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setEndorsements(data))
      .catch(err => console.error(err));
  };

  const fetchDrives = () => {
    fetch(`${API_BASE}/api/institutions/drives`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setDrives(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchAnalytics();
    fetchEndorsements();
    fetchDrives();
  }, [token]);

  const handleEndorseSkill = async (skillId, skillName) => {
    try {
      const resp = await fetch(`${API_BASE}/api/institutions/endorse/${skillId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!resp.ok) throw new Error("Endorsement failed");
      showToast(`Verified and endorsed skill "${skillName}"!`);
      fetchEndorsements();
      fetchAnalytics();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleRosterCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    showToast("Processing batch student roster import...", "info");
    try {
      const resp = await fetch(`${API_BASE}/api/institutions/roster-upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.detail || "Roster upload failed");
      showToast(data.message);
      fetchAnalytics();
      fetchEndorsements();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleCreateDrive = async (e) => {
    e.preventDefault();
    try {
      const companies = newDriveCompanies.split(",").map(c => c.trim()).filter(Boolean);
      const resp = await fetch(`${API_BASE}/api/institutions/drives`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: newDriveTitle,
          target_batch: 2026,
          drive_date: newDriveDate,
          companies_invited: companies
        })
      });
      if (!resp.ok) throw new Error("Failed to schedule drive");
      showToast("Campus placement drive scheduled successfully.");
      setNewDriveTitle("");
      fetchDrives();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  if (tab === "analytics") {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Placement Rate</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-emerald-400">{analytics ? analytics.placement_rate : "78.4"}%</span>
              <span className="text-xs text-emerald-500 font-semibold">+12% vs last yr</span>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cohort Size</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-white">{analytics ? analytics.total_students : 0}</span>
              <span className="text-xs text-slate-400">Class of 2026</span>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Offers Issued</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-indigo-400">{analytics ? analytics.offers_issued : 0}</span>
              <span className="text-xs text-indigo-300 font-medium">Campus & PPO</span>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Endorsements</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-amber-400">{endorsements.filter(e => !e.endorsed).length}</span>
              <span className="text-xs text-amber-500 font-medium">Awaiting TPO</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">Cohort Skill-Gap Heatmap</h3>
              <p className="text-xs text-slate-400">Curriculum alignment & market demand vs cohort competency deficit</p>
            </div>
            <span className="text-xs px-3 py-1 bg-slate-800 text-slate-300 rounded-lg font-medium">
              Academic Cohort 2025–26
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Competency Area</th>
                  <th className="p-3">Industry Demand</th>
                  <th className="p-3">Cohort Supply %</th>
                  <th className="p-3">Faculty Verified %</th>
                  <th className="p-3">Skill Deficit Gap</th>
                  <th className="p-3">Curriculum Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {analytics && analytics.skill_gap_heatmap ? (
                  analytics.skill_gap_heatmap.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-semibold text-white">{item.skill}</td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <span className="w-8">{item.market_demand_pct}%</span>
                          <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${item.market_demand_pct}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <span className="w-8">{item.cohort_supply_pct}%</span>
                          <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${item.cohort_supply_pct}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-emerald-400 font-semibold">{item.faculty_verified_pct}%</td>
                      <td className="p-3 font-bold text-rose-400">{item.gap_pct}%</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.urgency === "High" ? "bg-rose-950 border border-rose-700 text-rose-300" :
                          item.urgency === "Medium" ? "bg-amber-950 border border-amber-700 text-amber-300" :
                          "bg-emerald-950 border border-emerald-700 text-emerald-300"
                        }`}>
                          {item.urgency} Priority
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-4 text-center text-slate-500">Loading cohort heatmap...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (tab === "endorsements") {
    return (
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-white">Faculty Skill Endorsement Workflow</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Verify students' self-declared technical skills through academic projects, coursework, or lab assessments
          </p>
        </div>

        <div className="space-y-3">
          {endorsements.map(item => (
            <div key={item.skill_id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base ${
                  item.endorsed ? "bg-emerald-950 border border-emerald-600 text-emerald-400" : "bg-slate-800 text-slate-300"
                }`}>
                  {item.endorsed ? "🛡️" : "⏳"}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-white">{item.student_name}</h4>
                    <span className="text-xs text-slate-400">({item.branch} • CGPA {item.cgpa})</span>
                  </div>
                  <div className="mt-1 flex items-center space-x-2 text-xs">
                    <span className="text-indigo-400 font-semibold">{item.skill_name}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400 capitalize">{item.proficiency}</span>
                    {item.endorsed && (
                      <>
                        <span className="text-slate-500">•</span>
                        <span className="text-emerald-400 text-[11px] font-medium">Verified by: {item.endorsed_by}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div>
                {item.endorsed ? (
                  <span className="px-3 py-1 bg-emerald-950 border border-emerald-700 text-emerald-300 rounded-xl text-xs font-semibold">
                    ✓ Verified & Endorsed
                  </span>
                ) : (
                  <button
                    onClick={() => handleEndorseSkill(item.skill_id, item.skill_name)}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition"
                  >
                    🛡️ Verify & Endorse Skill
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tab === "roster_import") {
    const sampleCSVContent = `full_name,email,branch,graduation_year,cgpa,skills
Devendra Patil,devendra.patil@iitd.ac.in,Computer Science,2026,8.8,Python;Docker;FastAPI;SQL
Pooja Sharma,pooja.sharma@iitd.ac.in,Data Science,2026,9.1,PyTorch;Machine Learning;NLP;Python
Aman Gupta,aman.gupta@iitd.ac.in,Electronics,2026,8.2,C++;Embedded Systems;IoT`;

    return (
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-white">Bulk Student Roster CSV Import</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Rapidly onboard your entire institutional batch with automated account creation and initial skill mapping
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white mb-2">Upload Batch CSV</h3>
              <p className="text-xs text-slate-400 mb-6">
                Accepted columns: <code>full_name, email, branch, graduation_year, cgpa, skills</code> (semi-colon separated)
              </p>

              <input
                type="file"
                ref={rosterFileRef}
                onChange={handleRosterCSVUpload}
                accept=".csv"
                className="hidden"
              />

              <div
                onClick={() => rosterFileRef.current && rosterFileRef.current.click()}
                className="border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-950 p-8 rounded-xl text-center cursor-pointer transition"
              >
                <div className="text-3xl mb-2">📥</div>
                <span className="text-sm font-semibold text-white block">Click to select Student Roster CSV</span>
                <span className="text-xs text-slate-500 mt-1 block">UTF-8 Encoded .CSV file</span>
              </div>
            </div>

            <button
              onClick={() => rosterFileRef.current && rosterFileRef.current.click()}
              className="mt-6 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/30 transition"
            >
              Select & Upload Roster
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-2">Sample Roster Format</h3>
            <p className="text-xs text-slate-400 mb-3">Copy this template into Excel or Google Sheets to prepare your roster</p>

            <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-indigo-300 font-mono overflow-x-auto whitespace-pre">
              {sampleCSVContent}
            </pre>

            <button
              onClick={() => {
                navigator.clipboard.writeText(sampleCSVContent);
                showToast("Sample CSV format copied to clipboard!");
              }}
              className="mt-4 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
            >
              📋 Copy CSV Template
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (tab === "drives") {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-white">Scheduled Campus Placement Drives</h2>
              <p className="text-xs text-slate-400">Institutional recruitment drives and participating corporate partners</p>
            </div>

            {drives.map(d => (
              <div key={d.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <h3 className="text-base font-bold text-white">{d.title}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-950 border border-indigo-700 text-indigo-300 capitalize">
                      {d.status}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-400 space-y-1">
                    <p>📅 Date: <strong className="text-white">{d.drive_date}</strong> • Target: Batch of {d.target_batch}</p>
                    <p>🏛️ Institution: {d.institution_name}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-medium mr-1">Participating:</span>
                  {d.companies_invited.map((c, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-[11px] text-slate-300 rounded-md">
                      🏢 {c}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-fit">
            <h3 className="text-base font-bold text-white mb-1">Schedule New Drive</h3>
            <p className="text-xs text-slate-400 mb-4">Coordinate a dedicated hiring drive with partner firms</p>

            <form onSubmit={handleCreateDrive} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Drive Title</label>
                <input
                  type="text"
                  placeholder="e.g. Winter Tech Internship Sprint 2026"
                  value={newDriveTitle}
                  onChange={(e) => setNewDriveTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Drive Date</label>
                <input
                  type="date"
                  value={newDriveDate}
                  onChange={(e) => setNewDriveDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Invited Companies (Comma separated)</label>
                <input
                  type="text"
                  value={newDriveCompanies}
                  onChange={(e) => setNewDriveCompanies(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/30 transition"
              >
                Schedule Placement Drive
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// -------------------------------------------------------------
// RECRUITER DASHBOARD
// -------------------------------------------------------------
function RecruiterDashboard({ tab, token, showToast }) {
  const [postings, setPostings] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [candidateData, setCandidateData] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [targetAppForFeedback, setTargetAppForFeedback] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");

  const [newTitle, setNewTitle] = useState("");
  const [newJobType, setNewJobType] = useState("internship");
  const [newDesc, setNewDesc] = useState("");
  const [newSkillsStr, setNewSkillsStr] = useState("Python, FastAPI, Docker, PostgreSQL");
  const [newStipend, setNewStipend] = useState("₹45,000 / month");
  const [newLocation, setNewLocation] = useState("Bengaluru (Hybrid)");

  const fetchPostings = () => {
    fetch(`${API_BASE}/api/recruiters/postings`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        setPostings(data);
        if (data.length > 0 && !selectedJobId) {
          setSelectedJobId(data[0].id);
        }
      })
      .catch(err => console.error(err));
  };

  const fetchCandidates = (jobId) => {
    if (!jobId) return;
    fetch(`${API_BASE}/api/recruiters/postings/${jobId}/candidates`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setCandidateData(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchPostings();
  }, [token]);

  useEffect(() => {
    if (selectedJobId) {
      fetchCandidates(selectedJobId);
    }
  }, [selectedJobId, token]);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      const skillsArray = newSkillsStr.split(",").map(s => s.trim()).filter(Boolean);
      const resp = await fetch(`${API_BASE}/api/recruiters/postings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: newTitle,
          job_type: newJobType,
          description: newDesc,
          required_skills: skillsArray,
          stipend_or_ctc: newStipend,
          location: newLocation
        })
      });
      if (!resp.ok) throw new Error("Failed to create posting");
      showToast("Job posting published successfully!");
      setShowCreateModal(false);
      fetchPostings();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleUpdateStatus = async (appId, newStatus) => {
    try {
      const resp = await fetch(`${API_BASE}/api/recruiters/applications/${appId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (!resp.ok) throw new Error("Status update failed");
      showToast(`Candidate moved to '${newStatus.toUpperCase()}' stage.`);
      fetchCandidates(selectedJobId);
      fetchPostings();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!targetAppForFeedback) return;
    try {
      const resp = await fetch(`${API_BASE}/api/recruiters/applications/${targetAppForFeedback}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating: feedbackRating, match_accuracy_comment: feedbackComment })
      });
      if (!resp.ok) throw new Error("Failed to submit feedback");
      showToast("Post-hire skill accuracy rating recorded!");
      setShowFeedbackModal(false);
      fetchCandidates(selectedJobId);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  if (tab === "postings") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">My Active Postings & Hiring Pipelines</h2>
            <p className="text-xs text-slate-400">Manage open roles and monitor candidate conversion across recruitment stages</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition"
          >
            + Post New Internship / Role
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {postings.map(job => (
            <div key={job.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase text-indigo-400">{job.company_name}</span>
                    <h3 className="text-lg font-bold text-white mt-0.5">{job.title}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold uppercase bg-slate-800 text-slate-300">
                    {job.job_type}
                  </span>
                </div>

                <div className="mt-2 text-xs text-slate-400 flex items-center space-x-3">
                  <span>📍 {job.location}</span>
                  <span>💰 {job.stipend_or_ctc}</span>
                  <span>👥 {job.total_applicants} Candidates</span>
                </div>

                <div className="mt-4 grid grid-cols-5 gap-1 text-center text-[10px]">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block">Applied</span>
                    <span className="text-white font-bold text-xs">{job.pipeline_counts.applied}</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-purple-300 block">Shortlist</span>
                    <span className="text-white font-bold text-xs">{job.pipeline_counts.shortlisted}</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-blue-300 block">Interview</span>
                    <span className="text-white font-bold text-xs">{job.pipeline_counts.interview}</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-emerald-300 block">Offers</span>
                    <span className="text-white font-bold text-xs">{job.pipeline_counts.offer}</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block">Closed</span>
                    <span className="text-white font-bold text-xs">{job.pipeline_counts.closed}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Created: {new Date(job.created_at).toLocaleDateString()}</span>
                <span className="text-xs font-bold text-indigo-400">
                  Select in Candidates Tab ↗
                </span>
              </div>
            </div>
          ))}
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Post New Internship or Job</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleCreateJob} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Position Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. AI / Machine Learning Engineer"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Employment Type</label>
                    <select
                      value={newJobType}
                      onChange={(e) => setNewJobType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                    >
                      <option value="internship">Internship</option>
                      <option value="full_time">Full-Time (Graduate)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Stipend / CTC</label>
                    <input
                      type="text"
                      value={newStipend}
                      onChange={(e) => setNewStipend(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Required Skills (Comma separated)</label>
                  <input
                    type="text"
                    value={newSkillsStr}
                    onChange={(e) => setNewSkillsStr(e.target.value)}
                    placeholder="e.g. Python, Docker, PyTorch"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Location</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Job Description</label>
                  <textarea
                    rows="3"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Brief description of responsibilities and technical expectations..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                    required
                  ></textarea>
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md"
                  >
                    Publish Posting
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (tab === "candidates") {
    return (
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Ranked Candidate Matching Engine</h2>
            <p className="text-xs text-slate-400">
              Candidates sorted by AI cosine similarity & verified competency overlap score
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Position:</span>
            <select
              value={selectedJobId || ""}
              onChange={(e) => setSelectedJobId(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 outline-none"
            >
              {postings.map(j => (
                <option key={j.id} value={j.id}>{j.title} ({j.total_applicants} applicants)</option>
              ))}
            </select>
          </div>
        </div>

        {candidateData && candidateData.candidates.length > 0 ? (
          <div className="space-y-4">
            {candidateData.candidates.map((cand, idx) => (
              <div key={cand.application_id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-indigo-950/80 border border-indigo-700 text-center">
                      <span className="text-lg font-black text-white leading-none">{cand.match_score}%</span>
                      <span className="text-[9px] uppercase font-bold text-indigo-300 mt-0.5">Match</span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-500 font-bold">#{idx + 1}</span>
                        <h3 className="text-base font-bold text-white">{cand.candidate_name}</h3>
                        <span className="text-xs text-slate-400">({cand.college_name})</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {cand.branch} • CGPA: <strong className="text-white">{cand.cgpa}</strong> • Batch of {cand.graduation_year}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    {["shortlisted", "interview", "offer", "closed"].map(st => (
                      <button
                        key={st}
                        onClick={() => handleUpdateStatus(cand.application_id, st)}
                        className={`px-3 py-1.5 rounded-lg font-semibold uppercase text-[10px] tracking-wider transition ${
                          cand.status === st
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400"
                            : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        {st}
                      </button>
                    ))}

                    <button
                      onClick={() => {
                        setTargetAppForFeedback(cand.application_id);
                        setShowFeedbackModal(true);
                      }}
                      className="px-2.5 py-1.5 bg-amber-950 border border-amber-700 text-amber-300 hover:bg-amber-900 rounded-lg font-bold text-[10px] tracking-wider"
                      title="Submit Post-Hire Skill Accuracy Feedback"
                    >
                      ⭐ Rate Match
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-slate-300">💡 Why Matched:</span>
                    <span className="text-slate-400 text-[11px]">{cand.match_breakdown.explanation}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-slate-500 text-[11px] mr-1">Matched Skills:</span>
                    {cand.match_breakdown.matched_skills && cand.match_breakdown.matched_skills.map((ms, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-700 text-emerald-300 text-[11px] flex items-center space-x-1">
                        <span>{ms.skill}</span>
                        {ms.endorsed && <span title="Faculty Verified">🛡️</span>}
                      </span>
                    ))}

                    {cand.match_breakdown.missing_skills && cand.match_breakdown.missing_skills.length > 0 && (
                      <>
                        <span className="text-slate-500 text-[11px] ml-2 mr-1">Missing:</span>
                        {cand.match_breakdown.missing_skills.map((ms, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-rose-950/50 border border-rose-800 text-rose-300 text-[11px]">
                            {ms.skill}
                          </span>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                {cand.hiring_feedback && (
                  <div className="text-xs bg-amber-950/30 border border-amber-900/60 rounded-xl p-2.5 flex items-center justify-between text-amber-200">
                    <span>Recruiter Skill Match Rating: {"★".repeat(cand.hiring_feedback.rating)}{"☆".repeat(5 - cand.hiring_feedback.rating)}</span>
                    <span className="italic text-slate-400">"{cand.hiring_feedback.comment}"</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
            No candidates have applied to this posting yet.
          </div>
        )}

        {showFeedbackModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-white">Post-Hire Skill Match Accuracy Rating</h3>
              <p className="text-xs text-slate-400">
                Log recruiter feedback to refine future AI skill mapping and validation weights.
              </p>

              <form onSubmit={handleSubmitFeedback} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1">Score Accuracy (1 to 5 Stars)</label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setFeedbackRating(star)}
                        className={`text-xl ${star <= feedbackRating ? "text-amber-400" : "text-slate-700"}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Evaluator Notes</label>
                  <textarea
                    rows="3"
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Candidate live coding performance was completely aligned with the 92% match score..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                    required
                  ></textarea>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowFeedbackModal(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl"
                  >
                    Save Rating
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

// -------------------------------------------------------------
// NATIONAL ADMIN DASHBOARD
// -------------------------------------------------------------
function AdminDashboard({ tab, token, showToast }) {
  const [metrics, setMetrics] = useState(null);
  const [skillTrends, setSkillTrends] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/admin/metrics`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setMetrics(data))
      .catch(err => console.error(err));

    fetch(`${API_BASE}/api/admin/skill-trends`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setSkillTrends(data))
      .catch(err => console.error(err));
  }, [token]);

  const handleDownloadReport = () => {
    window.location.href = `${API_BASE}/api/admin/export-report`;
    showToast("Generating and downloading official AICTE Placement CSV Report...");
  };

  if (tab === "national_overview") {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">National Placement Rate</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-emerald-400">{metrics ? metrics.kpis.national_placement_rate : "82.5"}%</span>
              <span className="text-xs text-emerald-400 font-semibold">Verified Placements</span>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Active Students</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-white">{metrics ? metrics.kpis.total_students : 0}</span>
              <span className="text-xs text-slate-400">Skill Mapped</span>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Partner Institutions</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-indigo-400">{metrics ? metrics.kpis.total_institutions : 0}</span>
              <span className="text-xs text-indigo-300">IITs, NITs, State Unis</span>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recruiting Enterprises</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-amber-400">{metrics ? metrics.kpis.total_companies : 0}</span>
              <span className="text-xs text-amber-500 font-medium">Hiring Active</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">National Skill Demand vs Academic Supply</h3>
              <p className="text-xs text-slate-400">Comparison across top engineering competencies across India</p>
            </div>
            <button
              onClick={handleDownloadReport}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-md transition"
            >
              📥 Export CSV Report
            </button>
          </div>

          <div className="space-y-4">
            {skillTrends.map((st, idx) => (
              <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-sm">{st.skill}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                      {st.growth_yoy} YoY
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-slate-400">
                    <span>Industry Demand: <strong className="text-indigo-400">{st.industry_demand}%</strong></span>
                    <span>Student Supply: <strong className="text-cyan-400">{st.student_supply}%</strong></span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden flex">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${st.industry_demand}%` }} title="Industry Demand"></div>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden flex">
                    <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${st.student_supply}%` }} title="Student Supply"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (tab === "reports") {
    return (
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-white">National Placement & Accreditation Reports</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Compliant with Smart India Hackathon 2026 data standards and AICTE cohort review guidelines
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl text-center max-w-xl mx-auto space-y-4">
          <div className="text-4xl">📊</div>
          <h3 className="text-lg font-bold text-white">Full Cohort Skill Mapping & Placement Report</h3>
          <p className="text-xs text-slate-400">
            Includes verified vs unverified skill tallies, application stage distribution, institutional performance metrics, and student placement audits.
          </p>
          <button
            onClick={handleDownloadReport}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/30 transition inline-flex items-center space-x-2"
          >
            <span>📥 Download Official CSV Report</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
