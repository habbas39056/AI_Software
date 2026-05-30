import React from 'react';
import './TopHeader.css';

import { useLocation } from 'react-router-dom';

interface TopHeaderProps {
  role: 'Super Admin' | 'Client';
  userName?: string;
  agentLive?: boolean;
  agentName?: string;
  dateString?: string;
}

const TopHeader: React.FC<TopHeaderProps> = ({ role, userName, dateString }) => {
  const isSuperAdmin = role === 'Super Admin';
  const location = useLocation();
  const isKnowledgeBase = location.pathname.includes('/knowledge-base');
  const isLeads = location.pathname.includes('/leads');
  const isBilling = location.pathname.includes('/billing');
  const isProfile = location.pathname.includes('/profile');
  const isSettings = location.pathname.includes('/settings');

  let title = isSuperAdmin ? 'Agency Overview' : (userName ? `Welcome back, ${userName}` : 'Dashboard');
  let subtitle = isSuperAdmin ? dateString || 'Monday, June 26, 2024' : (
    <span style={{ display: 'flex', alignItems: 'center' }}>
      Overview <span style={{ margin: '0 0.5rem' }}>&gt;</span> <span style={{ color: '#10B981' }}>Real-time Stats</span>
    </span>
  );

  if (isKnowledgeBase) {
    title = `${userName || 'Customer'} - Knowledge Base`;
    subtitle = 'Manage bot knowledge and custom mappings.';
  } else if (isLeads) {
    title = `${userName || 'Customer'} - Captured Leads`;
    subtitle = 'Manage and view all captured leads for this bot instance.';
  } else if (isBilling) {
    title = 'Billing & Subscription Management';
    subtitle = 'Manage your Enterprise AI Plan and monitor renewal cycles';
  } else if (isProfile) {
    title = 'Personal Profile';
    subtitle = 'Manage your credentials & avatar';
  } else if (isSettings) {
    title = 'Agent Config & Security';
    subtitle = (
      <span style={{ display: 'flex', alignItems: 'center' }}>
        Overview <span style={{ margin: '0 0.5rem' }}>&gt;</span> <span style={{ color: '#10B981' }}>Real-time Stats</span>
      </span>
    ) as any;
  }

  return (
    <div className="top-header">
      <div className="header-title">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>


    </div>
  );
};

export default TopHeader;
