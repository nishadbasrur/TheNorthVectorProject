// North Vector — Mock data layer
// Replace with real DB queries when database is wired up.

export const mockUser = {
  name: "Nishad",
  fullName: "Nishad Basrur",
  role: "Pre-Med · UConn 2029",
  weekScore: 84,
  streakDays: 12,
};

export const mockGoals = [
  {
    id: "g1",
    title: "Maintain 3.9+ GPA",
    horizon: "long",
    status: "active",
    progress: 0,
    description: "Academic excellence throughout undergraduate career at UConn.",
    targetDate: "May 2029",
    keyResults: ["Complete Gen Chem with A", "Join PNB honors track", "Establish study schedule"],
    risk: "medium",
  },
  {
    id: "g2",
    title: "Match into Orthopedic Surgery",
    horizon: "long",
    status: "active",
    progress: 5,
    description: "Long-range objective anchoring all academic and clinical decisions.",
    targetDate: "2033",
    keyResults: ["MCAT 520+", "3 research publications", "250+ clinical hours"],
    risk: "low",
  },
  {
    id: "g3",
    title: "Launch North Vector v1",
    horizon: "mid",
    status: "active",
    progress: 38,
    description: "Build and deploy personal Chief of Staff operating system.",
    targetDate: "Sep 2025",
    keyResults: ["Design system complete", "Dashboard live", "Core data model wired"],
    risk: "low",
  },
  {
    id: "g4",
    title: "EMT Certification",
    horizon: "now",
    status: "active",
    progress: 62,
    description: "Complete National Registry EMT certification before fall semester.",
    targetDate: "Aug 15, 2025",
    keyResults: ["Finish NREMT prep course", "Pass skills check-off", "Pass written exam"],
    risk: "medium",
  },
  {
    id: "g5",
    title: "Graduate Debt-Free",
    horizon: "long",
    status: "active",
    progress: 10,
    description: "Exit UConn without student loan debt through scholarships and ArbScore income.",
    targetDate: "May 2029",
    keyResults: ["ArbScore profitable Q4 2025", "Apply to 5 scholarships/yr", "NEBHE discount maintained"],
    risk: "medium",
  },
];

export const mockProjects = [
  {
    id: "p1",
    title: "North Vector",
    description: "Personal Chief of Staff OS — design, build, deploy.",
    status: "active",
    progress: 38,
    goalId: "g3",
    goalTitle: "Launch North Vector v1",
    taskCount: 12,
    doneCount: 5,
    nextMilestone: "Dashboard UI complete",
    lastActivity: "2 hours ago",
    tags: ["tech", "build"],
  },
  {
    id: "p2",
    title: "ArbScore",
    description: "Depop → eBay arbitrage platform. Firebase + Chrome extension.",
    status: "active",
    progress: 71,
    goalId: "g5",
    goalTitle: "Graduate Debt-Free",
    taskCount: 9,
    doneCount: 6,
    nextMilestone: "Cloud Run scout stable",
    lastActivity: "1 day ago",
    tags: ["tech", "revenue"],
  },
  {
    id: "p3",
    title: "EMT Onboarding",
    description: "National Registry prep, skills check-offs, written exam.",
    status: "active",
    progress: 62,
    goalId: "g4",
    goalTitle: "EMT Certification",
    taskCount: 8,
    doneCount: 5,
    nextMilestone: "Skills check-off session",
    lastActivity: "3 days ago",
    tags: ["clinical", "cert"],
  },
  {
    id: "p4",
    title: "UConn Fall Prep",
    description: "Chemistry tutoring, course registration, dorm setup.",
    status: "active",
    progress: 55,
    goalId: "g1",
    goalTitle: "Maintain 3.9+ GPA",
    taskCount: 14,
    doneCount: 8,
    nextMilestone: "First tutoring session",
    lastActivity: "5 days ago",
    tags: ["academic", "logistics"],
  },
  {
    id: "p5",
    title: "Premed Roadmap",
    description: "MCAT timeline, shadowing hours, research track planning.",
    status: "planning",
    progress: 12,
    goalId: "g2",
    goalTitle: "Match into Orthopedic Surgery",
    taskCount: 6,
    doneCount: 1,
    nextMilestone: "Shadow physician contact",
    lastActivity: "1 week ago",
    tags: ["academic", "clinical"],
  },
];

export const mockTasks = [
  { id: "t1", title: "Complete NREMT Chapter 7 — Airway Management", projectId: "p3", projectTitle: "EMT Onboarding", dueDate: "Jun 15", priority: "high", status: "open", tags: ["clinical"] },
  { id: "t2", title: "Email Dr. Bala — confirm July tutoring session", projectId: "p4", projectTitle: "UConn Fall Prep", dueDate: "Jun 14", priority: "high", status: "open", tags: ["academic"] },
  { id: "t3", title: "Fix ArbScore Cloud Run scout — Depop DOM change", projectId: "p2", projectTitle: "ArbScore", dueDate: "Jun 16", priority: "high", status: "open", tags: ["tech"] },
  { id: "t4", title: "Build North Vector dashboard page", projectId: "p1", projectTitle: "North Vector", dueDate: "Jun 17", priority: "medium", status: "done", tags: ["tech"] },
  { id: "t5", title: "Book Italy train — Florence to Rome", projectId: null, projectTitle: null, dueDate: "Jun 18", priority: "medium", status: "open", tags: ["travel"] },
  { id: "t6", title: "Review PNB course requirements for Fall 2025", projectId: "p4", projectTitle: "UConn Fall Prep", dueDate: "Jun 20", priority: "medium", status: "open", tags: ["academic"] },
  { id: "t7", title: "Khan Academy — Pre-calculus Module 3", projectId: "p4", projectTitle: "UConn Fall Prep", dueDate: "Jun 21", priority: "medium", status: "open", tags: ["academic"] },
  { id: "t8", title: "Submit ArbScore eBay API rate limit ticket", projectId: "p2", projectTitle: "ArbScore", dueDate: "Jun 22", priority: "low", status: "open", tags: ["tech"] },
  { id: "t9", title: "Identify orthopedic surgeon to shadow — reach out", projectId: "p5", projectTitle: "Premed Roadmap", dueDate: "Jun 28", priority: "medium", status: "open", tags: ["clinical"] },
  { id: "t10", title: "Write North Vector mock data layer", projectId: "p1", projectTitle: "North Vector", dueDate: "Jun 14", priority: "high", status: "done", tags: ["tech"] },
];

export const mockRisks = [
  { id: "r1", title: "Chemistry placement — Gen Chem sequence at risk", severity: "high", domain: "Academic", note: "Scored 110/150 on placement. Borderline for accelerated track. Tutoring begins July." },
  { id: "r2", title: "ArbScore Depop scraper fragile post-DOM change", severity: "medium", domain: "Tech", note: "Scout failed overnight run June 12. Puppeteer selectors need patching." },
  { id: "r3", title: "EMT certification timeline tight for Aug 15 deadline", severity: "medium", domain: "Clinical", note: "3 modules and skills check-off remain. 9 weeks available." },
  { id: "r4", title: "Italy trip bookings unconfirmed — summer window narrows", severity: "low", domain: "Personal", note: "Train and hotel TBD for Florence-Rome leg. Book by June 18." },
];

export const mockDecisions = [
  { id: "d1", title: "Pursue FastTrack MPH alongside premed?", status: "open", domain: "Academic", openedDate: "Jun 1", context: "UConn offers dual-degree. Explore sophomore year when load is clearer." },
  { id: "d2", title: "ArbScore: scale to Poshmark or stay Depop-only?", status: "open", domain: "Tech", openedDate: "Jun 8", context: "Revenue plateau at ~$400/mo. Poshmark expansion adds complexity." },
  { id: "d3", title: "Shadowing: orthopedic vs. general surgery first?", status: "open", domain: "Clinical", openedDate: "Jun 10", context: "Specialty shadowing harder to secure. Gen surgery may be better foot-in-door." },
  { id: "d4", title: "Skyhawks vs. other summer income source", status: "resolved", domain: "Personal", openedDate: "May 15", context: "Chose ArbScore scaling over Skyhawks. Higher ceiling, flexible hours." },
];

export const mockMemories = [
  { id: "m1", type: "insight", emoji: "🎓", title: "UConn institutional email required for responses", content: "Gmail gets ignored. Always use mmw25001@uconn.edu for faculty outreach.", date: "Jun 5", tags: ["academic", "UConn"] },
  { id: "m2", type: "fact", emoji: "🧪", title: "Chemistry Placement: 110/150", content: "Passed threshold (~90). Borderline for accelerated section. Tutoring with Dr. Bala starts July.", date: "Jun 3", tags: ["academic", "chemistry"] },
  { id: "m3", type: "insight", emoji: "⚙️", title: "Depop DOM structure changed — scout broke", content: "Puppeteer selectors need update after June 12 Depop frontend deploy. Brittle architecture.", date: "Jun 12", tags: ["tech", "ArbScore"] },
  { id: "m4", type: "fact", emoji: "📐", title: "Math placement: 76%", content: "Plans to self-study pre-calculus via Khan Academy before Gen Chem sequence.", date: "Jun 3", tags: ["academic", "math"] },
  { id: "m5", type: "lesson", emoji: "💡", title: "FastTrack MPH — table until sophomore year", content: "Not worth evaluating dual-degree until load and GPA baseline are known.", date: "Jun 1", tags: ["academic", "planning"] },
  { id: "m6", type: "contact", emoji: "👨‍🔬", title: "Dr. Bala — Wyzant chemistry tutor", content: "Franklin, CT. $80/hr. Sessions at public library midway. Starting July.", date: "May 28", tags: ["academic", "contacts"] },
];

export const mockCountdowns = [
  { label: "UConn Move-In", days: 78, urgency: "medium" },
  { label: "EMT Deadline", days: 63, urgency: "high" },
  { label: "Italy Trip", days: 22, urgency: "low" },
];

export const mockWeeklyReview = {
  weekOf: "June 9–15, 2025",
  score: 84,
  completedTasks: 8,
  totalTasks: 11,
  wins: [
    "North Vector scaffold moved from empty repo to running application",
    "ArbScore Cloud Run deployment stable — nightly scout running",
    "Confirmed Dr. Bala tutoring arrangement for July",
  ],
  misses: [
    "Depop scout broke after June 12 DOM change — not patched yet",
    "Italy train booking still unscheduled",
    "Khan Academy pre-calc modules behind schedule",
  ],
  insights: [
    "Tech work is consuming time that should go to EMT prep — rebalance next week",
    "Weekly score up from 71 to 84 — momentum building",
  ],
  nextWeekPriorities: [
    "Patch ArbScore scout before Friday",
    "Complete EMT Chapters 7 & 8",
    "Book Florence-Rome train",
    "Email Dr. Bala to confirm July date",
  ],
};
