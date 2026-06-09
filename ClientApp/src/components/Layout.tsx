import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
  role: 'Super Admin' | 'Client';
  userName: string;
  userProfileImage?: string;
  moduleComplains?: boolean;
  moduleInstruction?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, role, userName, userProfileImage, moduleComplains, moduleInstruction }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-container">
      <input 
        type="checkbox" 
        id="sidebar-toggle" 
        checked={sidebarOpen} 
        onChange={() => setSidebarOpen(!sidebarOpen)} 
        style={{ display: 'none' }}
      />
      <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>

      <header className="mobile-nav-header">
        <div className="brand" style={{ margin: 0, padding: 0, fontSize: '1rem' }}>
          {role === 'Super Admin' ? (
            <img src="/logo.png" alt="Adwise Labs Ai Solutions" style={{ height: '32px', width: 'auto' }} />
          ) : (
            <img src="/logo.png" alt="Adwise Labs Ai Solutions" style={{ height: '32px', width: 'auto' }} />
          )}
        </div>
        <label htmlFor="sidebar-toggle" className="hamburger">
          <span></span>
          <span></span>
          <span></span>
        </label>
      </header>

      <Sidebar role={role} userName={userName} userProfileImage={userProfileImage} moduleComplains={moduleComplains} moduleInstruction={moduleInstruction} />

      <main className="main-content">
        <TopHeader role={role} userName={userName} />
        <div className="dashboard-container">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
