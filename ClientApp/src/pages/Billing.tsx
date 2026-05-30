import React, { useEffect, useState } from 'react';
import { adminService } from '../services/api';
import { User, Ban, CheckCircle, RefreshCcw } from 'lucide-react';
import './Billing.css';

const Billing: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const data = await adminService.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    if (newStatus === 'Suspended' && !window.confirm('Block this client portal?')) return;
    try {
      await adminService.toggleSubscription(id, newStatus);
      fetchData();
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const handleRenew = async (id: string, days: number, fee: number) => {
    try {
      await adminService.renewSubscription(id, days, fee);
      fetchData();
      alert('Subscription renewed!');
    } catch (error) {
      console.error('Failed to renew:', error);
    }
  };

  if (loading) return <div className="loading">Loading Billing Management...</div>;

  const activeCount = customers.filter(c => c.subscriptionStatus === 'Active').length;
  const suspendedCount = customers.filter(c => c.subscriptionStatus === 'Suspended').length;
  const warningCount = customers.filter(c => {
    if (!c.subscriptionExpiry) return false;
    const daysLeft = Math.ceil((new Date(c.subscriptionExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 10 && daysLeft > 0;
  }).length;
  const totalRevenue = customers.filter(c => c.subscriptionStatus === 'Active').reduce((sum, c) => sum + Number(c.monthlyFee || 0), 0);

  return (
    <div className="billing-page">


      <div className="stat-cards-grid mb-2">
        <div className="stat-card green">
          <div className="stat-header">
            <h3 className="stat-title">Active Clients</h3>
          </div>
          <p className="stat-value">{activeCount}</p>
        </div>
        <div className="stat-card orange">
          <div className="stat-header">
            <h3 className="stat-title">Expiring Soon (≤10d)</h3>
          </div>
          <p className="stat-value">{warningCount}</p>
        </div>
        <div className="stat-card danger">
          <div className="stat-header">
            <h3 className="stat-title">Suspended</h3>
          </div>
          <p className="stat-value">{suspendedCount}</p>
        </div>
        <div className="stat-card blue">
          <div className="stat-header">
            <h3 className="stat-title">Monthly Revenue (PKR)</h3>
          </div>
          <p className="stat-value">{totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      <div className="white-box no-padding">
        <div className="table-responsive">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Status</th>
                <th>Days Left</th>
                <th>Expiry</th>
                <th>Fee (PKR)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const daysLeft = c.subscriptionExpiry ? Math.max(0, Math.ceil((new Date(c.subscriptionExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
                const isSuspended = c.subscriptionStatus === 'Suspended';
                const isWarning = daysLeft <= 10 && daysLeft > 0;
                const isCritical = daysLeft <= 3 && daysLeft >= 0;
                
                const rowClass = isSuspended ? 'row-suspended' : isCritical ? 'row-critical' : isWarning ? 'row-warning' : '';
                const statusColor = isSuspended ? '#ef4444' : isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#10B981';

                return (
                  <tr key={c.whatsAppNumber} className={rowClass}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          {c.name ? c.name.substring(0, 1) : <User size={14} />}
                        </div>
                        <div>
                          <span className="block font-semibold">{c.name}</span>
                          <span className="text-xs text-muted">{c.whatsAppNumber}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="status-pill" style={{ 
                        color: statusColor, 
                        background: `${statusColor}15`,
                        borderColor: `${statusColor}30`
                      }}>
                        <span className="dot" style={{ background: statusColor }}></span>
                        {c.subscriptionStatus}
                      </span>
                    </td>
                    <td>
                      <span className="font-bold text-lg" style={{ color: statusColor }}>{daysLeft}</span>
                      <span className="text-xs text-muted"> days</span>
                    </td>
                    <td className="text-sm text-secondary">
                      {c.subscriptionExpiry ? new Date(c.subscriptionExpiry).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'N/A'}
                    </td>
                    <td className="font-semibold">{(c.monthlyFee || 0).toLocaleString()}</td>
                    <td>
                      <div className="flex gap-2">
                        {isSuspended || daysLeft <= 0 ? (
                          <button 
                            className="btn-success-sm" 
                            onClick={() => handleRenew(c.whatsAppNumber, c.subscriptionDays || 30, c.monthlyFee || 14000)}
                          >
                            <RefreshCcw size={14} /> Renew
                          </button>
                        ) : (
                          <button 
                            className="btn-danger-sm" 
                            onClick={() => handleToggleStatus(c.whatsAppNumber, c.subscriptionStatus)}
                          >
                            <Ban size={14} /> Block
                          </button>
                        )}
                        {isSuspended && (
                          <button 
                            className="btn-success-sm" 
                            onClick={() => handleToggleStatus(c.whatsAppNumber, c.subscriptionStatus)}
                          >
                            <CheckCircle size={14} /> Unblock
                          </button>
                        )}
                      </div>
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

export default Billing;
