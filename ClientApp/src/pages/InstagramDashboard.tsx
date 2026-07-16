import React, { useEffect, useState } from 'react';
import { instagramService, clientService } from '../services/api';
import { 
  Camera, 
  Users, 
  Layers, 
  TrendingUp, 
  Eye, 
  UserCheck, 
  Loader2, 
  Heart, 
  MessageCircle,
  ExternalLink,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import './InstagramDashboard.css';

const InstagramDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [data, setData] = useState<any>(null);
  const [agentId, setAgentId] = useState<number | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Instagram stats
      const resp = await instagramService.getDashboardData();
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
      console.error('Failed to load Instagram dashboard data:', err);
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
      const response = await instagramService.getAuthUrl(agentId);
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
      <div className="insta-loading-container">
        <Loader2 className="animate-spin text-pink" size={48} />
        <p className="mt-2 text-muted">Retrieving Instagram data...</p>
      </div>
    );
  }

  // State: Not Connected
  if (!data || !data.connected) {
    return (
      <div className="instagram-dashboard-page">
        <div className="insta-hero-card">
          <div className="insta-logo-glow">
            <Camera size={42} />
          </div>
          <h1 className="hero-title">Connect Instagram Business</h1>
          <p className="hero-subtitle">
            Integrate your Instagram Business profile to view real-time audience reach, profile impressions, follower stats, and post analytics right inside your CRM dashboard.
          </p>

          <div className="insta-features-list">
            <div className="feature-item">
              <div className="feature-icon"><Users size={18} /></div>
              <div>
                <h4>Follower Demographics</h4>
                <p>Track follower growth and engagement rates seamlessly.</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon"><TrendingUp size={18} /></div>
              <div>
                <h4>Insights & Reach</h4>
                <p>Monitor impressions, profile views, and overall visibility.</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon"><Layers size={18} /></div>
              <div>
                <h4>Recent Feed Performance</h4>
                <p>Review likes, comments, and engagement on your recent posts.</p>
              </div>
            </div>
          </div>

          <button 
            className="btn-insta-connect" 
            onClick={handleConnect} 
            disabled={connecting}
          >
            {connecting ? (
              <>
                <Loader2 className="animate-spin mr-2" size={18} /> Connecting to Meta...
              </>
            ) : (
              'Connect Instagram Profile'
            )}
          </button>
        </div>
      </div>
    );
  }

  // State: Connected Dashboard
  const { profile, media, insights, isMock } = data;

  return (
    <div className="instagram-dashboard-page">
      {/* Upper Profile Section */}
      <div className="insta-header-card">
        <div className="insta-profile-wrapper">
          <div className="insta-avatar-container">
            <img 
              src={profile.profile_picture_url || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=150&auto=format&fit=crop&q=60'} 
              alt="Instagram Avatar" 
              className="insta-avatar-img"
            />
          </div>
          <div className="insta-meta-info">
            <div className="insta-title-row">
              <h2 className="insta-profile-name">{profile.name}</h2>
              <span className="insta-badge-business">Business Account</span>
            </div>
            <p className="insta-username">@{profile.username}</p>
            <p className="insta-profile-id">ID: <span className="font-mono">{profile.id}</span></p>
          </div>
        </div>

        <div className="insta-header-actions">
          {isMock && (
            <div className="mock-disclaimer-badge" title="Meta Sandbox App restricts live metrics until app review is completed. Sandbox mock data is displayed.">
              <AlertCircle size={14} /> Sandbox Mode
            </div>
          )}
          <button className="btn-insta-refresh" onClick={fetchDashboardData}>
            <RefreshCw size={16} /> Sync Live Data
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="insta-stats-grid">
        <div className="insta-stat-card card-purple">
          <div className="insta-card-header">
            <span className="stat-label">Total Followers</span>
            <Users size={20} className="card-icon" />
          </div>
          <p className="stat-number">{profile.followers_count.toLocaleString()}</p>
          <span className="stat-growth-tag positive">+4.2% this week</span>
        </div>

        <div className="insta-stat-card card-pink">
          <div className="insta-card-header">
            <span className="stat-label">Weekly Reach</span>
            <TrendingUp size={20} className="card-icon" />
          </div>
          <p className="stat-number">{insights.reach.toLocaleString()}</p>
          <span className="stat-growth-tag positive">+12.8% vs last week</span>
        </div>

        <div className="insta-stat-card card-orange">
          <div className="insta-card-header">
            <span className="stat-label">Impressions</span>
            <Eye size={20} className="card-icon" />
          </div>
          <p className="stat-number">{insights.impressions.toLocaleString()}</p>
          <span className="stat-growth-tag positive">+8.5% reach rate</span>
        </div>

        <div className="insta-stat-card card-blue">
          <div className="insta-card-header">
            <span className="stat-label">Profile Views</span>
            <UserCheck size={20} className="card-icon" />
          </div>
          <p className="stat-number">{insights.profile_views.toLocaleString()}</p>
          <span className="stat-growth-tag positive">16.3% click rate</span>
        </div>
      </div>

      {/* Analytics Graph & Feed Section */}
      <div className="insta-dashboard-grid mt-2">
        
        {/* Audience Growth Graph Card */}
        <div className="insta-panel-card col-span-2">
          <h3 className="panel-title">Audience Growth & Engagement</h3>
          <p className="panel-subtitle">Performance analysis for the last 7 days</p>

          <div className="chart-container-wrapper">
            {/* Custom Premium SVG Area Chart */}
            <svg viewBox="0 0 500 180" className="animated-svg-chart">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity="0.4" />
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
                d="M 10 160 Q 90 120 170 135 T 330 70 T 490 50 L 490 160 Z" 
                fill="url(#chartGrad)" 
              />

              {/* Line Path */}
              <path 
                d="M 10 160 Q 90 120 170 135 T 330 70 T 490 50" 
                fill="none" 
                stroke="url(#instaGradientLine)" 
                strokeWidth="3.5" 
                strokeLinecap="round"
              />

              {/* Data point circles */}
              <circle cx="90" cy="120" r="5" fill="#f43f5e" stroke="#fff" strokeWidth="1.5" />
              <circle cx="250" cy="100" r="5" fill="#ec4899" stroke="#fff" strokeWidth="1.5" />
              <circle cx="410" cy="60" r="5" fill="#8b5cf6" stroke="#fff" strokeWidth="1.5" />
              <circle cx="490" cy="50" r="5" fill="#3b82f6" stroke="#fff" strokeWidth="1.5" />

              {/* Linear Gradient for Line */}
              <linearGradient id="instaGradientLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="50%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>

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

        {/* Info stats card */}
        <div className="insta-panel-card">
          <h3 className="panel-title">Content Summary</h3>
          <p className="panel-subtitle">Total post count & types</p>
          
          <div className="content-breakdown">
            <div className="breakdown-stat">
              <span className="breakdown-title">Total Posts</span>
              <span className="breakdown-number">{profile.media_count}</span>
            </div>
            <div className="progress-bar-minimal">
              <div className="progress-fill" style={{ width: '70%', background: 'linear-gradient(90deg, #ec4899, #f43f5e)' }}></div>
            </div>

            <div className="breakdown-details-row">
              <div className="sub-stat">
                <span className="sub-label">Images</span>
                <span className="sub-value">28</span>
              </div>
              <div className="sub-stat">
                <span className="sub-label">Reels</span>
                <span className="sub-value">11</span>
              </div>
              <div className="sub-stat">
                <span className="sub-label">Stories</span>
                <span className="sub-value">3</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Feed Post Grid */}
      <div className="insta-panel-card mt-2">
        <h3 className="panel-title">Recent Feed Performance</h3>
        <p className="panel-subtitle">Review how your latest content is performing live</p>

        <div className="insta-posts-grid">
          {media.map((post: any) => (
            <div key={post.id} className="insta-post-card">
              <div className="post-thumbnail-wrapper">
                <img 
                  src={post.media_url} 
                  alt="Instagram Post Thumbnail" 
                  className="post-thumbnail-img"
                  onError={(e) => {
                    // Fallback in case unsplash/instagram image fails to load
                    (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=300&auto=format&fit=crop&q=60';
                  }}
                />
                
                {/* Hover overlay with likes and comments */}
                <div className="post-hover-overlay">
                  <div className="overlay-metric">
                    <Heart size={16} fill="#fff" />
                    <span>{post.like_count || 0}</span>
                  </div>
                  <div className="overlay-metric">
                    <MessageCircle size={16} fill="#fff" />
                    <span>{post.comments_count || 0}</span>
                  </div>
                  <a 
                    href={post.permalink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="post-external-link"
                    title="View Post on Instagram"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
              
              <div className="post-meta-details">
                <p className="post-caption-text">{post.caption || 'No caption'}</p>
                <span className="post-date-tag">
                  {new Date(post.timestamp).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InstagramDashboard;
