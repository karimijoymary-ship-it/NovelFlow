import React, { useState, useEffect } from 'react';
import { getApiUrl } from './apiConfig';
import { stripEmoji } from './sanitize';

const MyLibrary = ({ user }) => {
 const [telemetries, setTelemetries] = useState([]);
 const [booksCatalog, setBooksCatalog] = useState([]);
 const [loading, setLoading] = useState(true);

 // Form State for Log Completed Book
 const [showLogModal, setShowLogModal] = useState(false);
 const [selectedBookId, setSelectedBookId] = useState('');
 const [manualTitle, setManualTitle] = useState('');
 const [manualAuthor, setManualAuthor] = useState('');
 const [pagesRead, setPagesRead] = useState(250);
 const [rating, setRating] = useState(5.0);
 const [submitting, setSubmitting] = useState(false);
 const [error, setError] = useState(null);
 const [successMsg, setSuccessMsg] = useState(null);

 const activeUserId = (user && (user.userId || user.id)) || 'user_1';

 const fetchLibrary = () => {
 setLoading(true);
 fetch(getApiUrl(`/api/books/user-library?userId=${activeUserId}`))
 .then(res => res.json())
 .then(data => {
 setTelemetries(data || []);
 setLoading(false);
 })
 .catch(err => {
 console.error('Failed to load library:', err);
 setLoading(false);
 });
 };

 const fetchCatalog = () => {
 fetch(getApiUrl('/api/books'))
 .then(res => res.json())
 .then(data => setBooksCatalog(data || []))
 .catch(console.error);
 };

 useEffect(() => {
 fetchLibrary();
 fetchCatalog();
 }, [activeUserId]);

 const handleLogCompleted = async (e) => {
 e.preventDefault();
 setSubmitting(true);
 setError(null);

 try {
 let targetBookMasterId = selectedBookId;

 // If user typed a manual title/author instead of choosing from dropdown
 if (!targetBookMasterId && manualTitle.trim() && manualAuthor.trim()) {
 const queryTitle = manualTitle.trim().toLowerCase();
 // Check if book already exists in catalog
 const match = booksCatalog.find(b => {
 const t = getTitle(b).toLowerCase();
 return t.includes(queryTitle) || queryTitle.includes(t);
 });

 if (match) {
 targetBookMasterId = match.bookMasterId;
 } else {
 const manualRes = await fetch(getApiUrl('/api/books/manual'), {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 title: manualTitle.trim(),
 author: manualAuthor.trim(),
 releaseYear: 2026,
 synopsis: 'Completed book logged via My Library'
 })
 });

 if (!manualRes.ok) {
 const errBody = await manualRes.json().catch(() => ({}));
 throw new Error(errBody.error || 'Failed to register manual book.');
 }
 const createdBook = await manualRes.json();
 targetBookMasterId = createdBook.bookMasterId;
 }
 }

 if (!targetBookMasterId) {
 throw new Error('Please select a book from the catalog or type a Title & Author.');
 }

 // Save Completed Telemetry
 const telRes = await fetch(getApiUrl(`/api/books/${targetBookMasterId}/telemetry`), {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 userId: activeUserId,
 readingStatus: 'Completed',
 pagesCompleted: parseInt(pagesRead, 10) || 0,
 fractionalRating: parseFloat(rating) || 5.0,
 })
 });

 if (!telRes.ok) throw new Error('Failed to update telemetry.');

 setSuccessMsg('Successfully logged book to your Completed library!');
 setShowLogModal(false);
 setSelectedBookId('');
 setManualTitle('');
 setManualAuthor('');
 fetchLibrary();
 setTimeout(() => setSuccessMsg(null), 3000);
 } catch (err) {
 setError(err.message);
 } finally {
 setSubmitting(false);
 }
 };

 const cleanStatus = (s) => stripEmoji(s || '').trim();
 const reading = telemetries.filter(t => cleanStatus(t.readingStatus).includes('Reading'));
 const queue = telemetries.filter(t => cleanStatus(t.readingStatus).includes('Queue'));
 const completed = telemetries.filter(t => cleanStatus(t.readingStatus).includes('Completed'));
 const dnf = telemetries.filter(t => cleanStatus(t.readingStatus).includes('DNF'));

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
 <div key={t.telemetryId} style={{ padding: '1rem', background: 'var(--social-bg)', borderRadius: '8px', marginBottom: '0.5rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
 <div style={{ fontWeight: 'bold', color: 'var(--text-h)' }}>{title}</div>
 <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
 By {t.bookMaster?.originalAuthor || 'Unknown Author'}
 </div>
 <div style={{ fontSize: '0.85rem', color: 'var(--accent)', marginTop: '0.25rem', fontWeight: 600 }}>
 {t.pagesCompleted} pages read
 {t.fractionalRating > 0 && ` • ${t.fractionalRating}`}
 </div>
 </div>
 );
 };

 return (
 <div className="main-content library-view animate-fade-in" style={{ padding: '2rem' }}>
 
 <header className="book-header" style={{ borderBottom: 'none', paddingBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 <div className="book-header-left">
 <h1>My Library</h1>
 <div className="author-by" style={{ color: 'var(--text-light)', marginTop: '0.5rem' }}>
 Your personal, active bookshelf tracking reading progress.
 </div>
 </div>

 <button
 type="button"
 onClick={() => setShowLogModal(!showLogModal)}
 style={{
 padding: '10px 18px',
 background: 'var(--accent)',
 color: '#fff',
 border: 'none',
 borderRadius: '8px',
 fontWeight: 700,
 fontSize: '0.9rem',
 cursor: 'pointer',
 display: 'flex',
 alignItems: 'center',
 gap: '8px',
 boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)'
 }}
 >
 <span>{showLogModal ? 'Close Form' : '+ Log Completed Book'}</span>
 </button>
 </header>

 {successMsg && (
 <div className="success-message animate-slide-down" style={{ marginBottom: '1.5rem' }}>
 {successMsg}
 </div>
 )}

 {/* LOG COMPLETED BOOK MODAL / FORM PANEL */}
 {showLogModal && (
 <div style={{ background: 'var(--social-bg)', borderRadius: '12px', border: '1px solid var(--accent)', padding: '1.5rem', marginBottom: '2rem' }} className="animate-slide-down">
 <h3 style={{ margin: '0 0 10px 0', color: 'var(--accent)', textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '0.5px' }}>
 Log a Finished Book to Your Completed Library
 </h3>
 <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.85rem', color: 'var(--text-light)' }}>
 Select an existing text from the catalog or type a new book below to instantly add it to your Completed bookshelf.
 </p>

 {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}

 <form onSubmit={handleLogCompleted} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
 
 {/* Catalog Selector */}
 <div>
 <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-h)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
 Select Book from Catalog
 </label>
 <select
 value={selectedBookId}
 onChange={e => {
 setSelectedBookId(e.target.value);
 if (e.target.value) {
 setManualTitle('');
 setManualAuthor('');
 }
 }}
 style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', outline: 'none' }}
 >
 <option value="">-- Choose from Catalog --</option>
 {booksCatalog.map(b => (
 <option key={b.bookMasterId} value={b.bookMasterId}>
 {getTitle(b)} (by {b.originalAuthor})
 </option>
 ))}
 </select>
 </div>

 {/* Manual Entry Fallback */}
 {!selectedBookId && (
 <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '8px', border: '1px dashed var(--border)' }}>
 <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
 Or Type Custom Book Details:
 </span>
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
 <input
 type="text"
 placeholder="Book Title (e.g. Blossoms of the Savannah)"
 value={manualTitle}
 onChange={e => setManualTitle(e.target.value)}
 style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--social-bg)', color: 'var(--text-h)', outline: 'none' }}
 />
 <input
 type="text"
 placeholder="Author (e.g. Henry Ole Kulet)"
 value={manualAuthor}
 onChange={e => setManualAuthor(e.target.value)}
 style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--social-bg)', color: 'var(--text-h)', outline: 'none' }}
 />
 </div>
 </div>
 )}

 {/* Metrics inputs */}
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
 <div>
 <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-h)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
 Total Pages Completed
 </label>
 <input
 type="number"
 min="1"
 max="5000"
 value={pagesRead}
 onChange={e => setPagesRead(e.target.value)}
 style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', outline: 'none' }}
 required
 />
 </div>

 <div>
 <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-h)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
 Completion Rating (1 to 5)
 </label>
 <select
 value={rating}
 onChange={e => setRating(e.target.value)}
 style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', outline: 'none' }}
 >
 <option value="5.0">5.0 - Exceptional</option>
 <option value="4.5">4.5 - Excellent</option>
 <option value="4.0">4.0 - Very Good</option>
 <option value="3.5">3.5 - Good</option>
 <option value="3.0">3.0 - Average</option>
 <option value="2.0">2.0 - Below Average</option>
 <option value="1.0">1.0 - Poor</option>
 </select>
 </div>
 </div>

 {/* Action Buttons */}
 <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
 <button
 type="button"
 onClick={() => setShowLogModal(false)}
 style={{ padding: '8px 14px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px', cursor: 'pointer' }}
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={submitting}
 style={{ padding: '8px 18px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer' }}
 >
 {submitting ? 'Logging Book...' : 'Save to Completed Library'}
 </button>
 </div>

 </form>
 </div>
 )}

 {loading ? (
 <div style={{ padding: '2rem', textAlign: 'center' }}>Syncing Library...</div>
 ) : (
 <div className="library-sections-grid" style={{ display: 'grid', gap: '2rem', marginTop: '1rem' }}>

 {/* 1. COMPLETED / READ SECTION */}
 <section className="library-section">
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
 <h3 style={{ margin: 0 }}>
 Completed / Read ({completed.length})
 </h3>
 <button
 type="button"
 onClick={() => setShowLogModal(!showLogModal)}
 style={{ padding: '4px 10px', background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
 >
 + Quick Log
 </button>
 </div>
 <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: '1rem' }}>
 Finished texts with logged completion progress and overall user ratings.
 </p>
 {completed.length === 0 ? (
 <div className="empty-state-mini" style={{ padding: '2rem', background: 'var(--social-bg)', borderRadius: '12px', textAlign: 'center', border: '1px dashed var(--border)' }}>
 No completed books yet. Click "+ Log Completed Book" above to quickly add one!
 </div>
 ) : (
 completed.map(renderBookItem)
 )}
 </section>

 {/* 2. CURRENTLY READING */}
 <section className="library-section">
 <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
 Currently Reading ({reading.length})
 </h3>
 <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: '1rem' }}>
 Books with active reading progress.
 </p>
 {reading.length === 0 ? (
 <div className="empty-state-mini" style={{ padding: '2rem', background: 'var(--social-bg)', borderRadius: '12px', textAlign: 'center', border: '1px dashed var(--border)' }}>
 No books currently in progress.
 </div>
 ) : (
 reading.map(renderBookItem)
 )}
 </section>

 {/* 3. WANT TO READ / QUEUE */}
 <section className="library-section">
 <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
 Want to Read / Queue ({queue.length})
 </h3>
 <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: '1rem' }}>
 Books saved for upcoming coursework or semester reading lists.
 </p>
 {queue.length === 0 ? (
 <div className="empty-state-mini" style={{ padding: '2rem', background: 'var(--social-bg)', borderRadius: '12px', textAlign: 'center', border: '1px dashed var(--border)' }}>
 Your queue is looking empty!
 </div>
 ) : (
 queue.map(renderBookItem)
 )}
 </section>

 {/* 4. DID NOT FINISH (DNF) */}
 <section className="library-section">
 <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
 Did Not Finish (DNF) ({dnf.length})
 </h3>
 <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: '1rem' }}>
 Dropped books alongside the recorded drop-state reason.
 </p>
 {dnf.length === 0 ? (
 <div className="empty-state-mini" style={{ padding: '2rem', background: 'var(--social-bg)', borderRadius: '12px', textAlign: 'center', border: '1px dashed var(--border)' }}>
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
