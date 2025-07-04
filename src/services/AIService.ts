import { OpenAI } from 'openai';

export class AIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async extractResumeContent(file: File): Promise<string> {
    // Simulate resume content extraction
    // In a real implementation, this would use OCR or PDF parsing
    return 'Resume content extracted...';
  }

  async analyzeResume(
    requirements: string,
    resumeContent: string,
    maxStrengths: number,
    maxAreasForImprovement: number
  ): Promise<any> {
    const prompt = `Analyze the resume against the job requirements.
    Requirements: ${requirements}
    Resume: ${resumeContent}
    
    Return a JSON object with:
    - matchScore (0-100)
    - strengths (top ${maxStrengths} relevant points)
    - areasForImprovement (top ${maxAreasForImprovement} relevant points)`;

    const completion = await this.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    return JSON.parse(completion.choices[0].message.content);
  }

  async generateInterviewQuestions(
    requirements: string,
    resumeContent: string
  ): Promise<string[]> {
    const prompt = `Generate interview questions based on the job requirements and resume.
    Requirements: ${requirements}
    Resume: ${resumeContent}
    
    Return a JSON array of 5 relevant interview questions`;

    const completion = await this.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    return JSON.parse(completion.choices[0].message.content);
  }
}
