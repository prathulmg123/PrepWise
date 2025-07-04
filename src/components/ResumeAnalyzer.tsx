import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaTimesCircle, FaRobot } from 'react-icons/fa';
import { IoAnalyticsOutline, IoCloseOutline } from 'react-icons/io5';
import { AIService } from '@/services/aiService';
import Modal from '@/components/Modal';

interface ResumeAnalyzerProps {
  requirements: string;
  resumeFile: File | null;
  onAnalysisComplete: (analysis: any) => void;
  triggerAnalysis: boolean;
  onAnalysisModalClose: () => void;
}

const ResumeAnalyzer: React.FC<ResumeAnalyzerProps> = ({ requirements, resumeFile, onAnalysisComplete, triggerAnalysis, onAnalysisModalClose }) => {
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [hasTriggeredAnalysis, setHasTriggeredAnalysis] = useState(false);

  useEffect(() => {
    if (triggerAnalysis && !hasTriggeredAnalysis) {
      setHasTriggeredAnalysis(true);
      const analyzeResume = async () => {
        if (!resumeFile) return;

        setIsLoading(true);
        try {
          // Extract content from resume
          const resumeContent = await AIService.extractResumeContent(resumeFile);
          
          // Analyze with AI service - with retry logic
          const analysis = await AIService.analyzeResume(requirements, resumeContent, 3, 1000);
          
          // Generate interview questions based on analysis - with retry logic
          const interviewQuestions = await AIService.generateInterviewQuestions(requirements, resumeContent);
          
          setAnalysisResults({
            ...analysis,
            interviewQuestions
          });
          
          onAnalysisComplete({
            ...analysis,
            interviewQuestions
          });
          
          // Close the current modal and open analysis modal
          onAnalysisModalClose();
          setShowAnalysisModal(true);
        } catch (error) {
          console.error('Error analyzing resume:', error);
          // Show error message in the UI
          setAnalysisResults({
            error: error instanceof Error ? error.message : 'Failed to analyze resume'
          });
          onAnalysisModalClose();
          setShowAnalysisModal(true);
        } finally {
          setIsLoading(false);
        }
      };

      analyzeResume();
    }
  }, [triggerAnalysis, resumeFile, requirements, onAnalysisComplete, onAnalysisModalClose]);

  return (
    <Modal isOpen={showAnalysisModal} onClose={() => setShowAnalysisModal(false)}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-300">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">
            <IoAnalyticsOutline className="w-6 h-6 text-[#5B2EC4] mr-2" />
            Resume Analysis Results
          </h3>
          <button 
            onClick={() => setShowAnalysisModal(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <IoCloseOutline className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5B2EC4]" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              {Object.entries(analysisResults || {}).map(([key, value]) => (
                <div key={key} className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold">{key}</h4>
                  <p className="mt-2">{typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}</p>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <button
                onClick={() => {
                  console.log('Starting AI interview with analysis:', analysisResults);
                  onAnalysisComplete(analysisResults);
                }}
                className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-[#814EE7] to-[#5B2EC4] text-white hover:shadow-lg transition-all flex items-center justify-center gap-3"
              >
                <FaRobot className="w-5 h-5" />
                Start AI Interview
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ResumeAnalyzer;
