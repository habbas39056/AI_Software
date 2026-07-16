import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus,
  UsersRound,
  BarChart3, 
  BookOpen, 
  CreditCard, 
  Lock, 
  Settings, 
  HelpCircle, 
  LogOut,
  KanbanSquare,
  DollarSign,
  AlertTriangle,
  FileText,
  MessageCircle
} from 'lucide-react';
import { authService } from '../services/api';
import './Sidebar.css';

interface SidebarProps {
  role: 'Super Admin' | 'Client' | 'TeamMember';
  userName: string;
  userProfileImage?: string;
  moduleComplains?: boolean;
  moduleInstruction?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ role, userName, userProfileImage, moduleComplains, moduleInstruction }) => {
  const isSuperAdmin = role === 'Super Admin';

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await authService.logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      window.location.href = '/login';
    }
  };

  const closeSidebar = () => {
    const checkbox = document.getElementById('sidebar-toggle') as HTMLInputElement;
    if (checkbox) {
      checkbox.checked = false;
    }
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <img src="/logo.png" alt="Adwise Labs Ai Solutions" className="brand-logo-img" />
      </div>

      <div className="sidebar-heading">MAIN MENU</div>
      <nav>
        {isSuperAdmin ? (
          <>
            <NavLink to="/" onClick={closeSidebar} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={18} />
              Dashboard
            </NavLink>
            <NavLink to="/onboarding" onClick={closeSidebar} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <UserPlus size={18} />
              New AI Agent
            </NavLink>
            <NavLink to="/clients" onClick={closeSidebar} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Users size={18} />
              CRM & Clients
            </NavLink>

            <NavLink to="/billing" onClick={closeSidebar} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <BarChart3 size={18} />
              Analytics & Billing
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/" onClick={closeSidebar} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={18} />
              Dashboard
            </NavLink>
            {role !== 'TeamMember' && (
              <>
                <NavLink to="/knowledge-base" onClick={closeSidebar} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <BookOpen size={18} />
                  Knowledge Base
                </NavLink>
              </>
            )}
            <NavLink to="/leads" onClick={closeSidebar} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Users size={18} />
              Leads Center
            </NavLink>
            <NavLink to="/pipeline" onClick={closeSidebar} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <KanbanSquare size={18} />
              Pipeline
            </NavLink>
            {role !== 'TeamMember' && (
              <NavLink to="/inbox" onClick={closeSidebar} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <MessageCircle size={18} />
                Live Chat Inbox
              </NavLink>
            )}

            {role !== 'TeamMember' && (
              <>
                <NavLink to="/commissions" onClick={closeSidebar} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <DollarSign size={18} />
                  Commissions
                </NavLink>
                <NavLink to="/team" onClick={closeSidebar} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <UsersRound size={18} />
                  Team Members
                </NavLink>
                <NavLink to="/billing" onClick={closeSidebar} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <CreditCard size={18} />
                  Billing & Plan
                </NavLink>
              </>
            )}
            {moduleComplains && (
              <NavLink to="/complaints" onClick={closeSidebar} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <AlertTriangle size={18} />
                Complaints
              </NavLink>
            )}
            {moduleInstruction && (
              <NavLink to="/instructions" onClick={closeSidebar} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <FileText size={18} />
                Installation Requests
              </NavLink>
            )}
          </>
        )}
      </nav>



      <div className="sidebar-heading" style={{ marginTop: '1.5rem' }}>SETTINGS</div>
      <nav>
        {isSuperAdmin ? (
          <NavLink to="/security" onClick={closeSidebar} className="nav-link">
            <Lock size={18} />
            Security
          </NavLink>
        ) : (
          <>
            <NavLink to="/profile" onClick={closeSidebar} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Lock size={18} />
              Profile & Security
            </NavLink>
            {role !== 'TeamMember' && (
              <>
                <NavLink to="/settings" onClick={closeSidebar} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Settings size={18} />
                  Agent Config
                </NavLink>
                <NavLink to="/support" onClick={closeSidebar} className="nav-link">
                  <HelpCircle size={18} />
                  Support Docs
                </NavLink>
              </>
            )}
          </>
        )}
      </nav>

      <div className="user-profile-widget" style={{ marginTop: 'auto' }}>
        <div className="user-avatar" style={!isSuperAdmin ? { backgroundColor: '#e0f2fe', color: '#0ea5e9', padding: 0, overflow: 'hidden' } : { padding: 0, overflow: 'hidden' }}>
          {userProfileImage ? (
            <img src={userProfileImage} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : null}
          <div className="user-status" style={{ position: 'absolute', bottom: 0, right: 0, zIndex: 10 }}></div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, lineHeight: 1.2, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', width: '100px' }}>
            {userName}
          </div>
          <div style={{ color: 'var(--sidebar-text)', fontSize: '0.75rem' }}>
            {isSuperAdmin ? 'Super Admin' : 'PRO ACCOUNT'}
          </div>
        </div>
        <button 
          onClick={handleLogout} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
