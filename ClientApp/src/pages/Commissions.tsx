import React, { useEffect, useState } from 'react';
import { teamService, clientService } from '../services/api';
import { formatCurrency } from '../utils/currencyUtils';
import './Commissions.css';

const Commissions: React.FC = () => {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [currency, setCurrency] = useState<string>('USD');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [data, settings] = await Promise.all([
          teamService.getCommissions(),
          clientService.getSettings().catch(() => ({}))
        ]);
        setCommissions(data);
        if (settings?.currency) setCurrency(settings.currency);
      } catch (error) {
        console.error('Failed to fetch commissions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalPayments = commissions.reduce((sum, c) => sum + (c.payment || 0), 0);
  const totalCommissions = commissions.reduce((sum, c) => sum + (c.commission || 0), 0);

  if (loading) return <div className="loading">Loading Commissions...</div>;

  return (
    <div className="commissions-page">
      <div className="commissions-stats-row">
        <div className="commissions-stat-card">
          <span className="commissions-stat-value">{commissions.length}</span>
          <span className="commissions-stat-label">Total Transactions</span>
        </div>
        <div className="commissions-stat-card">
          <span className="commissions-stat-value">{formatCurrency(totalPayments, currency)}</span>
          <span className="commissions-stat-label">Total Payments Received</span>
        </div>
        <div className="commissions-stat-card">
          <span className="commissions-stat-value" style={{ color: '#10b981' }}>{formatCurrency(totalCommissions, currency)}</span>
          <span className="commissions-stat-label">Total Commissions Due</span>
        </div>
      </div>

      <div className="white-box" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table className="glass-table commissions-table">
            <thead>
              <tr>
                <th>AGENT</th>
                <th>CLIENT</th>
                <th>SERVICE</th>
                <th>PAYMENT</th>
                <th>RATE</th>
                <th>COMMISSION</th>
                <th>MONTH</th>
              </tr>
            </thead>
            <tbody>
              {commissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">No commissions</td>
                </tr>
              ) : (
                commissions.map((c, index) => (
                  <tr key={`${c.id}-${index}`}>
                    <td className="font-medium text-slate-800">{c.agent}</td>
                    <td className="text-slate-600">{c.client}</td>
                    <td className="text-slate-500">{c.service}</td>
                    <td className="font-medium">{formatCurrency(c.payment, currency)}</td>
                    <td className="text-slate-500">{c.rate}%</td>
                    <td className="font-bold text-emerald-500">{formatCurrency(c.commission, currency)}</td>
                    <td className="text-slate-500">{c.month}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Commissions;
