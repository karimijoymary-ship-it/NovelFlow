import React from 'react';

export default function UserGuideModal({ onClose }) {
 return (
 <div
 style={{
 position: 'fixed',
 inset: 0,
 background: 'rgba(0, 0, 0, 0.75)',
 backdropFilter: 'blur(4px)',
 zIndex: 9999,
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 padding: '1.5rem'
 }}
 className="animate-fade-in"
 >
 <div
 style={{
 background: 'var(--social-bg)',
 border: '1px solid var(--border)',
 borderRadius: '16px',
 maxWidth: '720px',
 width: '100%',
 maxHeight: '85vh',
 overflowY: 'auto',
 padding: '2rem',
 boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
 }}
 className="animate-slide-down"
 >
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
 <div>
 <h2 style={{ margin: 0, color: 'var(--text-h)', fontSize: '1.4rem' }}>NovelFlow Academic User Guide</h2>
 <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '2px' }}>
 Comprehensive walkthrough of features, workflows, and platform navigation.
 </div>
 </div>
 <button
 type="button"
 onClick={onClose}
 style={{
 padding: '6px 12px',
 background: 'var(--bg)',
 border: '1px solid var(--border)',
 color: 'var(--text)',
 borderRadius: '8px',
 cursor: 'pointer',
 fontWeight: 600,
 fontSize: '0.9rem'
 }}
 >
 X Close
 </button>
 </div>

 <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.6 }}>

 {/* 1. Catalog & Discovery */}
 <section style={{ background: 'var(--bg)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
 <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-h)', fontSize: '1.05rem' }}>1. Catalog & Book Discovery</h3>
 <p style={{ margin: 0 }}>
 Browse the dedicated <strong>Catalog</strong> view to search through local curated set texts, Google Books, and OpenLibrary repositories. Click any book card to open its detailed overview.
 </p>
 </section>

 {/* 2. Character Relationship Maps */}
 <section style={{ background: 'var(--bg)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
 <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-h)', fontSize: '1.05rem' }}>2. Interactive Character Maps & Academic Provenance</h3>
 <p style={{ margin: 0 }}>
 The <strong>Character Map</strong> visualizes character networks as an interactive force-directed node graph. Each network includes an <strong>Academic Provenance</strong> badge detailing whether character entities were Human-Reviewed or extracted via NLP AI Detection with primary source references.
 </p>
 </section>

 {/* 3. Book Analytics & Narrative DNA */}
 <section style={{ background: 'var(--bg)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
 <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-h)', fontSize: '1.05rem' }}>3. Book Analytics & Narrative DNA</h3>
 <p style={{ margin: 0 }}>
 Analyze narrative dimensions (Complexity, Darkness, Pacing, Worldbuilding, Romance, Humor) using interactive radar charts. Adjust narrative DNA vectors live to match your academic research needs.
 </p>
 </section>

 {/* 4. Community Reviews & Threaded Replies */}
 <section style={{ background: 'var(--bg)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
 <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-h)', fontSize: '1.05rem' }}>4. Community Reviews & Discussion Threads</h3>
 <p style={{ margin: 0 }}>
 Read peer analyses, post your own reviews, upvote helpful comments, or click <strong>Reply</strong> to engage in threaded academic discussions. Any community member can flag inappropriate comments for System Administrator review.
 </p>
 </section>

 {/* 5. Personal Library & Reading Telemetry */}
 <section style={{ background: 'var(--bg)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
 <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-h)', fontSize: '1.05rem' }}>5. My Library & Reading Telemetry</h3>
 <p style={{ margin: 0 }}>
 Use <strong>My Library</strong> to organize your bookshelf across <em>Completed</em>, <em>Currently Reading</em>, <em>Queue</em>, and <em>DNF</em>. Click <strong>+ Log Completed Book</strong> to quickly record finished texts with zero navigation delay.
 </p>
 </section>

 </div>

 <div style={{ marginTop: '2rem', textAlign: 'right' }}>
 <button
 type="button"
 onClick={onClose}
 style={{
 padding: '10px 24px',
 background: 'var(--accent)',
 color: '#fff',
 border: 'none',
 borderRadius: '8px',
 fontWeight: 600,
 cursor: 'pointer'
 }}
 >
 Got it, thanks!
 </button>
 </div>

 </div>
 </div>
 );
}
