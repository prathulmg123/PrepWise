import { useState } from 'react';
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import Modal from "@/components/Modal";
import LinkedInSearch from "@/components/LinkedInSearch";
import ResumeAnalyzer from "@/components/ResumeAnalyzer";
import { FaHome, FaUser, FaChartBar, FaCog } from 'react-icons/fa';

const tabs = ['Recently Viewed', 'Shared Files', 'Shared Projects'];

interface EmployeeData {
  resume: File | null;
  description: string;
}

const cards = [
  {
    title: 'Blueprint - Dashboard',
    date: '1 Days Ago',
    image: '/inter.png', // Replace with actual paths
  },
  {
    title: '3D Animation - Shopping',
    date: '3 Days Ago',
    image: '/card2.png',
  },
  {
    title: 'Product Delivery',
    date: '5 Days Ago',
    image:'/card3.png',
  },
];

const Dashboard = ({ onLogout }: { onLogout: () => void }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employeeData, setEmployeeData] = useState<EmployeeData>({
    resume: null,
    description: ''
  });
  const [errors, setErrors] = useState({
    description: '',
    resume: ''
  });

  const handleInputChange = (field: keyof EmployeeData, value: string | File | null) => {
    setEmployeeData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for the current field
    setErrors(prev => ({
      ...prev,
      [field]: ''
    }));
  };

  const validateForm = () => {
    let hasError = false;
    const newErrors = {
      description: '',
      resume: ''
    };

    if (!employeeData.description.trim()) {
      newErrors.description = 'Job requirements are required';
      hasError = true;
    }

    if (!employeeData.resume) {
      newErrors.resume = 'Resume is required';
      hasError = true;
    }

    setErrors(newErrors);
    return !hasError;
  };

  const handleModalOpen = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEmployeeData({
      resume: null,
      description: ''
    });
    setErrors({
      description: '',
      resume: ''
    });
  };

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] text-gray-800">
      <Sidebar onLogout={onLogout} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header Tabs + Action Buttons */}
        <div className="flex items-center justify-between px-8 pt-6">
          <div className="flex items-center gap-8">
            {tabs.map((tab, index) => (
              <button
                key={tab}
                onClick={() => setActiveTab(index)}
                className={`pb-3 text-sm font-medium ${
                  activeTab === index
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-500 hover:text-purple-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button className="text-base rounded-full bg-white border border-gray-200 px-6 py-3 text-gray-700 hover:bg-gray-100 shadow-sm">
              <i className="ri-user-add-line mr-3" />
              Invite member
            </Button>
            <Button 
              className="text-base rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 shadow-md hover:shadow-lg"
              onClick={handleModalOpen}
            >
              + Create New Room
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-8 pt-4">
          <input
            type="text"
            placeholder="Search"
            className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 text-base shadow-sm"
          />
        </div>

        {/* Modal */}
        <Modal isOpen={isModalOpen} onClose={handleModalClose}>
          <div className="p-6">
            <h2 className="text-2xl font-bold text-[#5B2EC4] mb-8 text-center">Create New Room</h2>
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Requirements *</label>
                <div>
                  <textarea
                    placeholder="Enter job requirements (e.g., 3 years frontend experience, React, Redux, Tailwind CSS)"
                    value={employeeData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className={`w-full px-4 py-3.5 rounded-xl border ${errors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#5B2EC4]'} focus:border-transparent placeholder-gray-400 text-sm h-32 resize-none`}
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Resume *</label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    id="resume-upload"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        const preview = document.getElementById('resume-preview') as HTMLDivElement;
                        if (preview) {
                          preview.innerHTML = `
                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                              <div className="bg-[#5B2EC4]/10 p-3 rounded-lg">
                                <FaFilePdf className="w-6 h-6 text-[#5B2EC4]" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-800">${file.name}</div>
                                <div className="text-xs text-gray-400">${(file.size / 1024).toFixed(1)} KB</div>
                              </div>
                            </div>
                          `;
                        }
                        handleInputChange('resume', file);
                      }
                    }}
                  />
                  <label
                    htmlFor="resume-upload"
                    className={`w-full px-6 py-3.5 rounded-xl ${
                      employeeData.resume ? 'bg-green-500' : 'bg-gradient-to-r from-[#814EE7] to-[#5B2EC4]'
                    } text-white hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-3`}
                  >
                    <i className="ri-upload-cloud-2-line text-lg" />
                    <span>{employeeData.resume ? 'Resume Selected' : 'Upload Resume'}</span>
                  </label>
                </div>
                <div id="resume-preview" className="mt-3" />
                {errors.resume && (
                  <p className="text-red-500 text-sm mt-1">{errors.resume}</p>
                )}
              </div>

              <div className="mt-6">
                <ResumeAnalyzer
                  requirements={employeeData.description}
                  resumeFile={employeeData.resume}
                  onAnalysisComplete={(analysis) => {
                    // Here you would start the interview with your speech recognition system
                    // Pass the analysis results to your AI interview system
                    console.log('Starting interview with analysis:', analysis);
                    setIsModalOpen(false);
                  }}
                />
              </div>
            </div>
          </div>
        </Modal>

        {/* Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 px-8 py-6">
          {cards.map((card, index) => (
            <div
              key={index}
              className="bg-white rounded-3xl shadow-md hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-[1.03] hover:rotate-[-1deg] hover:-translate-y-1 hover:skew-x-[-1deg] p-5"
            >
              <img
                src={card.image}
                alt={card.title}
                className="rounded-xl mb-5 w-full object-cover"
              />
              <div className="text-base font-medium text-gray-800 mb-2">{card.title}</div>
              <div className="text-sm text-gray-400 mb-4">{card.date}</div>
              <div className="flex justify-between items-center text-purple-500 text-base">
                <button title="Delete" className="hover:text-purple-600"><i className="ri-delete-bin-line" /></button>
                <button title="Share" className="hover:text-purple-600"><i className="ri-share-line" /></button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
