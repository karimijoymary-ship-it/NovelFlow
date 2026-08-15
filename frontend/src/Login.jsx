import React, { useState } from 'react';
import { getApiUrl } from './apiConfig';

function Login({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [academicStream, setAcademicStream] = useState('');
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
      ? { email, password, fullName, academicStream }
      : { email, password };

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
        if (isRegister) {
          setSuccess('Account created successfully! Switching to Login...');
          setTimeout(() => {
            setIsRegister(false);
            setError(null);
            setSuccess(null);
          }, 1500);
        } else {
          onLoginSuccess(data);
        }
      })
      .catch((err) => {
        setLoading(false);
        setError(err.message);
      });
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

        <div className="login-tabs">
          <button
            type="button"
            className={`login-tab ${!isRegister ? 'active' : ''}`}
            onClick={() => { setIsRegister(false); setError(null); }}
          >
            Log In
          </button>
          <button
            type="button"
            className={`login-tab ${isRegister ? 'active' : ''}`}
            onClick={() => { setIsRegister(true); setError(null); }}
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
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? (
              <span className="spinner small"></span>
            ) : (
              isRegister ? 'Create Account' : 'Access Dashboard'
            )}
          </button>
        </form>

        <div className="login-footer">
          {!isRegister ? (
            <p>
              Demo credentials: <code style={{ cursor: 'pointer' }} onClick={() => { setEmail('alice@example.com'); setPassword('password123'); }}>alice@example.com / password123</code>
            </p>
          ) : (
            <p>Fill out the fields to register a new local user node.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
