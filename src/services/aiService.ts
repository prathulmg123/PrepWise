import { GoogleGenerativeAI } from '@google/generative-ai';

interface AIAnalysisResponse {
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
    difficulty: string;
    category: string;
  }>;
}

export class AIService {
  private static gemini = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
  private static model = this.gemini.getGenerativeModel({ model: 'gemini-2.0-flash' });

  static async analyzeResume(requirements: string, resumeContent: string): Promise<AIAnalysisResponse> {
    try {
      const prompt = `
        Analyze the following resume content against the job requirements:
        
        Job Requirements:
        ${requirements}
        
        Resume Content:
        ${resumeContent}
        
        Please provide a detailed analysis including:
        1. Match Score (0-100)
        2. Skills Match (list of required skills with boolean match)
        3. Experience Match (list of required experience with boolean match)
        4. Relevant Projects (with technologies, match score, and description)
        5. Recommendations for improvement
        6. Interview Questions (with difficulty and category)
        
        Format the response as JSON:
        {
          "matchScore": number,
          "skillsMatch": { "skill": boolean },
          "experienceMatch": { "experience": boolean },
          "projects": [...],
          "recommendations": [...],
          "interviewQuestions": [...]
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const json = JSON.parse(response.text());

      return json as AIAnalysisResponse;
    } catch (error) {
      console.error('Error in Gemini analysis:', error);
      throw error;
    }
  }

  static async extractResumeContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  }

  static async analyzeSkills(requirements: string, resumeContent: string): Promise<Record<string, boolean>> {
    const analysis = await this.analyzeResume(requirements, resumeContent);
    return analysis.skillsMatch;
  }

  static async generateInterviewQuestions(requirements: string, resumeContent: string): Promise<Array<{ question: string; difficulty: string; category: string }>> {
    const analysis = await this.analyzeResume(requirements, resumeContent);
    return analysis.interviewQuestions;
  }
}
