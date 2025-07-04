import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { FaHome, FaCalendarAlt, FaChartBar, FaCog } from 'react-icons/fa';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
  onLogout: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const sidebarItems = [
    { id: 'dashboard', icon: FaHome, label: 'Dashboard' },
    { id: 'schedule', icon: FaCalendarAlt, label: 'Schedule' },
    { id: 'analytics', icon: FaChartBar, label: 'Analytics' },
    { id: 'settings', icon: FaCog, label: 'Settings' },
  ];

  const handleLogout = () => {
    // Add your logout logic here
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-md">
        <Sidebar
          onLogout={handleLogout}
          items={sidebarItems}
          activeTab={activeTab}
          onTabChange={(id: string) => {
            setActiveTab(id);
            navigate(`/${id}`);
          }}
        />
      </div>
      <div className="ml-64 flex-1 ">
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
