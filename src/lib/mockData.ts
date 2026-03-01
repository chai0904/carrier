import { Application, Assessment, Candidate, MessageThread, InterviewQuestion } from "@/types";

export const MOCK_CANDIDATE: Candidate = {
  id: "cand_001",
  name: "Arjun Mehta",
  email: "arjun.mehta@email.com",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=arjun",
  skills: ["React", "TypeScript", "Node.js", "PostgreSQL", "AWS", "Figma"],
  resumeUrl: null,
  resumeText: "",
  profileCompleteness: 72,
};

export const MOCK_APPLICATIONS: Application[] = [
  {
    id: "app_001",
    companyName: "Razorpay",
    companyLogo: "https://logo.clearbit.com/razorpay.com",
    role: "Senior Frontend Engineer",
    location: "Bangalore, India",
    salary: "₹24L – ₹35L",
    appliedDate: "2024-01-15",
    status: "interview_scheduled",
    currentStage: 3,
    totalStages: 5,
    stages: [
      { name: "Application", status: "completed", date: "2024-01-15", note: "Applied via LinkedIn" },
      { name: "Resume Screen", status: "completed", date: "2024-01-18", note: "Shortlisted by recruiter" },
      { name: "Technical Assessment", status: "completed", date: "2024-01-22", note: "Score: 87/100" },
      { name: "Technical Interview", status: "active", date: "2024-01-28", note: "Scheduled for 3:00 PM" },
      { name: "Final Round", status: "pending", date: null, note: null },
    ],
    recruiterName: "Priya Sharma",
    recruiterEmail: "priya.s@razorpay.com",
    jobDescription: "We're looking for a Senior Frontend Engineer to join our Payments team. You'll build high-performance, accessible UIs used by millions of merchants. Must have 3+ years React experience.",
    assessmentScore: 87,
    assessmentCompleted: true,
    nextAction: "Interview on Jan 28 at 3:00 PM",
    aiInsight: "Your React expertise strongly matches this role. Prepare for system design questions around payment flows.",
  },
  {
    id: "app_002",
    companyName: "Zepto",
    companyLogo: "https://logo.clearbit.com/zeptonow.com",
    role: "Full Stack Developer",
    location: "Mumbai, India (Remote OK)",
    salary: "₹18L – ₹28L",
    appliedDate: "2024-01-20",
    status: "assessment",
    currentStage: 2,
    totalStages: 4,
    stages: [
      { name: "Application", status: "completed", date: "2024-01-20", note: null },
      { name: "Online Assessment", status: "active", date: "2024-01-30", note: "Due in 3 days" },
      { name: "Technical Interview", status: "pending", date: null, note: null },
      { name: "HR Round", status: "pending", date: null, note: null },
    ],
    recruiterName: "Rahul Gupta",
    recruiterEmail: "rahul.g@zepto.com",
    jobDescription: "Join Zepto's engineering team building real-time inventory and delivery systems. Fullstack role with Node.js + React.",
    assessmentScore: null,
    assessmentCompleted: false,
    nextAction: "Complete assessment by Jan 30",
    aiInsight: "Focus on your Node.js and real-time systems experience. Zepto values speed and scale.",
  },
  {
    id: "app_003",
    companyName: "CRED",
    companyLogo: "https://logo.clearbit.com/cred.club",
    role: "Product Engineer",
    location: "Bangalore, India",
    salary: "₹30L – ₹45L",
    appliedDate: "2024-01-10",
    status: "rejected",
    currentStage: 2,
    totalStages: 4,
    stages: [
      { name: "Application", status: "completed", date: "2024-01-10", note: null },
      { name: "Resume Screen", status: "rejected", date: "2024-01-14", note: "Did not match seniority requirements" },
      { name: "Technical Assessment", status: "skipped", date: null, note: null },
      { name: "Interview", status: "skipped", date: null, note: null },
    ],
    recruiterName: "Ananya Singh",
    recruiterEmail: "ananya.s@cred.club",
    jobDescription: "CRED is looking for senior engineers with 5+ years of experience in building consumer-facing products at scale.",
    assessmentScore: null,
    assessmentCompleted: false,
    nextAction: null,
    aiInsight: "CRED typically requires 5+ years. Build 12-18 more months of experience. Consider applying again.",
  },
];

export const MOCK_ASSESSMENTS: Assessment[] = [
  {
    id: "assess_001",
    applicationId: "app_002",
    title: "Full Stack Developer Assessment",
    company: "Zepto",
    duration: 90,
    questionCount: 25,
    status: "pending",
    dueDate: "2024-01-30",
    topics: ["JavaScript", "Node.js", "System Design", "SQL"],
    difficulty: "Medium",
  },
];

export const MOCK_MESSAGES: MessageThread[] = [
  {
    id: "msg_001",
    applicationId: "app_001",
    recruiterName: "Priya Sharma",
    recruiterAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=priya",
    company: "Razorpay",
    messages: [
      { id: "m1", from: "recruiter", text: "Hi Arjun! Congratulations on clearing the technical assessment. We'd love to schedule your technical interview.", timestamp: "2024-01-23T10:30:00Z" },
      { id: "m2", from: "candidate", text: "Thank you Priya! I'm really excited about this opportunity. January 28th at 3 PM works perfectly for me.", timestamp: "2024-01-23T11:15:00Z" },
      { id: "m3", from: "recruiter", text: "Perfect! I've sent a calendar invite. The interview will be with our Principal Engineer, Vikram. It'll be a 60-minute technical round. Best of luck!", timestamp: "2024-01-23T11:45:00Z" },
    ],
    unread: 0,
  },
];

export const MOCK_INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  { id: 1, category: "Technical", difficulty: "Hard", question: "Explain how you'd design a real-time payment status dashboard that handles millions of concurrent users.", coachingTip: "Use the STAR method. Focus on WebSocket connections, load balancing, and caching strategies.", exampleAnswer: "I would architect this using WebSocket connections for real-time updates, with a Redis pub/sub layer for horizontal scaling..." },
  { id: 2, category: "Behavioral", difficulty: "Medium", question: "Tell me about a time you had to push back on a product requirement. How did you handle it?", coachingTip: "Show diplomatic communication skills. Emphasize data-driven decision making.", exampleAnswer: "At my previous role, the PM wanted to ship a feature without proper error handling..." },
  { id: 3, category: "Technical", difficulty: "Medium", question: "How would you optimize a React application that's experiencing slow renders with large lists?", coachingTip: "Mention virtualization, React.memo, useMemo, useCallback, and profiling tools.", exampleAnswer: "I'd start by profiling with React DevTools to identify unnecessary re-renders..." },
  { id: 4, category: "Situational", difficulty: "Medium", question: "You discover a critical bug in production on a Friday evening. What's your approach?", coachingTip: "Show ownership and structured incident response. Mention communication and rollback strategies.", exampleAnswer: "First, I'd assess the impact scope and severity. If it affects payments..." },
  { id: 5, category: "Culture-Fit", difficulty: "Easy", question: "What excites you most about working on payment infrastructure?", coachingTip: "Be genuine. Connect your personal motivation to the company's mission.", exampleAnswer: "Payment systems sit at the intersection of engineering complexity and real-world impact..." },
  { id: 6, category: "Technical", difficulty: "Hard", question: "Walk me through how you'd implement optimistic updates in a React application with eventual consistency.", coachingTip: "Discuss state management, rollback strategies, and conflict resolution.", exampleAnswer: "Optimistic updates involve immediately reflecting changes in the UI before server confirmation..." },
];

export const DEMO_AI_RESPONSES = {
  resumeTailor: {
    matchScore: 82,
    matchSummary: "Strong alignment with the role's React and TypeScript requirements. Your backend experience adds versatility that could set you apart.",
    suggestions: [
      { section: "Experience", current: "Built React components", improved: "Architected and shipped 15+ high-performance React components serving 2M+ daily active users", reason: "Quantify impact and scale to match senior-level expectations" },
      { section: "Skills", current: "JavaScript, React", improved: "React 18, TypeScript, Next.js, Performance Optimization, Web Vitals", reason: "Use specific, modern terminology that matches the JD" },
    ],
    keywordsToAdd: ["payment flows", "merchant dashboard", "accessibility", "performance optimization"],
    strengthsToHighlight: ["React expertise", "TypeScript proficiency", "Full-stack capability"],
  },
  copilotResponses: [
    "Based on your application to Razorpay, I'd recommend focusing on system design for payment flows. Their interviews typically cover idempotency, retry mechanisms, and real-time dashboards.",
    "Your resume shows strong React skills. For the Zepto assessment, brush up on Node.js event loops and SQL query optimization — those are their most common topics.",
    "The CRED rejection was at resume screening, likely due to years of experience. Their JD requires 5+ years. Focus on building depth in your current role for the next year.",
    "Great question! For your Razorpay interview, practice explaining your thought process out loud. They value clear communication as much as technical ability.",
  ],
};
