export interface EmployeeData {
  resume: File | null;
  description: string;
}

export interface AIAnalysisResponse {
  matchScore: number;
  skillsMatch: Record<string, boolean>;
  experienceMatch: Record<string, boolean>;
  projects: Array<{
    name: string;
    technologies: string[];
    matchScore: number;
    description: string;
  }>;
  recommendations: string[];
  interviewQuestions: Array<{
    question: string;
    difficulty: 'easy' | 'medium' | 'hard';
    category: string;
  }>;
}
