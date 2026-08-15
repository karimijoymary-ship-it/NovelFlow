import React, { useState, useEffect } from 'react';
import { getApiUrl } from './apiConfig';

export default function PsychographicSliders({ bookId, userId, onTelemetryUpdated }) {
  const [readingStatus, setReadingStatus] = useState('Reading');
  const [pagesCompleted, setPagesCompleted] = useState(0);
  const [fractionalRating, setFractionalRating] = useState(0.0);
  const [dnfReason, setDnfReason] = useState('');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Fetch telemetry for current book and user
  useEffect(() => {
    if (!bookId || !userId) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    fetch(getApiUrl(`/api/books/${bookId}/telemetry?userId=${userId}`))
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load telemetry data');
        return res.json();
      })
      .then((data) => {
        setReadingStatus(data.readingStatus || 'Reading');
        setPagesCompleted(data.pagesCompleted || 0);
        setFractionalRating(data.fractionalRating || 0.0);
        setDnfReason(data.dnfReason || '');
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [bookId, userId]);

  // Handle telemetry submission
  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const payload = {
      userId,
      readingStatus,
      pagesCompleted: parseInt(pagesCompleted, 10) || 0,
      fractionalRating: parseFloat(fractionalRating) || 0.0,
      dnfReason: readingStatus === 'DNF' ? dnfReason : null,
    };

    fetch(getApiUrl(`/api/books/${bookId}/telemetry`), {
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
        setMessage('Telemetry updated successfully!');
        if (onTelemetryUpdated) {
          onTelemetryUpdated(updatedBook);
        }
        // Auto clear success message after 2.5 seconds
        setTimeout(() => setMessage(null), 2500);
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
          style={{ cursor: 'pointer' }}
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
    <div className="telemetry-panel">
      <div className="panel-desc">
        <h3>Reading Telemetry Sliders</h3>
        <p>Calibrate your personal academic metrics and progress for this edition.</p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Status Selector */}
        <div className="input-group">
          <label className="group-label">Reading Status</label>
          <div className="status-selector">
            <button
              type="button"
              className={`status-btn ${readingStatus === 'Reading' ? 'active reading' : ''}`}
              onClick={() => setReadingStatus('Reading')}
            >
              Reading
            </button>
            <button
              type="button"
              className={`status-btn ${readingStatus === 'Completed' ? 'active completed' : ''}`}
              onClick={() => setReadingStatus('Completed')}
            >
              Completed
            </button>
            <button
              type="button"
              className={`status-btn ${readingStatus === 'Queue' ? 'active queue' : ''}`}
              onClick={() => setReadingStatus('Queue')}
            >
              Queue
            </button>
            <button
              type="button"
              className={`status-btn ${readingStatus === 'DNF' ? 'active dnf' : ''}`}
              onClick={() => setReadingStatus('DNF')}
            >
              DNF
            </button>
          </div>
        </div>

        {/* Pages Completed Slider */}
        <div className="input-group">
          <div className="slider-header">
            <label className="group-label">Pages Completed</label>
            <span className="slider-value">{pagesCompleted} pages</span>
          </div>
          <input
            type="range"
            min="0"
            max="1200"
            value={pagesCompleted}
            onChange={(e) => setPagesCompleted(e.target.value)}
            className="custom-range"
          />
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${Math.min(100, (pagesCompleted / 1200) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Rating stars */}
        <div className="input-group">
          <div className="slider-header">
            <label className="group-label">Community Influence Rating</label>
            <span className="slider-value rating-highlight">{fractionalRating.toFixed(1)} / 5.0</span>
          </div>
          <div className="rating-stars">
            {renderStars()}
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text)',
                fontSize: '13px',
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
            <label className="group-label" htmlFor="dnfReason">Why did you decide to DNF (Did Not Finish)?</label>
            <textarea
              id="dnfReason"
              className="custom-textarea"
              rows="3"
              placeholder="Provide a critical commentary or reason..."
              value={dnfReason}
              onChange={(e) => setDnfReason(e.target.value)}
              required
            ></textarea>
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? <span className="spinner small"></span> : 'Sync Academic Metrics'}
        </button>
      </form>
    </div>
  );
}