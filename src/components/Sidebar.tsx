import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaUser, FaChartBar, FaCog, FaSignOutAlt } from 'react-icons/fa';

interface SidebarProps {
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');

  const sidebarItems = [
    { id: 'home', icon: FaHome, label: 'Home' },
    { id: 'profile', icon: FaUser, label: 'Profile' },
    { id: 'analytics', icon: FaChartBar, label: 'Analytics' },
    { id: 'settings', icon: FaCog, label: 'Settings' },
  ];

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <aside className="w-64 min-h-screen bg-[#F9F9FB] text-[#333] border-r border-gray-200 flex flex-col">
    {/* Logo / Brand */}
    <div className="p-6 border-b border-gray-200">
      <div className="flex items-center justify-center gap-2">
        <img src="/logo.svg" alt="logo" className="w-12 h-12" />
        <h1 className="text-xl font-bold text-[#5B2EC4]">PrepWise</h1>
      </div>
    </div>
  
    {/* Navigation Items */}
    <nav className="flex-1 px-4 pt-6 space-y-3">
      {sidebarItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={`w-full flex items-center px-6 py-3 rounded-lg text-base transition-all duration-150 ${
            activeTab === item.id
              ? 'bg-gradient-to-r from-[#814EE7] to-[#5B2EC4] text-white font-medium shadow-lg'
              : 'hover:bg-gradient-to-r hover:from-[#814EE7]/10 hover:to-[#5B2EC4]/10 hover:text-[#5B2EC4]'
          }`}
        >
          <item.icon className="w-6 h-6 mr-4" />
          {item.label}
        </button>
      ))}
    </nav>
  
    {/* Logout */}
    <div className="p-6 border-t border-gray-200">
      <button
        onClick={handleLogout}
        className="w-full flex items-center px-6 py-3 rounded-lg text-red-600 hover:bg-red-50 text-base transition-all duration-150"
      >
        <FaSignOutAlt className="w-5 h-5 mr-3" />
        Logout
      </button>
    </div>
  </aside>
  
  );
};

export default Sidebar;
