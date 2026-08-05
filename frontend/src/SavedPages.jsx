import React from 'react';

const SavedPages = () => {
  return (
    <div className="main-content saved-pages-view animate-fade-in" style={{ padding: '2rem' }}>
      <header className="book-header" style={{ borderBottom: 'none', paddingBottom: '20px' }}>
        <div className="book-header-left">
          <h1>Saved Pages & Mentions</h1>
          <div className="author-by" style={{ color: 'var(--text-light)', marginTop: '0.5rem' }}>
            Micro-level bookmarks and academic references within individual books.
          </div>
        </div>
      </header>

      <div className="saved-items-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>

        {/* Bookmarked Passages */}
        <div className="saved-item-row" style={{ display: 'flex', gap: '1rem', padding: '1.5rem', background: 'var(--surface-color)', borderRadius: '12px', alignItems: 'flex-start' }}>
          <div style={{ fontSize: '2rem' }}>🔖</div>
          <div>
            <h3 style={{ marginBottom: '0.25rem' }}>Bookmarked Passages</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
              Specific page highlights or quotes saved during a reading session.
            </p>
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>0 Passages Saved</div>
          </div>
        </div>

        {/* Character Web Snapshots */}
        <div className="saved-item-row" style={{ display: 'flex', gap: '1rem', padding: '1.5rem', background: 'var(--surface-color)', borderRadius: '12px', alignItems: 'flex-start' }}>
          <div style={{ fontSize: '2rem' }}>🕸️</div>
          <div>
            <h3 style={{ marginBottom: '0.25rem' }}>Character Web Snapshots</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
              Saved views of interactive character maps or complex node networks for quick reference during revision.
            </p>
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>0 Snapshots Saved</div>
          </div>
        </div>

        {/* Side-by-Side Translation Snippets */}
        <div className="saved-item-row" style={{ display: 'flex', gap: '1rem', padding: '1.5rem', background: 'var(--surface-color)', borderRadius: '12px', alignItems: 'flex-start' }}>
          <div style={{ fontSize: '2rem' }}>📖</div>
          <div>
            <h3 style={{ marginBottom: '0.25rem' }}>Side-by-Side Translation Snippets</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
              Specific comparative text frames saved between English and localized versions.
            </p>
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>0 Snippets Saved</div>
          </div>
        </div>

        {/* Personal Study Annotations */}
        <div className="saved-item-row" style={{ display: 'flex', gap: '1rem', padding: '1.5rem', background: 'var(--surface-color)', borderRadius: '12px', alignItems: 'flex-start' }}>
          <div style={{ fontSize: '2rem' }}>✍️</div>
          <div>
            <h3 style={{ marginBottom: '0.25rem' }}>Personal Study Annotations</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
              Sticky notes and margin comments attached to specific page indices.
            </p>
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>0 Annotations</div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SavedPages;
