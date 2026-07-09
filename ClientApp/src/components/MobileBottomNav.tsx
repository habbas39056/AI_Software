import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Users, KanbanSquare, MoreHorizontal, UserPlus, BarChart3 } from 'lucide-react';
import './MobileBottomNav.css';

interface MobileBottomNavProps {
  role: 'Super Admin' | 'Client' | 'TeamMember';
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ role }) => {
  const isSuperAdmin = role === 'Super Admin';

  const handleMoreClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const checkbox = document.getElementById('sidebar-toggle') as HTMLInputElement;
    if (checkbox) {
      checkbox.checked = true;
    }
  };

  return (
    <nav className="mobile-bottom-nav">
      <NavLink to="/" end className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <LayoutDashboard size={22} />
        <span>Dashboard</span>
      </NavLink>
      
      {isSuperAdmin ? (
        <>
          <NavLink to="/onboarding" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
            <UserPlus size={22} />
            <span>New Agent</span>
          </NavLink>
          <NavLink to="/clients" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
            <Users size={22} />
            <span>Clients</span>
          </NavLink>
          <NavLink to="/billing" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
            <BarChart3 size={22} />
            <span>Billing</span>
          </NavLink>
        </>
      ) : (
        <>
          {role !== 'TeamMember' ? (
            <NavLink to="/knowledge-base" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
              <BookOpen size={22} />
              <span>Knowledge Base</span>
            </NavLink>
          ) : (
             <div style={{ flex: 1 }}></div>
          )}
          <NavLink to="/leads" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
            <Users size={22} />
            <span>Leads</span>
          </NavLink>
          <NavLink to="/pipeline" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
            <KanbanSquare size={22} />
            <span>Pipeline</span>
          </NavLink>
        </>
      )}

      <button className="bottom-nav-item" onClick={handleMoreClick}>
        <MoreHorizontal size={22} />
        <span>More</span>
      </button>
    </nav>
  );
};

export default MobileBottomNav;
