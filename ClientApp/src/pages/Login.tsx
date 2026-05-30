import { useState } from 'react';
import { authService } from '../services/api';
import { Mail, Phone, Globe, MapPin } from 'lucide-react';
import './Login.css';

const Login: React.FC = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(credentials);
      localStorage.setItem('token', response.token);
      window.location.href = '/'; 
    } catch (err: any) {
      console.error('Login error detail:', err);
      const msg = err.response?.data?.message || err.message || 'Invalid username or password';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-branding">
          <img src="/logo.png" alt="Adwise Labs" className="login-logo-img" />
          <p className="login-tagline">Sales CRM Platform</p>
        </div>

        <div className="login-contact-card">
          <div className="contact-item">
            <Phone size={16} className="contact-icon" />
            <div>
              <div className="contact-bold">+1 385-699-4403</div>
              <div className="contact-light">+92 329 2371279</div>
            </div>
          </div>
          <div className="contact-item">
            <Mail size={16} className="contact-icon" />
            <div className="contact-light">info@adwiselabs.com</div>
          </div>
          <div className="contact-item">
            <Globe size={16} className="contact-icon" />
            <div className="contact-light">www.adwiselabs.com</div>
          </div>
          <div className="contact-item">
            <MapPin size={16} className="contact-icon" />
            <div className="contact-light" style={{ maxWidth: '200px', lineHeight: '1.4' }}>
              A-205/II Saba Ave, DHA Karachi Phase VIII
            </div>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-form-container">
          <h2 className="login-title">CRM Login</h2>
          <p className="login-subtitle">Sign in to your account</p>

          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">USERNAME</label>
              <input 
                type="text" 
                name="username" 
                className="plain-input" 
                placeholder="Username" 
                required 
                value={credentials.username}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">PASSWORD</label>
              <input 
                type="password" 
                name="password" 
                className="plain-input" 
                placeholder="Password" 
                required 
                value={credentials.password}
                onChange={handleChange}
              />
            </div>
            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
