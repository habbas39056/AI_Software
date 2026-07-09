import React, { useEffect, useState } from 'react';
import { clientService } from '../services/api';
import { 
  MessageSquare,
  Users,
  Clock, 
  DollarSign, 
  CalendarClock,
  AlertTriangle,
  Activity
} from 'lucide-react';
import RecentWins from '../components/RecentWins';
import FollowUpsWidget from '../components/FollowUpsWidget';
import GoalProgressBar from '../components/GoalProgressBar';
import { formatCurrency } from '../utils/currencyUtils';
import './Dashboard.css';

const ClientDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const dashboardData = await clientService.getDashboard();
      setData(dashboardData);
    } catch (error) {
      console.error('Failed to fetch client dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const chartData = React.useMemo(() => {
    if (!data?.customer?.leads || data.customer.leads.length === 0) return [];

    console.log('LEADS DATA:', JSON.stringify(data.customer.leads));

    const dataMap: Record<string, number> = {};
    let minDate = new Date();
    const seenPhones = new Set<string>();
    
    data.customer.leads.forEach((l: any) => {
      if (l.phoneNumber) {
        if (seenPhones.has(l.phoneNumber)) return;
        seenPhones.add(l.phoneNumber);
      }

      const rawDate = l.lastMessageAt || l.LastMessageAt || l.createdAt || l.CreatedAt || new Date().toISOString();
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return; // skip invalid dates
      if (d < minDate) minDate = d;
      
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dataMap[dateStr] = (dataMap[dateStr] || 0) + 1;
    });

    // Fill in missing dates between minDate and today
    const dates: string[] = [];
    const currentDate = new Date(minDate);
    currentDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    while (currentDate <= today) {
      const dateStr = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dates.push(dateStr);
      if (dataMap[dateStr] === undefined) {
        dataMap[dateStr] = 0;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const result = dates.map(date => ({
      name: date,
      leads: dataMap[date]
    }));
    console.log('CHART DATA:', JSON.stringify(result));
    return result;
  }, [data?.customer?.leads]);

  if (loading) return <div className="loading">Loading Client Dashboard...</div>;
  if (!data) return <div className="loading">Error: Could not load dashboard data.</div>;
  if (data?.blocked) return (
    <div className="locked-screen">
      <AlertTriangle size={64} className="text-danger mb-2" />
      <h1>Account Suspended</h1>
      <p>Your subscription has expired or been suspended. Please contact support.</p>
    </div>
  );

  const { customer, stats } = data;
  const isUrgent = stats?.daysLeft <= 7;


  return (
    <div className="dashboard-page">
      {isUrgent && (
        <div className="critical-alert-banner mb-2">
          <div className="alert-content">
            <AlertTriangle size={24} className="alert-icon" />
            <div>
              <strong>{stats.daysLeft <= 0 ? 'CRITICAL: Subscription Expired!' : `CRITICAL: Only ${stats.daysLeft} day(s) remaining!`}</strong>
              <p>Your portal will be BLOCKED {stats.daysLeft <= 0 ? 'immediately' : 'when your subscription expires'}. Please pay immediately to avoid service interruption.</p>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', gap: '1rem', alignItems: 'center' }}>
        {stats.alertLevel !== 'none' && (
          <div className={`alert-badge ${stats.alertLevel}`}>
            <Clock size={16} />
            {stats.daysLeft} days remaining
          </div>
        )}
      </div>

      <div className="stat-cards-grid">
        <div className="stat-card blue">
          <div className="stat-header">
            <h3 className="stat-title">Total Messages</h3>
            <MessageSquare size={20} className="stat-icon" />
          </div>
          <p className="stat-value">{stats.totalMessages}</p>
        </div>
        <div className="stat-card green">
          <div className="stat-header">
            <h3 className="stat-title">Leads Captured</h3>
            <Users size={20} className="stat-icon" />
          </div>
          <p className="stat-value">{stats.leadsCaptured}</p>
        </div>
        <div className="stat-card orange">
          <div className="stat-header">
            <h3 className="stat-title">Deal Value</h3>
            <DollarSign size={20} className="stat-icon" />
          </div>
          <p className="stat-value">{formatCurrency(stats.totalDealValue || 0, data?.customer?.currency)}</p>
        </div>
        <div className="stat-card purple">
          <div className="stat-header">
            <h3 className="stat-title">Follow-ups</h3>
            <CalendarClock size={20} className="stat-icon" />
          </div>
          <p className="stat-value">{stats.followUpsCount}</p>
        </div>
      </div>

      <GoalProgressBar target={stats.monthlyGoal || 0} received={stats.receivedAmount || 0} currency={data?.customer?.currency} />

      <div className="main-grid mt-2">
        <div className="white-box">
          <h2 className="box-title mb-2"><Activity size={20} className="text-blue" /> Leads Over Time (All Time)</h2>
          <div className="leads-chart-container">
            {chartData.length > 0 ? chartData.map((d, index) => {
              const maxLeads = Math.max(...chartData.map(c => c.leads), 1);
              const heightPercent = (d.leads / maxLeads) * 100;
              return (
                <div 
                  key={index} 
                  title={`${d.name} — ${d.leads} lead${d.leads !== 1 ? 's' : ''}`}
                  className="leads-chart-bar-wrap"
                >
                  <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <div 
                      style={{ 
                        width: 'min(100%, 40px)', 
                        height: `${Math.max(heightPercent, 2)}%`, 
                        background: d.leads > 0 
                          ? 'linear-gradient(to top, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.9))' 
                          : 'rgba(200, 200, 200, 0.15)',
                        borderRadius: '4px 4px 0 0',
                        position: 'relative',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.filter = 'brightness(1.4)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.filter = 'brightness(1)'; }}
                    >
                      {d.leads > 0 && (
                        <span style={{ 
                          position: 'absolute', 
                          top: '-20px', 
                          left: '50%', 
                          transform: 'translateX(-50%)', 
                          fontSize: '12px', 
                          fontWeight: 'bold', 
                          color: '#10B981'
                        }}>
                          {d.leads}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '11px', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center' }}>
                    {d.name}
                  </div>
                </div>
              );
            }) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#888' }}>
                No graph data available
              </div>
            )}
            {/* Horizontal Axis Line */}
            <div style={{ position: 'absolute', bottom: '30px', left: 10, right: 10, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
          </div>
        </div>

        <div className="white-box">
          <h2 className="box-title">Recent Conversations</h2>
          <div className="table-responsive">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Phone</th>
                  <th>Name</th>
                  <th>Summary</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {[...(customer.leads || [])]
                  .sort((a, b) => new Date(b.lastMessageAt || b.createdAt || 0).getTime() - new Date(a.lastMessageAt || a.createdAt || 0).getTime())
                  .slice(0, 5)
                  .map((l: any) => (
                  <tr key={l.id}>
                    <td className="font-mono">{l.phoneNumber}</td>
                    <td>{l.name || 'Unknown'}</td>
                    <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={l.summary}>
                      {l.summary || 'No summary'}
                    </td>
                    <td>
                      <span className={`badge ${
                        l.status?.toLowerCase() === 'won' ? 'won' :
                        l.status?.toLowerCase() === 'lost' ? 'lost' :
                        'active'
                      }`}>
                        {l.status || 'Engaged'}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!customer.leads || customer.leads.length === 0) && (
                  <tr>
                    <td colSpan={4} className="empty-state">No conversations yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <div className="main-wrapper mt-2">
        {/* Follow-ups Due Widget */}
        <FollowUpsWidget leads={data?.customer?.leads || []} />
        
        {/* Recent Wins Widget */}
        <RecentWins leads={data?.customer?.leads || []} />
      </div>
    </div>
  );
};

export default ClientDashboard;
