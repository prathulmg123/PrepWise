import React from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaCalendarAlt, FaChartBar, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { Tab } from './types';

interface SidebarProps {
  items: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout, items, activeTab, onTabChange }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-white shadow-lg fixed h-full">
      <div className="p-4">
      <div className="flex items-center justify-center gap-2 pb-8 mr-8">
        <img src="/logo.svg" alt="logo" className="w-10 h-10" />
        <h1 className="text-xl font-bold text-[#5B2EC4]">PrepWise</h1>
      </div>
        <nav>
          {items.map((item, index) => (
            <Link
              key={item.id}
              to={`/${item.id}`}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 ${
                activeTab === item.id
                  ? 'bg-[#5B2EC4]/10 text-[#5B2EC4] font-semibold'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onTabChange(item.id)}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="absolute bottom-0 w-full p-4 border-t">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50"
        >
          <FaSignOutAlt className="w-5 h-5 mr-3" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
