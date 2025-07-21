import React, { useState, useRef, useEffect } from 'react';
import { HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { Button } from '@/components/ui/button';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import { FaUpload, FaFilePdf, FaFile, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

interface SidebarItem {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
  path: string;
}

const Schedule: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<string>(location.pathname.split('/')[2]);
  const [sidebarItems] = useState<SidebarItem[]>([
    { id: 'dashboard', icon: FaUser, label: 'Dashboard', path: '/dashboard' },
    { id: 'schedule', icon: FaUpload, label: 'Schedule', path: '/schedule' },
    { id: 'logout', icon: FaSignOutAlt, label: 'Logout', path: '/logout' }
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [geminiResponse, setGeminiResponse] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [interviewQuestions, setInterviewQuestions] = useState<string[]>([]);

  const triggerFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
      const preview = URL.createObjectURL(file);
      setFilePreview(preview);
    }
  };
  useEffect(() => {
    console.log("isAnalyzing changed to:", isAnalyzing);
  }, [isAnalyzing]);
  
  // Function to extract interview questions from the Gemini response
  const extractInterviewQuestions = (response: string): string[] => {
    // This regex looks for numbered questions (1., 2., etc.) followed by the question text
    const questionRegex = /\n\s*\d+\.\s+(.+?)(?=\n\s*\d+\.|\n\s*$)/gs;
    const matches = [...response.matchAll(questionRegex)];
    
    if (matches.length > 0) {
      return matches.map(match => match[1].trim());
    }
    
    // Fallback: If no numbered questions found, try to split by question marks
    const fallbackQuestions = response
      .split('?')
      .filter(q => q.trim().length > 20) // Filter out short fragments
      .map(q => q.trim() + '?');
      
    return fallbackQuestions.length > 0 ? fallbackQuestions : [];
  };

  // Validate job description content
  const validateJobDescription = (description: string): { isValid: boolean; message: string } => {
    const trimmedDesc = description.trim();
    
    // Check minimum length
    if (trimmedDesc.length < 50) {
      return { 
        isValid: false, 
        message: "Job description is too short. Please provide more details about the position." 
      };
    }

    // Check for meaningful content (at least 3 words that are not too common)
    const words = trimmedDesc.split(/\s+/).filter(word => word.length > 3);
    const uniqueWords = new Set(words);
    
    if (uniqueWords.size < 5) {
      return {
        isValid: false,
        message: "Please provide a more detailed job description with specific requirements and responsibilities."
      };
    }

    // Check for common placeholder text
    const placeholders = [
      'enter job description',
      'paste job description',
      'job description here',
      'lorem ipsum',
      'sample text',
      'test description'
    ];

    const lowerDesc = trimmedDesc.toLowerCase();
    if (placeholders.some(placeholder => lowerDesc.includes(placeholder))) {
      return {
        isValid: false,
        message: "The job description appears to contain placeholder text. Please enter the actual job description."
      };
    }

    return { isValid: true, message: '' };
  };

  const handleAnalyze = async () => {
    // Basic validation
    if (!resumeFile) {
      alert("Please upload a resume file.");
      return;
    }

    if (!jobDescription.trim()) {
      alert("Please enter a job description.");
      return;
    }

    // Advanced job description validation
    const validation = validateJobDescription(jobDescription);
    if (!validation.isValid) {
      alert(validation.message);
      return;
    }
  
    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
  
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash",
            generationConfig: {
              temperature: 0.7,
              topP: 0.95,
              topK: 40,
              maxOutputTokens: 2048,
            },
            safetySettings: [
              {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
              },
              {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
              },
              {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
              },
              {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
              },
            ],
          });
          
          const prompt = `You are an intelligent HR assistant. Analyze the following job description and resume to provide a professional assessment.

Job Description:
${jobDescription}

Please provide:
1. A detailed analysis of the candidate's fit for this role
2. Key skills and experiences that match the job requirements
3. Any potential gaps or areas for development
4. 5 specific interview questions (each question should be 1-3 lines maximum, plain text with no symbols or special formatting)

Format your response with clear sections and numbered questions. Keep the questions simple, direct, and free of any symbols or special characters.`;
  
          const result = await model.generateContent({
            contents: [
              { 
                role: 'user', 
                parts: [{ 
                  text: prompt,
                }] 
              },
              {
                role: 'model',
                parts: [{
                  text: "I've received the job description. Please provide the resume for analysis."
                }]
              },
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      mimeType: 'application/pdf',
                      data: base64
                    }
                  }
                ]
              }
            ]
          });
  
          const geminiOutput = await result.response.text();
          
          // Additional validation of the response
          if (!geminiOutput || geminiOutput.trim().length < 100) {
            throw new Error("The response from the AI was incomplete or invalid.");
          }
          
          setGeminiResponse(geminiOutput);
          
          // Extract interview questions from the response
          const questions = extractInterviewQuestions(geminiOutput);
          if (questions.length === 0) {
            console.warn("No interview questions could be extracted from the response.");
          }
          setInterviewQuestions(questions);
        } catch (err) {
          console.error("Analysis failed:", err);
          alert(`Failed to analyze resume: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
          setIsAnalyzing(false);
        }
      };
  
      reader.onerror = () => {
        throw new Error("Failed to read the resume file. Please try again.");
      };
  
      reader.readAsDataURL(resumeFile);
    } catch (error) {
      console.error("Analysis process failed:", error);
      alert(`Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`);
      setIsAnalyzing(false);
    }
  };
  

  useEffect(() => {
    const handleTabChange = () => {
      setActiveTab(location.pathname.split('/')[2]);
    };
    window.addEventListener('popstate', handleTabChange);
    return () => window.removeEventListener('popstate', handleTabChange);
  }, [location.pathname]);

  const FullPageSpinner = () => (
      <div className="fixed inset-0 z-[9999] bg-white/70 flex items-center justify-center">

      <div className="flex flex-col items-center gap-4">
        <svg className="animate-spin h-10 w-10 text-[#5B2EC4]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        <p className="text-[#5B2EC4] font-medium text-lg">Analyzing Resume...</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] text-gray-800">
      <p>{isAnalyzing}</p>
      {isAnalyzing && <FullPageSpinner />}
      {/* <Sidebar activeItem={activeTab} items={sidebarItems} onLogout={() => navigate('/logout')} /> */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 pt-6">
          <h2 className="text-2xl font-bold mb-6">Upload Resume & Analyze</h2>
          <p className='text-black'>{isAnalyzing}</p>
          <div className="bg-white rounded-3xl shadow-md p-6">
            <div className="pb-6">
              <h3 className="text-lg font-semibold mb-2">Upload Resume</h3>
              <div className="border-2 border-dashed border-[#5B2EC4]/30 rounded-xl p-6 text-center">
                <FaFilePdf className="text-4xl text-[#5B2EC4] mx-auto mb-2" />
                <p className="text-gray-500">Drag & drop or upload your resume file</p>
                <Button onClick={triggerFileInput} className="mt-4 bg-gradient-to-r from-[#814EE7] to-[#5B2EC4] text-white">Upload</Button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />
                {resumeFile && (
                  <div className="mt-4 text-sm text-gray-600">
                    <strong>{resumeFile.name}</strong> - {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                )}
              </div>
            </div>
            <div className="pb-6">
              <h3 className="text-lg font-semibold mb-2">Job Description</h3>
              <textarea
                className="w-full p-4 border border-gray-200 rounded-xl h-40 resize-none"
                placeholder="Paste job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-4">
              <Button onClick={() => navigate('/dashboard')} variant="outline" className="text-[#5B2EC4] border-[#5B2EC4]">Cancel</Button>
              <Button onClick={handleAnalyze} disabled={isAnalyzing} className="bg-gradient-to-r from-[#814EE7] to-[#5B2EC4] text-white">
                {isAnalyzing ? 'Analyzing...' : 'Analyze'}
              </Button>
            </div>
          </div>

          {geminiResponse && (
            // <div className="mt-8 bg-white rounded-3xl shadow-md p-6 border border-[#5B2EC4]/20">
            //   <h3 className="text-xl font-semibold text-[#5B2EC4] mb-4">Analysis Result</h3>
            //   <pre className="whitespace-pre-wrap text-gray-800 text-base leading-relaxed">{geminiResponse}</pre>
            // </div>
            <div className="mt-8 bg-white rounded-3xl shadow-lg border border-[#5B2EC4]/30 p-8">
    <h3 className="text-2xl font-bold text-[#5B2EC4] mb-6 flex items-center gap-2">
      <FaFile className="text-[#5B2EC4]" />
      Resume Analysis
    </h3>
    <div className="space-y-6 text-gray-800 text-base leading-relaxed">
      {geminiResponse.split('\n\n').map((block, i) => (
        <div key={i}>
          {block.trim().startsWith('**') ? (
            <h4 className="text-lg font-semibold text-[#5B2EC4] mb-2">
              {block.replace(/\*\*/g, '')}
            </h4>
          ) : (
            <p className="whitespace-pre-wrap">{block}</p>
          )}
        </div>
      ))}
    </div>
    
    {/* Start Interview Button */}
    {interviewQuestions.length > 0 && (
      <div className="mt-6 flex justify-center">
        <Button 
          onClick={() => navigate('/speech', { state: { questions: interviewQuestions } })}
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-6 px-8 text-lg font-semibold rounded-xl shadow-lg transform transition-all hover:scale-105"
        >
          🎤 Start Interview
        </Button>
      </div>
    )}
  </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Schedule;
