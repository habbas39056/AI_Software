import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { leadsService, adminService, clientService, teamService, authService } from '../services/api';
import { ArrowLeft, Plus, X, Eye, Phone, Mail, Users, StickyNote, CalendarClock, Trash2, Edit2, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import { formatCurrency } from '../utils/currencyUtils';
import Pagination from '../components/Pagination';
import './Leads.css';

const STATUS_OPTIONS = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
const DEFAULT_SERVICE_OPTIONS = ['Select...', 'Web Design', 'SEO', 'Social Media', 'Google Ads', 'App Development', 'Branding', 'Consulting', 'Other'];
const ACTIVITY_TYPES = [
  { value: 'call', label: 'Call', icon: <Phone size={14} /> },
  { value: 'email', label: 'Email', icon: <Mail size={14} /> },
  { value: 'meeting', label: 'Meeting', icon: <Users size={14} /> },
  { value: 'note', label: 'Note', icon: <StickyNote size={14} /> },
  { value: 'follow-up', label: 'Follow-up', icon: <CalendarClock size={14} /> },
];

const Leads: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [serviceOptions, setServiceOptions] = useState<string[]>(DEFAULT_SERVICE_OPTIONS);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [assignedFilter, setAssignedFilter] = useState('All Team');
  const [serviceFilter, setServiceFilter] = useState('All Services');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  // Lead form state
  const [form, setForm] = useState({
    name: '', businessName: '', phoneNumber: '', email: '', service: 'Select...',
    dealValue: '', status: 'New', assignedTo: 'AI Agent', followUpDate: '',
    city: '', lossReason: '', summary: '', score: 'Manual Entry'
  });

  // Payment form
  const [paymentForm, setPaymentForm] = useState({ amount: '', date: '', note: '' });

  // Activity form (inline in edit modal)
  const [activityForm, setActivityForm] = useState({ type: 'Note', note: '', newFollowUpDate: '' });

  const fetchData = async () => {
    try {
      const [members, user] = await Promise.all([
        teamService.getMembers(),
        authService.getCurrentUser()
      ]);
      setTeamMembers(members);
      setCurrentUser(user);

      let targetId = id;
      if (!targetId) {
        const dashboard = await clientService.getDashboard();
        if (dashboard.customer) {
          targetId = dashboard.customer.whatsAppNumber;
          setCustomer(dashboard.customer);
          setLeads(await leadsService.getLeads(targetId!));
          if (dashboard.customer.customServices && dashboard.customer.customServices.length > 0) {
            setServiceOptions(['Select...', ...dashboard.customer.customServices]);
          }
        }
      } else {
        const [leadsData, customers] = await Promise.all([
          leadsService.getLeads(targetId), adminService.getCustomers()
        ]);
        setLeads(leadsData);
        const currentCustomer = customers.find((c: any) => c.whatsAppNumber === targetId);
        setCustomer(currentCustomer);
        if (currentCustomer?.customServices && currentCustomer.customServices.length > 0) {
          setServiceOptions(['Select...', ...currentCustomer.customServices]);
        }
      }
    } catch (error) { console.error('Failed to fetch data:', error); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
  }, [id]);


  const isTeamMemberUser = currentUser?.role === 'TeamMember';
  const userDisplayName = currentUser?.name || currentUser?.username || 'Me';

  // Build assigned options from team members
  const assignedOptions = isTeamMemberUser 
    ? [userDisplayName]
    : ['AI Agent', ...teamMembers.filter(m => m.isActive).map(m => m.fullName)];

  // ── Filters ──
  const uniqueAssigned = [...new Set(leads.map(l => l.assignedTo).filter(Boolean))];
  const uniqueServices = [...new Set(leads.map(l => l.service).filter(Boolean))];

  const filteredLeads = leads.filter(l => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || [l.name, l.phoneNumber, l.service, l.businessName].some(v => (v || '').toLowerCase().includes(q));
    const matchesStatus = statusFilter === 'All Status' || l.status === statusFilter;
    const matchesAssigned = assignedFilter === 'All Team' || l.assignedTo === assignedFilter;
    const matchesService = serviceFilter === 'All Services' || l.service === serviceFilter;
    return matchesSearch && matchesStatus && matchesAssigned && matchesService;
  });

  // Reset pagination to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, assignedFilter, serviceFilter]);

  // Compute current page items
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLeads = filteredLeads.slice(indexOfFirstItem, indexOfLastItem);

  // ── Handlers ──
  const resetForm = () => {
    const defaultAssignedTo = isTeamMemberUser ? userDisplayName : 'AI Agent';
    setForm({ name: '', businessName: '', phoneNumber: '', email: '', service: 'Select...', dealValue: '', status: 'New', assignedTo: defaultAssignedTo, followUpDate: '', city: '', lossReason: '', summary: '', score: 'Manual Entry' });
    setPaymentForm({ amount: '', date: '', note: '' });
    setActivityForm({ type: 'Note', note: '', newFollowUpDate: '' });
    setSelectedLead(null);
    setIsEditMode(false);
  };

  const openAddForm = () => { resetForm(); setIsFormOpen(true); };

  const openEditForm = (lead: any) => {
    setIsEditMode(true);
    setSelectedLead(lead);
    setForm({
      name: lead.name || '', businessName: lead.businessName || '', phoneNumber: lead.phoneNumber || '',
      email: lead.email || '', service: lead.service || 'Select...', dealValue: lead.dealValue?.toString() || '',
      status: lead.status || 'New', assignedTo: isTeamMemberUser ? userDisplayName : (lead.assignedTo || 'AI Agent'),
      followUpDate: lead.followUpDate ? lead.followUpDate.split('T')[0] : '',
      city: lead.city || '', lossReason: lead.lossReason || '', summary: lead.summary || '',
      score: lead.score || ''
    });
    setPaymentForm({ amount: '', date: '', note: '' });
    setActivityForm({ type: 'Note', note: '', newFollowUpDate: '' });
    setIsFormOpen(true);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editId = params.get('editLeadId');
    if (editId && leads.length > 0 && !isFormOpen && !isViewModalOpen) {
      const leadToEdit = leads.find(l => l.id === parseInt(editId));
      if (leadToEdit) {
        openEditForm(leadToEdit);
        // Clear the query parameter so it doesn't reopen on refresh
        navigate(location.pathname, { replace: true });
      }
    }
  }, [location.search, leads, navigate, location.pathname, isFormOpen, isViewModalOpen]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = id || customer?.whatsAppNumber;
    if (!targetId) return;
    const payload = { ...form, dealValue: parseFloat(form.dealValue) || 0, followUpDate: form.followUpDate || null, service: form.service === 'Select...' ? '' : form.service, assignedTo: form.assignedTo === 'AI Agent' ? '' : form.assignedTo };

    try {
      if (isEditMode && selectedLead) {
        const updated = await leadsService.updateLead(selectedLead.id, payload);
        setLeads(leads.map(l => l.id === selectedLead.id ? updated : l));
      } else {
        const created = await leadsService.createLead({ customerId: targetId, ...payload });
        setLeads([created, ...leads]);
      }
      setIsFormOpen(false);
      resetForm();
    } catch (error) { console.error('Failed to save lead:', error); }
  };

  const handleDelete = async (leadId: number) => {
    if (!window.confirm('Delete this lead and all its data?')) return;
    try {
      await leadsService.deleteLead(leadId);
      setLeads(leads.filter(l => l.id !== leadId));
      if (isViewModalOpen) setIsViewModalOpen(false);
      if (isFormOpen) { setIsFormOpen(false); resetForm(); }
    } catch (error) { console.error('Failed to delete:', error); }
  };

  const handleToggleLead = async (lead: any) => {
    try {
      await leadsService.updateLead(lead.id, {
        ...lead, isPaused: !lead.isPaused
      });
      setLeads(leads.map(l => l.id === lead.id ? { ...l, isPaused: !l.isPaused } : l));
    } catch (error) { console.error('Failed to toggle lead:', error); }
  };

  const handleRecordPayment = async () => {
    if (!selectedLead || !paymentForm.amount || !paymentForm.date) return;
    try {
      const payment = await leadsService.recordPayment(selectedLead.id, {
        amount: parseFloat(paymentForm.amount), date: paymentForm.date, note: paymentForm.note
      });
      const updatedLeads = leads.map(l => {
        if (l.id === selectedLead.id) return { ...l, payments: [...(l.payments || []), payment] };
        return l;
      });
      setLeads(updatedLeads);
      setSelectedLead((prev: any) => ({ ...prev, payments: [...(prev.payments || []), payment] }));
      setPaymentForm({ amount: '', date: '', note: '' });
    } catch (error) { console.error('Failed to record payment:', error); }
  };

  const handleDeletePayment = async (paymentId: number) => {
    if (!window.confirm('Delete this payment record?')) return;
    try {
      await leadsService.deletePayment(paymentId);
      const updatedLeads = leads.map(l => {
        if (l.id === selectedLead.id) {
          return { ...l, payments: (l.payments || []).filter((p: any) => p.id !== paymentId) };
        }
        return l;
      });
      setLeads(updatedLeads);
      setSelectedLead((prev: any) => ({ ...prev, payments: (prev.payments || []).filter((p: any) => p.id !== paymentId) }));
    } catch (error) { console.error('Failed to delete payment:', error); }
  };

  const handleLogActivity = async () => {
    if (!selectedLead || !activityForm.note) return;
    try {
      const activity = await leadsService.logActivity(selectedLead.id, {
        type: activityForm.type, note: activityForm.note,
        newFollowUpDate: activityForm.newFollowUpDate || undefined
      });
      const updatedLeads = leads.map(l => {
        if (l.id === selectedLead.id) {
          const updatedLead = { ...l, activities: [activity, ...(l.activities || [])] };
          if (activityForm.newFollowUpDate) updatedLead.followUpDate = activityForm.newFollowUpDate;
          return updatedLead;
        }
        return l;
      });
      setLeads(updatedLeads);
      setSelectedLead((prev: any) => {
        const updated = { ...prev, activities: [activity, ...(prev.activities || [])] };
        if (activityForm.newFollowUpDate) updated.followUpDate = activityForm.newFollowUpDate;
        return updated;
      });
      setActivityForm({ type: 'Note', note: '', newFollowUpDate: '' });
    } catch (error) { console.error('Failed to log activity:', error); }
  };

  const openViewModal = (lead: any) => { setSelectedLead(lead); setIsViewModalOpen(true); };

  const getStatusClass = (status: string) => {
    const map: Record<string, string> = { 'New': 'status-new', 'Contacted': 'status-contacted', 'Qualified': 'status-qualified', 'Proposal': 'status-proposal', 'Negotiation': 'status-negotiation', 'Won': 'status-won', 'Lost': 'status-lost' };
    return map[status] || 'status-new';
  };

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

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

      {/* ── Filter Bar ── */}
      <div className="leads-filter-bar">
        <div className="filter-search">
          <Search size={16} className="search-icon" />
          <input type="text" placeholder="Search client, business, phone..." className="filter-search-input"
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="filter-selects">
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option>All Status</option>
            {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="filter-select" value={assignedFilter} onChange={(e) => setAssignedFilter(e.target.value)}>
            <option>All Team</option>
            {uniqueAssigned.map(a => <option key={a}>{a}</option>)}
          </select>
          <select className="filter-select" value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)}>
            <option>All Services</option>
            {uniqueServices.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <button className="btn-primary" onClick={openAddForm}><Plus size={16} /> Add Lead</button>
      </div>

      {/* ── Leads Table ── */}
      <div className="white-box" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table className="glass-table leads-table">
            <thead>
              <tr>
                <th>CLIENT</th>
                <th>SERVICE</th>
                <th>DEAL</th>
                <th>STATUS</th>
                <th>ASSIGNED</th>
                <th>FOLLOW-UP</th>
                <th>ACTIVE</th>
                <th className="text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {currentLeads.length === 0 ? (
                <tr><td colSpan={8} className="empty-state">No leads found.</td></tr>
              ) : currentLeads.map((lead) => (
                <tr key={lead.id} className={lead.isPaused ? 'row-inactive' : ''}>
                  <td className="lead-client-cell">
                    <div className="lead-client-name">{lead.name || 'Unnamed'}</div>
                    {lead.businessName && <div className="lead-business-name">{lead.businessName}</div>}
                    <div className="lead-client-phone">{lead.phoneNumber}</div>
                  </td>
                  <td className="lead-service">{lead.service || '—'}</td>
                  <td className="lead-deal">{formatCurrency(lead.dealValue, customer?.currency)}</td>
                  <td><span className={`lead-status-badge ${getStatusClass(lead.status)}`}>{lead.status}</span></td>
                  <td className="lead-assigned">{lead.assignedTo || 'AI Agent'}</td>
                  <td className="lead-followup">{formatDate(lead.followUpDate)}</td>
                  <td>
                    <button className={`toggle-status-btn ${lead.isPaused ? 'inactive' : 'active'}`} onClick={() => handleToggleLead(lead)} title={lead.isPaused ? 'Paused — click to activate' : 'Active — click to pause'}>
                      {lead.isPaused ? <ToggleLeft size={22} /> : <ToggleRight size={22} />}
                    </button>
                  </td>
                  <td className="text-right">
                    <div className="lead-actions">
                      <button className="action-btn view" title="View" onClick={() => openViewModal(lead)}><Eye size={15} /></button>
                      <button className="action-btn edit" title="Edit" onClick={() => openEditForm(lead)}><Edit2 size={15} /></button>
                      <button className="action-btn delete" title="Delete" onClick={() => handleDelete(lead.id)}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* ── Add / Edit Lead Full Form (matching screenshot) ── */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-content white-box lead-form-modal">
            <button className="modal-close" onClick={() => { setIsFormOpen(false); resetForm(); }}><X size={20} /></button>
            <h2 className="box-title">{isEditMode ? 'Edit Lead' : 'Add Lead'}</h2>

            <form onSubmit={handleFormSubmit}>
              {/* Row 1: Client Name, Business Name */}
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

              {/* Row 2: WhatsApp, Email */}
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

              {/* Row 3: Service, Deal Value */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">SERVICE</label>
                  <select className="glass-input" value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}>
                    {serviceOptions.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">DEAL VALUE</label>
                  <input type="number" className="glass-input" placeholder="50000.00" value={form.dealValue}
                    onChange={(e) => setForm({ ...form, dealValue: e.target.value })} />
                </div>
              </div>

              {/* Row 4: Status, Assigned To */}
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

              {/* Row 5: Follow-up Date, City */}
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

              {/* Loss Reason */}
              <div className="form-group">
                <label className="form-label">LOSS REASON</label>
                <input type="text" className="glass-input" placeholder="If lost, why?" value={form.lossReason}
                  onChange={(e) => setForm({ ...form, lossReason: e.target.value })} />
              </div>

              {/* Notes */}
              <div className="form-group">
                <label className="form-label">NOTES / SUMMARY</label>
                <textarea className="glass-input" rows={3} placeholder="Key points, client requirements, follow-up details..."
                  value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })}></textarea>
              </div>

              <button type="submit" className="btn-primary block">{isEditMode ? 'Save Changes' : 'Add Lead'}</button>
            </form>

            {/* ── Payments Section (edit mode only) ── */}
            {isEditMode && selectedLead && (
              <div className="form-section">
                <h3 className="section-title">PAYMENTS RECEIVED</h3>
                {(!selectedLead.payments || selectedLead.payments.length === 0) ? (
                  <p className="empty-text">No payments yet</p>
                ) : (
                  <div className="payments-list">
                    {selectedLead.payments.map((p: any) => (
                      <div key={p.id} className="payment-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <span className="payment-amount" style={{ marginRight: '1rem' }}>{formatCurrency(p.amount, customer?.currency)}</span>
                          <span className="payment-date" style={{ marginRight: '1rem' }}>{formatDate(p.date)}</span>
                          <span className="payment-note">{p.note || ''}</span>
                        </div>
                        <button type="button" onClick={() => handleDeletePayment(p.id)} title="Delete Payment" style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                          <Trash2 size={16} />
                        </button>
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

            {/* ── Log Activity Section (edit mode only) ── */}
            {isEditMode && selectedLead && (
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

                {/* History */}
                {selectedLead.activities && selectedLead.activities.length > 0 && (
                  <>
                    <h3 className="section-title" style={{ marginTop: '0.5rem' }}>HISTORY</h3>
                    <div className="activity-timeline">
                      {selectedLead.activities.map((act: any) => (
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
          </div>
        </div>
      )}

      {/* ── Quick View Modal ── */}
      {isViewModalOpen && selectedLead && (
        <div className="modal-overlay">
          <div className="modal-content white-box" style={{ maxWidth: '700px' }}>
            <button className="modal-close" onClick={() => setIsViewModalOpen(false)}><X size={20} /></button>
            <div className="view-header">
              <div>
                <h2 className="box-title" style={{ marginBottom: '2px' }}>{selectedLead.name || 'Unnamed Lead'}</h2>
                {selectedLead.businessName && <div className="lead-business-name">{selectedLead.businessName}</div>}
                <span className="lead-client-phone">{selectedLead.phoneNumber}</span>
                {selectedLead.email && <span className="lead-client-phone" style={{ marginLeft: '12px' }}>{selectedLead.email}</span>}
              </div>
              <span className={`lead-status-badge ${getStatusClass(selectedLead.status)}`}>{selectedLead.status}</span>
            </div>

            <div className="view-details-grid">
              <div className="view-detail"><span className="view-label">Service</span><span className="view-value">{selectedLead.service || '—'}</span></div>
              <div className="view-detail"><span className="view-label">Deal Value</span><span className="view-value">{formatCurrency(selectedLead.dealValue, customer?.currency)}</span></div>
              <div className="view-detail"><span className="view-label">Assigned</span><span className="view-value">{selectedLead.assignedTo || 'AI Agent'}</span></div>
              <div className="view-detail"><span className="view-label">Follow-up</span><span className="view-value">{formatDate(selectedLead.followUpDate)}</span></div>
              <div className="view-detail"><span className="view-label">City</span><span className="view-value">{selectedLead.city || '—'}</span></div>
              <div className="view-detail">
                <span className="view-label">Payments</span>
                <span className="view-value">{selectedLead.payments?.length || 0} recorded</span>
              </div>
            </div>

            {selectedLead.summary && (
              <div className="view-notes"><span className="view-label">Notes</span><p>{selectedLead.summary}</p></div>
            )}
            {selectedLead.lossReason && (
              <div className="view-notes" style={{ borderLeft: '3px solid #f87171' }}><span className="view-label">Loss Reason</span><p>{selectedLead.lossReason}</p></div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
              <button className="btn-primary" onClick={() => { setIsViewModalOpen(false); openEditForm(selectedLead); }}>
                <Edit2 size={14} /> Edit Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
