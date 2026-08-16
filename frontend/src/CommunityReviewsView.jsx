import React, { useState, useEffect } from 'react';
import { getApiUrl } from './apiConfig';

export default function CommunityReviewsView({ book, currentUser }) {
 const [reviews, setReviews] = useState([]);
 const [loading, setLoading] = useState(true);
 const [submitting, setSubmitting] = useState(false);
 const [filterRating, setFilterRating] = useState('ALL'); // ALL, 5, 4, 3, 2, 1
 const [sortBy, setSortBy] = useState('NEWEST'); // NEWEST, RATING, HELPFUL
 const [showReviewForm, setShowReviewForm] = useState(false);

 // New Review Form State
 const [reviewerName, setReviewerName] = useState('');
 const [reviewerStream, setReviewerStream] = useState('');
 const [rating, setRating] = useState(5.0);
 const [hoverRating, setHoverRating] = useState(0);
 const [reviewTitle, setReviewTitle] = useState('');
 const [reviewText, setReviewText] = useState('');
 const [message, setMessage] = useState(null);
 const [error, setError] = useState(null);

 // Threaded Reply State
 const [replyingReviewId, setReplyingReviewId] = useState(null);
 const [replyText, setReplyText] = useState('');
 const [submittingReply, setSubmittingReply] = useState(false);

 useEffect(() => {
 if (currentUser) {
 setReviewerName(currentUser.fullName || '');
 setReviewerStream(currentUser.academicStream || 'General Literature');
 }
 }, [currentUser]);

 const fetchReviews = () => {
 if (!book) return;
 setLoading(true);
 fetch(getApiUrl(`/api/books/${book.bookMasterId}/reviews`))
 .then(res => res.json())
 .then(data => {
 setReviews(data || []);
 setLoading(false);
 })
 .catch(err => {
 console.error("Failed to load reviews:", err);
 setLoading(false);
 });
 };

 useEffect(() => {
 fetchReviews();
 }, [book]);

 const handleSubmitReview = (e) => {
 e.preventDefault();
 if (!reviewText.trim()) {
 setError("Please enter your review comments.");
 return;
 }

 setSubmitting(true);
 setError(null);

 const payload = {
 reviewerName: reviewerName.trim() || 'Anonymous Reader',
 reviewerStream: reviewerStream.trim() || 'General Reader',
 rating: parseFloat(rating),
 reviewTitle: reviewTitle.trim() || 'Community Review',
 reviewText: reviewText.trim()
 };

 fetch(getApiUrl(`/api/books/${book.bookMasterId}/reviews`), {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(payload)
 })
 .then(res => {
 if (!res.ok) throw new Error("Failed to post review.");
 return res.json();
 })
 .then(savedReview => {
 setSubmitting(false);
 setMessage("Your review has been posted!");
 setReviewTitle('');
 setReviewText('');
 setShowReviewForm(false);
 fetchReviews();
 setTimeout(() => setMessage(null), 3500);
 })
 .catch(err => {
 setSubmitting(false);
 setError(err.message);
 });
 };

 const handleHelpful = (reviewId) => {
 fetch(getApiUrl(`/api/books/reviews/${reviewId}/helpful`), {
 method: 'PUT'
 })
 .then(res => res.json())
 .then(updatedReview => {
 setReviews(prev => prev.map(r => r.reviewId === reviewId ? updatedReview : r));
 })
 .catch(console.error);
 };

 const handleFlag = (reviewId) => {
 fetch(getApiUrl(`/api/books/reviews/${reviewId}/flag`), {
 method: 'PUT'
 })
 .then(res => res.json())
 .then(updatedReview => {
 setMessage("Review has been flagged for administrator review.");
 setReviews(prev => prev.map(r => r.reviewId === reviewId ? updatedReview : r));
 setTimeout(() => setMessage(null), 3000);
 })
 .catch(console.error);
 };

 const handleUnflag = (reviewId) => {
 fetch(getApiUrl(`/api/books/reviews/${reviewId}/unflag`), {
 method: 'PUT'
 })
 .then(res => res.json())
 .then(updatedReview => {
 setMessage("Review flag has been dismissed by admin.");
 setReviews(prev => prev.map(r => r.reviewId === reviewId ? updatedReview : r));
 setTimeout(() => setMessage(null), 3000);
 })
 .catch(console.error);
 };

 const handleAdminDelete = (reviewId) => {
 if (!window.confirm("As Administrator, are you sure you want to delete this community review?")) return;
 fetch(getApiUrl(`/api/books/reviews/${reviewId}`), {
 method: 'DELETE'
 })
 .then(res => {
 if (!res.ok) throw new Error("Failed to delete review.");
 setMessage("Review deleted by administrator.");
 setReviews(prev => prev.filter(r => r.reviewId !== reviewId));
 setTimeout(() => setMessage(null), 3000);
 })
 .catch(console.error);
 };

 const handlePostReply = (parentReviewId) => {
 if (!replyText.trim()) return;

 setSubmittingReply(true);
 const payload = {
 reviewerName: reviewerName.trim() || 'Anonymous Reader',
 reviewerStream: reviewerStream.trim() || 'General Literature',
 rating: 5.0,
 reviewTitle: 'Reply',
 reviewText: replyText.trim(),
 parentReviewId
 };

 fetch(getApiUrl(`/api/books/${book.bookMasterId}/reviews`), {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(payload)
 })
 .then(res => {
 if (!res.ok) throw new Error("Failed to post reply.");
 return res.json();
 })
 .then(savedReply => {
 setSubmittingReply(false);
 setReplyText('');
 setReplyingReviewId(null);
 fetchReviews();
 })
 .catch(err => {
 setSubmittingReply(false);
 console.error(err);
 });
 };

 if (!book) return null;

 // Rating Distribution Calculation
 const totalCount = reviews.length;
 const avgRating = totalCount > 0
 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalCount).toFixed(1)
 : (book.calculatedAverageRating || 4.5).toFixed(1);

 const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
 reviews.forEach(r => {
 const rounded = Math.round(r.rating);
 if (starCounts[rounded] !== undefined) starCounts[rounded]++;
 });

 // Filter & Sort Logic
 let filtered = reviews.filter(r => {
 if (filterRating === 'ALL') return true;
 return Math.round(r.rating) === parseInt(filterRating, 10);
 });

 if (sortBy === 'NEWEST') {
 filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
 } else if (sortBy === 'RATING') {
 filtered.sort((a, b) => b.rating - a.rating);
 } else if (sortBy === 'HELPFUL') {
 filtered.sort((a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0));
 }

 const renderStars = (score, interactive = false) => {
 const stars = [];
 const displayRating = hoverRating || score;
 for (let i = 1; i <= 5; i++) {
 const isFilled = i <= Math.floor(displayRating);
 stars.push(
 <span
 key={i}
 onClick={() => interactive && setRating(i)}
 onMouseEnter={() => interactive && setHoverRating(i)}
 onMouseLeave={() => interactive && setHoverRating(0)}
 style={{
 color: isFilled ? '#f59e0b' : 'var(--border)',
 cursor: interactive ? 'pointer' : 'default',
 fontSize: interactive ? '1.4rem' : '1rem',
 marginRight: '2px',
 transition: 'transform 0.15s ease, color 0.15s ease'
 }}
 >
 
 </span>
 );
 }
 return stars;
 };

 return (
 <div className="reviews-container animate-fade-in" style={{ padding: '0 2rem 2rem' }}>
 
 {message && (
 <div className="success-message animate-slide-down" style={{ marginBottom: '1rem' }}>
 {message}
 </div>
 )}

 {/* OVERALL COMMUNITY RATING SUMMARY CARD */}
 <div style={{ background: 'var(--social-bg)', borderRadius: '12px', border: '1px solid var(--border)', padding: '1.5rem', marginBottom: '1.5rem' }}>
 <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr auto', gap: '2rem', alignItems: 'center' }}>
 
 {/* RATING SCORE DISPLAY */}
 <div style={{ textAlign: 'center', borderRight: '1px solid var(--border)', paddingRight: '1rem' }}>
 <div style={{ fontSize: '3.2rem', fontWeight: 800, color: 'var(--text-h)', lineHeight: 1, fontFamily: 'var(--mono)' }}>
 {avgRating}
 </div>
 <div style={{ margin: '4px 0' }}>{renderStars(parseFloat(avgRating))}</div>
 <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
 Based on {totalCount} {totalCount === 1 ? 'review' : 'community reviews'}
 </div>
 </div>

 {/* STAR BREAKDOWN BARS */}
 <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
 {[5, 4, 3, 2, 1].map(num => {
 const count = starCounts[num] || 0;
 const pct = totalCount > 0 ? (count / totalCount) * 100 : 0;
 return (
 <div key={num} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: 'var(--text)' }}>
 <span style={{ width: '30px', textAlign: 'right', fontWeight: 600 }}>{num} </span>
 <div style={{ flex: 1, height: '8px', background: 'var(--bg)', borderRadius: '4px', overflow: 'hidden' }}>
 <div style={{ width: `${pct}%`, height: '100%', background: '#f59e0b', borderRadius: '4px', transition: 'width 0.3s ease' }} />
 </div>
 <span style={{ width: '35px', color: 'var(--text-light)', fontFamily: 'var(--mono)' }}>{count}</span>
 </div>
 );
 })}
 </div>

 {/* WRITE REVIEW ACTION BUTTON */}
 <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
 <button
 type="button"
 onClick={() => setShowReviewForm(!showReviewForm)}
 style={{
 padding: '10px 18px',
 background: showReviewForm ? 'var(--bg)' : 'var(--accent)',
 color: showReviewForm ? 'var(--text-h)' : '#fff',
 border: showReviewForm ? '1px solid var(--border)' : 'none',
 borderRadius: '8px',
 fontWeight: 600,
 fontSize: '0.88rem',
 cursor: 'pointer',
 display: 'flex',
 alignItems: 'center',
 gap: '8px'
 }}
 >
 <span>{showReviewForm ? 'X Close Form' : ' Write Review'}</span>
 </button>
 <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
 Share your insights with peer readers
 </span>
 </div>

 </div>
 </div>

 {/* WRITE A REVIEW FORM PANEL */}
 {showReviewForm && (
 <div style={{ background: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--accent)', padding: '1.5rem', marginBottom: '1.5rem' }} className="animate-slide-down">
 <h3 style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem', color: 'var(--accent)', marginBottom: '1rem', marginTop: 0 }}>
 Submit Community Review for "{book.editions?.[0]?.title || book.bookMasterId}"
 </h3>

 {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}

 <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
 
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 180px', gap: '1rem', alignItems: 'center' }}>
 <div>
 <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Reviewer Name</label>
 <input
 type="text"
 value={reviewerName}
 onChange={e => setReviewerName(e.target.value)}
 placeholder="e.g. Karimi JoyMary"
 style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--social-bg)', color: 'var(--text-h)', outline: 'none' }}
 />
 </div>

 <div>
 <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Academic Stream / Field</label>
 <input
 type="text"
 value={reviewerStream}
 onChange={e => setReviewerStream(e.target.value)}
 placeholder="e.g. Comparative Literature"
 style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--social-bg)', color: 'var(--text-h)', outline: 'none' }}
 />
 </div>

 <div>
 <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Your Rating</label>
 <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
 {renderStars(rating, true)}
 <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b', fontFamily: 'var(--mono)', marginLeft: '6px' }}>{rating}.0</span>
 </div>
 </div>
 </div>

 <div>
 <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Review Title / Headline</label>
 <input
 type="text"
 value={reviewTitle}
 onChange={e => setReviewTitle(e.target.value)}
 placeholder="e.g. Masterpiece on resilience & female autonomy"
 style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--social-bg)', color: 'var(--text-h)', outline: 'none' }}
 />
 </div>

 <div>
 <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Review Comments & Analysis</label>
 <textarea
 rows="4"
 value={reviewText}
 onChange={e => setReviewText(e.target.value)}
 placeholder="Share your perspective on the book's themes, character development, narrative structure..."
 style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--social-bg)', color: 'var(--text-h)', outline: 'none', resize: 'vertical' }}
 required
 />
 </div>

 <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
 <button
 type="button"
 onClick={() => setShowReviewForm(false)}
 style={{ padding: '8px 14px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px', cursor: 'pointer' }}
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={submitting}
 style={{ padding: '8px 18px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}
 >
 {submitting ? 'Posting Review...' : 'Publish Review'}
 </button>
 </div>

 </form>
 </div>
 )}

 {/* FILTER & SORT BAR */}
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', background: 'var(--social-bg)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
 <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 600 }}>Filter Rating:</span>
 {['ALL', '5', '4', '3', '2', '1'].map(f => (
 <button
 key={f}
 type="button"
 onClick={() => setFilterRating(f)}
 style={{
 padding: '4px 10px',
 borderRadius: '12px',
 fontSize: '0.78rem',
 fontWeight: filterRating === f ? 700 : 400,
 border: filterRating === f ? '1px solid #f59e0b' : '1px solid var(--border)',
 background: filterRating === f ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
 color: filterRating === f ? '#f59e0b' : 'var(--text)',
 cursor: 'pointer'
 }}
 >
 {f === 'ALL' ? 'All Reviews' : `${f} `}
 </button>
 ))}
 </div>

 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
 <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 600 }}>Sort By:</span>
 <select
 value={sortBy}
 onChange={e => setSortBy(e.target.value)}
 style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', fontSize: '0.8rem', outline: 'none' }}
 >
 <option value="NEWEST">Newest First</option>
 <option value="RATING">Highest Rating</option>
 <option value="HELPFUL">Most Helpful</option>
 </select>
 </div>
 </div>

 {/* REVIEWS LIST & THREADED REPLIES */}
 {loading ? (
 <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>
 Loading community reviews...
 </div>
 ) : filtered.filter(r => !r.parentReviewId).length === 0 ? (
 <div style={{ padding: '3rem 1.5rem', textAlign: 'center', background: 'var(--social-bg)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
 <h4 style={{ margin: '0 0 6px 0', color: 'var(--text-h)' }}>No Community Reviews Yet</h4>
 <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-light)' }}>Be the first reader to submit a review for this book!</p>
 <button
 type="button"
 onClick={() => setShowReviewForm(true)}
 style={{ marginTop: '1rem', padding: '8px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
 >
 Write First Review
 </button>
 </div>
 ) : (
 <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
 {filtered.filter(r => !r.parentReviewId).map(rev => {
 const initials = (rev.reviewerName || 'A R')
 .split(' ')
 .map(n => n[0])
 .join('')
 .toUpperCase()
 .substring(0, 2);

 const childReplies = reviews.filter(c => c.parentReviewId === rev.reviewId);
 const isReplying = replyingReviewId === rev.reviewId;

 return (
 <div
 key={rev.reviewId}
 style={{
 background: 'var(--social-bg)',
 borderRadius: '12px',
 border: '1px solid var(--border)',
 padding: '1.25rem',
 display: 'flex',
 flexDirection: 'column',
 gap: '0.75rem',
 transition: 'border-color 0.2s ease'
 }}
 >
 {/* REVIEW HEADER */}
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
 <div
 style={{
 width: '36px',
 height: '36px',
 borderRadius: '50%',
 background: 'linear-gradient(135deg, var(--accent), #6366f1)',
 color: '#fff',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 fontWeight: 700,
 fontSize: '0.85rem'
 }}
 >
 {initials}
 </div>
 <div>
 <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-h)' }}>
 {rev.reviewerName}
 </div>
 <div style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>
 {rev.reviewerStream || 'General Literature'}
 </div>
 </div>
 </div>

 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
 <div>{renderStars(rev.rating)}</div>
 <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
 {new Date(rev.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
 </div>
 </div>
 </div>

 {/* REVIEW TITLE */}
 {rev.reviewTitle && (
 <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-h)', fontWeight: 700 }}>
 {rev.reviewTitle}
 </h4>
 )}

 {/* REVIEW BODY */}
 <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
 {rev.reviewText}
 </p>

 {/* FOOTER ACTIONS */}
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px dashed var(--border)' }}>
 <div>
 {rev.isFlagged ? (
 <span style={{ fontSize: '0.75rem', color: '#ef4444', background: 'rgba(239, 68, 68, 0.15)', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
 Flagged for Admin Review
 </span>
 ) : (
 <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
 Verified Community Member
 </span>
 )}
 </div>

 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
 <button
 type="button"
 onClick={() => handleHelpful(rev.reviewId)}
 style={{
 background: 'var(--bg)',
 border: '1px solid var(--border)',
 borderRadius: '16px',
 padding: '4px 12px',
 fontSize: '0.78rem',
 color: 'var(--text)',
 cursor: 'pointer',
 display: 'flex',
 alignItems: 'center',
 gap: '6px',
 fontWeight: 600
 }}
 >
 <span>Helpful</span>
 <span style={{ color: 'var(--accent)', fontFamily: 'var(--mono)', fontWeight: 700 }}>
 {rev.helpfulCount || 0}
 </span>
 </button>

 <button
 type="button"
 onClick={() => {
 setReplyingReviewId(isReplying ? null : rev.reviewId);
 setReplyText('');
 }}
 style={{
 background: 'var(--accent-bg)',
 border: '1px solid var(--accent-border)',
 borderRadius: '16px',
 padding: '4px 12px',
 fontSize: '0.78rem',
 color: 'var(--accent)',
 cursor: 'pointer',
 fontWeight: 600
 }}
 >
 {isReplying ? 'Cancel Reply' : 'Reply'}
 </button>

 {!rev.isFlagged && (
 <button
 type="button"
 onClick={() => handleFlag(rev.reviewId)}
 style={{
 background: 'transparent',
 border: '1px solid var(--border)',
 borderRadius: '16px',
 padding: '4px 10px',
 fontSize: '0.78rem',
 color: 'var(--text-light)',
 cursor: 'pointer'
 }}
 title="Flag inappropriate review for administrator"
 >
 Flag
 </button>
 )}

 {/* SPECIAL SYSTEM ADMINISTRATOR CONTROLS */}
 {currentUser?.role === 'admin' && (
 <div style={{ display: 'flex', gap: '6px', marginLeft: '6px', paddingLeft: '6px', borderLeft: '1px solid var(--border)' }}>
 {rev.isFlagged && (
 <button
 type="button"
 onClick={() => handleUnflag(rev.reviewId)}
 style={{ padding: '4px 8px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
 >
 Dismiss Flag
 </button>
 )}
 <button
 type="button"
 onClick={() => handleAdminDelete(rev.reviewId)}
 style={{ padding: '4px 8px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
 >
 Delete
 </button>
 </div>
 )}
 </div>
 </div>

 {/* INLINE THREADED REPLY FORM */}
 {isReplying && (
 <div style={{ marginTop: '8px', padding: '12px', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--accent-border)' }} className="animate-slide-down">
 <span style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
 Reply to {rev.reviewerName}'s Review:
 </span>
 <textarea
 rows="2"
 value={replyText}
 onChange={e => setReplyText(e.target.value)}
 placeholder="Write your thoughtful analysis or response..."
 style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--social-bg)', color: 'var(--text-h)', outline: 'none', fontSize: '0.85rem' }}
 />
 <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
 <button
 type="button"
 onClick={() => setReplyingReviewId(null)}
 style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-light)', borderRadius: '6px', fontSize: '0.78rem', cursor: 'pointer' }}
 >
 Cancel
 </button>
 <button
 type="button"
 disabled={submittingReply}
 onClick={() => handlePostReply(rev.reviewId)}
 style={{ padding: '4px 14px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
 >
 {submittingReply ? 'Posting...' : 'Post Reply'}
 </button>
 </div>
 </div>
 )}

 {/* NESTED THREADED REPLIES */}
 {childReplies.length > 0 && (
 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', paddingLeft: '1.25rem', borderLeft: '2px solid var(--accent-border)' }}>
 {childReplies.map(child => (
 <div key={child.reviewId} style={{ background: 'var(--bg)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
 <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-h)' }}>
 {child.reviewerName} <span style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 400 }}>({child.reviewerStream || 'Literature'})</span>
 </span>
 <span style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>
 {new Date(child.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
 </span>
 </div>
 <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text)', lineHeight: 1.4 }}>
 {child.reviewText}
 </p>
 </div>
 ))}
 </div>
 )}

 </div>
 );
 })}
 </div>
 )}

 </div>
 );
}
