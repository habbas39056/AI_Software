import React, { useEffect, useState } from 'react';
import { X, Plus, StickyNote, CalendarClock, Phone, Mail, Users } from 'lucide-react';
import { leadsService, clientService, teamService, authService } from '../services/api';
import { formatCurrency } from '../utils/currencyUtils';

const STATUS_OPTIONS = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
const SERVICE_OPTIONS = ['Select...', 'Web Design', 'SEO', 'Social Media', 'Google Ads', 'App Development', 'Branding', 'Consulting', 'Other'];
const ACTIVITY_TYPES = [
  { value: 'call', label: 'Call', icon: <Phone size={14} /> },
  { value: 'email', label: 'Email', icon: <Mail size={14} /> },
  { value: 'meeting', label: 'Meeting', icon: <Users size={14} /> },
  { value: 'note', label: 'Note', icon: <StickyNote size={14} /> },
  { value: 'follow-up', label: 'Follow-up', icon: <CalendarClock size={14} /> },
];

interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any | null;
  onSave: () => void;
}

const LeadFormModal: React.FC<LeadFormModalProps> = ({ isOpen, onClose, lead, onSave }) => {
  const [customer, setCustomer] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);

  const [form, setForm] = useState({
    name: '', businessName: '', phoneNumber: '', email: '', service: 'Select...',
    dealValue: '', status: 'New', assignedTo: 'AI Agent', followUpDate: '',
    city: '', lossReason: '', summary: '', score: 'Manual Entry'
  });
  
  const [paymentForm, setPaymentForm] = useState({ amount: '', date: '', note: '' });
  const [activityForm, setActivityForm] = useState({ type: 'note', note: '', newFollowUpDate: '' });
  const [localLead, setLocalLead] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalLead(lead);
      if (lead) {
        setForm({
          name: lead.name || '', businessName: lead.businessName || '', phoneNumber: lead.phoneNumber || '',
          email: lead.email || '', service: lead.service || 'Select...', dealValue: lead.dealValue?.toString() || '',
          status: lead.status || 'New', assignedTo: lead.assignedTo || 'AI Agent',
          followUpDate: lead.followUpDate ? lead.followUpDate.split('T')[0] : '',
          city: lead.city || '', lossReason: lead.lossReason || '', summary: lead.summary || '',
          score: lead.score || ''
        });
      } else {
        setForm({
          name: '', businessName: '', phoneNumber: '', email: '', service: 'Select...',
          dealValue: '', status: 'New', assignedTo: 'AI Agent', followUpDate: '',
          city: '', lossReason: '', summary: '', score: 'Manual Entry'
        });
      }
    }
  }, [isOpen, lead]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchLookups = async () => {
      try {
        const [userResp, teamResp, settingsResp] = await Promise.all([
          authService.getCurrentUser(),
          teamService.getMembers().catch(() => []),
          clientService.getSettings().catch(() => null)
        ]);
        setCurrentUser(userResp);
        setTeamMembers(teamResp);
        setCustomer(settingsResp);
      } catch (e) {
        console.error('Failed to load lookups for lead modal', e);
      } finally {
        setLoadingData(false);
      }
    };
    fetchLookups();
  }, [isOpen]);

  const isTeamMemberUser = currentUser?.role === 'TeamMember';
  const userDisplayName = currentUser?.name || currentUser?.username || 'Me';
  const assignedOptions = isTeamMemberUser 
    ? [userDisplayName]
    : ['AI Agent', ...teamMembers.filter(m => m.isActive).map(m => m.fullName)];

  // Ensure default assignedTo is set correctly for team members
  useEffect(() => {
    if (!lead && isTeamMemberUser && form.assignedTo === 'AI Agent') {
      setForm(prev => ({ ...prev, assignedTo: userDisplayName }));
    }
  }, [lead, isTeamMemberUser, userDisplayName, form.assignedTo]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form, dealValue: form.dealValue ? parseFloat(form.dealValue) : null };
      if (lead) {
        await leadsService.updateLead(lead.id, payload);
      } else {
        // Find a way to get customerId if creating new (assume logged in user's customerId or from settings)
        await leadsService.createLead({ customerId: currentUser?.customerId || customer?.whatsAppNumber, ...payload });
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to save lead:', error);
    }
  };

  const handleRecordPayment = async () => {
    if (!localLead || !paymentForm.amount || !paymentForm.date) return;
    try {
      const payment = await leadsService.recordPayment(localLead.id, {
        amount: parseFloat(paymentForm.amount), date: paymentForm.date, note: paymentForm.note
      });
      setLocalLead((prev: any) => ({ ...prev, payments: [...(prev.payments || []), payment] }));
      setPaymentForm({ amount: '', date: '', note: '' });
      onSave(); // notify parent to refresh if needed
    } catch (error) { console.error('Failed to record payment:', error); }
  };

  const handleLogActivity = async () => {
    if (!localLead || !activityForm.note) return;
    try {
      const activity = await leadsService.logActivity(localLead.id, {
        type: activityForm.type, note: activityForm.note,
        newFollowUpDate: activityForm.newFollowUpDate || undefined
      });
      setLocalLead((prev: any) => {
        const updated = { ...prev, activities: [activity, ...(prev.activities || [])] };
        if (activityForm.newFollowUpDate) updated.followUpDate = activityForm.newFollowUpDate;
        return updated;
      });
      setActivityForm({ type: 'note', note: '', newFollowUpDate: '' });
      onSave(); // notify parent
    } catch (error) { console.error('Failed to log activity:', error); }
  };

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content white-box lead-form-modal">
        <button className="modal-close" onClick={onClose}><X size={20} /></button>
        <h2 className="box-title">{lead ? 'Edit Lead' : 'Add Lead'}</h2>

        {loadingData ? <div style={{ padding: '20px' }}>Loading...</div> : (
          <>
            <form onSubmit={handleFormSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">CLIENT NAME <span className="required">*</span></label>
                  <input type="text" className="glass-input" required placeholder="Muhammad Rehan" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">BUSINESS NAME</label>
                  <input type="text" className="glass-input" placeholder="FGI FG Industrial Equipments pvt ltd" value={form.businessName}
                    onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">WHATSAPP</label>
                  <input type="text" className="glass-input" required placeholder="0321 2392308" value={form.phoneNumber}
                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">EMAIL</label>
                  <input type="email" className="glass-input" placeholder="email@example.com" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">SERVICE</label>
                  <select className="glass-input" value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}>
                    {SERVICE_OPTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">DEAL VALUE</label>
                  <input type="number" className="glass-input" placeholder="50000.00" value={form.dealValue}
                    onChange={(e) => setForm({ ...form, dealValue: e.target.value })} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">STATUS</label>
                  <select className="glass-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">ASSIGNED TO</label>
                  <select className="glass-input" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
                    {assignedOptions.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">FOLLOW-UP DATE</label>
                  <input type="date" className="glass-input" value={form.followUpDate}
                    onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">CITY</label>
                  <input type="text" className="glass-input" placeholder="Karachi" value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">LOSS REASON</label>
                <input type="text" className="glass-input" placeholder="If lost, why?" value={form.lossReason}
                  onChange={(e) => setForm({ ...form, lossReason: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">NOTES / SUMMARY</label>
                <textarea className="glass-input" rows={3} placeholder="Key points, client requirements, follow-up details..."
                  value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })}></textarea>
              </div>

              <button type="submit" className="btn-primary block">{lead ? 'Save Changes' : 'Add Lead'}</button>
            </form>

            {lead && localLead && (
              <div className="form-section">
                <h3 className="section-title">PAYMENTS RECEIVED</h3>
                {(!localLead.payments || localLead.payments.length === 0) ? (
                  <p className="empty-text">No payments yet</p>
                ) : (
                  <div className="payments-list">
                    {localLead.payments.map((p: any) => (
                      <div key={p.id} className="payment-row">
                        <span className="payment-amount">{formatCurrency(p.amount, customer?.currency)}</span>
                        <span className="payment-date">{formatDate(p.date)}</span>
                        <span className="payment-note">{p.note || ''}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="payment-form-inline">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">AMOUNT</label>
                      <input type="number" className="glass-input" placeholder="50000" value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">DATE</label>
                      <input type="date" className="glass-input" value={paymentForm.date}
                        onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">NOTE</label>
                    <input type="text" className="glass-input" placeholder="Advance, 50% etc." value={paymentForm.note}
                      onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })} />
                  </div>
                  <button type="button" className="btn-record-payment" onClick={handleRecordPayment}>
                    <Plus size={14} /> Record Payment
                  </button>
                </div>
              </div>
            )}

            {lead && localLead && (
              <div className="form-section">
                <h3 className="section-title">LOG ACTIVITY</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">TYPE</label>
                    <select className="glass-input" value={activityForm.type}
                      onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })}>
                      {ACTIVITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">NEW FOLLOW-UP DATE</label>
                    <input type="date" className="glass-input" value={activityForm.newFollowUpDate}
                      onChange={(e) => setActivityForm({ ...activityForm, newFollowUpDate: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">DESCRIPTION</label>
                  <textarea className="glass-input" rows={2} placeholder="What happened?" value={activityForm.note}
                    onChange={(e) => setActivityForm({ ...activityForm, note: e.target.value })}></textarea>
                </div>
                <button type="button" className="btn-text" onClick={handleLogActivity} style={{ marginBottom: '1rem' }}>
                  <Plus size={14} /> Log Activity
                </button>

                {localLead.activities && localLead.activities.length > 0 && (
                  <>
                    <h3 className="section-title" style={{ marginTop: '0.5rem' }}>HISTORY</h3>
                    <div className="activity-timeline">
                      {localLead.activities.map((act: any) => (
                        <div key={act.id} className="activity-item">
                          <div className={`activity-icon ${act.type}`}>
                            {ACTIVITY_TYPES.find(t => t.value === act.type)?.icon || <StickyNote size={14} />}
                          </div>
                          <div className="activity-body">
                            <div className="activity-meta">
                              <span className="activity-type-label">{ACTIVITY_TYPES.find(t => t.value === act.type)?.label || act.type}</span>
                              <span className="activity-time">{new Date(act.createdAt).toLocaleString()}</span>
                            </div>
                            {act.note && <p className="activity-note">{act.note}</p>}
                            {act.newFollowUpDate && <p className="activity-followup-update">Follow-up updated → {formatDate(act.newFollowUpDate)}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LeadFormModal;
