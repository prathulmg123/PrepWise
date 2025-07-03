import { useState } from 'react';
import { FaCheckCircle, FaTimesCircle, FaRobot } from 'react-icons/fa';
import { IoAnalyticsOutline } from 'react-icons/io5';
import { AIService } from '@/services/aiService';

interface ResumeAnalyzerProps {
  requirements: string;
  resumeFile: File | null;
  onAnalysisComplete: (analysis: any) => void;
}

const ResumeAnalyzer: React.FC<ResumeAnalyzerProps> = ({ requirements, resumeFile, onAnalysisComplete }) => {
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const analyzeResume = async () => {
    if (!resumeFile) return;

    setIsLoading(true);
    try {
      // Extract content from resume
      const resumeContent = await AIService.extractResumeContent(resumeFile);
      
      // Analyze with AI service
      const analysis = await AIService.analyzeResume(requirements, resumeContent);
      
      // Generate interview questions based on analysis
      const interviewQuestions = await AIService.generateInterviewQuestions(requirements, resumeContent);
      
      setAnalysisResults({
        ...analysis,
        interviewQuestions
      });
      
      onAnalysisComplete({
        ...analysis,
        interviewQuestions
      });
    } catch (error) {
      console.error('Error analyzing resume:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6">
      <div className="bg-white rounded-xl p-6 shadow-md">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <IoAnalyticsOutline className="w-6 h-6 text-[#5B2EC4]" />
          Resume Analysis
        </h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5B2EC4]" />
          </div>
        ) : (
          analysisResults && (
            <>
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-500" />
                  <span className="font-medium">Match Score: {analysisResults.matchScore}%</span>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Skills Match</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(analysisResults.skillsMatch).map(([skill, matched]) => (
                      <div
                        key={skill}
                        className={`flex items-center gap-2 p-2 rounded-lg ${
                          matched ? 'bg-green-50' : 'bg-red-50'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full ${
                          matched ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <span>{skill}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Experience</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(analysisResults.experienceMatch).map(([exp, matched]) => (
                      <div
                        key={exp}
                        className={`flex items-center gap-2 p-2 rounded-lg ${
                          matched ? 'bg-green-50' : 'bg-red-50'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full ${
                          matched ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <span>{exp}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Projects</h4>
                  <div className="space-y-4">
                    {analysisResults.projects.map((project: any) => (
                      <div key={project.name} className="p-3 bg-gray-50 rounded-lg">
                        <h5 className="font-medium">{project.name}</h5>
                        <div className="flex items-center gap-2 mt-1">
                          {project.technologies.map((tech: string) => (
                            <span
                              key={tech}
                              className="px-2 py-1 bg-[#5B2EC4]/10 rounded-full text-sm"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-sm">Match Score:</span>
                          <div className="w-24 h-2 bg-gray-200 rounded-full">
                            <div
                              className="h-full bg-[#5B2EC4] rounded-full"
                              style={{ width: `${project.matchScore}%` }}
                            />
                          </div>
                          <span className="text-sm">{project.matchScore}%</span>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          {project.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">AI Recommendations</h4>
                  <div className="space-y-2">
                    {analysisResults.recommendations.map((rec: string, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <FaCheckCircle className="text-green-500" />
                        <span className="text-sm">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Interview Questions</h4>
                  <div className="space-y-4">
                    {analysisResults.interviewQuestions.map((question: any, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{question.question}</span>
                          <span className="text-sm text-gray-500">
                            {question.difficulty} • {question.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              // Implement question selection logic
                              console.log('Selected question:', question);
                            }}
                            className="px-3 py-1 rounded-full bg-[#5B2EC4]/10 text-sm text-[#5B2EC4] hover:bg-[#5B2EC4]/20 transition-colors"
                          >
                            Select
                          </button>
                          <button
                            onClick={() => {
                              // Implement question skip logic
                              console.log('Skipped question:', question);
                            }}
                            className="px-3 py-1 rounded-full bg-gray-100 text-sm text-gray-600 hover:bg-gray-200 transition-colors"
                          >
                            Skip
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => {
                    // Start AI interview with selected questions
                    console.log('Starting AI interview with analysis:', analysisResults);
                    onAnalysisComplete(analysisResults);
                  }}
                  className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-[#814EE7] to-[#5B2EC4] text-white hover:shadow-lg transition-all flex items-center justify-center gap-3"
                >
                  <FaRobot className="w-5 h-5" />
                  Start AI Interview
                </button>
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
};

export default ResumeAnalyzer;
