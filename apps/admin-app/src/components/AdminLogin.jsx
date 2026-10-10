import React, { useState } from 'react';
import { Button, Card, apiClient } from '@uiu/ui';
import { ShieldCheck, Lock, Mail, AlertCircle } from 'lucide-react';
import './AdminLogin.css';

export default function AdminLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFillDemo = () => {
    setEmail('admin@uiu.ac.bd');
    setPassword('admin123');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiClient.post('/api/auth/login', { email, password });
      if (data.user?.role !== 'admin') {
        apiClient.clearSession();
        setError('Access denied: Account does not have Administrator privileges.');
        setLoading(false);
        return;
      }
      apiClient.setSession(data.token, data.user);
      onLoginSuccess(data.user);
      
    } catch (err) {
      setError(err.message || 'Invalid administrator credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <Card className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-icon-badge">
            <ShieldCheck size={32} color="#D97706" />
          </div>
          <h1 className="admin-login-title">UIU Administrator Portal</h1>
          <p className="admin-login-subtitle">
            Secure administrative control center for UIU Alumni Relations Office.
          </p>
        </div>

        {error && (
          <div className="admin-error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div style={{ marginBottom: '16px', background: 'rgba(217, 119, 6, 0.08)', border: '1px solid rgba(217, 119, 6, 0.25)', borderRadius: '8px', padding: '12px 14px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#D97706', marginBottom: '4px' }}>🔑 Demo Administrator Account</div>
            <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px' }}>Email: admin@uiu.ac.bd | Password: admin123</div>
            <button
              type="button"
              onClick={handleFillDemo}
              style={{ background: 'none', border: 'none', color: '#D97706', fontWeight: 600, fontSize: '12px', cursor: 'pointer', padding: 0 }}
            >
              Auto-fill Admin Credentials →
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">Admin Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                required
                className="form-input icon-padded"
                placeholder="admin@uiu.ac.bd"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                required
                className="form-input icon-padded"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" variant="accent" size="lg" fullWidth disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In as Administrator'}
          </Button>

          <div className="admin-login-footer-text">
            <span>Official Authorized Personnel Only • Protected by UIU IT Governance</span>
          </div>
        </form>
      </Card>
    </div>
  );
}
