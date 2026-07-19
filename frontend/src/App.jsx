import React, { useState, useEffect } from 'react';
import './App.css';
import PsychographicSliders from './PsychographicSliders';
import CharacterWebMatrix from './CharacterWebMatrix';
import Login from './Login';

function App() {
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [activeTab, setActiveTab] = useState('matrix'); // 'matrix' or 'telemetry'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('novelflow_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('novelflow_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('novelflow_user');
  };

  // Fetch all books
  const fetchBooks = () => {
    setLoading(true);
    fetch('/api/books')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch books from the backend.');
        return res.json();
      })
      .then((data) => {
        setBooks(data);
        if (data.length > 0) {
          // Keep current selection or default to first
          setSelectedBook((curr) => {
            if (curr) {
              const updated = data.find((b) => b.bookMasterId === curr.bookMasterId);
              return updated || data[0];
            }
            return data[0];
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  const handleSearch = () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      fetchBooks();
      return;
    }
    setIsSearching(true);
    setLoading(true);
    setError(null);
    fetch(`/api/books/search?query=${encodeURIComponent(trimmed)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Search failed on backend server.');
        return res.json();
      })
      .then((data) => {
        setBooks(data);
        if (data.length > 0) {
          setSelectedBook(data[0]);
        } else {
          setSelectedBook(null);
        }
        setIsSearching(false);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsSearching(false);
        setLoading(false);
      });
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    fetchBooks();
  };

  useEffect(() => {
    if (user) {
      fetchBooks();
    }
  }, [user]);

  const handleTelemetryUpdated = (updatedBook) => {
    // Update local books list and selected book info to reflect updated average rating
    setBooks((prevBooks) =>
      prevBooks.map((b) => (b.bookMasterId === updatedBook.bookMasterId ? updatedBook : b))
    );
    setSelectedBook(updatedBook);
  };

  // Helper to resolve title from English edition or fallback
  const getBookTitle = (book) => {
    if (!book) return 'Untitled';
    // If editions list is populated, look for English title
    if (book.editions && book.editions.length > 0) {
      const enEd = book.editions.find((e) => e.languageTag === 'en');
      return enEd ? enEd.title : book.editions[0].title;
    }
    // Fallback if editions is empty
    return `Book #${book.bookMasterId}`;
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (loading && books.length === 0) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
        <p style={{ fontFamily: 'var(--sans)' }}>Initializing NovelFlow Engine...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar - Book Selector */}
      <aside className="sidebar">
        <div className="logo-area">
          <div className="logo-icon">N</div>
          <div className="logo-text">NovelFlow</div>
        </div>

        <div className="user-profile-widget">
          <div className="user-avatar">{user.fullName ? user.fullName.charAt(0) : 'U'}</div>
          <div className="user-info">
            <div className="user-name">{user.fullName || 'User'}</div>
            <div className="user-stream">{user.academicStream || 'Academic'}</div>
          </div>
          <button type="button" className="btn-logout" onClick={handleLogout} title="Log Out">
            Logout
          </button>
        </div>

        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search books or ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
          />
          {searchQuery && (
            <button type="button" className="btn-clear-search" onClick={handleClearSearch} title="Clear Search">
              ✕
            </button>
          )}
          <button type="button" className="btn-search" onClick={handleSearch} disabled={isSearching}>
            {isSearching ? '...' : 'Search'}
          </button>
        </div>

        <div className="book-list-hdr">Catalog Discovery</div>

        {error && <div className="error-message">{error}</div>}

        <div className="book-list">
          {books.map((book) => {
            const title = getBookTitle(book);
            const isActive = selectedBook?.bookMasterId === book.bookMasterId;
            return (
              <div
                key={book.bookMasterId}
                className={`book-card ${isActive ? 'active' : ''}`}
                onClick={() => setSelectedBook(book)}
              >
                <div className="book-card-title">{title}</div>
                <div className="book-card-author">{book.originalAuthor}</div>
                <div className="book-card-meta">
                  <span className="release-year">{book.originalReleaseYear}</span>
                  <span className="rating-star-badge">
                    ★ {book.calculatedAverageRating ? book.calculatedAverageRating.toFixed(1) : '0.0'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {selectedBook ? (
          <>
            {/* Book Header Information */}
            <header className="book-header animate-fade-in">
              <div className="book-header-left">
                <h1>{getBookTitle(selectedBook)}</h1>
                <div className="author-by">by <strong>{selectedBook.originalAuthor}</strong></div>
                <span className="release-year">Originally Published: {selectedBook.originalReleaseYear}</span>
              </div>
              <div className="book-header-rating">
                <div className="rating-big-value">
                  {selectedBook.calculatedAverageRating ? selectedBook.calculatedAverageRating.toFixed(1) : '0.0'}
                  <span>★</span>
                </div>
                <div className="rating-label">Calculated Community Rating</div>
              </div>
            </header>

            {/* Translations / Editions widget */}
            <section className="editions-section animate-fade-in">
              <h4>Registered Translations & Editions</h4>
              <div className="editions-grid">
                {selectedBook.editions && selectedBook.editions.length > 0 ? (
                  selectedBook.editions.map((ed) => (
                    <div key={ed.editionId} className="edition-badge-card">
                      <span className="edition-lang">{ed.languageTag}</span>
                      <div className="edition-details">
                        <span className="edition-title">{ed.title}</span>
                        <span className="edition-isbn">ISBN: {ed.isbnBarcode}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No translation editions linked to this master book.</p>
                )}
              </div>
            </section>

            {/* Navigation Tabs */}
            <nav className="tabs-nav">
              <button
                type="button"
                className={`tab-link ${activeTab === 'matrix' ? 'active' : ''}`}
                onClick={() => setActiveTab('matrix')}
              >
                Character Web Matrix
              </button>
              <button
                type="button"
                className={`tab-link ${activeTab === 'telemetry' ? 'active' : ''}`}
                onClick={() => setActiveTab('telemetry')}
              >
                Reading Telemetry Sliders
              </button>
            </nav>

            {/* Active Tab Panel */}
            <section className="tab-panel animate-fade-in">
              {activeTab === 'matrix' ? (
                <CharacterWebMatrix bookId={selectedBook.bookMasterId} />
              ) : (
                <PsychographicSliders
                  bookId={selectedBook.bookMasterId}
                  userId={user.userId}
                  onTelemetryUpdated={handleTelemetryUpdated}
                />
              )}
            </section>
          </>
        ) : (
          <div className="empty-state">
            <h2>Welcome to NovelFlow</h2>
            <p>Select a book from the sidebar catalog to begin managing characters and reading metrics.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
