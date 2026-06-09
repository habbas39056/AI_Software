import React, { useState, useEffect } from 'react';
import { Play, ToggleLeft, ToggleRight, Power } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import LeadRunnerModal from './LeadRunnerModal';
import { leadsService, clientService } from '../services/api';
import './TopHeader.css';

interface TopHeaderProps {
  role: 'Super Admin' | 'Client' | 'TeamMember';
  userName?: string;
  agentLive?: boolean;
  agentName?: string;
  dateString?: string;
}

const TopHeader: React.FC<TopHeaderProps> = ({ role, userName, dateString }) => {
  const isSuperAdmin = role === 'Super Admin';
  const isTeamMember = role === 'TeamMember';
  const location = useLocation();

  const [isRunnerOpen, setIsRunnerOpen] = useState(false);
  const [runnerLeads, setRunnerLeads] = useState<any[]>([]);
  const [runnerStarting, setRunnerStarting] = useState(false);

  const [isAgentActive, setIsAgentActive] = useState(true);
  const [isScheduledAsleep, setIsScheduledAsleep] = useState(false);

  useEffect(() => {
    if (role === 'Super Admin') return;
    const fetchAgentStatus = async () => {
      try {
        const settings = await clientService.getSettings();
        if (settings?.agents?.length > 0) {
          const agent = settings.agents[0];
          setIsAgentActive(agent.isActive);
          
          if (agent.scheduleEnabled && agent.scheduleStartTime && agent.scheduleEndTime) {
            try {
              const tz = agent.timezone || 'UTC';
              const formatter = new Intl.DateTimeFormat('en-US', { 
                timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' 
              });
              const currentTime = formatter.format(new Date()); 
              const start = agent.scheduleStartTime;
              const end = agent.scheduleEndTime;
              let isAsleep = false;
              if (start < end) {
                isAsleep = !(currentTime >= start && currentTime <= end);
              } else {
                isAsleep = !(currentTime >= start || currentTime <= end);
              }
              setIsScheduledAsleep(isAsleep);
            } catch(e) {}
          } else {
            setIsScheduledAsleep(false);
          }
        }
      } catch (e) {
        console.error('Failed to fetch agent status', e);
      }
    };
    fetchAgentStatus();
    
    // Check schedule every minute to keep UI synced automatically
    const interval = setInterval(fetchAgentStatus, 60000);
    return () => clearInterval(interval);
  }, [role]);

  const handleToggleAgent = async () => {
    try {
      const newState = !isAgentActive;
      setIsAgentActive(newState);
      await clientService.toggleAgent(newState);
    } catch (error) {
      console.error('Failed to toggle agent:', error);
      setIsAgentActive(!isAgentActive);
      alert('Failed to toggle AI Agent status');
    }
  };

  const startLeadRunner = async () => {
    setRunnerStarting(true);
    try {
      const allLeads = await leadsService.getAllLeads();
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      const dueLeads = allLeads.filter((l: any) => {
        if (l.status === 'Won' || l.status === 'Lost') return false;
        if (!l.followUpDate) return false;
        const fDate = new Date(l.followUpDate);
        return fDate <= today;
      });

      if (dueLeads.length > 0) {
        setRunnerLeads(dueLeads);
        setIsRunnerOpen(true);
      } else {
        alert('All caught up! No due leads for today.');
      }
    } catch (err) {
      console.error('Failed to start lead runner', err);
      alert('Failed to load due leads.');
    } finally {
      setRunnerStarting(false);
    }
  };

  const isKnowledgeBase = location.pathname.includes('/knowledge-base');
  const isLeads = location.pathname.includes('/leads');
  const isBilling = location.pathname.includes('/billing');
  const isProfile = location.pathname.includes('/profile');
  const isSettings = location.pathname.includes('/settings');
  const isCommissions = location.pathname.includes('/commissions');
  const isComplaints = location.pathname.includes('/complaints');
  const isInstructions = location.pathname.includes('/instructions');

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
  } else if (isCommissions) {
    title = 'Commissions';
    subtitle = 'Track team member earnings based on collected payments.';
  } else if (isSettings) {
    title = 'Agent Config & Security';
    subtitle = (
      <span style={{ display: 'flex', alignItems: 'center' }}>
        Overview <span style={{ margin: '0 0.5rem' }}>&gt;</span> <span style={{ color: '#10B981' }}>Real-time Stats</span>
      </span>
    ) as any;
  } else if (isComplaints) {
    title = 'Complaints';
    subtitle = 'Manage external complaints submitted via the AI Agent.';
  } else if (isInstructions) {
    title = 'Installation Requests';
    subtitle = 'Manage installation requests submitted via the AI Agent.';
  }

  return (
    <div className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="header-title">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="header-actions" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        {role !== 'Super Admin' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: !isAgentActive ? 'rgba(248, 113, 113, 0.1)' : isScheduledAsleep ? 'rgba(251, 191, 36, 0.1)' : 'rgba(59, 130, 246, 0.1)', padding: '6px 14px', borderRadius: '30px', border: `2px solid ${!isAgentActive ? '#f87171' : isScheduledAsleep ? '#f59e0b' : '#3b82f6'}`, boxShadow: !isAgentActive ? '0 0 10px rgba(248, 113, 113, 0.2)' : isScheduledAsleep ? '0 0 10px rgba(251, 191, 36, 0.2)' : '0 0 10px rgba(59, 130, 246, 0.2)', transition: 'all 0.3s ease' }}>
            <Power size={18} color={!isAgentActive ? '#f87171' : isScheduledAsleep ? '#f59e0b' : '#3b82f6'} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#000', fontWeight: 600 }}>Agent Status</span>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: !isAgentActive ? '#f87171' : isScheduledAsleep ? '#f59e0b' : '#3b82f6', lineHeight: '1.2' }}>{!isAgentActive ? 'OFFLINE' : isScheduledAsleep ? 'ASLEEP' : 'ONLINE'}</span>
            </div>
            <button 
              onClick={handleToggleAgent}
              style={{ background: 'none', border: 'none', color: isAgentActive ? (isScheduledAsleep ? '#f59e0b' : '#3b82f6') : '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0, marginLeft: '4px' }}
              title={isAgentActive ? 'Click to Manually Kill Agent' : 'Click to Revive Agent'}
            >
              {isAgentActive ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </button>
          </div>
        )}

        {isTeamMember && (
          <button 
            className="btn-primary" 
            onClick={startLeadRunner} 
            disabled={runnerStarting}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
          >
            <Play size={16} /> {runnerStarting ? 'Loading...' : 'Start Leads'}
          </button>
        )}
      </div>

      {isRunnerOpen && (
        <LeadRunnerModal 
          leads={runnerLeads} 
          onClose={() => setIsRunnerOpen(false)} 
          onFinished={() => setIsRunnerOpen(false)} 
        />
      )}
    </div>
  );
};

export default TopHeader;
