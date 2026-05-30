import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { leadsService, adminService, clientService } from '../services/api';
import { ArrowLeft, Phone, MessageSquare, Plus, X, History } from 'lucide-react';
import './Leads.css';

const Leads: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<any[]>([]);
  const [newLead, setNewLead] = useState({ phoneNumber: '', summary: '', score: 'Manual Entry' });

  const fetchData = async () => {
    try {
      let targetId = id;
      
      if (!targetId) {
        // Client portal mode
        const dashboard = await clientService.getDashboard();
        if (dashboard.customer) {
          targetId = dashboard.customer.whatsAppNumber;
          setCustomer(dashboard.customer);
          const leadsData = await leadsService.getLeads(targetId!);
          setLeads(leadsData);
        }
      } else {
        // Admin portal mode
        const [leadsData, customers] = await Promise.all([
          leadsService.getLeads(targetId),
          adminService.getCustomers()
        ]);
        setLeads(leadsData);
        setCustomer(customers.find((c: any) => c.whatsAppNumber === targetId));
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = id || customer?.whatsAppNumber;
    if (!targetId) return;
    try {
      const created = await leadsService.createLead({
        customerId: targetId,
        ...newLead
      });
      setLeads([created, ...leads]);
      setIsModalOpen(false);
      setNewLead({ phoneNumber: '', summary: '', score: 'Manual Entry' });
    } catch (error) {
      console.error('Failed to create lead:', error);
    }
  };

  // Group leads by phone number, since backend orders by date DESC, the first one is the newest
  const groupedLeads = useMemo(() => {
    const map = new Map<string, any[]>();
    leads.forEach((l) => {
      const arr = map.get(l.phoneNumber) || [];
      arr.push(l);
      map.set(l.phoneNumber, arr);
    });
    return Array.from(map.values());
  }, [leads]);

  if (loading) return <div className="loading">Loading Leads Center...</div>;

  return (
    <div className="leads-page">
      <div style={{ marginBottom: '1.5rem' }}>
        {id ? (
          <Link to={`/clients/${id}`} className="btn-secondary btn-sm" style={{ display: 'inline-flex', width: 'auto' }}>
            <ArrowLeft size={16} style={{ marginRight: '4px' }} /> Back to 360 View
          </Link>
        ) : (
          <Link to="/" className="btn-secondary btn-sm" style={{ display: 'inline-flex', width: 'auto' }}>
            <ArrowLeft size={16} style={{ marginRight: '4px' }} /> Back to Dashboard
          </Link>
        )}
      </div>

      <div className="white-box">
        <div className="box-header">
          <h2 className="box-title">Captured Leads ({groupedLeads.length})</h2>
          <button className="icon-btn-circle orange" onClick={() => setIsModalOpen(true)} title="Add Lead Manually">
            <Plus size={20} />
          </button>
        </div>

        <div className="table-responsive">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Phone</th>
                <th>AI Summary</th>
                <th>Score</th>
                <th>Last Message</th>
                <th className="text-right">History</th>
              </tr>
            </thead>
            <tbody>
              {groupedLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state">
                    No leads captured yet.
                  </td>
                </tr>
              ) : (
                groupedLeads.map((group) => {
                  const mainLead = group[0];
                  return (
                  <tr key={mainLead.id}>
                    <td className="lead-phone">
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-muted" />
                        {mainLead.phoneNumber}
                      </div>
                    </td>
                    <td className="lead-summary">
                      <div className="flex items-start gap-2">
                        <MessageSquare size={14} className="text-muted mt-1 shrink-0" />
                        <span>{mainLead.summary}</span>
                      </div>
                    </td>
                    <td>
                      <span className="tag">{mainLead.score}</span>
                    </td>
                    <td className="lead-time">
                      {new Date(mainLead.lastMessageAt).toLocaleString()}
                    </td>
                    <td className="text-right">
                      {group.length > 1 ? (
                        <button 
                          className="icon-btn edit" 
                          title="View History"
                          onClick={() => {
                            setSelectedHistory(group);
                            setIsHistoryModalOpen(true);
                          }}
                        >
                          <History size={16} /> ({group.length})
                        </button>
                      ) : (
                        <span className="text-muted" style={{ fontSize: '0.8rem' }}>1 Entry</span>
                      )}
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content white-box">
            <button className="modal-close" onClick={() => setIsModalOpen(false)}>
              <X size={20} />
            </button>
            <h2 className="box-title">Add Lead Manually</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  required 
                  placeholder="e.g. +1234567890"
                  value={newLead.phoneNumber}
                  onChange={(e) => setNewLead({ ...newLead, phoneNumber: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Summary / Notes</label>
                <textarea 
                  className="glass-input textarea-sm" 
                  rows={3} 
                  placeholder="Notes about this lead..."
                  value={newLead.summary}
                  onChange={(e) => setNewLead({ ...newLead, summary: e.target.value })}
                ></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">Score / Tag</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  required 
                  placeholder="e.g. High Intent, General Inquiry"
                  value={newLead.score}
                  onChange={(e) => setNewLead({ ...newLead, score: e.target.value })}
                />
              </div>
              <button type="submit" className="btn-primary block">Add Lead</button>
            </form>
          </div>
        </div>
      )}

      {isHistoryModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content white-box" style={{ maxWidth: '700px' }}>
            <button className="modal-close" onClick={() => setIsHistoryModalOpen(false)}>
              <X size={20} />
            </button>
            <h2 className="box-title mb-1">
              History for {selectedHistory[0]?.phoneNumber}
            </h2>
            <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Score / Tag</th>
                    <th>Summary / Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedHistory.map(entry => (
                    <tr key={entry.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{new Date(entry.lastMessageAt).toLocaleString()}</td>
                      <td><span className="tag">{entry.score}</span></td>
                      <td className="lead-summary">{entry.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
