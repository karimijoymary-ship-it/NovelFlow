import React, { useState, useEffect } from 'react';
import './App.css';
import PsychographicSliders from './PsychographicSliders';
import CharacterWebMatrix from './CharacterWebMatrix';
import Login from './Login';
import Sidebar from './Sidebar';
import MyLibrary from './MyLibrary';
import SavedPages from './SavedPages';
import ManualBookForm from './ManualBookForm';
import BookAnalyticsView from './BookAnalyticsView';
import AdminDashboardView from './AdminDashboardView';
import Collections from './Collections';
import CommunityReviewsView from './CommunityReviewsView';
import CatalogView from './CatalogView';
import UserGuideModal from './UserGuideModal';
import { getApiUrl } from './apiConfig';

// Apply saved theme on load
const savedTheme = localStorage.getItem('novelflow_theme') || 'system';
if (savedTheme === 'dark') document.documentElement.classList.add('theme-dark');
else if (savedTheme === 'light') document.documentElement.classList.add('theme-light');

function App() {
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingManually, setIsAddingManually] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [activeGlobalView, setActiveGlobalView] = useState('Discovery');
  const [theme, setTheme] = useState(() => localStorage.getItem('novelflow_theme') || 'system');
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('novelflow_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Apply theme class to :root whenever theme state changes
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-light');
    if (theme === 'dark') root.classList.add('theme-dark');
    else if (theme === 'light') root.classList.add('theme-light');
    localStorage.setItem('novelflow_theme', theme);
  }, [theme]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('novelflow_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('novelflow_user');
  };

  // Fetch all books
  const fetchBooks = (retryCount = 0) => {
    setLoading(true);
    setError(null);
    fetch(getApiUrl('/api/books'))
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
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        if (retryCount < 3) {
          setTimeout(() => {
            fetchBooks(retryCount + 1);
          }, 2500);
        } else {
          setError(err.message);
          setLoading(false);
        }
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
    fetch(getApiUrl(`/api/books/search?query=${encodeURIComponent(trimmed)}`))
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

  const handleManualAddSuccess = (newBook) => {
    setIsAddingManually(false);
    setSearchQuery('');
    setBooks(prev => [newBook, ...prev]);
    setSelectedBook(newBook);
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
      <Sidebar
        activeView={activeGlobalView}
        onViewChange={setActiveGlobalView}
        user={user}
        onLogout={handleLogout}
        onOpenGuide={() => setShowGuideModal(true)}
      />

      {showGuideModal && (
        <UserGuideModal onClose={() => setShowGuideModal(false)} />
      )}

      {activeGlobalView === 'Catalog' ? (
        <CatalogView
          onSelectBook={(book) => {
            setSelectedBook(book);
            setActiveGlobalView('Discovery');
          }}
          onAddManual={() => {
            setActiveGlobalView('Discovery');
            setIsAddingManually(true);
          }}
        />
      ) : activeGlobalView === 'Discovery' ? (
        <React.Fragment>
          {/* Sidebar - Book Selector */}
          <aside className="sidebar">
            {/* Logo area hidden since it's now in the global sidebar */}
            <div className="logo-area" style={{ display: 'none' }}>
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
                placeholder="Search by title, author, or ISBN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
              />
              <button type="button" className="btn-add-manually" onClick={() => setIsAddingManually(v => !v)} title="Add Book Manually" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '0 8px', color: 'var(--text-light)' }}>
                ➕
              </button>
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

            {/* Inline Manual Book Form panel — slides in below the header */}
            {isAddingManually && (
              <div className="manual-book-panel animate-slide-down">
                <ManualBookForm
                  onClose={() => setIsAddingManually(false)}
                  onSuccess={handleManualAddSuccess}
                />
              </div>
            )}

            {error && (
              <div className="error-message" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => fetchBooks(3)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    color: '#fff',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap'
                  }}
                >
                  🔄 Retry
                </button>
              </div>
            )}

            <div className="book-list">
              {isSearching ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <div className="spinner" style={{ margin: '0 auto', width: '30px', height: '30px' }}></div>
                  <p style={{ marginTop: '1rem', color: 'var(--text-light)', fontSize: '0.9rem' }}>Searching catalog...</p>
                </div>
              ) : books.length === 0 && searchQuery ? (
                <div className="empty-state-mini" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <p style={{ marginBottom: '1.5rem', color: 'var(--text-light)', fontSize: '0.95rem' }}>No results found for "{searchQuery}".</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                     <button type="button" onClick={() => setIsAddingManually(true)} style={{ width: '100%', padding: '0.5rem', fontSize: '0.9rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text)', borderRadius: '6px', cursor: 'pointer' }}>➕ Add Manually</button>
                  </div>
                </div>
              ) : (
                books.map((book) => {
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
                })
              )}
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
                  <div
                    className="book-header-rating"
                    onClick={() => setActiveGlobalView('Community Reviews')}
                    style={{ cursor: 'pointer' }}
                    title="Click to view community reviews and submit a rating"
                  >
                    <div className="rating-big-value">
                      {selectedBook.calculatedAverageRating ? selectedBook.calculatedAverageRating.toFixed(1) : '0.0'}
                      <span>★</span>
                    </div>
                    <div className="rating-label">Community Rating (Click for Reviews)</div>
                  </div>
                </header>

                {/* Synopsis / Summary widget */}
                {selectedBook.synopsis && (
                  <section className="synopsis-section animate-fade-in" style={{ padding: '1.5rem', background: 'var(--social-bg)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '24px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-h)' }}>Synopsis</h4>
                    <p style={{ color: 'var(--text)', fontSize: '0.95rem', lineHeight: '1.6', margin: '0 0 16px 0' }}>
                      {selectedBook.synopsis}
                    </p>

                    {/* Active Narrative Themes & Custom Tags */}
                    {(selectedBook.thematicElements || selectedBook.customTags) && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '12px', borderTop: '1px dashed var(--border)' }}>
                        {selectedBook.thematicElements && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.78rem', color: '#c084fc', fontWeight: 600, textTransform: 'uppercase' }}>🎭 Narrative Themes:</span>
                            {selectedBook.thematicElements.split(',').map((t, idx) => (
                              <span key={idx} style={{ background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.4)', color: '#c084fc', padding: '3px 10px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 600 }}>
                                🎭 {t.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                        {selectedBook.customTags && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase' }}>🏷️ Micro Tags:</span>
                            {selectedBook.customTags.split(',').map((t, idx) => (
                              <span key={idx} style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent)', padding: '3px 10px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 600 }}>
                                {t.trim().startsWith('#') ? t.trim() : `#${t.trim()}`}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </section>
                )}

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

                <div className="empty-state" style={{ border: '1px dashed var(--border)', background: 'transparent' }}>
                  <p style={{ fontSize: '1rem', color: 'var(--text)' }}>📌 Open <strong>Character Map</strong> from the sidebar to explore the character relationship web for this book.</p>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <h2>Welcome to NovelFlow</h2>
                <p>Select a book from the sidebar catalog to begin managing characters and reading metrics.</p>
              </div>
            )}
          </main>
        </React.Fragment>
      ) : activeGlobalView === 'Character Map' ? (
        <div className="main-content">
          {selectedBook ? (
            <div className="animate-fade-in">
              <header className="book-header" style={{ borderBottom: 'none', paddingBottom: '10px' }}>
                <div className="book-header-left">
                  <h1>Character Map</h1>
                  <div className="author-by">for <strong>{getBookTitle(selectedBook)}</strong></div>
                </div>
              </header>
              <section className="tab-panel" style={{ marginTop: '20px' }}>
                <CharacterWebMatrix bookId={selectedBook.bookMasterId} synopsis={selectedBook.synopsis} thematicElements={selectedBook.thematicElements} customTags={selectedBook.customTags} />
              </section>
            </div>
          ) : (
            <div className="empty-state">
              <h2>Character Map</h2>
              <p>Please select a book from the Discovery view first to map its characters.</p>
            </div>
          )}
        </div>
      ) : activeGlobalView === 'Book Analytics' ? (
        <div className="main-content">
          {selectedBook ? (
            <div className="animate-fade-in" style={{ padding: '0 2rem' }}>
              <header className="book-header" style={{ borderBottom: 'none', paddingBottom: '20px' }}>
                <div className="book-header-left">
                  <h1>Book Analytics</h1>
                  <div className="author-by">for <strong>{getBookTitle(selectedBook)}</strong></div>
                </div>
              </header>
              <section className="tab-panel">
                <BookAnalyticsView book={selectedBook} onBookUpdated={setSelectedBook} />
              </section>
            </div>
          ) : (
            <div className="empty-state">
              <h2>Book Analytics</h2>
              <p>Please select a book from the Discovery view first.</p>
            </div>
          )}
        </div>
      ) : activeGlobalView === 'Community Reviews' ? (
        <div className="main-content">
          {selectedBook ? (
            <div className="animate-fade-in" style={{ padding: '0 2rem' }}>
              <header className="book-header" style={{ borderBottom: 'none', paddingBottom: '20px' }}>
                <div className="book-header-left">
                  <h1>Community Rating & Reviews</h1>
                  <div className="author-by">for <strong>{getBookTitle(selectedBook)}</strong></div>
                </div>
              </header>
              <section className="tab-panel">
                <CommunityReviewsView book={selectedBook} currentUser={user} />
              </section>
            </div>
          ) : (
            <div className="empty-state">
              <h2>Community Rating & Reviews</h2>
              <p>Please select a book from the catalog first to view and write community reviews.</p>
            </div>
          )}
        </div>
      ) : activeGlobalView === 'System Administration' ? (
        <div className="main-content">
           <AdminDashboardView />
        </div>
      ) : activeGlobalView === 'Reading Stats' ? (
        <div className="main-content">
          {selectedBook ? (
            <div className="animate-fade-in" style={{ padding: '2rem' }}>
              <header className="book-header" style={{ borderBottom: 'none', paddingBottom: '10px' }}>
                <div className="book-header-left">
                  <h1>Reading Stats & Telemetry</h1>
                  <div className="author-by">for <strong>{getBookTitle(selectedBook)}</strong></div>
                </div>
              </header>
              <section className="tab-panel" style={{ marginTop: '20px' }}>
                <PsychographicSliders
                  book={selectedBook}
                  bookId={selectedBook.bookMasterId}
                  userId={user.userId}
                  onTelemetryUpdated={(updated) => {
                    if (updated && updated.bookMasterId) {
                      setSelectedBook(updated);
                      setBooks(prev => prev.map(b => b.bookMasterId === updated.bookMasterId ? updated : b));
                    }
                  }}
                />
              </section>
            </div>
          ) : (
            <div className="empty-state">
              <h2>Reading Stats</h2>
              <p>Please select a book from the Discovery view first to calibrate your reading telemetry.</p>
            </div>
          )}
        </div>
      ) : activeGlobalView === 'My Library' ? (
        <MyLibrary user={user} />
      ) : activeGlobalView === 'Collections' ? (
        <Collections />
      ) : activeGlobalView === 'Saved Pages' ? (
        <SavedPages />
      ) : activeGlobalView === 'Settings' ? (
        <div className="main-content">
          <div className="settings-panel animate-fade-in">
            <h2 style={{ marginBottom: '0.25rem' }}>Settings</h2>
            <p style={{ color: 'var(--text)', marginBottom: '2rem', fontSize: '0.95rem' }}>Manage your NovelFlow preferences.</p>

            <div className="settings-section">
              <h3 className="settings-section-title">Appearance</h3>
              <div className="settings-row">
                <div className="settings-row-label">
                  <span className="settings-label">Theme</span>
                  <span className="settings-desc">Choose how NovelFlow looks. System will follow your OS setting.</span>
                </div>
                <div className="theme-toggle-group">
                  {['light', 'system', 'dark'].map(t => (
                    <button
                      key={t}
                      type="button"
                      className={`theme-toggle-btn ${theme === t ? 'active' : ''}`}
                      onClick={() => setTheme(t)}
                    >
                      {t === 'light' ? '☀️ Light' : t === 'dark' ? '🌙 Dark' : '💻 System'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="main-content">
          <div className="empty-state">
            <h2>{activeGlobalView}</h2>
            <p>This view is currently under development.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
