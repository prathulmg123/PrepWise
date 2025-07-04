import React, { useState, useEffect } from 'react';
import { 
  FaUpload, 
  FaFilePdf, 
  FaFileWord,
  FaHome,
  FaCalendarAlt,
  FaChartBar,
  FaCog
} from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';

interface ScheduleProps {
  onLogout: () => void;
}

interface SidebarItem {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
}

const Schedule: React.FC<ScheduleProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('schedule'); // Set to 'schedule' for Schedule tab

  const sidebarItems: SidebarItem[] = [
    { id: 'dashboard', icon: FaHome, label: 'Dashboard' },
    { id: 'schedule', icon: FaCalendarAlt, label: 'Schedule' },
    { id: 'analytics', icon: FaChartBar, label: 'Analytics' },
    { id: 'settings', icon: FaCog, label: 'Settings' },
  ];

  useEffect(() => {
    const path = location.pathname.replace('/', '');
    const matchingItem = sidebarItems.find(item => item.id === path);
    if (matchingItem) {
      setActiveTab(matchingItem.id);
    } else {
      setActiveTab('schedule'); // Default to Schedule tab
    }
  }, [location.pathname]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setResumeFile(file);
    }
  };

  const handleAnalyze = () => {
    if (!resumeFile || !jobDescription.trim()) {
      alert('Please upload a resume and enter job description');
      return;
    }

    setIsUploading(true);
    // Navigate to dashboard with the uploaded file and description
    navigate('/dashboard', {
      state: {
        resume: resumeFile,
        description: jobDescription
      }
    });
  };

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] text-gray-800">
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header Tabs + Action Buttons */}
        <div className="flex items-center justify-between px-8 pt-6">
          <div className="flex items-center gap-8">
            <button className="pb-3 text-sm font-medium text-purple-600  border-purple-600">
              Schedule Analysis
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-8 pt-4 pb-8">
          <input
            type="text"
            placeholder="Search"
            className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 text-base shadow-sm"
          />
        </div>

        <div className="px-8">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
            <FaUpload className="w-6 h-6 text-[#5B2EC4]" />
            Upload Resume & Job Description
          </h2>
          <div className="bg-white rounded-3xl shadow-md p-6">
            <div className='pb-8'>
              <h3 className="text-lg font-semibold mb-4">Upload Resume</h3>
              <div className="border-2 border-dashed border-[#5B2EC4]/30 rounded-xl p-8 text-center">
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-4">
                    <FaFilePdf className="w-12 h-12 text-[#5B2EC4]" />
                    {/* <FaFileWord className="w-12 h-12 text-[#5B2EC4]" /> */}
                  </div>
                  <p className="text-gray-500">Drag and drop your resume here or</p>
                  <label className="cursor-pointer">
                    <Button className="bg-gradient-to-r from-[#814EE7] to-[#5B2EC4]  mt-4 text-white hover:shadow-lg transition-all">
                      <FaUpload className="mr-2" />
                      Browse Files
                    </Button>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className='pb-8'>
              <h3 className="text-lg font-semibold mb-4">Job Description</h3>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Enter job description here..."
                className="w-full h-48 p-4 rounded-xl border border-gray-200 focus:outline-none focus:border-[#5B2EC4] resize-none"
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
                className="text-[#5B2EC4] border-[#5B2EC4] hover:bg-[#5B2EC4]/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAnalyze}
                className="bg-gradient-to-r from-[#814EE7] to-[#5B2EC4] text-white hover:shadow-lg transition-all"
                disabled={!resumeFile || !jobDescription.trim() || isUploading}
              >
                {isUploading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#5B2EC4]" />
                ) : (
                  'Analyze Resume'
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Schedule;
