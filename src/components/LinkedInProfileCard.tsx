import { useState } from 'react';
import { FaLinkedin, FaStar, FaDownload, FaVideo } from 'react-icons/fa';

interface LinkedInProfile {
  id: string;
  name: string;
  headline: string;
  location: string;
  experience: number;
  skills: string[];
  profilePicture?: string;
  resumeUrl?: string;
  videoCallUrl?: string;
}

interface LinkedInProfileCardProps {
  profile: LinkedInProfile;
  onDownloadResume: (url: string) => void;
  onScheduleInterview: (profile: LinkedInProfile) => void;
}

const LinkedInProfileCard: React.FC<LinkedInProfileCardProps> = ({ profile, onDownloadResume, onScheduleInterview }) => {
  const [isFavorited, setIsFavorited] = useState(false);

  return (
    <div className="bg-white rounded-3xl shadow-md hover:shadow-xl transition-shadow p-6">
      <div className="flex items-center gap-4 mb-4">
        {profile.profilePicture ? (
          <img
            src={profile.profilePicture}
            alt={profile.name}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-[#0077B5]/10 flex items-center justify-center">
            <FaLinkedin className="w-8 h-8 text-[#0077B5]" />
          </div>
        )}
        <div>
          <h3 className="text-xl font-semibold text-gray-800">{profile.name}</h3>
          <p className="text-gray-600">{profile.headline}</p>
          <p className="text-sm text-gray-500">{profile.location}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-gray-600">{profile.experience} years exp</span>
            <button
              onClick={() => setIsFavorited(!isFavorited)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FaStar className={`w-5 h-5 ${isFavorited ? 'text-yellow-500' : 'text-gray-400'}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Skills</h4>
        <div className="flex flex-wrap gap-2">
          {profile.skills.map((skill, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-gray-100 rounded-full text-sm"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-4">
        {profile.resumeUrl && (
          <button
            onClick={() => onDownloadResume(profile.resumeUrl)}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#814EE7] to-[#5B2EC4] text-white hover:shadow-lg transition-all flex items-center gap-2"
          >
            <FaDownload className="w-5 h-5" />
            Download Resume
          </button>
        )}
        <button
          onClick={() => onScheduleInterview(profile)}
          className="px-4 py-2 rounded-lg bg-[#0077B5] text-white hover:bg-[#006097] transition-all flex items-center gap-2"
        >
          <FaVideo className="w-5 h-5" />
          Schedule Interview
        </button>
      </div>
    </div>
  );
};

export default LinkedInProfileCard;
