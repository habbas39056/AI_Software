import React, { useState, useEffect } from 'react';
import { authService } from '../services/api';
import { User, Lock, Camera, Loader2 } from 'lucide-react';
import './Profile.css';

const Profile: React.FC = () => {
  const [profile, setProfile] = useState({ name: '', email: '', password: '', profileImage: '' });
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userResp = await authService.getCurrentUser();
        setProfile({ name: userResp.name || '', email: userResp.email || '', password: '', profileImage: userResp.profileImage || '' });
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
      </div>
    </div>
  );
};

export default Profile;
