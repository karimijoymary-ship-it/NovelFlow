import React, { useState, useEffect } from 'react';
import { getApiUrl } from './apiConfig';

export default function PsychographicSliders({ book, bookId, userId, onTelemetryUpdated }) {
  const [readingStatus, setReadingStatus] = useState('Reading');
  const [pagesCompleted, setPagesCompleted] = useState(0);
  const [fractionalRating, setFractionalRating] = useState(0.0);
  const [dnfReason, setDnfReason] = useState('');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const effectiveUserId = userId || 'user_1';
  const targetId = bookId || (book && book.bookMasterId);

  // Fetch telemetry for current book and user
  useEffect(() => {
    if (!targetId) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    fetch(getApiUrl(`/api/books/${targetId}/telemetry?userId=${effectiveUserId}`))
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load telemetry data');
        return res.json();
      })
      .then((data) => {
        if (data) {
          setReadingStatus(data.readingStatus || 'Reading');
          setPagesCompleted(data.pagesCompleted !== undefined && data.pagesCompleted !== null ? data.pagesCompleted : 0);
          setFractionalRating(data.fractionalRating !== undefined && data.fractionalRating !== null ? data.fractionalRating : 0.0);
          setDnfReason(data.dnfReason || '');
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [targetId, effectiveUserId]);

  // Handle telemetry submission
  const handleSave = (e) => {
    e.preventDefault();
    if (!targetId) {
      setError("No book selected to save reading stats.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    const payload = {
      userId: effectiveUserId,
      readingStatus,
      pagesCompleted: parseInt(pagesCompleted, 10) || 0,
      fractionalRating: parseFloat(fractionalRating) || 0.0,
      dnfReason: readingStatus === 'DNF' ? dnfReason : null,
    };

    fetch(getApiUrl(`/api/books/${targetId}/telemetry`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to update telemetry records');
        return res.json();
      })
      .then((updatedBook) => {
        setSaving(false);
        setMessage(`Saved progress: ${pagesCompleted} pages (${readingStatus})!`);
        if (onTelemetryUpdated) {
          onTelemetryUpdated(updatedBook);
        }
        setTimeout(() => setMessage(null), 3000);
      })
      .catch((err) => {
        setSaving(false);
        setError(err.message);
      });
  };

  // Helper to render star rating inputs
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= Math.floor(fractionalRating);
      const isHalf = !isFilled && (i - 0.5 <= fractionalRating);

      stars.push(
        <span
          key={i}
          className={`star ${isFilled ? 'filled' : isHalf ? 'half-filled' : ''}`}
          style={{ cursor: 'pointer', fontSize: '1.4rem', marginRight: '4px', color: isFilled ? '#f59e0b' : 'var(--border)' }}
          onClick={() => setFractionalRating(i)}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading personal reading metrics...</p>
      </div>
    );
  }

  return (
    <div className="telemetry-panel animate-fade-in" style={{ maxWidth: '650px', margin: '0 auto', background: 'var(--social-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
      <div className="panel-desc" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, color: 'var(--text-h)' }}>Personal Reading Telemetry</h3>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: 'var(--text-light)' }}>
          Calibrate your personal academic metrics, completion progress, and status.
        </p>
      </div>

      {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}
      {message && <div className="success-message" style={{ marginBottom: '1rem' }}>{message}</div>}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Status Selector */}
        <div className="input-group">
          <label className="group-label">Reading Status</label>
          <div className="status-selector" style={{ display: 'flex', gap: '8px' }}>
            {['Reading', 'Completed', 'Queue', 'DNF'].map(status => (
              <button
                key={status}
                type="button"
                className={`status-btn ${readingStatus === status ? 'active ' + status.toLowerCase() : ''}`}
                onClick={() => setReadingStatus(status)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: readingStatus === status ? '2px solid var(--accent)' : '1px solid var(--border)',
                  background: readingStatus === status ? 'var(--accent-bg)' : 'var(--bg)',
                  color: readingStatus === status ? 'var(--accent)' : 'var(--text-h)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {status === 'Reading' && '📖 '}
                {status === 'Completed' && '✅ '}
                {status === 'Queue' && '⏳ '}
                {status === 'DNF' && '🛑 '}
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Pages Completed Input & Slider */}
        <div className="input-group">
          <div className="slider-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label className="group-label" style={{ fontWeight: 600, color: 'var(--text-h)' }}>Pages Completed</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="number"
                min="0"
                max="5000"
                value={pagesCompleted}
                onChange={(e) => setPagesCompleted(Math.max(0, parseInt(e.target.value, 10) || 0))}
                style={{ width: '80px', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', fontWeight: 700, fontFamily: 'var(--mono)', textAlign: 'right', outline: 'none' }}
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>pages</span>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="1200"
            value={Math.min(1200, pagesCompleted)}
            onChange={(e) => setPagesCompleted(parseInt(e.target.value, 10) || 0)}
            className="custom-range"
            style={{ width: '100%', cursor: 'pointer' }}
          />
          <div className="progress-bar-container" style={{ height: '8px', background: 'var(--bg)', borderRadius: '4px', overflow: 'hidden', marginTop: '6px' }}>
            <div
              className="progress-bar-fill"
              style={{ width: `${Math.min(100, (pagesCompleted / 1200) * 100)}%`, height: '100%', background: 'var(--accent)', borderRadius: '4px', transition: 'width 0.2s ease' }}
            ></div>
          </div>
        </div>

        {/* Rating stars */}
        <div className="input-group">
          <div className="slider-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label className="group-label" style={{ fontWeight: 600, color: 'var(--text-h)' }}>Personal Influence Rating</label>
            <span className="slider-value rating-highlight" style={{ fontWeight: 700, color: '#f59e0b', fontFamily: 'var(--mono)' }}>
              {fractionalRating.toFixed(1)} / 5.0
            </span>
          </div>
          <div className="rating-stars" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {renderStars()}
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-light)',
                fontSize: '12px',
                cursor: 'pointer',
                marginLeft: '12px'
              }}
              onClick={() => setFractionalRating(0.0)}
            >
              Clear
            </button>
          </div>
        </div>

        {/* DNF Reason (only if DNF is selected) */}
        {readingStatus === 'DNF' && (
          <div className="input-group animate-slide-down">
            <label className="group-label" htmlFor="dnfReason" style={{ fontWeight: 600, color: 'var(--text-h)', marginBottom: '6px', display: 'block' }}>
              Why did you decide to DNF (Did Not Finish)?
            </label>
            <textarea
              id="dnfReason"
              className="custom-textarea"
              rows="3"
              placeholder="Provide a critical commentary or reason..."
              value={dnfReason}
              onChange={(e) => setDnfReason(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', outline: 'none' }}
              required
            ></textarea>
          </div>
        )}

        <button
          type="submit"
          className="btn-primary"
          disabled={saving}
          style={{ padding: '12px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.95rem', cursor: saving ? 'not-allowed' : 'pointer' }}
        >
          {saving ? 'Saving Progress...' : '💾 Save Academic Telemetry'}
        </button>
      </form>
    </div>
  );
}