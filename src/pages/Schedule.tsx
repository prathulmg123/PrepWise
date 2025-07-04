import React, { useState, useRef, useEffect } from 'react';
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
  
  const handleAnalyze = async () => {
    if (!resumeFile || !jobDescription.trim()) {
      alert("Please upload a resume and enter job description.");
      return;
    }
  
    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
  
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
          const prompt = `
          You are an intelligent HR assistant.
          
          Compare the resume with the job description and give a detailed analysis including:
          - Overall assessment
          - Skill match
          - Experience relevance
          - Strengths and areas for improvement
          - Education and project fit
          - A final verdict on the candidate's suitability
          
          Also, provide 5 interview questions that could be asked during the interview, based on the resume and job description. 
          
          Important:
          - Number the interview questions from 1 to 5.
          - Do not format the interview questions with  asterisks.
          - Present the questions as plain text, each separated by a line break.
          - Make the overall analysis sectioned and professional.
          `;
          
          
          // const prompt = `You are an intelligent HR assistant.\nCompare the resume with the job description and give a detailed analysis.`;
  
          const result = await model.generateContent({
            contents: [
              { role: 'user', parts: [{ text: prompt + "\n\nJob Description:\n" + jobDescription }] },
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
          setGeminiResponse(geminiOutput);
        } catch (err) {
          console.error("Gemini failed:", err);
          alert("Failed to analyze resume.");
        } finally {
          setIsAnalyzing(false); // ✅ Now in the right place
        }
      };
  
      reader.readAsDataURL(resumeFile);
    } catch (error) {
      console.error("File read failed:", error);
      alert("Something went wrong.");
      setIsAnalyzing(false); // In case readAsDataURL itself fails
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
      Gemini Resume Analysis
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
  </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Schedule;
