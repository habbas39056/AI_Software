import React, { useEffect, useState } from 'react';
import { clientService } from '../services/api';
import { Info, CheckCircle2, History, MessageSquare } from 'lucide-react';
import './ClientBilling.css';

const ClientBilling: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await clientService.getDashboard();
        setData(response);
      } catch (error) {
        console.error('Failed to fetch billing data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="loading">Loading Subscription Details...</div>;
  if (!data) return <div className="error">Failed to load data.</div>;

  const { customer, stats } = data;
  const daysLeft = stats.daysLeft;
  const totalDays = customer.subscriptionDays || 30;
  const percentage = Math.max(0, Math.min(100, (daysLeft / totalDays) * 100));
  
  const isExpired = daysLeft <= 0;
  const isUrgent = daysLeft <= 7 && daysLeft > 0;
  const statusColor = (customer.subscriptionStatus === 'Active' && !isExpired) ? '#10B981' : '#EF4444';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="client-billing-page">


      <div className="billing-grid mt-2">
        <div className="white-box billing-main">
          <h2 className="box-title">Subscription Overview</h2>
          
          <div className="plan-header mt-2">
            <div>
              <h3 className="plan-name">Enterprise AI Plan</h3>
              <span className="plan-status" style={{ color: statusColor }}>
                Status: {isExpired ? 'Suspended (Expired)' : customer.subscriptionStatus}
              </span>
            </div>
            <div className="plan-price">
              <span className="amount">{formatCurrency(customer.monthlyFee || 0)}</span>
              <span className="cycle">per cycle ({totalDays} days)</span>
            </div>
          </div>

          <div className="usage-section mt-3">
            <div className="usage-header">
              <span className="usage-label">SUBSCRIPTION USAGE</span>
              <span className={`usage-days ${isUrgent || isExpired ? 'urgent' : ''}`}>
                {isExpired ? 'EXPIRED' : `${daysLeft} DAYS REMAINING`}
              </span>
            </div>
            <div className="progress-bar-bg">
              <div 
                className={`progress-bar-fill ${isUrgent || isExpired ? 'urgent' : ''}`} 
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>

          <div className="details-list mt-2">
            <div className="detail-item">
              <span className="detail-label">Subscription Started</span>
              <span className="detail-value">{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Expiry Date</span>
              <span className="detail-value">{customer.subscriptionExpiry ? new Date(customer.subscriptionExpiry).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }) : 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Assigned Days</span>
              <span className="detail-value">{totalDays} days</span>
            </div>
          </div>

          {(isUrgent || isExpired) && (
            <div className="urgent-alert mt-2">
              <Info size={18} />
              <div>
                <strong>{isExpired ? 'PORTAL SUSPENDED!' : `URGENT: ${daysLeft} day(s) remaining!`}</strong>
                <p>{isExpired ? 'Your access has been blocked. Please renew your plan to continue using the AI agent.' : 'Your portal will be BLOCKED after expiry. Pay now to avoid losing access.'}</p>
              </div>
            </div>
          )}

          <button className="btn-renew-contact mt-2">
            <MessageSquare size={18} /> Contact Admin to Renew
          </button>
        </div>

        <div className="billing-sidebar">
          <div className="white-box mb-2">
            <h2 className="box-title">Plan Features</h2>
            <ul className="features-list mt-1">
              <li><CheckCircle2 size={18} className="text-success" /> Unlimited Messages & Leads</li>
              <li><CheckCircle2 size={18} className="text-success" /> Unlimited Knowledge Base Rules</li>
              <li><CheckCircle2 size={18} className="text-success" /> AI Agent Auto-Responses (24/7)</li>
              <li><CheckCircle2 size={18} className="text-success" /> Priority SLA Support</li>
            </ul>
          </div>

          <div className="white-box">
            <h2 className="box-title">Billing History</h2>
            <div className="empty-history mt-2">
              <History size={48} className="text-muted mb-1" />
              <p>Billing history will appear here after your first renewal cycle.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientBilling;
