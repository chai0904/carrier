export type ApplicationStatus = "applied" | "screening" | "assessment" | "interview_scheduled" | "offer" | "rejected";
export type StageStatus = "completed" | "active" | "pending" | "rejected" | "skipped";

export interface Stage {
  name: string;
  status: StageStatus;
  date: string | null;
  note: string | null;
}

export interface Application {
  id: string;
  companyName: string;
  companyLogo: string;
  role: string;
  location: string;
  salary: string;
  appliedDate: string;
  status: ApplicationStatus;
  currentStage: number;
  totalStages: number;
  stages: Stage[];
  recruiterName: string;
  recruiterEmail: string;
  jobDescription: string;
  assessmentScore: number | null;
  assessmentCompleted: boolean;
  nextAction: string | null;
  aiInsight: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  avatar: string;
  skills: string[];
  resumeUrl: string | null;
  resumeText: string;
  profileCompleteness: number;
}

export interface ChatMessage {
  id: string;
  from: "recruiter" | "candidate";
  text: string;
  timestamp: string;
}

export interface MessageThread {
  id: string;
  applicationId: string;
  recruiterName: string;
  recruiterAvatar: string;
  company: string;
  messages: ChatMessage[];
  unread: number;
}

export interface Assessment {
  id: string;
  applicationId: string;
  title: string;
  company: string;
  duration: number;
  questionCount: number;
  status: "pending" | "in_progress" | "completed";
  dueDate: string;
  topics: string[];
  difficulty: "Easy" | "Medium" | "Hard";
}

export interface InterviewQuestion {
  id: number;
  category: "Technical" | "Behavioral" | "Situational" | "Culture-Fit";
  difficulty: "Easy" | "Medium" | "Hard";
  question: string;
  coachingTip: string;
  exampleAnswer: string;
}

export interface CopilotMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}
