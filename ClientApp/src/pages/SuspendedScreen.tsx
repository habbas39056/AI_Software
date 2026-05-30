import React from 'react';
import { Lock, LogOut, MessageCircle } from 'lucide-react';
import { authService } from '../services/api';
import './SuspendedScreen.css';

const SuspendedScreen: React.FC = () => {
  const handleLogout = async () => {
    await authService.logout();
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const handleContactSupport = () => {
    window.open('https://wa.me/923346565253', '_blank');
  };

  return (
    <div className="suspended-overlay">
      <div className="suspended-card">
        <div className="lock-icon-wrapper">
          <Lock size={48} className="lock-icon" />
        </div>

        <h1 className="suspended-title">
          <span className="warning-icon">⚠</span> Account Suspended
        </h1>

        <p className="suspended-msg">
          Your subscription has expired. Your AI agents have been <strong>paused</strong> and your dashboard access has been <strong>restricted</strong>.
        </p>

        <p className="suspended-submsg">
          Please clear your outstanding dues to restore full access to your portal and re-activate your AI agents.
        </p>

        <div className="status-details-box">
          <div className="status-row">
            <span className="label">Account Status</span>
            <span className="value status-red">SUSPENDED</span>
          </div>
          <div className="status-row">
            <span className="label">AI Agents</span>
            <span className="value status-red">ALL PAUSED</span>
          </div>
          <div className="status-row border-none">
            <span className="label">Action Required</span>
            <span className="value status-blue">Clear Outstanding Dues</span>
          </div>
        </div>

        <div className="suspended-actions">
          <button className="btn-contact-admin" onClick={handleContactSupport}>
            <MessageCircle size={18} />
            Contact Admin to Pay
          </button>
          <button className="btn-logout-suspended" onClick={handleLogout}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuspendedScreen;
