import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { externalModulesService, authService } from '../services/api';
import { X, Edit2, Trash2, Plus, ArrowLeft, Search } from 'lucide-react';
import '../pages/Leads.css'; // Importing leads CSS to reuse the layout styles
import './ExternalModules.css';

const ExternalComplaints: React.FC = () => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Form State
  const [form, setForm] = useState({
    fullName: '',
    phoneNumber: '',
    installationAddress: '',
    natureOfComplaint: '',
    issueContinuous: '',
    restartedRouter: ''
  });

  const fetchComplaints = async () => {
    try {
      const data = await externalModulesService.getComplaints();
      setComplaints(data);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (e) {
        console.error('Error fetching user', e);
      }
      fetchComplaints();
    };
    init();
  }, []);

  const isFieldAllowed = (fieldName: string) => {
    if (!user) return false;
    if (user.role === 'Super Admin') return true;
    const allowedFields = user.moduleComplainsFields || [];
    return allowedFields.includes(fieldName);
  };

  const resetForm = () => {
    setForm({
      fullName: '', phoneNumber: '', installationAddress: '',
      natureOfComplaint: '', issueContinuous: '', restartedRouter: ''
    });
    setSelectedId(null);
    setIsEditMode(false);
  };

  const openAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEdit = (complaint: any) => {
    setForm({
      fullName: complaint.fullName || '',
      phoneNumber: complaint.phoneNumber || '',
      installationAddress: complaint.installationAddress || '',
      natureOfComplaint: complaint.natureOfComplaint || '',
      issueContinuous: complaint.issueContinuous || '',
      restartedRouter: complaint.restartedRouter || ''
    });
    setSelectedId(complaint.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this complaint?')) return;
    try {
      await externalModulesService.deleteComplaint(id);
      setComplaints(complaints.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting complaint:', error);
      alert('Failed to delete complaint');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditMode && selectedId) {
        const updated = await externalModulesService.updateComplaint(selectedId, form);
        setComplaints(complaints.map(c => c.id === selectedId ? updated : c));
      } else {
        const created = await externalModulesService.createComplaint(form);
        setComplaints([...complaints, created]);
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving complaint:', error);
      alert('Failed to save complaint');
    }
  };

  const filteredComplaints = complaints.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.fullName && c.fullName.toLowerCase().includes(q)) ||
      (c.phoneNumber && c.phoneNumber.toLowerCase().includes(q)) ||
      (c.installationAddress && c.installationAddress.toLowerCase().includes(q)) ||
      (c.natureOfComplaint && c.natureOfComplaint.toLowerCase().includes(q))
    );
  });

  if (loading) return <div className="loading">Loading complaints...</div>;

  return (
    <div className="leads-page">
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/" className="btn-secondary btn-sm" style={{ display: 'inline-flex', width: 'auto' }}>
          <ArrowLeft size={16} style={{ marginRight: '4px' }} /> Back to Dashboard
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="leads-filter-bar">
        <div className="filter-search">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search full name, phone, address..." 
            className="filter-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Complaint
        </button>
      </div>

      <div className="white-box" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table className="glass-table leads-table">
            <thead>
              <tr>
                <th>DATE TIME</th>
                {isFieldAllowed('fullName') && <th>FULL NAME</th>}
                {isFieldAllowed('phoneNumber') && <th>PHONE NUMBER</th>}
                {isFieldAllowed('installationAddress') && <th>INSTALLATION ADDRESS</th>}
                {isFieldAllowed('natureOfComplaint') && <th>NATURE OF COMPLAINT</th>}
                {isFieldAllowed('issueContinuous') && <th>CONTINUOUS ISSUE?</th>}
                {isFieldAllowed('restartedRouter') && <th>RESTARTED ROUTER?</th>}
                <th className="text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-state">No complaints found.</td>
                </tr>
              ) : (
                filteredComplaints.map(complaint => (
                  <tr key={complaint.id}>
                    <td>{new Date(complaint.createdAt).toLocaleString()}</td>
                    {isFieldAllowed('fullName') && <td>{complaint.fullName}</td>}
                    {isFieldAllowed('phoneNumber') && <td>{complaint.phoneNumber}</td>}
                    {isFieldAllowed('installationAddress') && <td>{complaint.installationAddress}</td>}
                    {isFieldAllowed('natureOfComplaint') && <td>{complaint.natureOfComplaint}</td>}
                    {isFieldAllowed('issueContinuous') && <td>{complaint.issueContinuous}</td>}
                    {isFieldAllowed('restartedRouter') && <td>{complaint.restartedRouter}</td>}
                    <td className="text-right">
                      <div className="lead-actions" style={{ justifyContent: 'flex-end' }}>
                        <button className="action-btn edit" onClick={() => openEdit(complaint)} title="Edit"><Edit2 size={15} /></button>
                        <button className="action-btn delete" onClick={() => handleDelete(complaint.id)} title="Delete"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content white-box" style={{ width: '100%', maxWidth: '500px', padding: '2rem', borderRadius: '12px', position: 'relative' }}>
            <button style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }} onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600 }}>{isEditMode ? 'Edit Complaint' : 'Add Complaint'}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {isFieldAllowed('fullName') && (
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666', marginBottom: '0.5rem', display: 'block' }}>FULL NAME</label>
                  <input type="text" className="glass-input" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} required style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }} />
                </div>
              )}
              {isFieldAllowed('phoneNumber') && (
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666', marginBottom: '0.5rem', display: 'block' }}>PHONE NUMBER</label>
                  <input type="text" className="glass-input" value={form.phoneNumber} onChange={e => setForm({...form, phoneNumber: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }} />
                </div>
              )}
              {isFieldAllowed('installationAddress') && (
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666', marginBottom: '0.5rem', display: 'block' }}>INSTALLATION ADDRESS</label>
                  <input type="text" className="glass-input" value={form.installationAddress} onChange={e => setForm({...form, installationAddress: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }} />
                </div>
              )}
              {isFieldAllowed('natureOfComplaint') && (
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666', marginBottom: '0.5rem', display: 'block' }}>NATURE OF COMPLAINT</label>
                  <input type="text" className="glass-input" value={form.natureOfComplaint} onChange={e => setForm({...form, natureOfComplaint: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }} />
                </div>
              )}
              <div style={{ display: 'flex', gap: '1rem' }}>
                {isFieldAllowed('issueContinuous') && (
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666', marginBottom: '0.5rem', display: 'block' }}>CONTINUOUS ISSUE?</label>
                    <input type="text" className="glass-input" value={form.issueContinuous} onChange={e => setForm({...form, issueContinuous: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }} />
                  </div>
                )}
                {isFieldAllowed('restartedRouter') && (
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666', marginBottom: '0.5rem', display: 'block' }}>RESTARTED ROUTER?</label>
                    <input type="text" className="glass-input" value={form.restartedRouter} onChange={e => setForm({...form, restartedRouter: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }} />
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid #ddd', background: '#f5f5f5', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', background: '#0ea5e9', color: '#fff', border: 'none', cursor: 'pointer' }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExternalComplaints;
