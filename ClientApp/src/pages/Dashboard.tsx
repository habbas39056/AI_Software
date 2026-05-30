import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, MessageSquare, CreditCard, ArrowUpRight } from 'lucide-react';
import { adminService } from '../services/api';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dashboardData = await adminService.getDashboardData();
        setData(dashboardData);
      } catch (error: any) {
        console.error('Failed to fetch dashboard data:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  
  if (!data) return (
    <div className="error-container">
      <div className="error-box">
        <h2>Connection Error</h2>
        <p>The frontend cannot connect to the backend API.</p>
        <button onClick={() => window.location.reload()} className="btn-primary mt-1">Retry Connection</button>
      </div>
    </div>
  );

  const stats = data.stats || { totalClients: 0, activeAgents: 0, totalAgents: 0, estimatedRevenue: 0 };
  const customers = data.customers || [];

  return (
    <div className="dashboard-page">
      <div className="stat-cards-grid">
        <div className="stat-card blue">
          <div className="stat-header">
            <h3 className="stat-title">Total Clients</h3>
            <div className="stat-icon-wrapper">
              <Users size={16} />
            </div>
          </div>
          <p className="stat-value">{stats.totalClients}</p>
          <div className="stat-change positive">
            <ArrowUpRight size={14} />
            12.5% <span>vs last month</span>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-header">
            <h3 className="stat-title">Active Agents</h3>
            <div className="stat-icon-wrapper">
              <UserPlus size={16} />
            </div>
          </div>
          <p className="stat-value">{stats.activeAgents}</p>
          <div className="stat-change positive">
            <ArrowUpRight size={14} />
            8.2% <span>vs last month</span>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-header">
            <h3 className="stat-title">Total Agents</h3>
            <div className="stat-icon-wrapper">
              <MessageSquare size={16} />
            </div>
          </div>
          <p className="stat-value">{stats.totalAgents}</p>
          <div className="stat-change positive">
            <ArrowUpRight size={14} />
            24.1% <span>vs last month</span>
          </div>
        </div>

        <div className="stat-card blue">
          <div className="stat-header">
            <h3 className="stat-title">Revenue</h3>
            <div className="stat-icon-wrapper">
              <CreditCard size={16} />
            </div>
          </div>
          <p className="stat-value">₨ {stats.estimatedRevenue.toLocaleString()}</p>
          <div className="stat-change positive">
            <ArrowUpRight size={14} />
            15.3% <span>vs last month</span>
          </div>
        </div>
      </div>

      <div className="main-wrapper">
        <div className="white-box">
          <h2 className="box-title">Recent Clients</h2>
          <p className="box-subtitle">Monitor your latest AI agent interactions and client signups.</p>
          
          <div className="glass-table-container">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Expiry</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c: any) => (
                  <tr key={c.whatsAppNumber}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="avatar-sm">{c.name?.substring(0,1)}</div>
                        <span>{c.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${c.subscriptionStatus?.toLowerCase()}`}>
                        {c.subscriptionStatus}
                      </span>
                    </td>
                    <td>{new Date(c.subscriptionExpiry).toLocaleDateString()}</td>
                    <td>
                      <button className="btn-text" onClick={() => navigate(`/clients/${c.whatsAppNumber}`)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="white-box">
          <h2 className="box-title">Quick Actions</h2>
          <p className="box-subtitle">Common tasks you can perform quickly.</p>
          
          <div className="action-grid-vertical">
            <button className="action-card-btn" onClick={() => navigate('/onboarding')}>
              <UserPlus size={18} />
              Add New Client
            </button>
            <button className="action-card-btn" onClick={() => navigate('/clients')}>
              <Users size={18} />
              Manage All Clients
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
