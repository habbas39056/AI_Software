import React, { useEffect, useState } from 'react';
import { clientService, evolutionService } from '../services/api';
import { Zap, Loader2, Pause, Play, Smartphone } from 'lucide-react';
import './Settings.css';

const Settings: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<'open' | 'close' | 'connecting' | 'unknown'>('unknown');
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

  const handleToggleAgent = async () => {
    const active = data.agents?.[0]?.isActive;
    try {
      await clientService.toggleAgent(!active);
      fetchData();
    } catch (error) {
      alert('Failed to update agent status.');
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

      {/* ── Settings Grid ── */}
      <div className="settings-grid">

        {/* Card 1: Active Agent Instances */}
        <div className="settings-card">
          <div className="card-header">
            <div className="card-title-group">
              <div className="card-icon blue">
                <Smartphone size={20} />
              </div>
              <div>
                <h2 className="card-title">Active Instances</h2>
                <p className="card-subtitle">Manage your AI agent instances</p>
              </div>
            </div>
          </div>

          <div className="instance-item">
            <div className="instance-details">
              <div className="instance-avatar">
                {(agent?.instanceName || 'A').charAt(0)}
              </div>
              <div className="instance-meta">
                <span className="instance-name">{agent?.instanceName || 'Primary Agent'}</span>
                <span className={`instance-status ${status === 'open' ? 'online' : 'offline'}`}>
                  {status === 'open' ? 'Connected' : status.toUpperCase()}
                </span>
              </div>
            </div>
            <button className={`btn-toggle-agent ${agent?.isActive ? 'pause' : 'resume'}`} onClick={handleToggleAgent}>
              {agent?.isActive ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Resume</>}
            </button>
          </div>
        </div>

        {/* Card 2: WhatsApp AI Engine Sync */}
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

      </div>
    </div>
  );
};

export default Settings;
