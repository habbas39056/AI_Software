import React, { useEffect, useState } from 'react';
import { facebookService, clientService } from '../services/api';
import { 
  MessageSquare, 
  Users, 
  TrendingUp, 
  MessageCircle, 
  Loader2, 
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Clock
} from 'lucide-react';
import './FacebookDashboard.css';

const FacebookDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [data, setData] = useState<any>(null);
  const [agentId, setAgentId] = useState<number | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Facebook Messenger stats
      const resp = await facebookService.getDashboardData();
      setData(resp);

      // 2. Fetch agent settings in case we need to connect
      if (!resp.connected) {
        const settings = await clientService.getSettings();
        const firstAgent = settings?.agents?.[0];
        if (firstAgent) {
          setAgentId(firstAgent.id);
        }
      }
    } catch (err) {
      console.error('Failed to load Facebook dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleConnect = async () => {
    if (!agentId) {
      alert('No active WhatsApp Agent found. Please ensure a WhatsApp instance is configured first.');
      return;
    }
    setConnecting(true);
    try {
      const response = await facebookService.getAuthUrl(agentId);
      if (response.url) {
        window.location.href = response.url;
      } else {
        alert('Could not initialize login flow. Please try again.');
      }
    } catch (e) {
      console.error(e);
      alert('Error initiating OAuth. Please try again.');
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="fb-loading-container">
        <Loader2 className="animate-spin text-fb-blue" size={48} />
        <p className="mt-2 text-muted">Retrieving Facebook Page details...</p>
      </div>
    );
  }

  // State: Not Connected
  if (!data || !data.connected) {
    return (
      <div className="facebook-dashboard-page">
        <div className="fb-hero-card">
          <div className="fb-logo-glow">
            <MessageSquare size={42} />
          </div>
          <h1 className="hero-title">Connect Facebook Messenger</h1>
          <p className="hero-subtitle">
            Integrate your Facebook Business Page to sync live customer chats, automate replies via our AI agent, and view Messenger growth trends inside your CRM.
          </p>

          <div className="fb-features-list">
            <div className="feature-item">
              <div className="feature-icon"><MessageCircle size={18} /></div>
              <div>
                <h4>Live Conversation Tracking</h4>
                <p>Monitor recent threads and message counters automatically.</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon"><Users size={18} /></div>
              <div>
                <h4>Audience Growth</h4>
                <p>Observe Page Likes and user growth directly in the CRM.</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon"><TrendingUp size={18} /></div>
              <div>
                <h4>AI Agent Response Rates</h4>
                <p>Track metrics on auto-sent replies and active sessions.</p>
              </div>
            </div>
          </div>

          <button 
            className="btn-fb-connect" 
            onClick={handleConnect} 
            disabled={connecting}
          >
            {connecting ? (
              <>
                <Loader2 className="animate-spin mr-2" size={18} /> Connecting to Meta...
              </>
            ) : (
              'Connect Facebook Page'
            )}
          </button>
        </div>
      </div>
    );
  }

  // State: Connected Dashboard
  const { page, conversations, stats, isMock } = data;

  return (
    <div className="facebook-dashboard-page">
      {/* Upper Profile Section */}
      <div className="fb-header-card">
        <div className="fb-profile-wrapper">
          <div className="fb-avatar-container">
            <img 
              src={page.picture?.data?.url || 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=150&auto=format&fit=crop&q=60'} 
              alt="Facebook Page Avatar" 
              className="fb-avatar-img"
            />
          </div>
          <div className="fb-meta-info">
            <div className="fb-title-row">
              <h2 className="fb-profile-name">{page.name}</h2>
              <span className="fb-badge-business">Facebook Page</span>
            </div>
            <p className="fb-username">@{page.username || 'n/a'}</p>
            <p className="fb-profile-id">ID: <span className="font-mono">{page.id}</span></p>
          </div>
        </div>

        <div className="fb-header-actions">
          {isMock && (
            <div className="mock-disclaimer-badge" title="Meta Sandbox App restricts live metrics until app review is completed. Sandbox mock data is displayed.">
              <AlertCircle size={14} /> Sandbox Mode
            </div>
          )}
          <button className="btn-fb-refresh" onClick={fetchDashboardData}>
            <RefreshCw size={16} /> Sync Live Page
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="fb-stats-grid">
        <div className="fb-stat-card card-blue">
          <div className="fb-card-header">
            <span className="stat-label">Page Likes</span>
            <Users size={20} className="card-icon" />
          </div>
          <p className="stat-number">{page.fan_count.toLocaleString()}</p>
          <span className="stat-growth-tag positive">+2.1% this week</span>
        </div>

        <div className="fb-stat-card card-purple">
          <div className="fb-card-header">
            <span className="stat-label">Conversations</span>
            <MessageSquare size={20} className="card-icon" />
          </div>
          <p className="stat-number">{stats.totalConversations}</p>
          <span className="stat-growth-tag positive">Active Threads</span>
        </div>

        <div className="fb-stat-card card-green">
          <div className="fb-card-header">
            <span className="stat-label">Received Messages</span>
            <MessageCircle size={20} className="card-icon" />
          </div>
          <p className="stat-number">{stats.messagesReceived}</p>
          <span className="stat-growth-tag positive">Customer Inquiries</span>
        </div>

        <div className="fb-stat-card card-orange">
          <div className="fb-card-header">
            <span className="stat-label">AI Response Rate</span>
            <TrendingUp size={20} className="card-icon" />
          </div>
          <p className="stat-number">{stats.responseRate}</p>
          <span className="stat-growth-tag positive">Avg &lt;1m response</span>
        </div>
      </div>

      {/* Analytics Graph & Feed Section */}
      <div className="fb-dashboard-grid mt-2">
        
        {/* Growth Graph Card */}
        <div className="fb-panel-card col-span-2">
          <h3 className="panel-title">Messenger Growth & Chats</h3>
          <p className="panel-subtitle">Chats and messages processed in the last 7 days</p>

          <div className="chart-container-wrapper">
            {/* Custom SVG Area Chart */}
            <svg viewBox="0 0 500 180" className="animated-svg-chart">
              <defs>
                <linearGradient id="fbChartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1877f2" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="10" y1="30" x2="490" y2="30" stroke="rgba(226, 232, 240, 0.08)" strokeDasharray="3" />
              <line x1="10" y1="75" x2="490" y2="75" stroke="rgba(226, 232, 240, 0.08)" strokeDasharray="3" />
              <line x1="10" y1="120" x2="490" y2="120" stroke="rgba(226, 232, 240, 0.08)" strokeDasharray="3" />
              <line x1="10" y1="160" x2="490" y2="160" stroke="rgba(226, 232, 240, 0.2)" />

              {/* Area Path */}
              <path 
                d="M 10 150 Q 90 100 170 115 T 330 60 T 490 30 L 490 160 Z" 
                fill="url(#fbChartGrad)" 
              />

              {/* Line Path */}
              <path 
                d="M 10 150 Q 90 100 170 115 T 330 60 T 490 30" 
                fill="none" 
                stroke="#1877f2" 
                strokeWidth="3.5" 
                strokeLinecap="round"
              />

              {/* Data circles */}
              <circle cx="90" cy="100" r="5" fill="#1877f2" stroke="#fff" strokeWidth="1.5" />
              <circle cx="250" cy="80" r="5" fill="#3b82f6" stroke="#fff" strokeWidth="1.5" />
              <circle cx="410" cy="40" r="5" fill="#8b5cf6" stroke="#fff" strokeWidth="1.5" />
              <circle cx="490" cy="30" r="5" fill="#10b981" stroke="#fff" strokeWidth="1.5" />

              {/* Labels */}
              <text x="10" y="175" fill="#64748b" fontSize="8">Mon</text>
              <text x="90" y="175" fill="#64748b" fontSize="8">Tue</text>
              <text x="170" y="175" fill="#64748b" fontSize="8">Wed</text>
              <text x="250" y="175" fill="#64748b" fontSize="8">Thu</text>
              <text x="330" y="175" fill="#64748b" fontSize="8">Fri</text>
              <text x="410" y="175" fill="#64748b" fontSize="8">Sat</text>
              <text x="470" y="175" fill="#64748b" fontSize="8">Sun</text>
            </svg>
          </div>
        </div>

        {/* Breakdown Widget */}
        <div className="fb-panel-card">
          <h3 className="panel-title">AI Performance</h3>
          <p className="panel-subtitle">Agent messaging activity</p>
          
          <div className="fb-content-breakdown">
            <div className="fb-breakdown-stat">
              <span className="fb-breakdown-title">Total Processed</span>
              <span className="fb-breakdown-number">{stats.messagesSent + stats.messagesReceived}</span>
            </div>
            <div className="fb-progress-bar-minimal">
              <div className="fb-progress-fill" style={{ width: '85%', background: '#1877f2' }}></div>
            </div>

            <div className="fb-breakdown-details-row">
              <div className="fb-sub-stat">
                <span className="fb-sub-label">Sent</span>
                <span className="fb-sub-value">{stats.messagesSent}</span>
              </div>
              <div className="fb-sub-stat">
                <span className="fb-sub-label">Received</span>
                <span className="fb-sub-value">{stats.messagesReceived}</span>
              </div>
              <div className="fb-sub-stat">
                <span className="fb-sub-label">Active Users</span>
                <span className="fb-sub-value">{conversations.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Messenger Conversations */}
      <div className="fb-panel-card mt-2">
        <h3 className="panel-title">Recent Messenger Threads</h3>
        <p className="panel-subtitle">Monitor customer inquiries processed by the AI engine</p>

        <div className="fb-table-container">
          <table className="fb-threads-table">
            <thead>
              <tr>
                <th>Participant</th>
                <th>Conversation ID</th>
                <th>Messages</th>
                <th>Last Active</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {conversations.map((thread: any) => {
                const customerParticipant = thread.participants?.data?.find((p: any) => p.id !== page.id);
                return (
                  <tr key={thread.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="fb-thread-avatar">
                          {customerParticipant?.name?.charAt(0) || 'C'}
                        </div>
                        <span style={{ fontWeight: 600 }}>{customerParticipant?.name || 'Customer'}</span>
                      </div>
                    </td>
                    <td className="font-mono text-muted" style={{ fontSize: '0.8rem' }}>{thread.id}</td>
                    <td>
                      <span className="fb-msg-badge">{thread.message_count || 1} msgs</span>
                    </td>
                    <td>
                      <div className="fb-time-row">
                        <Clock size={12} />
                        {new Date(thread.updated_time).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <a 
                        href={`https://facebook.com/${thread.id}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="fb-action-link"
                      >
                        Open In Messenger <ExternalLink size={12} style={{ marginLeft: '4px' }} />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FacebookDashboard;
