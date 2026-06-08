import React, { useEffect, useState } from 'react';
import { clientService, evolutionService, instructionsService } from '../services/api';
import { Zap, Loader2, Smartphone, FileText, Plus, Trash2, Edit2 } from 'lucide-react';
import './Settings.css';

const Settings: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<'open' | 'close' | 'connecting' | 'unknown'>('unknown');
  
  // Scheduling state
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleStartTime, setScheduleStartTime] = useState('09:00');
  const [scheduleEndTime, setScheduleEndTime] = useState('17:00');
  const [timezone, setTimezone] = useState('UTC');
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Tabs state
  const [activeTab, setActiveTab] = useState<'scheduling' | 'sync' | 'instructions'>('scheduling');

  // Instructions state
  const [instructions, setInstructions] = useState<{id: number, title: string, content: string}[]>([]);
  const [instructionTitle, setInstructionTitle] = useState('');
  const [instructionContent, setInstructionContent] = useState('');
  const [editingInstructionId, setEditingInstructionId] = useState<number | null>(null);
  const fetchStatus = async (instance: string) => {
    try {
      const resp = await evolutionService.getStatus(instance);
      setStatus(resp.instance?.state || 'unknown');
    } catch (error) {
      console.error('Status check failed:', error);
    }
  };

  const fetchData = async () => {
    try {
      const resp = await clientService.getSettings().catch(() => ({}));
      setData(resp || {});
      const inst = resp?.agents?.[0]?.instanceName;
      if (inst) fetchStatus(inst);
      
      const agent = resp?.agents?.[0];
      if (agent) {
        setScheduleEnabled(agent.scheduleEnabled || false);
        setScheduleStartTime(agent.scheduleStartTime || '09:00');
        setScheduleEndTime(agent.scheduleEndTime || '17:00');
        setTimezone(agent.timezone || 'UTC');
      }
      
      const instructionsResp = await instructionsService.getInstructions().catch(() => []);
      setInstructions(instructionsResp || []);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConnect = async () => {
    const inst = data.agents?.[0]?.instanceName;
    if (!inst) return alert('No instance assigned. Contact admin.');
    setQrLoading(true);
    setQrCode(null);
    try {
      const resp = await evolutionService.getQR(inst);
      if (resp.base64) {
        setQrCode(resp.base64);
      } else {
        alert('Failed to get QR. Agent might be already connected.');
      }
    } catch (error) {
      alert('Connection error. Try again.');
    } finally {
      setQrLoading(false);
    }
  };

  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    try {
      await clientService.updateSettings({
        scheduleEnabled,
        scheduleStartTime,
        scheduleEndTime,
        timezone
      });
      alert('Schedule saved successfully!');
      fetchData();
    } catch (e) {
      alert('Failed to save schedule.');
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleRemoveSchedule = async () => {
    setSavingSchedule(true);
    try {
      await clientService.updateSettings({
        scheduleEnabled: false,
        scheduleStartTime: '',
        scheduleEndTime: '',
        timezone: 'UTC'
      });
      setScheduleEnabled(false);
      setScheduleStartTime('');
      setScheduleEndTime('');
      alert('Schedule removed successfully!');
      fetchData();
    } catch (e) {
      alert('Failed to remove schedule.');
    } finally {
      setSavingSchedule(false);
    }
  };

  if (loading) return <div className="loading">Loading Configuration...</div>;
  if (!data) return <div className="error">Failed to load configuration.</div>;

  const agent = data.agents?.[0];

  return (
    <div className="settings-page">

      {/* ── Dark Status Banner ── */}
      <div className="agent-status-banner">
        <div className="banner-left">
          <div className={`status-icon-wrap ${status === 'open' ? 'online' : 'offline'}`}>
            <Zap size={24} />
          </div>
          <div className="banner-text">
            <h3>Agent Engine — {agent?.instanceName || 'N/A'}</h3>
            <p>Last sync: {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
        <div className="banner-right">
          <div className={`status-live-badge ${status === 'open' ? 'online' : 'offline'}`}>
            <span className="pulse-dot"></span>
            {status === 'open' ? 'Live' : 'Offline'}
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem', gap: '2rem', padding: '0 0.5rem' }}>
        <button 
          style={{ 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'scheduling' ? '2px solid #2563eb' : '2px solid transparent', 
            padding: '0.5rem 0.5rem 0.75rem 0.5rem', 
            fontSize: '0.95rem', 
            fontWeight: 500, 
            color: activeTab === 'scheduling' ? '#2563eb' : '#64748b',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onClick={() => setActiveTab('scheduling')}
        >
          Agent Scheduling
        </button>
        <button 
          style={{ 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'sync' ? '2px solid #2563eb' : '2px solid transparent', 
            padding: '0.5rem 0.5rem 0.75rem 0.5rem', 
            fontSize: '0.95rem', 
            fontWeight: 500, 
            color: activeTab === 'sync' ? '#2563eb' : '#64748b',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onClick={() => setActiveTab('sync')}
        >
          WhatsApp Engine Sync
        </button>
        <button 
          style={{ 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'instructions' ? '2px solid #2563eb' : '2px solid transparent', 
            padding: '0.5rem 0.5rem 0.75rem 0.5rem', 
            fontSize: '0.95rem', 
            fontWeight: 500, 
            color: activeTab === 'instructions' ? '#2563eb' : '#64748b',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onClick={() => setActiveTab('instructions')}
        >
          Agent Instructions
        </button>
      </div>

      {/* ── Settings Content ── */}
      <div className="settings-content">

        {/* Card 1: Agent Scheduling */}
        {activeTab === 'scheduling' && (
        <div className="settings-card">
          <div className="card-header">
            <div className="card-title-group">
              <div className="card-icon blue">
                <Smartphone size={20} />
              </div>
              <div>
                <h2 className="card-title">Agent Scheduling</h2>
                <p className="card-subtitle">Set operating hours for your AI agent</p>
              </div>
            </div>
            {!agent?.scheduleEnabled && (
              <button className="btn-primary" onClick={handleSaveSchedule} disabled={savingSchedule}>
                {savingSchedule ? <Loader2 size={16} className="animate-spin" /> : 'Save Schedule'}
              </button>
            )}
          </div>

          {agent?.scheduleEnabled ? (
            <div style={{ background: '#f0f9ff', borderBottom: '1px solid #e0f2fe', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0ea5e9', boxShadow: '0 0 5px #0ea5e9' }}></div>
                <span style={{ fontSize: '1rem', color: '#0369a1', fontWeight: 600 }}>
                  Active Schedule: <strong style={{ color: '#0284c7', background: '#e0f2fe', padding: '4px 8px', borderRadius: '4px' }}>{agent.scheduleStartTime} - {agent.scheduleEndTime}</strong> ({agent.timezone})
                </span>
              </div>
              <button 
                onClick={handleRemoveSchedule}
                disabled={savingSchedule}
                style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                Delete Schedule
              </button>
            </div>
          ) : (
            <div className="schedule-form" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="checkbox" 
                  id="scheduleEnabled" 
                  checked={scheduleEnabled} 
                  onChange={e => setScheduleEnabled(e.target.checked)} 
                  style={{ width: '18px', height: '18px', accentColor: '#3b82f6' }}
                />
                <label htmlFor="scheduleEnabled" style={{ color: '#111827', fontSize: '1rem', fontWeight: 500, cursor: 'pointer' }}>Enable Automatic Scheduling</label>
              </div>

              {scheduleEnabled && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginTop: '10px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.85rem', color: '#4b5563', marginBottom: '5px', display: 'block', fontWeight: 500 }}>Timezone</label>
                    <select 
                      value={timezone} 
                      onChange={e => setTimezone(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#f9fafb', border: '1px solid #d1d5db', color: '#111827', fontWeight: 500 }}
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">EST (New York)</option>
                      <option value="America/Los_Angeles">PST (Los Angeles)</option>
                      <option value="Europe/London">GMT (London)</option>
                      <option value="Asia/Karachi">PKT (Karachi)</option>
                      <option value="Asia/Dubai">GST (Dubai)</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.85rem', color: '#4b5563', marginBottom: '5px', display: 'block', fontWeight: 500 }}>Start Time (HH:MM)</label>
                    <input 
                      type="time" 
                      value={scheduleStartTime} 
                      onChange={e => setScheduleStartTime(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#f9fafb', border: '1px solid #d1d5db', color: '#111827', fontWeight: 500 }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.85rem', color: '#4b5563', marginBottom: '5px', display: 'block', fontWeight: 500 }}>End Time (HH:MM)</label>
                    <input 
                      type="time" 
                      value={scheduleEndTime} 
                      onChange={e => setScheduleEndTime(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#f9fafb', border: '1px solid #d1d5db', color: '#111827', fontWeight: 500 }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* Card 2: WhatsApp AI Engine Sync */}
        {activeTab === 'sync' && (
        <div className="settings-card">
          <div className="card-header">
            <div className="card-title-group">
              <div className="card-icon orange">
                <Zap size={20} />
              </div>
              <div>
                <h2 className="card-title">WhatsApp Engine Sync</h2>
                <p className="card-subtitle">Connect your WhatsApp instance</p>
              </div>
            </div>
            {status !== 'open' && (
              <button className="btn-connect" onClick={handleConnect} disabled={qrLoading}>
                {qrLoading ? <Loader2 size={18} className="animate-spin" /> : 'Connect'}
              </button>
            )}
          </div>

          <div className="sync-content">
            {!qrCode ? (
              <div className="sync-placeholder">
                <div className="sync-icon-large"><Smartphone size={28} /></div>
                <p>Click <strong>'Connect'</strong> to generate a fresh pairing QR code.</p>
              </div>
            ) : (
              <div className="qr-active-display">
                <img src={qrCode} alt="WhatsApp QR" className="qr-image-large" />
                <p className="mt-1 text-muted">Scan this QR code with your WhatsApp app.</p>
                <button className="btn-text mt-1" onClick={() => setQrCode(null)}>Cancel</button>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Card 3: Agent Instructions */}
        {activeTab === 'instructions' && (
        <div className="settings-card">
          <div className="card-header">
            <div className="card-title-group">
              <div className="card-icon purple">
                <FileText size={20} />
              </div>
              <div>
                <h2 className="card-title">Agent Instructions</h2>
                <p className="card-subtitle">Manage instructions for your AI agent</p>
              </div>
            </div>
          </div>
          
          <div className="form-group mb-4" style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '10px', color: '#1e293b' }}>{editingInstructionId ? 'Edit Instruction' : 'Add New Instruction'}</h3>
            <input 
              type="text" 
              className="glass-input"
              placeholder="Instruction Title (e.g., Tone of Voice)"
              value={instructionTitle}
              onChange={(e) => setInstructionTitle(e.target.value)}
              style={{ marginBottom: '10px' }}
            />
            <textarea 
              className="glass-input" 
              placeholder="Instruction Details..."
              value={instructionContent}
              onChange={(e) => setInstructionContent(e.target.value)}
              rows={4}
              style={{ resize: 'vertical', marginBottom: '10px' }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              {editingInstructionId && (
                <button 
                  className="btn-secondary" 
                  onClick={() => {
                    setEditingInstructionId(null);
                    setInstructionTitle('');
                    setInstructionContent('');
                  }}
                  style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.375rem', fontWeight: 500, cursor: 'pointer' }}
                >
                  Cancel
                </button>
              )}
              <button 
                className="btn-primary" 
                onClick={async () => {
                  if (!instructionTitle.trim() || !instructionContent.trim()) {
                    alert('Title and content are required.');
                    return;
                  }
                  try {
                    if (editingInstructionId) {
                      const updated = await instructionsService.updateInstruction(editingInstructionId, { title: instructionTitle, content: instructionContent });
                      setInstructions(instructions.map(i => i.id === editingInstructionId ? updated : i));
                      setEditingInstructionId(null);
                    } else {
                      const newInstruction = await instructionsService.createInstruction({ title: instructionTitle, content: instructionContent });
                      setInstructions([...instructions, newInstruction]);
                    }
                    setInstructionTitle('');
                    setInstructionContent('');
                  } catch (e) {
                    alert('Failed to save instruction.');
                  }
                }}
              >
                <Plus size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> {editingInstructionId ? 'Update' : 'Add'} Instruction
              </button>
            </div>
          </div>

          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {instructions.length === 0 ? (
              <p className="text-muted text-center">No instructions added yet.</p>
            ) : (
              instructions.map((inst) => (
                <div key={inst.id} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#0f172a' }}>{inst.title}</h4>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer' }}
                        onClick={() => {
                          setEditingInstructionId(inst.id);
                          setInstructionTitle(inst.title);
                          setInstructionContent(inst.content);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to delete this instruction?')) {
                            try {
                              await instructionsService.deleteInstruction(inst.id);
                              setInstructions(instructions.filter(i => i.id !== inst.id));
                            } catch (e) {
                              alert('Failed to delete instruction.');
                            }
                          }
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: '#334155', whiteSpace: 'pre-wrap' }}>{inst.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
