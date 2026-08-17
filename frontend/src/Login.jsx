import React, { useState } from 'react';
import { getApiUrl } from './apiConfig';

function Login({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1 = request token, 2 = enter token & new password
  const [email, setEmail] = useState(() => localStorage.getItem('novelflow_remembered_email') || '');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [academicStream, setAcademicStream] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Forgot password form states
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const url = getApiUrl(isRegister ? '/api/auth/register' : '/api/auth/login');
    const payload = isRegister
      ? { email: email.trim(), password, fullName: fullName.trim(), academicStream: academicStream.trim() }
      : { email: email.trim(), password };

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().catch(() => ({ message: `Server error (${res.status})` })).then((data) => {
            throw new Error(data.message || 'Authentication failed');
          });
        }
        return res.json();
      })
      .then((data) => {
        setLoading(false);
        if (rememberMe && email) {
          localStorage.setItem('novelflow_remembered_email', email.trim());
        } else {
          localStorage.removeItem('novelflow_remembered_email');
        }

        if (isRegister) {
          setSuccess('Account created successfully! Entering dashboard...');
          setTimeout(() => {
            onLoginSuccess(data);
          }, 800);
        } else {
          onLoginSuccess(data);
        }
      })
      .catch((err) => {
        setLoading(false);
        setError(err.message);
      });
  };

  const handleForgotPasswordSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (resetStep === 1) {
      fetch(getApiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
        .then(res => res.json().then(data => ({ ok: res.ok, data })))
        .then(({ ok, data }) => {
          setLoading(false);
          if (!ok) throw new Error(data.message || 'Failed to generate reset code');
          setSuccess(data.message);
          if (data.resetToken) {
            setResetToken(data.resetToken);
          }
          setResetStep(2);
        })
        .catch(err => {
          setLoading(false);
          setError(err.message);
        });
    } else {
      if (newPassword !== confirmPassword) {
        setLoading(false);
        setError('New passwords do not match!');
        return;
      }

      fetch(getApiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          resetToken: resetToken.trim(),
          newPassword
        }),
      })
        .then(res => res.json().then(data => ({ ok: res.ok, data })))
        .then(({ ok, data }) => {
          setLoading(false);
          if (!ok) throw new Error(data.message || 'Password reset failed');
          setSuccess(data.message);
          setPassword(newPassword);
          setTimeout(() => {
            setIsForgotPassword(false);
            setResetStep(1);
            setSuccess('Password updated successfully! Enter your credentials to log in.');
          }, 1500);
        })
        .catch(err => {
          setLoading(false);
          setError(err.message);
        });
    }
  };

  return (
    <div className="login-page">
      <div className="login-backdrop-glow"></div>
      <div className="login-card animate-fade-in">
        <div className="login-logo-area">
          <div className="login-logo-icon">N</div>
          <h2>NovelFlow</h2>
          <p className="login-subtitle">Academic Reading & Character Graph Analytics</p>
        </div>

        {isForgotPassword ? (
          <div className="animate-slide-down">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--accent)' }}>
                {resetStep === 1 ? 'Forgot Password?' : 'Reset Password'}
              </h3>
              <button
                type="button"
                onClick={() => { setIsForgotPassword(false); setError(null); setSuccess(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
              >
                ← Back to Log In
              </button>
            </div>

            {error && <div className="error-message animate-slide-down">{error}</div>}
            {success && <div className="success-message animate-slide-down">{success}</div>}

            <form onSubmit={handleForgotPasswordSubmit} className="login-form">
              <div className="login-input-group">
                <label htmlFor="resetEmail">Email Address</label>
                <input
                  id="resetEmail"
                  type="email"
                  placeholder="e.g. alice@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={resetStep === 2}
                  required
                />
              </div>

              {resetStep === 2 && (
                <>
                  <div className="login-input-group">
                    <label htmlFor="resetToken">6-Digit Verification Code</label>
                    <input
                      id="resetToken"
                      type="text"
                      placeholder="e.g. 123456"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      required
                    />
                  </div>

                  <div className="login-input-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      id="newPassword"
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="login-input-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              <button type="submit" className="login-submit-btn" disabled={loading} style={{ marginTop: '8px' }}>
                {loading ? (
                  <span className="spinner small"></span>
                ) : (
                  resetStep === 1 ? 'Get Verification Code' : 'Update Password & Return to Login'
                )}
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="login-tabs">
              <button
                type="button"
                className={`login-tab ${!isRegister ? 'active' : ''}`}
                onClick={() => { setIsRegister(false); setError(null); setSuccess(null); }}
              >
                Log In
              </button>
              <button
                type="button"
                className={`login-tab ${isRegister ? 'active' : ''}`}
                onClick={() => { setIsRegister(true); setError(null); setSuccess(null); }}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              {error && <div className="error-message animate-slide-down">{error}</div>}
              {success && <div className="success-message animate-slide-down">{success}</div>}

              {isRegister && (
                <>
                  <div className="login-input-group">
                    <label htmlFor="fullName">Full Name</label>
                    <input
                      id="fullName"
                      type="text"
                      placeholder="e.g. Alice Reader"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="login-input-group">
                    <label htmlFor="academicStream">Academic Stream</label>
                    <input
                      id="academicStream"
                      type="text"
                      placeholder="e.g. Comparative Literature"
                      value={academicStream}
                      onChange={(e) => setAcademicStream(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              <div className="login-input-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="e.g. alice@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="login-input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="password">Password</label>
                  {!isRegister && (
                    <button
                      type="button"
                      onClick={() => { setIsForgotPassword(true); setResetStep(1); setError(null); setSuccess(null); }}
                      style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, padding: 0 }}
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-light)', margin: '4px 0 12px 0' }}>
                <input
                  id="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ cursor: 'pointer', accentColor: 'var(--accent)' }}
                />
                <label htmlFor="rememberMe" style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Remember email & save login session
                </label>
              </div>

              <button type="submit" className="login-submit-btn" disabled={loading}>
                {loading ? (
                  <span className="spinner small"></span>
                ) : (
                  isRegister ? 'Create Account' : 'Access Dashboard'
                )}
              </button>
            </form>
          </>
        )}

        <div className="login-footer">
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-light)', textAlign: 'center' }}>
            NovelFlow Academic & Literary Analytics Platform
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
