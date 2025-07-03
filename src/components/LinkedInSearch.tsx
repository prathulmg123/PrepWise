import { useState } from 'react';
import { IoSearchOutline, IoMicOutline } from 'react-icons/io5';
import { FaLinkedin } from 'react-icons/fa';

interface LinkedInProfile {
  id: string;
  name: string;
  headline: string;
  location: string;
  experience: number;
  skills: string[];
  profilePicture?: string;
  resumeUrl?: string;
}

interface LinkedInSearchProps {
  onSearch: (query: string, experience: number) => void;
  onProfilesFound: (profiles: LinkedInProfile[]) => void;
}

const LinkedInSearch: React.FC<LinkedInSearchProps> = ({ onSearch, onProfilesFound }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [experience, setExperience] = useState(3);
  const [isListening, setIsListening] = useState(false);

  const handleVoiceSearch = async () => {
    if (!('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser');
      return;
    }

    const recognition = new (window as any).SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const speechResult = event.results[last][0].transcript;
      setSearchQuery(speechResult);
    };

    recognition.onend = () => {
      setIsListening(false);
      handleSearch(searchQuery, experience);
    };

    setIsListening(true);
    recognition.start();
  };

  const handleSearch = async (query: string, experience: number) => {
    try {
      // Simulate LinkedIn API call
      const profiles: LinkedInProfile[] = [
        {
          id: '1',
          name: 'John Doe',
          headline: 'Senior Software Engineer',
          location: 'San Francisco, CA',
          experience: 5,
          skills: ['React', 'Node.js', 'AWS'],
          profilePicture: 'https://via.placeholder.com/150',
          resumeUrl: 'https://example.com/resume.pdf'
        },
        {
          id: '2',
          name: 'Jane Smith',
          headline: 'Frontend Developer',
          location: 'New York, NY',
          experience: 3,
          skills: ['React', 'TypeScript', 'CSS'],
          profilePicture: 'https://via.placeholder.com/150',
          resumeUrl: 'https://example.com/resume.pdf'
        }
      ];

      onProfilesFound(profiles);
    } catch (error) {
      console.error('Error searching LinkedIn:', error);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <div className="flex items-center gap-4 mb-6">
        <FaLinkedin className="text-[#0077B5] text-2xl" />
        <h2 className="text-xl font-bold">LinkedIn Search</h2>
      </div>

      <div className="space-y-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search for candidates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-6 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0077B5] focus:border-transparent"
          />
          <div className="absolute inset-y-0 right-3 flex items-center gap-2">
            <button
              onClick={handleVoiceSearch}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <IoMicOutline className={`w-6 h-6 ${isListening ? 'text-blue-500' : 'text-gray-400'}`} />
            </button>
            <button
              onClick={() => onSearch(searchQuery, experience)}
              className="px-6 py-2 rounded-xl bg-[#0077B5] text-white hover:bg-[#006097] transition-colors"
            >
              <IoSearchOutline className="w-5 h-5 mr-2" />
              Search
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
          <input
            type="number"
            value={experience}
            onChange={(e) => setExperience(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0077B5] focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
};

export default LinkedInSearch;
