import React, { useEffect, useState } from 'react';
import { teamService } from '../services/api';
import { X, Edit2, Trash2, Search, UserPlus, ToggleLeft, ToggleRight } from 'lucide-react';
import Pagination from '../components/Pagination';
import './TeamMembers.css';

const ROLE_OPTIONS = ['Sales', 'Manager', 'Support', 'Admin', 'Marketing'];

const TeamMembers: React.FC = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  // Form
  const [form, setForm] = useState({
    fullName: '', username: '', password: '', role: 'Sales',
    phone: '', monthlyGoal: '500000', commission: '10', targetBonus: '10000'
  });

  const fetchMembers = async () => {
    try {
      const data = await teamService.getMembers();
      setMembers(data);
    } catch (error) { console.error('Failed to fetch team:', error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMembers(); }, []);

  const filteredMembers = members.filter(m => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || [m.fullName, m.username, m.phone, m.role].some(v => (v || '').toLowerCase().includes(q));
    const matchesRole = roleFilter === 'All Roles' || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter]);

  // Compute current page items
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMembers = filteredMembers.slice(indexOfFirstItem, indexOfLastItem);

  const resetForm = () => {
    setForm({ fullName: '', username: '', password: '', role: 'Sales', phone: '', monthlyGoal: '500000', commission: '10', targetBonus: '10000' });
    setSelectedMember(null);
    setIsEditMode(false);
  };

  const openAdd = () => { resetForm(); setIsModalOpen(true); };

  const openEdit = (m: any) => {
    setIsEditMode(true);
    setSelectedMember(m);
    setForm({
      fullName: m.fullName || '', username: m.username || '', password: '',
      role: m.role || 'Sales', phone: m.phone || '',
      monthlyGoal: m.monthlyGoal?.toString() || '500000',
      commission: m.commission?.toString() || '10',
      targetBonus: m.targetBonus?.toString() || '10000'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      monthlyGoal: parseFloat(form.monthlyGoal) || 0,
      commission: parseFloat(form.commission) || 0,
      targetBonus: parseFloat(form.targetBonus) || 0,
    };

    try {
      if (isEditMode && selectedMember) {
        const updated = await teamService.updateMember(selectedMember.id, payload);
        setMembers(members.map(m => m.id === selectedMember.id ? updated : m));
      } else {
        const created = await teamService.createMember(payload);
        setMembers([...members, created]);
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error saving member');
    }
  };

  const handleToggle = async (m: any) => {
    try {
      const updated = await teamService.toggleMember(m.id);
      setMembers(members.map(mem => mem.id === m.id ? updated : mem));
    } catch (error) { console.error('Failed to toggle:', error); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this team member?')) return;
    try {
      await teamService.deleteMember(id);
      setMembers(members.filter(m => m.id !== id));
    } catch (error) { console.error('Failed to delete:', error); }
  };

  const formatNumber = (v: number | null) => {
    if (!v && v !== 0) return '—';
    return new Intl.NumberFormat('en-US').format(v);
  };

  if (loading) return <div className="loading">Loading Team Members...</div>;

  return (
    <div className="team-page">
      <div className="team-header-bar">
        <div>
          <h1 className="team-page-title">Team Members</h1>
          <p className="team-page-subtitle">Manage your sales team and their targets</p>
        </div>
        <button className="btn-primary" onClick={openAdd}><UserPlus size={16} /> Add Member</button>
      </div>

      {/* Stats row */}
      <div className="team-stats-row">
        <div className="team-stat-card">
          <span className="team-stat-value">{members.length}</span>
          <span className="team-stat-label">Total Members</span>
        </div>
        <div className="team-stat-card">
          <span className="team-stat-value">{members.filter(m => m.isActive).length}</span>
          <span className="team-stat-label">Active</span>
        </div>
        <div className="team-stat-card">
          <span className="team-stat-value">{members.filter(m => !m.isActive).length}</span>
          <span className="team-stat-label">Inactive</span>
        </div>
        <div className="team-stat-card">
          <span className="team-stat-value">{formatNumber(members.reduce((sum, m) => sum + (parseFloat(m.monthlyGoal) || 0), 0))}</span>
          <span className="team-stat-label">Combined Goal</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="team-filter-bar">
        <div className="filter-search">
          <Search size={16} className="search-icon" />
          <input type="text" className="filter-search-input" placeholder="Search by name, username, phone..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <select className="filter-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option>All Roles</option>
          {ROLE_OPTIONS.map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

      {/* Members Table */}
      <div className="white-box" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table className="glass-table team-table">
            <thead>
              <tr>
                <th>MEMBER</th>
                <th>ROLE</th>
                <th>PHONE</th>
                <th>MONTHLY GOAL</th>
                <th>COMMISSION</th>
                <th>BONUS</th>
                <th>STATUS</th>
                <th className="text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {currentMembers.length === 0 ? (
                <tr><td colSpan={8} className="empty-state">No team members found.</td></tr>
              ) : currentMembers.map(m => (
                <tr key={m.id} className={!m.isActive ? 'row-inactive' : ''}>
                  <td className="member-cell">
                    <div className="member-avatar">{(m.fullName || '?')[0].toUpperCase()}</div>
                    <div>
                      <div className="member-name">{m.fullName}</div>
                      <div className="member-username">@{m.username}</div>
                    </div>
                  </td>
                  <td><span className={`role-badge role-${(m.role || 'sales').toLowerCase()}`}>{m.role}</span></td>
                  <td className="member-phone">{m.phone || '—'}</td>
                  <td className="member-goal">{formatNumber(m.monthlyGoal)}</td>
                  <td className="member-commission">{m.commission}%</td>
                  <td className="member-bonus">{formatNumber(m.targetBonus)}</td>
                  <td>
                    <button className={`toggle-status-btn ${m.isActive ? 'active' : 'inactive'}`} onClick={() => handleToggle(m)} title={m.isActive ? 'Active — click to deactivate' : 'Inactive — click to activate'}>
                      {m.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                      <span>{m.isActive ? 'Active' : 'Inactive'}</span>
                    </button>
                  </td>
                  <td className="text-right">
                    <div className="lead-actions">
                      <button className="action-btn edit" title="Edit" onClick={() => openEdit(m)}><Edit2 size={15} /></button>
                      <button className="action-btn delete" title="Delete" onClick={() => handleDelete(m.id)}><Trash2 size={15} /></button>
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content white-box" style={{ maxWidth: '540px' }}>
            <button className="modal-close" onClick={() => { setIsModalOpen(false); resetForm(); }}><X size={20} /></button>
            <h2 className="box-title">{isEditMode ? 'Edit Member' : 'Add Member'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">FULL NAME <span className="required">*</span></label>
                  <input type="text" className="glass-input" required value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">USERNAME <span className="required">*</span></label>
                  <input type="text" className="glass-input" required value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">PASSWORD</label>
                  <input type="password" className="glass-input" placeholder="blank = keep current" value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">ROLE</label>
                  <select className="glass-input" value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    {ROLE_OPTIONS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">PHONE</label>
                  <input type="text" className="glass-input" value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">MONTHLY GOAL</label>
                  <input type="number" className="glass-input" value={form.monthlyGoal}
                    onChange={(e) => setForm({ ...form, monthlyGoal: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">COMMISSION %</label>
                  <input type="number" className="glass-input" value={form.commission}
                    onChange={(e) => setForm({ ...form, commission: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">TARGET BONUS</label>
                  <input type="number" className="glass-input" value={form.targetBonus}
                    onChange={(e) => setForm({ ...form, targetBonus: e.target.value })} />
                </div>
              </div>
              <div className="form-actions-row">
                <button type="button" className="btn-secondary" onClick={() => { setIsModalOpen(false); resetForm(); }}>Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamMembers;
