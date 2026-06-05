import React, { useState, useEffect } from 'react';
import { authService, clientService } from '../services/api';
import { User, Lock, Camera, Loader2, Smartphone } from 'lucide-react';
import './Profile.css';

const Profile: React.FC = () => {
  const [profile, setProfile] = useState({ name: '', email: '', password: '', profileImage: '' });
  const [currency, setCurrency] = useState('USD');
  const [customServices, setCustomServices] = useState<string[]>([]);
  const [newService, setNewService] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [userResp, settingsResp] = await Promise.all([
          authService.getCurrentUser(),
          clientService.getSettings().catch(() => ({}))
        ]);
        setProfile({ name: userResp.name || '', email: userResp.email || '', password: '', profileImage: userResp.profileImage || '' });
        if (settingsResp?.currency) setCurrency(settingsResp.currency);
        if (settingsResp?.customServices) setCustomServices(settingsResp.customServices);
      } catch (error) {
        console.error('Failed to load profile', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      if (imageFile) {
        const formData = new FormData();
        formData.append('profileImage', imageFile);
        const imgResp = await authService.uploadProfileImage(formData);
        setProfile(prev => ({ ...prev, profileImage: imgResp.imageUrl }));
      }
      await authService.updateProfile({ name: profile.name, email: profile.email, password: profile.password });
      alert('Profile updated successfully!');
      setProfile(prev => ({ ...prev, password: '' }));
      window.location.reload(); // Refresh to update Layout profile pic if needed
    } catch (error) {
      alert('Failed to update profile.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  if (loading) return <div className="loading">Loading Profile...</div>;

  return (
    <div className="profile-page">


      <div className="settings-container mt-2">
        <div className="white-box mb-2">
          <h2 className="box-title mb-2"><User size={20} /> Personal Details</h2>
          <form className="profile-form" onSubmit={handleUpdateProfile}>
            <div className="profile-image-section">
              <div className="profile-avatar-large">
                {previewImage || profile.profileImage ? (
                  <img src={previewImage || profile.profileImage} alt="Profile" className="profile-img" />
                ) : (
                  <User size={40} className="text-muted" />
                )}
                <label className="upload-btn">
                  <Camera size={14} />
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                </label>
              </div>
              <div className="profile-image-text">
                <h3>Profile Picture</h3>
                <p>Upload a new avatar. Max size 2MB.</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" name="name" value={profile.name} onChange={handleProfileChange} className="glass-input" required />
              </div>
              <div className="form-group">
                <label className="form-label">Login Email / Username</label>
                <input type="text" name="email" value={profile.email} onChange={handleProfileChange} className="glass-input" required />
              </div>
              <div className="form-group">
                <label className="form-label"><Lock size={14} className="inline-icon" /> New Password (Leave blank to keep)</label>
                <input type="password" name="password" value={profile.password} onChange={handleProfileChange} className="glass-input" placeholder="••••••••" />
              </div>
            </div>

            <div className="mt-2 flex justify-end">
              <button type="submit" className="btn-primary" disabled={updatingProfile}>
                {updatingProfile ? <Loader2 size={16} className="animate-spin" /> : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>

        <div className="white-box mt-2">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div className="card-title-group" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div className="card-icon green">
                <Smartphone size={20} />
              </div>
              <div>
                <h2 className="card-title" style={{ margin: 0 }}>General Preferences</h2>
                <p className="card-subtitle" style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Configure global portal settings</p>
              </div>
            </div>
            <button className="btn-primary" onClick={async () => {
              try {
                await clientService.updateSettings({ currency, customServices });
                alert('Preferences saved successfully!');
              } catch (e) {
                alert('Failed to save preferences.');
              }
            }}>Save Preferences</button>
          </div>
          
          <div className="form-group">
            <label className="form-label">DISPLAY CURRENCY</label>
            <select 
              className="glass-input" 
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="USD">US Dollar ($)</option>
              <option value="PKR">Pakistani Rupee (Rs)</option>
              <option value="EUR">Euro (€)</option>
              <option value="GBP">British Pound (£)</option>
              <option value="INR">Indian Rupee (₹)</option>
              <option value="AED">UAE Dirham (د.إ)</option>
              <option value="AUD">Australian Dollar (A$)</option>
              <option value="CAD">Canadian Dollar (C$)</option>
            </select>
            <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
              This currency will be used to format all financial figures across your dashboard, leads, and commissions.
            </p>
          </div>

          <hr style={{ margin: '1.5rem 0', borderColor: '#e2e8f0' }} />
          
          <div className="form-group">
            <label className="form-label">CUSTOM SERVICES</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input 
                type="text" 
                className="glass-input" 
                style={{ flex: 1 }}
                placeholder="e.g. AI Automation"
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (newService.trim() && !customServices.includes(newService.trim())) {
                      setCustomServices([...customServices, newService.trim()]);
                      setNewService('');
                    }
                  }
                }}
              />
              <button 
                type="button" 
                className="btn-primary"
                onClick={() => {
                  if (newService.trim() && !customServices.includes(newService.trim())) {
                    setCustomServices([...customServices, newService.trim()]);
                    setNewService('');
                  }
                }}
              >
                Add
              </button>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
              {customServices.map((service, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f1f5f9', padding: '4px 12px', borderRadius: '9999px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#334155' }}>{service}</span>
                  <button 
                    type="button"
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}
                    onClick={() => {
                      setCustomServices(customServices.filter((_, i) => i !== index));
                    }}
                  >
                    &times;
                  </button>
                </div>
              ))}
              {customServices.length === 0 && (
                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>No custom services added. Default services will be shown.</p>
              )}
            </div>
            <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
              These services will appear in the Lead Add/Edit dropdowns.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
