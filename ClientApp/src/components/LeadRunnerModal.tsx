import React, { useState } from 'react';
import { X } from 'lucide-react';
import { leadsService } from '../services/api';
import './LeadRunnerModal.css';

const STATUS_OPTIONS = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];

interface LeadRunnerModalProps {
  leads: any[];
  onClose: () => void;
  onFinished: () => void;
}

const LeadRunnerModal: React.FC<LeadRunnerModalProps> = ({ leads, onClose, onFinished }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  
  const currentLead = leads[currentIndex];

  const [status, setStatus] = useState(currentLead?.status || 'New');
  const [note, setNote] = useState('');
  const [newFollowUpDate, setNewFollowUpDate] = useState('');

  React.useEffect(() => {
    if (currentLead) {
      setStatus(currentLead.status || 'New');
      setNote('');
      setNewFollowUpDate('');
    }
  }, [currentLead]);

  if (!currentLead) return null;

  const handleSaveAndNext = async () => {
    setSaving(true);
    try {
      if (status !== currentLead.status) {
        await leadsService.updateLead(currentLead.id, { status });
      }

      if (note.trim() || newFollowUpDate) {
        await leadsService.logActivity(currentLead.id, {
          type: 'note',
          note: note.trim() || 'Updated lead via Lead Runner',
          newFollowUpDate: newFollowUpDate || undefined
        });
      }

      if (currentIndex + 1 < leads.length) {
        setCurrentIndex(prev => prev + 1);
      } else {
        onFinished();
      }
    } catch (error) {
      console.error('Failed to save lead in runner:', error);
      alert('Failed to save lead updates.');
    } finally {
      setSaving(false);
    }
  };

  const isLastLead = currentIndex === leads.length - 1;
  const leadActivities = currentLead.activities || [];

  return (
    <div className="lr-overlay">
      <div className="lr-modal">
        <div className="lr-header-bar">
          <h2 className="lr-title">{currentLead.businessName || currentLead.name}</h2>
          <div className="lr-header-right">
            <span className="lr-status-badge">{currentLead.status}</span>
            <button className="lr-close-btn" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        <div className="lr-body">
          <div className="lr-info-grid">
            <div className="lr-info-box">
              <span className="lr-info-label">SERVICE</span>
              <span className="lr-info-value">{currentLead.service || 'N/A'}</span>
            </div>
            <div className="lr-info-box">
              <span className="lr-info-label">DEAL VALUE</span>
              <span className="lr-info-value">Rs {currentLead.dealValue || '0'}</span>
            </div>
            <div className="lr-info-box">
              <span className="lr-info-label">WHATSAPP</span>
              <span className="lr-info-value">{currentLead.phoneNumber}</span>
            </div>
            <div className="lr-info-box">
              <span className="lr-info-label">FOLLOW-UP</span>
              <span className="lr-info-value text-red">
                {currentLead.followUpDate ? new Date(currentLead.followUpDate).toISOString().split('T')[0] : 'None'}
              </span>
            </div>
          </div>

          <div className="lr-section">
            <h3 className="lr-section-title">RECENT ACTIVITY</h3>
            <div className="lr-activity-list">
              {leadActivities.length === 0 ? (
                <p className="lr-empty-text">No recent activity.</p>
              ) : (
                leadActivities.map((act: any) => (
                  <div key={act.id} className="lr-activity-item">
                    <div className="lr-activity-dot"></div>
                    <div className="lr-activity-content">
                      <p className="lr-act-text">{act.note}</p>
                      <p className="lr-act-meta">{act.type} · {new Date(act.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lr-section">
            <h3 className="lr-section-title">LOG INTERACTION</h3>
            <div className="lr-form-grid">
              <div className="lr-form-group">
                <label>STATUS</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="lr-form-group">
                <label>NEXT FOLLOW-UP *</label>
                <input 
                  type="date" 
                  value={newFollowUpDate ? newFollowUpDate.split('T')[0] : ''}
                  onChange={(e) => setNewFollowUpDate(e.target.value)}
                />
              </div>
              <div className="lr-form-group full-width">
                <label>REMARKS *</label>
                <textarea 
                  placeholder="What happened? Next steps?"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <div className="lr-footer">
          <span className="lr-progress">Queue: {currentIndex + 1} / {leads.length}</span>
          <div className="lr-footer-actions">
            <button className="lr-btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="lr-btn-primary" onClick={handleSaveAndNext} disabled={saving}>
              {saving ? 'Saving...' : (isLastLead ? 'Save & Finish' : 'Save & Next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadRunnerModal;
