import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminService } from '../services/api';
import { 
  User, 
  Building2, 
  Mail, 
  Phone, 
  Lock, 
  Calendar, 
  DollarSign, 
  ChevronRight, 
  ChevronLeft, 
  Settings, 
  Globe, 
  Zap,
  Info,
  Check
} from 'lucide-react';
import './AddCustomer.css';

const AddCustomer: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialFetch, setInitialFetch] = useState(isEditing);
  const [formData, setFormData] = useState({
    name: '',
    businessEntity: '',
    email: '',
    whatsAppNumber: '',
    password: '',
    subscriptionDays: 30,
    monthlyFee: 14000,
    instanceName: '',
    configApiKey: '',
    n8nWebhookUrl: '',
    initialKnowledge: ''
  });

  React.useEffect(() => {
    if (isEditing && id) {
      const fetchCustomer = async () => {
        try {
          const response = await adminService.getCustomerDetails(id);
          const customer = response.customer;
          setFormData({
            name: customer.name || '',
            businessEntity: customer.businessEntity || '',
            email: customer.email || '',
            whatsAppNumber: customer.whatsAppNumber || '',
            password: customer.password || '',
            subscriptionDays: customer.subscriptionDays || 30,
            monthlyFee: customer.monthlyFee || 14000,
            instanceName: customer.instanceName || '',
            configApiKey: customer.configApiKey || '',
            n8nWebhookUrl: customer.n8nWebhookUrl || '',
            initialKnowledge: customer.initialKnowledge || ''
          });
        } catch (err) {
          console.error('Failed to load customer', err);
          alert('Failed to load customer details');
        } finally {
          setInitialFetch(false);
        }
      };
      fetchCustomer();
    }
  }, [id, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name.trim() || !formData.email.trim() || !formData.whatsAppNumber.trim()) {
        alert('Please fill out all required fields: Customer Name, Primary Admin Email, and WhatsApp Number.');
        return;
      }
    } else if (step === 2) {
      if (!formData.instanceName.trim() || !formData.configApiKey.trim()) {
        alert('Please fill out all required fields: Instance Name and Evolution API Key.');
        return;
      }
    }
    setStep(prev => prev + 1);
  };
  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing && id) {
        await adminService.updateCustomer(id, formData);
      } else {
        await adminService.addCustomer(formData);
      }
      navigate('/clients');
    } catch (error: any) {
      console.error('Failed to save customer:', error);
      const msg = error.response?.data?.message || error.message || 'Failed to save client.';
      alert('Error: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  if (initialFetch) return <div className="loading">Loading client data...</div>;

  return (
    <div className="add-customer-page">
      {!isEditing ? (
        <>
          <div className="step-indicator">
            <span className="step-badge">Step {step} of 3</span>
          </div>

          <div className="stepper-header">
            <div className={`step-item ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
              <div className="step-circle">
                {step > 1 ? <Check size={20} /> : <span>1</span>}
              </div>
              <div className="step-label">CLIENT IDENTITY</div>
            </div>
            <div className={`step-item ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
              <div className="step-circle">
                {step > 2 ? <Check size={20} /> : <span>2</span>}
              </div>
              <div className="step-label">TECHNICAL CONFIG</div>
            </div>
            <div className={`step-item ${step >= 3 ? 'active' : ''}`}>
              <div className="step-circle">
                <span>3</span>
              </div>
              <div className="step-label">INITIAL KNOWLEDGE</div>
            </div>
          </div>
        </>
      ) : (
        <div className="page-header mb-2" style={{ textAlign: 'center', display: 'block' }}>
          <h1 className="page-title">Edit Client Details</h1>
          <p className="page-subtitle">Update configuration and identity for this client.</p>
        </div>
      )}

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          {(step === 1 || isEditing) && (
            <div className="step-content mb-2">


              <div className="section-header">
                <div className="section-icon"><User size={18} /></div>
                <div>
                  <span className="section-tag">PART 01</span>
                  <h2 className="section-title">Client Identity</h2>
                </div>
              </div>

              <div className="white-box">
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Customer Name <Info size={14} className="info-icon" /></label>
                    <div className="input-group">
                      <User size={18} className="input-icon" />
                      <input 
                        type="text" 
                        name="name" 
                        value={formData.name} 
                        onChange={handleChange} 
                        className="glass-input with-icon" 
                        required 
                        placeholder="e.g. Acme Corp" 
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Business Entity <Info size={14} className="info-icon" /></label>
                    <div className="input-group">
                      <Building2 size={18} className="input-icon" />
                      <input 
                        type="text" 
                        name="businessEntity" 
                        value={formData.businessEntity} 
                        onChange={handleChange} 
                        className="glass-input with-icon" 
                        placeholder="e.g. Acme Services LLC" 
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Primary Admin Email <Info size={14} className="info-icon" /></label>
                  <div className="input-group">
                    <Mail size={18} className="input-icon" />
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange} 
                      className="glass-input with-icon" 
                      required 
                      placeholder="admin@customer.com" 
                    />
                  </div>
                  <span className="input-help">This email will receive the automatically generated system access credentials.</span>
                </div>

                <div className="form-group">
                  <label className="form-label">WhatsApp Number</label>
                  <div className="input-group">
                    <Phone size={18} className="input-icon" />
                    <input 
                      type="text" 
                      name="whatsAppNumber" 
                      value={formData.whatsAppNumber} 
                      onChange={handleChange} 
                      className="glass-input with-icon" 
                      required 
                      placeholder="+1234567890" 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">System Access Password</label>
                  <div className="input-group">
                    <Lock size={18} className="input-icon" />
                    <input 
                      type="password" 
                      name="password" 
                      value={formData.password} 
                      onChange={handleChange} 
                      className="glass-input with-icon" 
                      placeholder="Default: 123456" 
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Subscription Days <Info size={14} className="info-icon" /></label>
                    <div className="input-group">
                      <Calendar size={18} className="input-icon" />
                      <input 
                        type="number" 
                        name="subscriptionDays" 
                        value={formData.subscriptionDays} 
                        onChange={handleChange} 
                        className="glass-input with-icon" 
                        min="1" 
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Monthly Fee (PKR)</label>
                    <div className="input-group">
                      <DollarSign size={18} className="input-icon" />
                      <input 
                        type="number" 
                        name="monthlyFee" 
                        value={formData.monthlyFee} 
                        onChange={handleChange} 
                        className="glass-input with-icon" 
                        min="0" 
                      />
                    </div>
                  </div>
                </div>

                {!isEditing && (
                  <button type="button" className="btn-dark-full" onClick={handleNext}>
                    Continue to Config <ChevronRight size={18} />
                  </button>
                )}
              </div>
            </div>
          )}

          {(step === 2 || isEditing) && (
            <div className="step-content mb-2">
              {!isEditing && (
                <>
                  <h1 className="step-title text-center">Technical Configuration</h1>
                  <p className="step-subtitle text-center">Configure the connection between your instance and the automation engine.</p>
                </>
              )}

              <div className="white-box mt-2">
                <div className="config-section">
                  <div className="section-icon-bg green"><Globe size={20} /></div>
                  <div className="flex-1">
                    <h3 className="config-title">Instance Details</h3>
                    <p className="config-desc">Your dedicated SaaS subdomain environment.</p>
                    <div className="form-group">
                      <label className="form-label">Instance Name <Info size={14} className="info-icon" /></label>
                      <div className="input-group">
                        <Globe size={18} className="input-icon" />
                        <input 
                          type="text" 
                          name="instanceName" 
                          value={formData.instanceName} 
                          onChange={handleChange} 
                          className="glass-input with-icon" 
                          required 
                          placeholder="acme-corp-bot" 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="config-section">
                  <div className="section-icon-bg blue"><Settings size={20} /></div>
                  <div className="flex-1">
                    <h3 className="config-title">API Credentials</h3>
                    <p className="config-desc">Secure keys for backend service integration.</p>
                    <div className="form-group">
                      <label className="form-label">Evolution API Key <Info size={14} className="info-icon" /></label>
                      <div className="input-group">
                        <Zap size={18} className="input-icon" />
                        <input 
                          type="text" 
                          name="configApiKey" 
                          value={formData.configApiKey} 
                          onChange={handleChange} 
                          className="glass-input with-icon" 
                          required
                          placeholder="Enter your evolution api key" 
                        />
                      </div>
                    </div>
                  </div>
                </div>



                {!isEditing && (
                  <div className="button-group spread">
                    <button type="button" className="btn-secondary" onClick={handleBack}>
                      <ChevronLeft size={18} /> Back
                    </button>
                    <button type="button" className="btn-dark" onClick={handleNext}>
                      Continue to Knowledge <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {(step === 3 || isEditing) && (
            <div className="step-content">
              {!isEditing && (
                <>
                  <h1 className="step-title text-center">Initial Base Knowledge</h1>
                  <p className="step-subtitle text-center">Paste the company FAQs and capabilities to initialize the AI's brain.</p>
                </>
              )}

              <div className="white-box mt-2">
                <div className="form-group">
                  <label className="form-label">Initial Context (Optional)</label>
                  <textarea 
                    name="initialKnowledge" 
                    value={formData.initialKnowledge} 
                    onChange={handleChange} 
                    className="glass-input textarea" 
                    rows={8} 
                    placeholder="Enter facts, prices, and services..."
                  ></textarea>
                </div>

                <div className="button-group spread">
                  {!isEditing ? (
                    <>
                      <button type="button" className="btn-secondary" onClick={handleBack}>
                        <ChevronLeft size={18} /> Back
                      </button>
                      <button type="submit" className="btn-dark" disabled={loading}>
                        {loading ? 'Processing...' : 'Finalize & Create Tenant'}
                      </button>
                    </>
                  ) : (
                    <button type="submit" className="btn-dark w-full" disabled={loading}>
                      {loading ? 'Saving Changes...' : 'Save Changes'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddCustomer;
