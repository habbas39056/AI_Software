import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminService } from '../services/api';
import { 
  ArrowLeft, 
  BookOpen, 
  Users, 
  RefreshCcw, 
  Ban, 
  CheckCircle,
  Zap,
  Loader2
} from 'lucide-react';
import './ClientDetails.css';

const ClientDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [renewDays, setRenewDays] = useState(30);

  const fetchData = async () => {
    if (!id) return;
    try {
      const details = await adminService.getCustomerDetails(id);
      setData(details);
      setRenewDays(details.customer.subscriptionDays || 30);
    } catch (error) {
      console.error('Failed to fetch details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!id || !data) return;
    const newStatus = data.customer.subscriptionStatus === 'Active' ? 'Suspended' : 'Active';
    if (newStatus === 'Suspended' && !window.confirm('Block this client portal?')) return;
    
    try {
      await adminService.toggleSubscription(id, newStatus);
      fetchData();
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const handleRenew = async () => {
    if (!id || !data) return;
    try {
      await adminService.renewSubscription(id, renewDays, data.customer.monthlyFee);
      fetchData();
      alert('Subscription renewed successfully!');
    } catch (error) {
      console.error('Failed to renew:', error);
    }
  };

  const generateQR = async () => {
    if (!data) return;
    setQrLoading(true);
    setQrCode(null);
    try {
      // Use our Node.js Evolution Bridge
      const response = await fetch(`/api/evolution/qr/${data.customer.instanceName}`);
      const qrData = await response.json();
      
      // Handle both base64 (QR) and pairingCode formats
      if (qrData.base64) {
        setQrCode(qrData.base64);
      } else if (qrData.pairingCode) {
        alert(`Pairing Code: ${qrData.pairingCode}`);
      } else {
        alert('Failed to generate QR code. Check Evolution API logs.');
      }
    } catch (error) {
      console.error('QR generation failed:', error);
      alert('System error connecting to Evolution bridge.');
    } finally {
      setQrLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading Client 360 View...</div>;
  if (!data) return <div className="error">Client not found.</div>;

  const { customer, daysLeft } = data;

  return (
    <div className="details-page">
      <div className="page-header">
        <div>
          <Link to="/clients" className="btn-secondary btn-sm mb-1">
            <ArrowLeft size={16} /> Back to Roster
          </Link>
          <h1 className="page-title">{customer.name} (360° View)</h1>
          <p className="page-subtitle">Manage integrations, bot knowledge, and captured leads.</p>
        </div>
        <div className="subscription-status-badge">
          <span className={`badge big ${customer.subscriptionStatus.toLowerCase()}`}>
            {customer.subscriptionStatus}
          </span>
          <p className="expiry-text">
            Expires: {new Date(customer.subscriptionExpiry).toLocaleDateString()} ({daysLeft} days left)
          </p>
        </div>
      </div>

      <div className="subscription-controls white-box">
        <div className="control-info">
          <strong>Subscription Control:</strong> {customer.subscriptionDays} days cycle | PKR {customer.monthlyFee.toLocaleString()}
        </div>
        <div className="control-actions">
          {customer.subscriptionStatus === 'Active' ? (
            <button className="btn-danger-outline" onClick={handleToggleStatus}>
              <Ban size={16} /> Block Portal
            </button>
          ) : (
            <button className="btn-success-outline" onClick={handleToggleStatus}>
              <CheckCircle size={16} /> Unblock Portal
            </button>
          )}
          <div className="renew-group">
            <input 
              type="number" 
              value={renewDays} 
              onChange={(e) => setRenewDays(parseInt(e.target.value))} 
              className="renew-input"
            />
            <button className="btn-primary" onClick={handleRenew}>
              <RefreshCcw size={16} /> Renew
            </button>
          </div>
        </div>
      </div>

      <div className="stats-grid-details mt-2">
        <div className="stat-card-mini">
          <span className="stat-label">Total Leads</span>
          <span className="stat-value text-blue">{customer.leads?.length || 0}</span>
        </div>
        <div className="stat-card-mini">
          <span className="stat-label">Knowledge Articles</span>
          <span className="stat-value text-green">{customer.knowledgeBases?.length || 0}</span>
        </div>
        <div className="stat-card-mini">
          <span className="stat-label">Monthly Revenue</span>
          <span className="stat-value text-orange">PKR {customer.monthlyFee?.toLocaleString() || 0}</span>
        </div>
        <div className="stat-card-mini">
          <span className="stat-label">Agent Status</span>
          <span className={`stat-value ${customer.agents?.[0]?.isActive ? 'text-success' : 'text-danger'}`}>
            {customer.agents?.[0]?.isActive ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="details-grid mt-2">
        <div className="white-box">
          <h2 className="box-title">
            <Zap size={20} className="text-green" /> WhatsApp Agent Linking
          </h2>
          <div className="instance-info mt-1">
            <p className="label">Instance Name:</p>
            <div className="instance-name-box">{customer.instanceName || customer.agents?.[0]?.instanceName}</div>
          </div>
          
          <div className="config-details mt-1">
            <div className="config-item">
              <span className="label">API Key:</span>
              <code className="code-box">{customer.configApiKey || 'Not Set'}</code>
            </div>
            <div className="config-item">
              <span className="label">Webhook URL:</span>
              <p className="url-text">{customer.n8nWebhookUrl || 'Not Set'}</p>
            </div>
          </div>

          <div className="qr-section mt-2">
            {!qrCode ? (
              <button className="btn-primary w-full" onClick={generateQR} disabled={qrLoading}>
                {qrLoading ? <Loader2 size={18} className="animate-spin" /> : 'Connect WhatsApp Agent'}
              </button>
            ) : (
              <div className="qr-display">
                <img src={qrCode} alt="WhatsApp QR" className="qr-image" />
                <button className="btn-text mt-1" onClick={generateQR}>Regenerate QR</button>
              </div>
            )}
          </div>
        </div>

        <div className="cards-column">
          <div className="white-box link-card">
            <BookOpen size={48} className="text-green mb-1" />
            <h2 className="box-title">Knowledge Base</h2>
            <p className="box-subtitle">Manage bot knowledge and custom mappings.</p>
            <Link to={`/clients/${id}/knowledge-base`} className="btn-primary w-full">
              View Knowledge Base
            </Link>
          </div>

          <div className="white-box link-card">
            <Users size={48} className="text-green mb-1" />
            <h2 className="box-title">Captured Leads ({customer.leads?.length || 0})</h2>
            <p className="box-subtitle">View and manage leads captured by the AI.</p>
            <Link to={`/clients/${id}/leads`} className="btn-primary w-full">
              View Captured Leads
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;
