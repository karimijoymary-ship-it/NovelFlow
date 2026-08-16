import React, { useState, useEffect } from 'react';
import { getApiUrl } from './apiConfig';

export default function CatalogView({ onSelectBook, onAddManual }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterGenre, setFilterGenre] = useState('ALL');

  const fetchCatalog = () => {
    setLoading(true);
    const url = query.trim()
      ? getApiUrl(`/api/books/search?query=${encodeURIComponent(query.trim())}`)
      : getApiUrl('/api/books');

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setBooks(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load catalog:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCatalog();
  };

  const getTitle = (b) => {
    if (b.editions && b.editions.length > 0) {
      const en = b.editions.find(e => e.languageTag === 'en');
      return en ? en.title : b.editions[0].title;
    }
    return `Book #${b.bookMasterId}`;
  };

  return (
    <div className="main-content catalog-view animate-fade-in" style={{ padding: '2rem' }}>
      <header className="book-header" style={{ borderBottom: 'none', paddingBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>Literary Catalog Discovery</h1>
          <p style={{ color: 'var(--text-light)', marginTop: '0.4rem', fontSize: '0.9rem' }}>
            Explore the complete curated master library, academic texts, and community set books.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddManual}
          style={{
            padding: '10px 18px',
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.88rem',
            cursor: 'pointer'
          }}
        >
          + Add Book Manually
        </button>
      </header>

      {/* SEARCH BAR & FILTERS */}
      <div style={{ background: 'var(--social-bg)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '2rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by title, author, or ISBN..."
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text-h)',
              outline: 'none',
              fontSize: '0.95rem'
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); fetchCatalog(); }}
              style={{ padding: '10px 14px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-light)', borderRadius: '8px', cursor: 'pointer' }}
            >
              Clear
            </button>
          )}
          <button
            type="submit"
            style={{ padding: '10px 22px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
          >
            Search Catalog
          </button>
        </form>
      </div>

      {/* CATALOG GRID */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-light)' }}>
          Loading catalog repository...
        </div>
      ) : books.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--social-bg)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
          <h3>No books found matching your search.</h3>
          <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Try searching with a different title or add it manually.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {books.map(b => {
            const title = getTitle(b);
            const rating = b.calculatedAverageRating ? b.calculatedAverageRating.toFixed(1) : '4.5';
            const year = b.originalReleaseYear || 'N/A';

            return (
              <div
                key={b.bookMasterId}
                onClick={() => onSelectBook(b)}
                style={{
                  background: 'var(--social-bg)',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  padding: '1.25rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  gap: '1rem',
                  transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease'
                }}
                className="catalog-card-hover"
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--accent)', background: 'var(--accent-bg)', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                      {year}
                    </span>
                    <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.85rem' }}>
                      ★ {rating}
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', color: 'var(--text-h)', fontWeight: 700 }}>
                    {title}
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                    by {b.originalAuthor}
                  </div>

                  {b.synopsis && (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text)', marginTop: '10px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {b.synopsis}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px dashed var(--border)' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>
                    {b.isVerified !== false ? 'Verified Academic' : 'Community Addition'}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>
                    Open Details →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
