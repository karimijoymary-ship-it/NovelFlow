import React, { useState } from 'react';
import { getApiUrl } from './apiConfig';

const ManualBookForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    releaseYear: '',
    languageTag: 'en',
    isbnBarcode: '',
    synopsis: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.author) {
      setError('Title and Author are required.');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      ...formData,
      releaseYear: formData.releaseYear ? parseInt(formData.releaseYear) : null
    };

    fetch(getApiUrl('/api/books/manual'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async res => {
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error || 'Failed to create book manually.');
        }
        return res.json();
      })
      .then(data => {
        setLoading(false);
        onSuccess(data);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  return (
    <div className="manual-book-panel-inner animate-slide-down">
      <div className="manual-book-panel-header">
        <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-h)' }}>Add Book Manually</span>
        <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '1rem', cursor: 'pointer', padding: '2px 6px' }} title="Close">✕</button>
      </div>
      <p style={{ color: 'var(--text)', marginBottom: '1rem', fontSize: '0.82rem' }}>If a book isn't in the global catalog, enter its details here.</p>

      {error && <div className="error-message" style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.78rem', color: 'var(--text)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Title *</label>
          <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg)', color: 'var(--text-h)', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none' }} placeholder="e.g. The Lord of the Rings" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.78rem', color: 'var(--text)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Author *</label>
          <input type="text" value={formData.author} onChange={e => setFormData({ ...formData, author: e.target.value })} required style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg)', color: 'var(--text-h)', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none' }} placeholder="e.g. J.R.R. Tolkien" />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Year</label>
            <input type="number" value={formData.releaseYear} onChange={e => setFormData({ ...formData, releaseYear: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg)', color: 'var(--text-h)', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none' }} placeholder="1954" />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lang</label>
            <input type="text" value={formData.languageTag} onChange={e => setFormData({ ...formData, languageTag: e.target.value })} placeholder="en" style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg)', color: 'var(--text-h)', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none' }} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.78rem', color: 'var(--text)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>ISBN-13</label>
          <input type="text" value={formData.isbnBarcode} onChange={e => setFormData({ ...formData, isbnBarcode: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg)', color: 'var(--text-h)', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none' }} placeholder="Optional" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.78rem', color: 'var(--text)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Synopsis</label>
          <textarea value={formData.synopsis} onChange={e => setFormData({ ...formData, synopsis: e.target.value })} rows="3" style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg)', color: 'var(--text-h)', fontFamily: 'inherit', fontSize: '0.9rem', resize: 'vertical', outline: 'none' }} placeholder="A detailed synopsis helps the AI extract characters..." />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button type="button" onClick={onClose} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
          <button type="submit" disabled={loading} style={{ padding: '0.5rem 1rem', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {loading && <div className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px' }}></div>}
            {loading ? 'Saving...' : 'Save Book'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManualBookForm;
