import React, { useState, useEffect } from 'react';
import { getApiUrl } from './apiConfig';

export default function PsychographicSliders({ book, bookId, userId, onTelemetryUpdated }) {
  const [readingStatus, setReadingStatus] = useState('Reading');
  const [pagesCompleted, setPagesCompleted] = useState(0);
  const [fractionalRating, setFractionalRating] = useState(0.0);
  const [dnfReason, setDnfReason] = useState('');

  // Psychographic DNA state (Synced with Book Analytics)
  const [dna, setDna] = useState({
    dnaComplexity: 50,
    dnaDarkness: 50,
    dnaPacing: 50,
    dnaRomance: 50,
    dnaWorldBuild: 50,
    dnaHumor: 50
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Sync DNA from book prop
  useEffect(() => {
    if (book) {
      setDna({
        dnaComplexity: book.dnaComplexity ?? 50,
        dnaDarkness: book.dnaDarkness ?? 50,
        dnaPacing: book.dnaPacing ?? 50,
        dnaRomance: book.dnaRomance ?? 50,
        dnaWorldBuild: book.dnaWorldBuild ?? 50,
        dnaHumor: book.dnaHumor ?? 50
      });
    }
  }, [book]);

  // Fetch telemetry for current book and user
  useEffect(() => {
    const targetId = bookId || (book && book.bookMasterId);
    if (!targetId || !userId) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    fetch(getApiUrl(`/api/books/${targetId}/telemetry?userId=${userId}`))
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
  }, [book, bookId, userId]);

  const handleDnaChange = (field, val) => {
    setDna(prev => ({
      ...prev,
      [field]: parseInt(val, 10)
    }));
  };

  // Handle telemetry & DNA submission
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const targetId = bookId || (book && book.bookMasterId);

    const telemetryPayload = {
      userId,
      readingStatus,
      pagesCompleted: parseInt(pagesCompleted, 10) || 0,
      fractionalRating: parseFloat(fractionalRating) || 0.0,
      dnfReason: readingStatus === 'DNF' ? dnfReason : null,
    };

    try {
      // 1. Save Telemetry
      await fetch(getApiUrl(`/api/books/${targetId}/telemetry`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telemetryPayload),
      });

      // 2. Save Psychographic DNA (Syncing with Book Analytics)
      const dnaRes = await fetch(getApiUrl(`/api/books/${targetId}/dna`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dna),
      });

      if (!dnaRes.ok) throw new Error("Failed to update DNA");
      const updatedBook = await dnaRes.json();

      setSaving(false);
      setMessage('Academic metrics & Psychographic DNA synced successfully!');
      if (onTelemetryUpdated) {
        onTelemetryUpdated(updatedBook);
      }
      setTimeout(() => setMessage(null), 2500);

    } catch (err) {
      setSaving(false);
      setError(err.message);
    }
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

  const dnaFields = [
    { key: 'dnaComplexity', label: 'Prose & Structural Complexity', icon: '🧩', color: '#a855f7' },
    { key: 'dnaDarkness', label: 'Atmospheric Darkness', icon: '🌑', color: '#ef4444' },
    { key: 'dnaPacing', label: 'Narrative Pacing & Tension', icon: '⚡', color: '#f59e0b' },
    { key: 'dnaWorldBuild', label: 'Worldbuilding Depth', icon: '🌍', color: '#3b82f6' },
    { key: 'dnaRomance', label: 'Subplot / Romance Dynamics', icon: '💖', color: '#ec4899' },
    { key: 'dnaHumor', label: 'Wit & Satirical Tone', icon: '🎭', color: '#10b981' },
  ];

  return (
    <div className="telemetry-panel animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
      
      {/* LEFT COLUMN: READING TELEMETRY */}
      <div style={{ background: 'var(--social-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <div className="panel-desc" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, color: 'var(--text-h)' }}>Personal Reading Telemetry</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-light)' }}>
            Track reading completion, personal rating, and status.
          </p>
        </div>

        {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}
        {message && <div className="success-message" style={{ marginBottom: '1rem' }}>{message}</div>}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
              <label className="group-label">Personal Influence Rating</label>
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

          <button type="submit" className="btn-primary" disabled={saving} style={{ marginTop: '10px' }}>
            {saving ? <span className="spinner small"></span> : '💾 Sync Telemetry & Psychographic DNA'}
          </button>
        </form>
      </div>

      {/* RIGHT COLUMN: SYNCHRONIZED PSYCHOGRAPHIC DNA SLIDERS */}
      <div style={{ background: 'var(--social-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--text-h)' }}>🧠 Psychographic DNA Sliders</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-light)' }}>
              100% Synced with Book Analytics Tab
            </p>
          </div>
          <span style={{ fontSize: '0.75rem', background: 'var(--accent-bg)', color: 'var(--accent)', padding: '4px 10px', borderRadius: '12px', fontWeight: 600 }}>
            ✨ Live Sync
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {dnaFields.map(f => {
            const val = dna[f.key] ?? 50;
            return (
              <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-h)' }}>
                    {f.icon} {f.label}
                  </span>
                  <span style={{ fontWeight: 700, color: f.color, fontFamily: 'var(--mono)', fontSize: '0.9rem' }}>
                    {val} / 100
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={val}
                  onChange={e => handleDnaChange(f.key, e.target.value)}
                  style={{ accentColor: f.color, cursor: 'pointer', width: '100%' }}
                />

                <div style={{ height: '6px', background: 'var(--bg)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${val}%`, height: '100%', background: f.color, borderRadius: '3px', transition: 'width 0.2s ease' }} />
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: '1.5rem', padding: '10px 12px', background: 'var(--bg)', borderRadius: '8px', border: '1px dashed var(--border)', fontSize: '0.78rem', color: 'var(--text-light)', textAlign: 'center' }}>
          💡 Adjusting these sliders updates the Book Analytics Radar Chart in real time.
        </div>
      </div>

    </div>
  );
}