import React, { useState, useEffect } from 'react';
import { 
 LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { getQueueSize, flushQueue, enqueueOfflineAction } from './idbService';
import { getApiUrl } from './apiConfig';

export default function AdminDashboardView() {
 const [activeTab, setActiveTab] = useState('catalog');
 const [users, setUsers] = useState([]);
 const [loadingUsers, setLoadingUsers] = useState(false);
 const [unverifiedBooks, setUnverifiedBooks] = useState([]);
 const [allReviews, setAllReviews] = useState([]);
 const [loadingReviews, setLoadingReviews] = useState(false);
 const [latencyData, setLatencyData] = useState([]);
 const [offlineCounts, setOfflineCounts] = useState({ telemetry: 0, tags: 0 });

 useEffect(() => {
 if (activeTab === 'community') {
 fetchUsers();
 }
 if (activeTab === 'catalog') {
 fetchUnverified();
 }
 if (activeTab === 'reviews') {
 fetchAdminReviews();
 }
 if (activeTab === 'infrastructure') {
 fetchLatency(); // initial
 const int = setInterval(fetchLatency, 10000); // 10s poll
 checkOfflineQueues();
 return () => clearInterval(int);
 }
 }, [activeTab]);

 const checkOfflineQueues = async () => {
 const telCount = await getQueueSize('telemetryQueue');
 const tagCount = await getQueueSize('tagSyncQueue');
 setOfflineCounts({ telemetry: telCount, tags: tagCount });
 };

 const forceSync = async () => {
 await flushQueue('telemetryQueue');
 await flushQueue('tagSyncQueue');
 checkOfflineQueues();
 };

 const fetchLatency = () => {
 fetch(getApiUrl('/api/telemetry/latency'))
 .then(res => res.json())
 .then(data => {
 setLatencyData(prev => {
 let updated = [...prev, data];
 if (updated.length > 6) updated = updated.slice(1);
 return updated;
 });
 })
 .catch(console.error);
 };

 const fetchUnverified = () => {
 fetch(getApiUrl('/api/books/unverified'))
 .then(res => res.json())
 .then(data => setUnverifiedBooks(data))
 .catch(err => console.error(err));
 };

 const verifyBook = (id) => {
 fetch(getApiUrl(`/api/books/${id}/verify`), { method: 'PUT' })
 .then(res => {
 if (res.ok) {
 setUnverifiedBooks(unverifiedBooks.filter(b => b.bookMasterId !== id));
 }
 });
 };

 const fetchUsers = () => {
 setLoadingUsers(true);
 fetch(getApiUrl('/api/users'))
 .then(res => res.json())
 .then(data => {
 setUsers(data);
 setLoadingUsers(false);
 })
 .catch(err => {
 console.error("Failed to fetch users", err);
 setLoadingUsers(false);
 });
 };

 const promoteUser = (userId, newRole) => {
 fetch(getApiUrl(`/api/users/${userId}/role`), {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ role: newRole })
 })
 .then(res => res.json())
 .then(updatedUser => {
 setUsers(users.map(u => u.userId === userId ? updatedUser : u));
 });
 };

 const fetchAdminReviews = () => {
 setLoadingReviews(true);
 fetch(getApiUrl('/api/books/all-reviews'))
 .then(res => res.json())
 .then(data => {
 setAllReviews(data || []);
 setLoadingReviews(false);
 })
 .catch(err => {
 console.error("Failed to fetch reviews", err);
 setLoadingReviews(false);
 });
 };

 const [reviewFilter, setReviewFilter] = useState('ALL'); // ALL, FLAGGED

 const unflagAdminReview = (reviewId) => {
 fetch(getApiUrl(`/api/books/reviews/${reviewId}/unflag`), {
 method: 'PUT'
 })
 .then(res => res.json())
 .then(updatedReview => {
 setAllReviews(allReviews.map(r => r.reviewId === reviewId ? updatedReview : r));
 })
 .catch(console.error);
 };

 const deleteAdminReview = (reviewId, reviewerName) => {
 if (!window.confirm(`Are you sure you want to delete review by "${reviewerName}"? This action cannot be undone.`)) {
 return;
 }

 fetch(getApiUrl(`/api/books/reviews/${reviewId}`), {
 method: 'DELETE'
 })
 .then(res => {
 if (res.ok) {
 setAllReviews(allReviews.filter(r => r.reviewId !== reviewId));
 }
 })
 .catch(console.error);
 };

 const cacheHitData = [
 { source: 'Google', hits: 85, misses: 15 },
 { source: 'OpenLibrary', hits: 55, misses: 45 },
 { source: 'Handmade API', hits: 98, misses: 2 },
 ];

 return (
 <div className="admin-dashboard animate-fade-in" style={{ padding: '0 2rem 2rem' }}>
 <header className="book-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '20px', marginBottom: '20px' }}>
 <div className="book-header-left">
 <h1>System Administration</h1>
 <div className="author-by" style={{ color: 'var(--text-light)', marginTop: '0.5rem' }}>
 Platform Governance, Community Reviews & Infrastructure Monitoring
 </div>
 </div>
 </header>

 <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
 <button 
 onClick={() => setActiveTab('catalog')}
 style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', background: activeTab === 'catalog' ? 'var(--primary-color)' : 'var(--social-bg)', color: activeTab === 'catalog' ? '#fff' : 'var(--text)', fontWeight: 600 }}
 >
 Catalog Governance
 </button>
 <button 
 onClick={() => setActiveTab('community')}
 style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', background: activeTab === 'community' ? 'var(--primary-color)' : 'var(--social-bg)', color: activeTab === 'community' ? '#fff' : 'var(--text)', fontWeight: 600 }}
 >
 Community Management
 </button>
 <button 
 onClick={() => setActiveTab('reviews')}
 style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', background: activeTab === 'reviews' ? 'var(--primary-color)' : 'var(--social-bg)', color: activeTab === 'reviews' ? '#fff' : 'var(--text)', fontWeight: 600 }}
 >
 Reviews Moderation ({allReviews.length})
 </button>
 <button 
 onClick={() => setActiveTab('infrastructure')}
 style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', background: activeTab === 'infrastructure' ? 'var(--primary-color)' : 'var(--social-bg)', color: activeTab === 'infrastructure' ? '#fff' : 'var(--text)', fontWeight: 600 }}
 >
 Infrastructure Telemetry
 </button>
 </div>

 {activeTab === 'catalog' && (
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
 <div style={{ background: 'var(--social-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
 <h3 style={{ marginBottom: '1rem' }}>Regional API Fallback Sync</h3>
 <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 <span>Google Books API</span>
 <span style={{ color: '#4CAF50', fontWeight: 600 }}>Active (Primary)</span>
 </div>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 <span>OpenLibrary API</span>
 <span style={{ color: '#2196F3', fontWeight: 600 }}>Standby (Fallback)</span>
 </div>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 <span>Handmade Local DB</span>
 <span style={{ color: '#FFC107', fontWeight: 600 }}>Operational (Seeded)</span>
 </div>
 </div>
 </div>

 <div style={{ background: 'var(--social-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
 <h3 style={{ marginBottom: '1rem' }}>Unverified User Additions ({unverifiedBooks.length})</h3>
 {unverifiedBooks.length === 0 ? (
 <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>All user-submitted catalog books are verified.</p>
 ) : (
 <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
 {unverifiedBooks.map(b => (
 <div key={b.bookMasterId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
 <div>
 <div style={{ fontWeight: 600 }}>{b.editions?.[0]?.title || b.bookMasterId}</div>
 <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>By {b.originalAuthor} ({b.originalReleaseYear})</div>
 </div>
 <button onClick={() => verifyBook(b.bookMasterId)} style={{ padding: '0.4rem 0.8rem', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
 Verify Book
 </button>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 )}

 {activeTab === 'community' && (
 <div style={{ background: 'var(--social-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
 <h3 style={{ marginBottom: '1rem' }}>Platform User Directory</h3>
 {loadingUsers ? (
 <p>Loading community users...</p>
 ) : (
 <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
 <thead>
 <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-light)' }}>
 <th style={{ padding: '0.75rem' }}>User ID</th>
 <th style={{ padding: '0.75rem' }}>Full Name</th>
 <th style={{ padding: '0.75rem' }}>Email</th>
 <th style={{ padding: '0.75rem' }}>Academic Stream</th>
 <th style={{ padding: '0.75rem' }}>Role</th>
 <th style={{ padding: '0.75rem' }}>Actions</th>
 </tr>
 </thead>
 <tbody>
 {users.map(u => (
 <tr key={u.userId} style={{ borderBottom: '1px solid var(--border)' }}>
 <td style={{ padding: '0.75rem', fontFamily: 'var(--mono)', fontSize: '0.8rem' }}>{u.userId}</td>
 <td style={{ padding: '0.75rem', fontWeight: 600 }}>{u.fullName}</td>
 <td style={{ padding: '0.75rem' }}>{u.email}</td>
 <td style={{ padding: '0.75rem' }}>{u.academicStream}</td>
 <td style={{ padding: '0.75rem' }}>
 <span style={{ 
 padding: '2px 8px', 
 borderRadius: '12px', 
 fontSize: '0.75rem', 
 fontWeight: 600,
 background: u.role === 'admin' ? 'rgba(233, 30, 99, 0.15)' : 'rgba(33, 150, 243, 0.15)',
 color: u.role === 'admin' ? '#E91E63' : '#2196F3'
 }}>
 {u.role}
 </span>
 </td>
 <td style={{ padding: '0.75rem' }}>
 {u.role === 'user' ? (
 <button onClick={() => promoteUser(u.userId, 'admin')} style={{ padding: '4px 8px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>
 Promote to Admin
 </button>
 ) : (
 <span style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>Administrator</span>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 )}
 </div>
 )}

 {/* REVIEWS MODERATION TAB */}
 {activeTab === 'reviews' && (
 <div style={{ background: 'var(--social-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
 <div>
 <h3 style={{ margin: 0 }}>Community Reviews Moderation</h3>
 <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-light)' }}>
 Inspect, manage, and moderate all user-submitted reviews across books.
 </p>
 </div>
 <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
 <button
 type="button"
 onClick={() => setReviewFilter('ALL')}
 style={{
 padding: '4px 12px',
 borderRadius: '16px',
 fontSize: '0.8rem',
 fontWeight: 600,
 border: reviewFilter === 'ALL' ? '1px solid var(--accent)' : '1px solid var(--border)',
 background: reviewFilter === 'ALL' ? 'var(--accent-bg)' : 'transparent',
 color: reviewFilter === 'ALL' ? 'var(--accent)' : 'var(--text)',
 cursor: 'pointer'
 }}
 >
 All ({allReviews.length})
 </button>
 <button
 type="button"
 onClick={() => setReviewFilter('FLAGGED')}
 style={{
 padding: '4px 12px',
 borderRadius: '16px',
 fontSize: '0.8rem',
 fontWeight: 600,
 border: reviewFilter === 'FLAGGED' ? '1px solid #ef4444' : '1px solid var(--border)',
 background: reviewFilter === 'FLAGGED' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
 color: reviewFilter === 'FLAGGED' ? '#ef4444' : 'var(--text)',
 cursor: 'pointer'
 }}
 >
 Flagged Only ({allReviews.filter(r => r.isFlagged).length})
 </button>
 </div>
 </div>

 {loadingReviews ? (
 <p>Loading reviews for moderation...</p>
 ) : allReviews.length === 0 ? (
 <p style={{ color: 'var(--text-light)' }}>No community reviews found.</p>
 ) : (
 <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
 {allReviews
 .filter(r => reviewFilter === 'ALL' || r.isFlagged)
 .map(rev => (
 <div
 key={rev.reviewId}
 style={{
 background: 'var(--bg)',
 borderRadius: '8px',
 border: rev.isFlagged ? '2px solid #ef4444' : '1px solid var(--border)',
 padding: '1rem',
 display: 'flex',
 flexDirection: 'column',
 gap: '0.5rem'
 }}
 >
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
 <span style={{ fontWeight: 700, color: 'var(--text-h)', fontSize: '0.95rem' }}>
 {rev.reviewerName}
 </span>
 <span style={{ fontSize: '0.78rem', color: 'var(--accent)', background: 'var(--accent-bg)', padding: '2px 8px', borderRadius: '10px' }}>
 {rev.reviewerStream || 'General Reader'}
 </span>
 {rev.isFlagged && (
 <span style={{ fontSize: '0.78rem', color: '#ef4444', background: 'rgba(239, 68, 68, 0.15)', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
 FLAGGED FOR REVIEW
 </span>
 )}
 <span style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>
 Book: <strong>{rev.bookMaster?.editions?.[0]?.title || rev.bookMaster?.bookMasterId || 'Book'}</strong>
 </span>
 </div>

 <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
 <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.9rem' }}>
 {rev.rating ? rev.rating.toFixed(1) : '5.0'}
 </span>
 <span style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>
 {rev.helpfulCount || 0} Helpful
 </span>

 {rev.isFlagged && (
 <button
 type="button"
 onClick={() => unflagAdminReview(rev.reviewId)}
 style={{ padding: '4px 10px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem' }}
 >
 Dismiss Flag
 </button>
 )}

 <button
 type="button"
 onClick={() => deleteAdminReview(rev.reviewId, rev.reviewerName)}
 style={{ padding: '4px 10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem' }}
 >
 ️ Delete Review
 </button>
 </div>
 </div>

 {rev.reviewTitle && (
 <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-h)' }}>
 {rev.reviewTitle}
 </div>
 )}

 <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.4 }}>
 {rev.reviewText}
 </p>

 <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', textAlign: 'right' }}>
 Submitted on: {new Date(rev.createdAt).toLocaleString()}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 )}

 {activeTab === 'infrastructure' && (
 <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
 <div style={{ background: 'var(--social-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
 <h3 style={{ marginBottom: '1rem' }}>Backend Microservice Latency Telemetry (ms)</h3>
 <div style={{ width: '100%', height: 250 }}>
 <ResponsiveContainer>
 <LineChart data={latencyData}>
 <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
 <XAxis dataKey="timestamp" stroke="var(--text-light)" />
 <YAxis stroke="var(--text-light)" />
 <RechartsTooltip contentStyle={{ background: 'var(--bg)', border: '1px solid var(--border)' }} />
 <Legend />
 <Line type="monotone" dataKey="Google" stroke="#4285F4" strokeWidth={2} />
 <Line type="monotone" dataKey="OpenLibrary" stroke="#34A853" strokeWidth={2} />
 <Line type="monotone" dataKey="HandmadeAPI" stroke="#FBBC05" strokeWidth={2} />
 </LineChart>
 </ResponsiveContainer>
 </div>
 </div>

 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
 <div style={{ background: 'var(--social-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
 <h3 style={{ marginBottom: '1rem' }}>Search Cache Hit Rates</h3>
 <div style={{ width: '100%', height: 200 }}>
 <ResponsiveContainer>
 <BarChart data={cacheHitData} layout="vertical">
 <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
 <XAxis type="number" stroke="var(--text-light)" />
 <YAxis dataKey="source" type="category" stroke="var(--text-light)" width={100} />
 <RechartsTooltip contentStyle={{ background: 'var(--bg)', border: '1px solid var(--border)' }} />
 <Legend />
 <Bar dataKey="hits" stackId="a" fill="#4CAF50" />
 <Bar dataKey="misses" stackId="a" fill="#F44336" />
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>

 <div style={{ background: 'var(--social-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
 <h3 style={{ marginBottom: '1rem' }}>IndexedDB Offline Sync Queues</h3>
 <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
 <div>
 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
 <span>Telemetry Updates Pending</span>
 <strong>{offlineCounts.telemetry} records</strong>
 </div>
 <div style={{ height: '8px', background: 'var(--bg)', borderRadius: '4px', overflow: 'hidden' }}>
 <div style={{ width: `${Math.min(offlineCounts.telemetry * 2, 100)}%`, height: '100%', background: '#FFC107', transition: 'width 0.5s' }}></div>
 </div>
 </div>
 <div>
 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
 <span>Personal Tags Sync Pending</span>
 <strong>{offlineCounts.tags} records</strong>
 </div>
 <div style={{ height: '8px', background: 'var(--bg)', borderRadius: '4px', overflow: 'hidden' }}>
 <div style={{ width: `${Math.min(offlineCounts.tags * 2, 100)}%`, height: '100%', background: '#2196F3', transition: 'width 0.5s' }}></div>
 </div>
 </div>
 <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
 <button onClick={forceSync} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '8px', cursor: 'pointer' }}>
 Force Network Sync Emulation
 </button>
 <button onClick={async () => { await enqueueOfflineAction('telemetryQueue', { mock: 'sync_test' }); checkOfflineQueues(); }} style={{ padding: '0.75rem', background: '#34A853', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
 +
 </button>
 </div>
 </div>
 </div>
 </div>

 </div>
 )}

 </div>
 );
}
