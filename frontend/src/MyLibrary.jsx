import React, { useState, useEffect } from 'react';

const MyLibrary = ({ user }) => {
  const [telemetries, setTelemetries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.userId) return;
    fetch(`/api/books/user-library?userId=${user.userId}`)
      .then(res => res.json())
      .then(data => {
        setTelemetries(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load library:', err);
        setLoading(false);
      });
  }, [user]);

  const reading = telemetries.filter(t => t.readingStatus === 'Reading');
  const queue = telemetries.filter(t => t.readingStatus === 'Queue');
  const completed = telemetries.filter(t => t.readingStatus === 'Completed');
  const dnf = telemetries.filter(t => t.readingStatus === 'DNF');

  const getTitle = (bookMaster) => {
    if (!bookMaster) return 'Unknown Title';
    if (bookMaster.editions && bookMaster.editions.length > 0) {
      const en = bookMaster.editions.find(e => e.languageTag === 'en');
      return en ? en.title : bookMaster.editions[0].title;
    }
    return `Book #${bookMaster.bookMasterId}`;
  };

  const renderBookItem = (t) => {
    const title = getTitle(t.bookMaster);
    return (
      <div key={t.telemetryId} style={{ padding: '1rem', background: 'var(--surface-color)', borderRadius: '8px', marginBottom: '0.5rem', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div style={{ fontWeight: 'bold' }}>{title}</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
          By {t.bookMaster?.originalAuthor || 'Unknown Author'}
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--primary-color)', marginTop: '0.25rem' }}>
          {t.pagesCompleted} pages read
          {t.fractionalRating > 0 && ` • ⭐ ${t.fractionalRating}`}
        </div>
      </div>
    );
  };

  return (
    <div className="main-content library-view animate-fade-in" style={{ padding: '2rem' }}>
      <header className="book-header" style={{ borderBottom: 'none', paddingBottom: '20px' }}>
        <div className="book-header-left">
          <h1>My Library</h1>
          <div className="author-by" style={{ color: 'var(--text-light)', marginTop: '0.5rem' }}>
            Your personal, active bookshelf tracking reading progress.
          </div>
        </div>
      </header>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>Syncing Library...</div>
      ) : (
        <div className="library-sections-grid" style={{ display: 'grid', gap: '2rem', marginTop: '1rem' }}>

          {/* Currently Reading */}
          <section className="library-section">
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              📚 Currently Reading
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: '1rem' }}>
              Books with active telemetry progress.
            </p>
            {reading.length === 0 ? (
              <div className="empty-state-mini" style={{ padding: '2rem', background: 'var(--surface-color)', borderRadius: '12px', textAlign: 'center', border: '1px dashed var(--border-color)' }}>
                No books currently in progress.
              </div>
            ) : (
              reading.map(renderBookItem)
            )}
          </section>

          {/* Want to Read / Queue */}
          <section className="library-section">
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              ⏳ Want to Read / Queue
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: '1rem' }}>
              Books saved for upcoming coursework or semester reading lists.
            </p>
            {queue.length === 0 ? (
              <div className="empty-state-mini" style={{ padding: '2rem', background: 'var(--surface-color)', borderRadius: '12px', textAlign: 'center', border: '1px dashed var(--border-color)' }}>
                Your queue is looking empty!
              </div>
            ) : (
              queue.map(renderBookItem)
            )}
          </section>

          {/* Completed / Read */}
          <section className="library-section">
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              ✅ Completed / Read
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: '1rem' }}>
              Finished texts with logged finish dates and overall user ratings.
            </p>
            {completed.length === 0 ? (
              <div className="empty-state-mini" style={{ padding: '2rem', background: 'var(--surface-color)', borderRadius: '12px', textAlign: 'center', border: '1px dashed var(--border-color)' }}>
                Finish a book to see it here.
              </div>
            ) : (
              completed.map(renderBookItem)
            )}
          </section>

          {/* Did Not Finish (DNF) */}
          <section className="library-section">
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              🛑 Did Not Finish (DNF)
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: '1rem' }}>
              Dropped books alongside the recorded drop-state reason.
            </p>
            {dnf.length === 0 ? (
              <div className="empty-state-mini" style={{ padding: '2rem', background: 'var(--surface-color)', borderRadius: '12px', textAlign: 'center', border: '1px dashed var(--border-color)' }}>
                No dropped books. Great dedication!
              </div>
            ) : (
              dnf.map(renderBookItem)
            )}
          </section>

        </div>
      )}
    </div>
  );
};

export default MyLibrary;
