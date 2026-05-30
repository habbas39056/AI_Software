import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../services/api';
import { Mail, Phone, Eye, Edit, Trash2, Plus, User } from 'lucide-react';
import './Clients.css';

const Clients: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    try {
      const data = await adminService.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('CRITICAL: This will permanently delete this client and ALL their AI agents. Are you sure?')) {
      try {
        await adminService.deleteCustomer(id);
        setCustomers(customers.filter(c => c.whatsAppNumber !== id));
      } catch (error) {
        console.error('Failed to delete customer:', error);
        alert('Failed to delete customer.');
      }
    }
  };

  if (loading) return <div className="loading">Loading clients...</div>;

  return (
    <div className="clients-page">
      <div className="page-header">
        <div></div>
        <Link to="/clients/add" className="btn-primary">
          <Plus size={18} />
          Onboard New Client
        </Link>
      </div>

      <div className="white-box no-padding">
        <div className="table-responsive">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Customer Identity</th>
                <th>Instance Name</th>
                <th>Auth (WhatsApp/Email)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state">
                    No clients installed. Go to Onboard New Client to begin.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.whatsAppNumber}>
                    <td>
                      <div className="customer-identity">
                        <div className="avatar">
                          {c.name ? c.name.substring(0, 1) : <User size={16} />}
                        </div>
                        <div className="customer-info">
                          <span className="customer-name">{c.name}</span>
                          <span className="customer-entity">{c.businessEntity}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="instance-badge">{c.instanceName}</span>
                    </td>
                    <td>
                      <div className="auth-info">
                        <div className="auth-item">
                          <Mail size={12} /> {c.email}
                        </div>
                        <div className="auth-item">
                          <Phone size={12} /> {c.whatsAppNumber}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${c.subscriptionStatus?.toLowerCase()}`}>
                        {c.subscriptionStatus}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Link to={`/clients/${c.whatsAppNumber}`} className="btn-secondary btn-sm">
                          <Eye size={12} /> 360 View
                        </Link>
                        <Link to={`/clients/edit/${c.whatsAppNumber}`} className="icon-btn edit">
                          <Edit size={16} />
                        </Link>
                        <button 
                          onClick={() => handleDelete(c.whatsAppNumber)} 
                          className="icon-btn delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Clients;
