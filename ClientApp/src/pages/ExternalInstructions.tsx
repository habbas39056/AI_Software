import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { externalModulesService, authService } from '../services/api';
import { X, Edit2, Trash2, Plus, ArrowLeft, Search } from 'lucide-react';
import '../pages/Leads.css'; // Importing leads CSS to reuse the layout styles
import './ExternalModules.css';

const ExternalInstructions: React.FC = () => {
  const [instructions, setInstructions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Form State
  const [form, setForm] = useState({
    fullName: '', phoneNumber: '', emailAddress: '', installationAddress: '',
    nearestLandmark: '', purposeOfUsage: '', ownsWifiDevice: '',
    wifiCoverageRequired: '', connectionType: '', expectedUsers: '',
    installationTimeline: ''
  });

  const fetchInstructions = async () => {
    try {
      const data = await externalModulesService.getInstructions();
      setInstructions(data);
    } catch (error) {
      console.error('Error fetching instructions:', error);
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
      fetchInstructions();
    };
    init();
  }, []);

  const isFieldAllowed = (fieldName: string) => {
    if (!user) return false;
    if (user.role === 'Super Admin') return true;
    const allowedFields = user.moduleInstructionFields || [];
    return allowedFields.includes(fieldName);
  };

  const resetForm = () => {
    setForm({
      fullName: '', phoneNumber: '', emailAddress: '', installationAddress: '',
      nearestLandmark: '', purposeOfUsage: '', ownsWifiDevice: '',
      wifiCoverageRequired: '', connectionType: '', expectedUsers: '',
      installationTimeline: ''
    });
    setSelectedId(null);
    setIsEditMode(false);
  };

  const openAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEdit = (inst: any) => {
    setForm({
      fullName: inst.fullName || '', phoneNumber: inst.phoneNumber || '',
      emailAddress: inst.emailAddress || '', installationAddress: inst.installationAddress || '',
      nearestLandmark: inst.nearestLandmark || '', purposeOfUsage: inst.purposeOfUsage || '',
      ownsWifiDevice: inst.ownsWifiDevice || '', wifiCoverageRequired: inst.wifiCoverageRequired || '',
      connectionType: inst.connectionType || '', expectedUsers: inst.expectedUsers || '',
      installationTimeline: inst.installationTimeline || ''
    });
    setSelectedId(inst.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this installation request?')) return;
    try {
      await externalModulesService.deleteInstruction(id);
      setInstructions(instructions.filter(i => i.id !== id));
    } catch (error) {
      console.error('Error deleting instruction:', error);
      alert('Failed to delete installation request');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditMode && selectedId) {
        const updated = await externalModulesService.updateInstruction(selectedId, form);
        setInstructions(instructions.map(i => i.id === selectedId ? updated : i));
      } else {
        const created = await externalModulesService.createInstruction(form);
        setInstructions([...instructions, created]);
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving instruction:', error);
      alert('Failed to save installation request');
    }
  };

  const filteredInstructions = instructions.filter(i => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (i.fullName && i.fullName.toLowerCase().includes(q)) ||
      (i.phoneNumber && i.phoneNumber.toLowerCase().includes(q)) ||
      (i.emailAddress && i.emailAddress.toLowerCase().includes(q)) ||
      (i.installationAddress && i.installationAddress.toLowerCase().includes(q))
    );
  });

  if (loading) return <div className="loading">Loading installation requests...</div>;

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
            placeholder="Search full name, phone, email..." 
            className="filter-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Installation Request
        </button>
      </div>

      <div className="white-box" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive" style={{ overflowX: 'auto', width: '100%' }}>
          <table className="glass-table leads-table" style={{ minWidth: '1200px' }}>
            <thead>
              <tr>
                <th>DATE TIME</th>
                {isFieldAllowed('fullName') && <th>FULL NAME</th>}
                {isFieldAllowed('phoneNumber') && <th>PHONE NUMBER</th>}
                {isFieldAllowed('emailAddress') && <th>EMAIL ADDRESS</th>}
                {isFieldAllowed('installationAddress') && <th>INSTALLATION ADDRESS</th>}
                {isFieldAllowed('nearestLandmark') && <th>NEAREST LANDMARK</th>}
                {isFieldAllowed('purposeOfUsage') && <th>PURPOSE OF USAGE</th>}
                {isFieldAllowed('ownsWifiDevice') && <th>OWNS WI-FI DEVICE?</th>}
                {isFieldAllowed('wifiCoverageRequired') && <th>COVERAGE REQUIRED</th>}
                {isFieldAllowed('connectionType') && <th>CONNECTION TYPE</th>}
                {isFieldAllowed('expectedUsers') && <th>EXPECTED USERS</th>}
                {isFieldAllowed('installationTimeline') && <th>INSTALLATION TIMELINE</th>}
                <th className="text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredInstructions.length === 0 ? (
                <tr>
                  <td colSpan={13} className="empty-state">No installation requests found.</td>
                </tr>
              ) : (
                filteredInstructions.map(inst => (
                  <tr key={inst.id}>
                    <td>{new Date(inst.createdAt).toLocaleString()}</td>
                    {isFieldAllowed('fullName') && <td>{inst.fullName}</td>}
                    {isFieldAllowed('phoneNumber') && <td>{inst.phoneNumber}</td>}
                    {isFieldAllowed('emailAddress') && <td>{inst.emailAddress}</td>}
                    {isFieldAllowed('installationAddress') && <td>{inst.installationAddress}</td>}
                    {isFieldAllowed('nearestLandmark') && <td>{inst.nearestLandmark}</td>}
                    {isFieldAllowed('purposeOfUsage') && <td>{inst.purposeOfUsage}</td>}
                    {isFieldAllowed('ownsWifiDevice') && <td>{inst.ownsWifiDevice}</td>}
                    {isFieldAllowed('wifiCoverageRequired') && <td>{inst.wifiCoverageRequired}</td>}
                    {isFieldAllowed('connectionType') && <td>{inst.connectionType}</td>}
                    {isFieldAllowed('expectedUsers') && <td>{inst.expectedUsers}</td>}
                    {isFieldAllowed('installationTimeline') && <td>{inst.installationTimeline}</td>}
                    <td className="text-right">
                      <div className="lead-actions" style={{ justifyContent: 'flex-end' }}>
                        <button className="action-btn edit" onClick={() => openEdit(inst)} title="Edit"><Edit2 size={15} /></button>
                        <button className="action-btn delete" onClick={() => handleDelete(inst.id)} title="Delete"><Trash2 size={15} /></button>
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
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: '2rem' }}>
          <div className="modal-content white-box" style={{ width: '100%', maxWidth: '600px', padding: '2rem', borderRadius: '12px', position: 'relative', margin: 'auto' }}>
            <button style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }} onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600 }}>{isEditMode ? 'Edit Installation Request' : 'Add Installation Request'}</h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {isFieldAllowed('emailAddress') && (
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666', marginBottom: '0.5rem', display: 'block' }}>EMAIL ADDRESS</label>
                    <input type="email" className="glass-input" value={form.emailAddress} onChange={e => setForm({...form, emailAddress: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }} />
                  </div>
                )}
                {isFieldAllowed('nearestLandmark') && (
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666', marginBottom: '0.5rem', display: 'block' }}>NEAREST LANDMARK</label>
                    <input type="text" className="glass-input" value={form.nearestLandmark} onChange={e => setForm({...form, nearestLandmark: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }} />
                  </div>
                )}
              </div>

              {isFieldAllowed('installationAddress') && (
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666', marginBottom: '0.5rem', display: 'block' }}>INSTALLATION ADDRESS</label>
                  <input type="text" className="glass-input" value={form.installationAddress} onChange={e => setForm({...form, installationAddress: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }} />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {isFieldAllowed('purposeOfUsage') && (
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666', marginBottom: '0.5rem', display: 'block' }}>PURPOSE OF USAGE</label>
                    <input type="text" className="glass-input" value={form.purposeOfUsage} onChange={e => setForm({...form, purposeOfUsage: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }} />
                  </div>
                )}
                {isFieldAllowed('ownsWifiDevice') && (
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666', marginBottom: '0.5rem', display: 'block' }}>OWNS WI-FI DEVICE?</label>
                    <input type="text" className="glass-input" value={form.ownsWifiDevice} onChange={e => setForm({...form, ownsWifiDevice: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }} />
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {isFieldAllowed('wifiCoverageRequired') && (
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666', marginBottom: '0.5rem', display: 'block' }}>COVERAGE REQUIRED</label>
                    <input type="text" className="glass-input" value={form.wifiCoverageRequired} onChange={e => setForm({...form, wifiCoverageRequired: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }} />
                  </div>
                )}
                {isFieldAllowed('connectionType') && (
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666', marginBottom: '0.5rem', display: 'block' }}>CONNECTION TYPE</label>
                    <input type="text" className="glass-input" value={form.connectionType} onChange={e => setForm({...form, connectionType: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }} />
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {isFieldAllowed('expectedUsers') && (
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666', marginBottom: '0.5rem', display: 'block' }}>EXPECTED USERS</label>
                    <input type="text" className="glass-input" value={form.expectedUsers} onChange={e => setForm({...form, expectedUsers: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }} />
                  </div>
                )}
                {isFieldAllowed('installationTimeline') && (
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666', marginBottom: '0.5rem', display: 'block' }}>INSTALLATION TIMELINE</label>
                    <input type="text" className="glass-input" value={form.installationTimeline} onChange={e => setForm({...form, installationTimeline: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }} />
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

export default ExternalInstructions;
