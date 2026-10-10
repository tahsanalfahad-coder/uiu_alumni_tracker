import React, { useState, useEffect } from 'react';
import { Modal, Button, Badge, api, setAuthSession } from '@uiu/ui';
import { KeyRound, ShieldAlert, CheckCircle, ArrowRight } from 'lucide-react';
import './AuthModal.css';

export default function AuthModal({
  isOpen,
  onClose,
  initialRole = 'alumni',
  initialMode = 'signin',
  onAuthenticate
}) {
  const [roleTab, setRoleTab] = useState(initialRole === 'admin' ? 'alumni' : initialRole);
  const [modeTab, setModeTab] = useState(initialMode);
  const [submittedPending, setSubmittedPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [batch, setBatch] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [studentId, setStudentId] = useState('');
  const [currentRole, setCurrentRole] = useState('Software Engineer');
  const [company, setCompany] = useState('Tech Company');

  useEffect(() => {
    setRoleTab(initialRole === 'admin' ? 'alumni' : initialRole);
    setModeTab(initialMode);
    setSubmittedPending(false);
    setErrorMsg('');
  }, [initialRole, initialMode, isOpen]);

  const handleFillDemo = () => {
    setErrorMsg('');
    if (roleTab === 'alumni') {
      setEmail('tanvir.ahmed@gmail.com');
      setPassword('password123');
    } else {
      setEmail('shakil.011201044@bscse.uiu.ac.bd');
      setPassword('password123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (modeTab === 'register') {
        if (roleTab === 'alumni') {
          const res = await api.post('/auth/register/alumni', {
            name: fullName,
            email,
            password,
            batch,
            department,
            currentRole,
            company
          });
          setSubmittedPending(true);
        } else {
          // Student register
          const res = await api.post('/auth/register/student', {
            name: fullName,
            email,
            password,
            studentId,
            department
          });
          setAuthSession(res.token, res.user);
          if (onAuthenticate) onAuthenticate(res.token, res.user);
          onClose();
        }
      } else {
        // Sign In
        const res = await api.post('/auth/login', { email, password });
        if (res.user.role === 'admin') {
          setErrorMsg('Administrator access must use the dedicated Admin Portal (port 5174).');
          setLoading(false);
          return;
        }
        setAuthSession(res.token, res.user);
        if (onAuthenticate) onAuthenticate(res.token, res.user);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const getSubmitButtonVariant = () => {
    if (roleTab === 'student') return 'role-student';
    return 'role-alumni';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="UIU Alumni Portal Access"
      subtitle="Sign in or create your account to proceed"
      maxWidth="500px"
    >
      {/* Role Tabs (Alumni & Student only) */}
      <div className="auth-role-tabs">
        <button
          className={`auth-role-tab role-alumni-tab ${roleTab === 'alumni' ? 'active' : ''}`}
          onClick={() => { setRoleTab('alumni'); setSubmittedPending(false); setErrorMsg(''); }}
        >
          Alumni
        </button>
        <button
          className={`auth-role-tab role-student-tab ${roleTab === 'student' ? 'active' : ''}`}
          onClick={() => { setRoleTab('student'); setSubmittedPending(false); setErrorMsg(''); }}
        >
          Current Student
        </button>
      </div>

      {/* Sub-tabs: Sign In vs Register */}
      {!submittedPending && (
        <div className="auth-segmented-control">
          <button
            className={`auth-sub-tab ${modeTab === 'signin' ? 'active' : ''}`}
            onClick={() => { setModeTab('signin'); setErrorMsg(''); }}
          >
            Sign In
          </button>
          <button
            className={`auth-sub-tab ${modeTab === 'register' ? 'active' : ''}`}
            onClick={() => { setModeTab('register'); setErrorMsg(''); }}
          >
            Register
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="auth-error-banner">
          <ShieldAlert size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {submittedPending ? (
        <div className="auth-pending-notice">
          <div className="pending-icon-wrap">
            <CheckCircle size={40} className="text-success" />
          </div>
          <h3>Application Submitted for Admin Approval</h3>
          <p>
            Thank you, <strong>{fullName || 'Alumnus'}</strong>. Alumni accounts require verification by the UIU Registrar office before full access is granted.
          </p>
          <Badge variant="warning">Status: Pending Verification</Badge>
          <div style={{ marginTop: '20px' }}>
            <Button
              variant="primary"
              fullWidth
              onClick={() => onClose()}
            >
              Close Window
            </Button>
          </div>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Demo Helper Box */}
          {modeTab === 'signin' && (
            <div className="demo-credentials-box">
              <div className="demo-cred-header">
                <KeyRound size={16} />
                <span>Demo Credentials ({roleTab.toUpperCase()})</span>
              </div>
              <p className="demo-cred-text">
                Testing? Click to auto-fill credentials:
              </p>
              <button type="button" className="demo-autofill-link" onClick={handleFillDemo}>
                Auto-fill {roleTab} login details <ArrowRight size={12} />
              </button>
            </div>
          )}

          {/* Registration Info Banner for Alumni */}
          {modeTab === 'register' && roleTab === 'alumni' && (
            <div className="auth-info-banner">
              <ShieldAlert size={18} />
              <span>Alumni accounts require admin approval before full access is granted.</span>
            </div>
          )}

          {/* Registration extra fields */}
          {modeTab === 'register' && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tanvir Ahmed"
                  className="form-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              {roleTab === 'alumni' && (
                <>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="form-label">Batch Code</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. CSE-2020"
                        className="form-input"
                        value={batch}
                        onChange={(e) => setBatch(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Department</label>
                      <select
                        className="form-input"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                      >
                        <option value="Computer Science & Engineering">CSE</option>
                        <option value="Electrical & Electronic Engineering">EEE</option>
                        <option value="Business Administration">BBA</option>
                        <option value="Civil Engineering">Civil</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="form-label">Current Role / Job Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Senior Developer"
                        className="form-input"
                        value={currentRole}
                        onChange={(e) => setCurrentRole(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Company</label>
                      <input
                        type="text"
                        placeholder="e.g. Google"
                        className="form-input"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              {roleTab === 'student' && (
                <div className="form-group">
                  <label className="form-label">UIU Student ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 011201044"
                    className="form-input"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                  />
                </div>
              )}
            </>
          )}

          {/* Common Email & Password */}
          <div className="form-group">
            <label className="form-label">UIU Email Address</label>
            <input
              type="email"
              required
              placeholder={roleTab === 'student' ? 'student@bscse.uiu.ac.bd' : 'user@gmail.com'}
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="auth-submit-wrap">
            <Button
              type="submit"
              variant={getSubmitButtonVariant()}
              fullWidth
              size="lg"
              disabled={loading}
            >
              {loading ? 'Processing...' : modeTab === 'signin'
                ? `Sign In as ${roleTab.charAt(0).toUpperCase() + roleTab.slice(1)}`
                : roleTab === 'alumni' ? 'Submit Application' : 'Create Account'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
