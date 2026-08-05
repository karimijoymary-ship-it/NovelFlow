import React, { useState, useEffect } from 'react';

const Collections = () => {
  const [sets, setSets] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newSet, setNewSet] = useState({ name: '', description: '', icon: '📚' });

  useEffect(() => {
    fetch('/api/sets')
      .then(res => res.json())
      .then(data => setSets(data))
      .catch(err => console.error("Failed to fetch sets:", err));
  }, []);

  const handleCreateSet = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSet)
      });
      if (res.ok) {
        const createdSet = await res.json();
        setSets([...sets, createdSet]);
        setShowModal(false);
        setNewSet({ name: '', description: '', icon: '📚' });
      }
    } catch (err) {
      console.error("Failed to create set", err);
    }
  };

  return (
    <div className="main-content collections-view animate-fade-in" style={{ padding: '2rem' }}>
      <header className="book-header" style={{ borderBottom: 'none', paddingBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="book-header-left">
          <h1>Collections</h1>
          <div className="author-by" style={{ color: 'var(--text-light)', marginTop: '0.5rem' }}>
            Customized, thematic groupings of books based on relationships.
          </div>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', background: 'var(--primary-color)', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
        >
          + Create Set
        </button>
      </header>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="manual-book-panel-inner animate-slide-down" style={{ width: '400px', maxWidth: '90%', margin: 0 }}>
            <div className="manual-book-panel-header">
              <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-h)' }}>Create New Set</span>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '1rem', cursor: 'pointer', padding: '2px 6px' }} title="Close">✕</button>
            </div>
            <p style={{ color: 'var(--text)', marginBottom: '1rem', fontSize: '0.82rem' }}>Define a thematic grouping for books.</p>

            <form onSubmit={handleCreateSet} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>NAME *</label>
                <input required type="text" value={newSet.name} onChange={e => setNewSet({...newSet, name: e.target.value})} placeholder="e.g. East African Fiction" style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg)', color: 'var(--text-h)', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>DESCRIPTION</label>
                <textarea value={newSet.description} onChange={e => setNewSet({...newSet, description: e.target.value})} placeholder="An optional breakdown of this collection..." rows="3" style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg)', color: 'var(--text-h)', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>ICON *</label>
                <input type="text" value={newSet.icon} onChange={e => setNewSet({...newSet, icon: e.target.value})} placeholder="e.g. 📙" required style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg)', color: 'var(--text-h)', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.5rem 1rem', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="collections-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>

        {/* Existing Static Cards */}
        {/* Course / Curriculum Sets */}
        <div className="collection-card" style={{ padding: '1.5rem', background: 'var(--surface-color)', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🎓 Course / Curriculum Sets
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', minHeight: '3rem' }}>
            Custom folders for specific units (e.g., “CLT 301: East African Fiction”).
          </p>
          <button style={{ marginTop: '1rem', padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: 'var(--primary-color)', color: 'white', cursor: 'pointer' }}>View Sets</button>
        </div>

        {/* Language Alignment Sets */}
        <div className="collection-card" style={{ padding: '1.5rem', background: 'var(--surface-color)', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🌐 Language Alignment
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', minHeight: '3rem' }}>
            Texts paired with their translation guide tracks (e.g., “Kiswahili-English”).
          </p>
          <button style={{ marginTop: '1rem', padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: 'var(--primary-color)', color: 'white', cursor: 'pointer' }}>View Sets</button>
        </div>

        {/* Psychographic Presets */}
        <div className="collection-card" style={{ padding: '1.5rem', background: 'var(--surface-color)', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🧠 Psychographic Presets
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', minHeight: '3rem' }}>
            Folders based on narrative DNA attributes (e.g., “High Complexity”).
          </p>
          <button style={{ marginTop: '1rem', padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: 'var(--primary-color)', color: 'white', cursor: 'pointer' }}>View Sets</button>
        </div>

        {/* User-Created Custom Tags */}
        <div className="collection-card" style={{ padding: '1.5rem', background: 'var(--surface-color)', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🏷️ Custom Tags
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', minHeight: '3rem' }}>
            Folders created to organize research papers or specific authors.
          </p>
          <button style={{ marginTop: '1rem', padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: 'transparent', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', cursor: 'pointer' }}>+ Create Tag</button>
        </div>
      </div>

      <div style={{ marginTop: '3rem', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', color: 'var(--text-h)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>My Custom Sets</h2>
      </div>

      {sets.length === 0 ? (
          <div className="empty-state-mini" style={{ padding: '2rem', background: 'var(--surface-color)', borderRadius: '12px', textAlign: 'center', border: '1px dashed var(--border-color)' }}>
            You haven't created any custom collections yet.
          </div>
      ) : (
        <div className="collections-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {/* Dynamic User Sets */}
          {sets.map(set => (
            <div key={set.id} className="collection-card animate-fade-in" style={{ padding: '1.5rem', background: 'var(--surface-color)', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid var(--primary-color)' }}>
            <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-color)' }}>
              {set.icon} {set.name}
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', minHeight: '3rem' }}>
              {set.description || "No description provided."}
            </p>
            <button style={{ marginTop: '1rem', padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: 'var(--primary-color)', color: 'white', cursor: 'pointer' }}>Open Set</button>
          </div>
        ))}
        </div>
      )}
    </div>
  );
};

export default Collections;
