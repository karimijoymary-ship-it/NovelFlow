import React, { useState, useEffect } from 'react';
import { getApiUrl } from './apiConfig';

const Collections = () => {
 const [sets, setSets] = useState([]);
 const [books, setBooks] = useState([]);
 const [telemetry, setTelemetry] = useState([]);
 const [activeTab, setActiveTab] = useState('ALL'); // ALL, COURSE, LANGUAGE_ALIGNMENT, PSYCHOGRAPHIC_PRESET, CUSTOM_TAG, SHARED_LIST
 const [selectedSet, setSelectedSet] = useState(null);
 const [showCreateModal, setShowCreateModal] = useState(false);
 const [showAddItemModal, setShowAddItemModal] = useState(false);
 const [showJoinModal, setShowJoinModal] = useState(false);
 const [inputShareCode, setInputShareCode] = useState('');
 const [sharedPreviewSet, setSharedPreviewSet] = useState(null);
 const [joinError, setJoinError] = useState(null);
 const [selectedTag, setSelectedTag] = useState(null);
 const [toastMessage, setToastMessage] = useState(null);
 const [showShareModal, setShowShareModal] = useState(false);
 const [shareModalSet, setShareModalSet] = useState(null);
 const [editingDnaBook, setEditingDnaBook] = useState(null);

 const handleUpdateBookDna = (bookId, newDna) => {
 fetch(getApiUrl(`/api/books/${bookId}/dna`), {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(newDna)
 })
 .then(res => res.json())
 .then(() => {
 triggerToast("Synced Psychographic DNA with Book Analytics!");
 setEditingDnaBook(null);
 fetchBooks();
 })
 .catch(console.error);
 };

 // New Set Form State
 const [newSet, setNewSet] = useState({
 name: '',
 description: '',
 icon: '',
 setType: 'COURSE',
 courseCode: '',
 semester: 'Fall 2026',
 isPublic: true,
 targetTag: '',
 dnaComplexityMin: 70,
 dnaDarknessMin: 60,
 dnaPacingMin: 50,
 dnaWorldBuildMin: 50
 });

 // Add Item Form State
 const [newItem, setNewItem] = useState({
 bookMasterId: '',
 itemType: 'REQUIRED',
 syllabusNotes: '',
 translationNotes: ''
 });

 // Discussion Comment Form State
 const [newComment, setNewComment] = useState({
 authorName: 'Alice Reader',
 authorRole: 'Student',
 commentText: ''
 });

 // Dynamic DNA threshold adjusters for Psychographic Presets view
 const [dnaFilters, setDnaFilters] = useState({
 complexity: 70,
 darkness: 60,
 pacing: 50,
 worldBuild: 50
 });

 useEffect(() => {
 fetchSets();
 fetchBooks();
 fetchUserTelemetry();
 }, []);

 const triggerToast = (msg) => {
 setToastMessage(msg);
 setTimeout(() => setToastMessage(null), 3000);
 };

 const fetchSets = () => {
 fetch(getApiUrl('/api/sets'))
 .then(res => res.json())
 .then(data => {
 setSets(data);
 if (selectedSet) {
 const updated = data.find(s => s.id === selectedSet.id);
 if (updated) setSelectedSet(updated);
 }
 })
 .catch(err => console.error("Failed to fetch sets:", err));
 };

 const fetchBooks = () => {
 fetch(getApiUrl('/api/books'))
 .then(res => res.json())
 .then(data => setBooks(data))
 .catch(err => console.error("Failed to fetch books:", err));
 };

 const fetchUserTelemetry = () => {
 fetch(getApiUrl('/api/books/user-library?userId=user_1'))
 .then(res => res.json())
 .then(data => setTelemetry(data))
 .catch(err => console.error("Failed to fetch telemetry:", err));
 };

 const handleCreateSet = async (e) => {
 e.preventDefault();
 try {
 const res = await fetch(getApiUrl('/api/sets'), {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(newSet)
 });
 if (res.ok) {
 const createdSet = await res.json();
 setSets([...sets, createdSet]);
 setShowCreateModal(false);
 setSelectedSet(createdSet);
 triggerToast(`Created new collection: "${createdSet.name}"`);
 // Reset form
 setNewSet({
 name: '',
 description: '',
 icon: '',
 setType: 'COURSE',
 courseCode: '',
 semester: 'Fall 2026',
 isPublic: true,
 targetTag: '',
 dnaComplexityMin: 70,
 dnaDarknessMin: 60,
 dnaPacingMin: 50,
 dnaWorldBuildMin: 50
 });
 }
 } catch (err) {
 console.error("Failed to create set", err);
 }
 };

 const handleAddItemToSet = async (e) => {
 e.preventDefault();
 if (!selectedSet || !newItem.bookMasterId) return;

 try {
 const res = await fetch(getApiUrl(`/api/sets/${selectedSet.id}/items`), {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(newItem)
 });
 if (res.ok) {
 const updatedSet = await res.json();
 setSelectedSet(updatedSet);
 fetchSets();
 setShowAddItemModal(false);
 triggerToast("Book added to collection!");
 setNewItem({ bookMasterId: '', itemType: 'REQUIRED', syllabusNotes: '', translationNotes: '' });
 }
 } catch (err) {
 console.error("Failed to add item to set", err);
 }
 };

 const handleRemoveItem = async (bookId) => {
 if (!selectedSet) return;
 try {
 const res = await fetch(getApiUrl(`/api/sets/${selectedSet.id}/items/${bookId}`), {
 method: 'DELETE'
 });
 if (res.ok) {
 const updatedSet = await res.json();
 setSelectedSet(updatedSet);
 fetchSets();
 triggerToast("Book removed from collection");
 }
 } catch (err) {
 console.error("Failed to remove item", err);
 }
 };

 const handleDeleteSet = async (set, e) => {
 if (e) e.stopPropagation();
 if (!set) return;

 if (!window.confirm(`Are you sure you want to delete the collection "${set.name}"? This action cannot be undone.`)) {
 return;
 }

 try {
 const res = await fetch(getApiUrl(`/api/sets/${set.id}`), {
 method: 'DELETE'
 });
 if (res.ok) {
 setSets(prev => prev.filter(s => s.id !== set.id));
 if (selectedSet && selectedSet.id === set.id) {
 setSelectedSet(null);
 }
 triggerToast(`Deleted collection: "${set.name}"`);
 } else {
 triggerToast("Failed to delete collection");
 }
 } catch (err) {
 console.error("Failed to delete set", err);
 }
 };

 const handleCloneSet = async (setId) => {
 try {
 const res = await fetch(getApiUrl(`/api/sets/${setId}/clone?userId=user_1`), {
 method: 'POST'
 });
 if (res.ok) {
 const cloned = await res.json();
 setSets([...sets, cloned]);
 setSelectedSet(cloned);
 triggerToast(`Cloned list to your workspace: "${cloned.name}"`);
 }
 } catch (err) {
 console.error("Failed to clone collection", err);
 }
 };

 const handleAddComment = async (e) => {
 e.preventDefault();
 if (!selectedSet || !newComment.commentText.trim()) return;

 try {
 const res = await fetch(getApiUrl(`/api/sets/${selectedSet.id}/comments`), {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(newComment)
 });
 if (res.ok) {
 fetchSets();
 setNewComment({ ...newComment, commentText: '' });
 triggerToast("Discussion note added!");
 }
 } catch (err) {
 console.error("Failed to post comment", err);
 }
 };

 const copyShareCode = (code, e) => {
 if (e) e.stopPropagation();
 const fullLink = `${window.location.origin}/?share=${encodeURIComponent(code)}`;

 const doToast = () => triggerToast(`Copied share link to clipboard! (${code})`);

 if (navigator.clipboard && navigator.clipboard.writeText) {
 navigator.clipboard.writeText(fullLink)
 .then(doToast)
 .catch(() => fallbackCopy(fullLink, code));
 } else {
 fallbackCopy(fullLink, code);
 }
 };

 const fallbackCopy = (text, code) => {
 try {
 const textarea = document.createElement('textarea');
 textarea.value = text;
 textarea.style.position = 'fixed';
 textarea.style.opacity = '0';
 document.body.appendChild(textarea);
 textarea.select();
 document.execCommand('copy');
 document.body.removeChild(textarea);
 triggerToast(`Copied share link to clipboard! (${code})`);
 } catch (err) {
 console.error("Copy failed", err);
 triggerToast(`Share code: ${code}`);
 }
 };

 const openShareModal = (set, e) => {
 if (e) e.stopPropagation();
 setShareModalSet(set);
 setShowShareModal(true);
 if (set.shareCode) {
 copyShareCode(set.shareCode);
 }
 };

 const handleLookupShareCode = async (e) => {
 e.preventDefault();
 if (!inputShareCode.trim()) return;
 setJoinError(null);
 setSharedPreviewSet(null);

 try {
 const res = await fetch(getApiUrl(`/api/sets/share/${encodeURIComponent(inputShareCode.trim())}`));
 if (res.ok) {
 const set = await res.json();
 setSharedPreviewSet(set);
 } else {
 setJoinError('No collection found matching that Share Code. Check for typos and try again.');
 }
 } catch (err) {
 setJoinError('Failed to verify share code. Check your backend connection.');
 }
 };

 const handleImportSharedSet = async (set) => {
 if (!set) return;
 try {
 const res = await fetch(getApiUrl(`/api/sets/${set.id}/clone?userId=user_1`), {
 method: 'POST'
 });
 if (res.ok) {
 const cloned = await res.json();
 setSets(prev => [...prev, cloned]);
 setSelectedSet(cloned);
 setShowJoinModal(false);
 setSharedPreviewSet(null);
 setInputShareCode('');
 triggerToast(`Imported shared collection: "${cloned.name}"`);
 }
 } catch (err) {
 console.error("Failed to import shared set", err);
 }
 };

 // Compute Syllabus Completion Rate for Course sets
 const getSyllabusCompletion = (set) => {
 if (!set.items || set.items.length === 0) return 0;
 let completedCount = 0;
 set.items.forEach(item => {
 const tel = telemetry.find(t => t.bookMaster?.bookMasterId === item.bookMaster?.bookMasterId);
 if (tel && tel.readingStatus === 'Completed') {
 completedCount++;
 }
 });
 return Math.round((completedCount / set.items.length) * 100);
 };

 // Collect all unique custom tags across books and sets
 const getAllTags = () => {
 const tagSet = new Set();
 // Default system seed tags
 ['#MauMauUprising', '#NgugiRetrospective', '#JazzAge', '#DystopianClassic', '#SciFiMasterpiece', '#AmericanDream', '#WorldBuilding'].forEach(t => tagSet.add(t));
 
 books.forEach(b => {
 if (b.customTags) {
 b.customTags.split(',').forEach(tag => {
 const trimmed = tag.trim();
 if (trimmed) tagSet.add(trimmed.startsWith('#') ? trimmed : `#${trimmed}`);
 });
 }
 });
 return Array.from(tagSet);
 };

 // Filter books matching selected custom tag
 const getBooksForTag = (tag) => {
 if (!tag) return [];
 const cleanTag = tag.replace('#', '').toLowerCase();
 return books.filter(b => b.customTags && b.customTags.toLowerCase().includes(cleanTag));
 };

 // Filter books matching Psychographic DNA threshold sliders
 const getBooksMatchingDna = (filters) => {
 return books.filter(b => {
 const comp = b.dnaComplexity ?? 50;
 const dark = b.dnaDarkness ?? 50;
 const pace = b.dnaPacing ?? 50;
 const world = b.dnaWorldBuild ?? 50;
 return comp >= filters.complexity && dark >= filters.darkness && pace >= filters.pacing && world >= filters.worldBuild;
 });
 };

 const filteredSets = sets.filter(s => activeTab === 'ALL' || s.setType === activeTab);

 return (
 <div className="main-content collections-view animate-fade-in" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
 
 {/* Toast Alert Banner */}
 {toastMessage && (
 <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: 'var(--accent)', color: '#fff', padding: '12px 20px', borderRadius: '8px', boxShadow: '0 8px 16px rgba(0,0,0,0.2)', zIndex: 2000, fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
 <span></span> {toastMessage}
 </div>
 )}

 {/* Header Area */}
 <header className="book-header" style={{ borderBottom: 'none', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 <div className="book-header-left">
 <h1 style={{ margin: 0, fontSize: '2.2rem', color: 'var(--text-h)' }}>Academic Collections Hub</h1>
 <div className="author-by" style={{ color: 'var(--text-light)', marginTop: '0.25rem', fontSize: '0.95rem' }}>
 Structured course syllabi, parallel language tracks, psychographic DNA clusters, multi-label tags, and collaborative reading lists.
 </div>
 </div>
 <div style={{ display: 'flex', gap: '10px' }}>
 <button 
 onClick={() => { setShowJoinModal(true); setJoinError(null); setSharedPreviewSet(null); setInputShareCode(''); }}
 style={{ padding: '0.7rem 1.2rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}
 >
 Join via Share Code
 </button>
 <button 
 onClick={() => setShowCreateModal(true)}
 style={{ padding: '0.7rem 1.4rem', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}
 >
 + Create Collection
 </button>
 </div>
 </header>

 {/* Category Navigation Tabs */}
 <div className="tabs-nav" style={{ marginBottom: '24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
 {[
 { id: 'ALL', label: 'All Collections', count: sets.length },
 { id: 'COURSE', label: 'Course Syllabi', count: sets.filter(s => s.setType === 'COURSE').length },
 { id: 'PSYCHOGRAPHIC_PRESET', label: 'Psychographic DNA', count: sets.filter(s => s.setType === 'PSYCHOGRAPHIC_PRESET').length },
 { id: 'CUSTOM_TAG', label: 'Custom Tags', count: getAllTags().length },
 { id: 'SHARED_LIST', label: 'Collaborative Lists', count: sets.filter(s => s.setType === 'SHARED_LIST').length }
 ].map(tab => (
 <button
 key={tab.id}
 onClick={() => { setActiveTab(tab.id); setSelectedSet(null); setSelectedTag(null); }}
 style={{
 padding: '10px 16px',
 border: 'none',
 borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
 background: 'transparent',
 color: activeTab === tab.id ? 'var(--text-h)' : 'var(--text-light)',
 fontWeight: activeTab === tab.id ? 600 : 400,
 cursor: 'pointer',
 fontSize: '0.9rem',
 display: 'flex',
 alignItems: 'center',
 gap: '6px'
 }}
 >
 {tab.label}
 <span style={{ fontSize: '0.75rem', background: activeTab === tab.id ? 'var(--accent-bg)' : 'var(--code-bg)', color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-light)', padding: '2px 6px', borderRadius: '10px' }}>
 {tab.count}
 </span>
 </button>
 ))}
 </div>

 {/* ----------------- SECTION 1: CUSTOM TAGS TAXONOMY VIEW ----------------- */}
 {activeTab === 'CUSTOM_TAG' && (
 <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
 <div style={{ background: 'var(--social-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
 <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-h)' }}> Multi-Label Tag Taxonomy</h3>
 <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', margin: '0 0 16px 0' }}>
 Click any taxonomic tag to aggregate books across micro-themes, historical periods, or author studies.
 </p>

 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
 {getAllTags().map(tag => {
 const isSelected = selectedTag === tag;
 const matchCount = getBooksForTag(tag).length;
 return (
 <button
 key={tag}
 onClick={() => setSelectedTag(isSelected ? null : tag)}
 style={{
 padding: '8px 14px',
 borderRadius: '20px',
 border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
 background: isSelected ? 'var(--accent)' : 'var(--bg)',
 color: isSelected ? '#fff' : 'var(--text-h)',
 cursor: 'pointer',
 fontSize: '0.85rem',
 fontWeight: 500,
 display: 'flex',
 alignItems: 'center',
 gap: '6px'
 }}
 >
 <span>{tag}</span>
 <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>({matchCount})</span>
 </button>
 );
 })}
 </div>
 </div>

 {selectedTag && (
 <div className="animate-slide-down" style={{ background: 'var(--bg)', border: '1px solid var(--accent)', padding: '20px', borderRadius: '12px' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
 <h4 style={{ margin: 0, color: 'var(--text-h)' }}>
 Books Tagged with <span style={{ color: 'var(--accent)' }}>{selectedTag}</span>
 </h4>
 <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>{getBooksForTag(selectedTag).length} Titles Found</span>
 </div>

 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
 {getBooksForTag(selectedTag).map(b => (
 <div key={b.bookMasterId} style={{ padding: '16px', background: 'var(--social-bg)', border: '1px solid var(--border)', borderRadius: '10px' }}>
 <div style={{ fontWeight: 600, color: 'var(--text-h)', marginBottom: '4px' }}>
 {b.editions && b.editions.length > 0 ? b.editions[0].title : `Book #${b.bookMasterId}`}
 </div>
 <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>by {b.originalAuthor} ({b.originalReleaseYear})</div>
 <div style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 500 }}>
 Tags: {b.customTags}
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 )}

 {/* ----------------- SECTION 2: PSYCHOGRAPHIC PRESETS VIEW ----------------- */}
 {activeTab === 'PSYCHOGRAPHIC_PRESET' && (
 <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
 <div style={{ background: 'var(--social-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
 <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-h)' }}> Calibrated Psychographic DNA Matcher</h3>
 <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', margin: '0 0 16px 0' }}>
 Adjust narrative vector sliders below to isolate books matching your target cognitive complexity, tone, and pacing.
 </p>

 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
 <div className="input-group">
 <div className="slider-header">
 <span className="group-label" style={{ fontSize: '0.85rem' }}>Narrative Complexity</span>
 <span className="slider-value">≥ {dnaFilters.complexity}%</span>
 </div>
 <input
 type="range"
 min="0"
 max="100"
 value={dnaFilters.complexity}
 onChange={e => setDnaFilters({ ...dnaFilters, complexity: Number(e.target.value) })}
 className="custom-range"
 />
 </div>

 <div className="input-group">
 <div className="slider-header">
 <span className="group-label" style={{ fontSize: '0.85rem' }}>Narrative Darkness</span>
 <span className="slider-value">≥ {dnaFilters.darkness}%</span>
 </div>
 <input
 type="range"
 min="0"
 max="100"
 value={dnaFilters.darkness}
 onChange={e => setDnaFilters({ ...dnaFilters, darkness: Number(e.target.value) })}
 className="custom-range"
 />
 </div>

 <div className="input-group">
 <div className="slider-header">
 <span className="group-label" style={{ fontSize: '0.85rem' }}>Pacing Velocity</span>
 <span className="slider-value">≥ {dnaFilters.pacing}%</span>
 </div>
 <input
 type="range"
 min="0"
 max="100"
 value={dnaFilters.pacing}
 onChange={e => setDnaFilters({ ...dnaFilters, pacing: Number(e.target.value) })}
 className="custom-range"
 />
 </div>

 <div className="input-group">
 <div className="slider-header">
 <span className="group-label" style={{ fontSize: '0.85rem' }}>World-Building Depth</span>
 <span className="slider-value">≥ {dnaFilters.worldBuild}%</span>
 </div>
 <input
 type="range"
 min="0"
 max="100"
 value={dnaFilters.worldBuild}
 onChange={e => setDnaFilters({ ...dnaFilters, worldBuild: Number(e.target.value) })}
 className="custom-range"
 />
 </div>
 </div>
 </div>

 <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '20px', borderRadius: '12px' }}>
 <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-h)' }}>
 Catalog Match Results ({getBooksMatchingDna(dnaFilters).length} Books Matched)
 </h4>

 {getBooksMatchingDna(dnaFilters).length === 0 ? (
 <div className="empty-state-mini" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>
 No books in catalog meet all selected threshold levels. Try lowering one of the sliders above!
 </div>
 ) : (
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
 {getBooksMatchingDna(dnaFilters).map(b => {
 const isEditingThis = editingDnaBook?.bookMasterId === b.bookMasterId;
 const title = b.editions && b.editions.length > 0 ? b.editions[0].title : `Book #${b.bookMasterId}`;

 return (
 <div key={b.bookMasterId} style={{ padding: '16px', background: 'var(--social-bg)', border: '1px solid var(--accent-border)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
 <div>
 <div style={{ fontWeight: 700, color: 'var(--text-h)', fontSize: '0.95rem' }}>{title}</div>
 <div style={{ fontSize: '0.82rem', color: 'var(--text-light)' }}>by {b.originalAuthor}</div>
 </div>
 <button
 type="button"
 onClick={() => setEditingDnaBook(isEditingThis ? null : { ...b })}
 style={{ padding: '4px 10px', background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
 >
 {isEditingThis ? 'X Close' : ' Tune Analytics DNA'}
 </button>
 </div>

 {/* DNA Analytics Synced Badges */}
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem', background: 'var(--bg)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
 <div> Complexity: <strong style={{ color: '#a855f7' }}>{b.dnaComplexity ?? 50}%</strong></div>
 <div> Darkness: <strong style={{ color: '#ef4444' }}>{b.dnaDarkness ?? 50}%</strong></div>
 <div> Pacing: <strong style={{ color: '#f59e0b' }}>{b.dnaPacing ?? 50}%</strong></div>
 <div> Worldbuild: <strong style={{ color: '#3b82f6' }}>{b.dnaWorldBuild ?? 50}%</strong></div>
 </div>

 {/* Inline DNA Editor Panel */}
 {isEditingThis && (
 <div className="animate-slide-down" style={{ marginTop: '6px', paddingTop: '10px', borderTop: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
 <span style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase' }}>
 Adjust Saved Book Analytics DNA
 </span>

 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem' }}>
 <div>
 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
 <span>Complexity:</span> <strong>{editingDnaBook.dnaComplexity ?? 50}%</strong>
 </div>
 <input type="range" min="0" max="100" value={editingDnaBook.dnaComplexity ?? 50} onChange={e => setEditingDnaBook({ ...editingDnaBook, dnaComplexity: Number(e.target.value) })} style={{ width: '100%' }} />
 </div>

 <div>
 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
 <span>Darkness:</span> <strong>{editingDnaBook.dnaDarkness ?? 50}%</strong>
 </div>
 <input type="range" min="0" max="100" value={editingDnaBook.dnaDarkness ?? 50} onChange={e => setEditingDnaBook({ ...editingDnaBook, dnaDarkness: Number(e.target.value) })} style={{ width: '100%' }} />
 </div>

 <div>
 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
 <span>Pacing:</span> <strong>{editingDnaBook.dnaPacing ?? 50}%</strong>
 </div>
 <input type="range" min="0" max="100" value={editingDnaBook.dnaPacing ?? 50} onChange={e => setEditingDnaBook({ ...editingDnaBook, dnaPacing: Number(e.target.value) })} style={{ width: '100%' }} />
 </div>

 <div>
 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
 <span>Worldbuilding:</span> <strong>{editingDnaBook.dnaWorldBuild ?? 50}%</strong>
 </div>
 <input type="range" min="0" max="100" value={editingDnaBook.dnaWorldBuild ?? 50} onChange={e => setEditingDnaBook({ ...editingDnaBook, dnaWorldBuild: Number(e.target.value) })} style={{ width: '100%' }} />
 </div>
 </div>

 <button
 type="button"
 onClick={() => handleUpdateBookDna(b.bookMasterId, editingDnaBook)}
 style={{ padding: '6px 12px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', marginTop: '4px' }}
 >
 Sync with Book Analytics
 </button>
 </div>
 )}
 </div>
 );
 })}
 </div>
 )}
 </div>
 </div>
 )}

 {/* ----------------- SECTION 3: EXPANDED DETAILED SET VIEW ----------------- */}
 {selectedSet && activeTab !== 'CUSTOM_TAG' && activeTab !== 'PSYCHOGRAPHIC_PRESET' && (
 <div className="animate-fade-in" style={{ background: 'var(--social-bg)', padding: '24px', borderRadius: '12px', border: '1px solid var(--accent)', marginBottom: '32px' }}>
 
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '20px' }}>
 <div>
 <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
 <span style={{ fontSize: '1.8rem' }}>{selectedSet.icon}</span>
 <h2 style={{ margin: 0, color: 'var(--text-h)' }}>{selectedSet.name}</h2>
 <span style={{ fontSize: '0.75rem', background: 'var(--accent-bg)', color: 'var(--accent)', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
 {selectedSet.setType}
 </span>
 </div>
 <p style={{ color: 'var(--text-light)', margin: '8px 0 0 0', fontSize: '0.9rem' }}>
 {selectedSet.description || "No description provided."}
 </p>
 </div>

 <div style={{ display: 'flex', gap: '8px' }}>
 {selectedSet.shareCode && (
 <button
 type="button"
 onClick={(e) => openShareModal(selectedSet, e)}
 style={{ padding: '6px 12px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-h)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
 >
 {selectedSet.shareCode}
 </button>
 )}
 {selectedSet.setType === 'SHARED_LIST' && (
 <button
 type="button"
 onClick={() => handleCloneSet(selectedSet.id)}
 style={{ padding: '6px 12px', background: 'var(--accent)', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
 >
 Clone List to My Workspace
 </button>
 )}
 <button
 type="button"
 onClick={(e) => handleDeleteSet(selectedSet, e)}
 style={{ padding: '6px 12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
 title="Delete Collection"
 >
  Delete
 </button>
 <button
 type="button"
 onClick={() => setSelectedSet(null)}
 style={{ padding: '6px 10px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
 >
 X Close
 </button>
 </div>
 </div>

 {/* COURSE SYLLABUS SPECIFIC VIEW */}
 {selectedSet.setType === 'COURSE' && (
 <div>
 <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '20px' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
 <span style={{ fontWeight: 600, color: 'var(--text-h)', fontSize: '0.9rem' }}>
 Syllabus Reading Progress ({getSyllabusCompletion(selectedSet)}% Completed)
 </span>
 <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
 Module Code: <strong>{selectedSet.courseCode || 'N/A'}</strong> | {selectedSet.semester || 'Academic Term'}
 </span>
 </div>
 <div className="progress-bar-container" style={{ height: '8px' }}>
 <div className="progress-bar-fill" style={{ width: `${getSyllabusCompletion(selectedSet)}%` }}></div>
 </div>
 </div>

 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
 <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-h)' }}>Syllabus Book List & Notes</h3>
 <button
 type="button"
 onClick={() => setShowAddItemModal(true)}
 style={{ padding: '6px 12px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
 >
 + Add Book to Syllabus
 </button>
 </div>

 {(!selectedSet.items || selectedSet.items.length === 0) ? (
 <div className="empty-state-mini" style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--bg)', borderRadius: '8px' }}>
 No books added to this syllabus yet. Click "+ Add Book to Syllabus" above.
 </div>
 ) : (
 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
 {selectedSet.items.map((item, idx) => {
 const b = item.bookMaster;
 const title = b.editions && b.editions.length > 0 ? b.editions[0].title : `Book #${b.bookMasterId}`;
 const tel = telemetry.find(t => t.bookMaster?.bookMasterId === b.bookMasterId);
 const status = tel ? tel.readingStatus : 'Not Started';

 return (
 <div key={item.id || idx} style={{ padding: '16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
 <div style={{ flex: 1 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
 <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', background: item.itemType === 'REQUIRED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)', color: item.itemType === 'REQUIRED' ? '#f87171' : '#60a5fa', fontWeight: 600 }}>
 {item.itemType}
 </span>
 <h4 style={{ margin: 0, color: 'var(--text-h)' }}>{title}</h4>
 <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>by {b.originalAuthor}</span>
 </div>

 {item.syllabusNotes && (
 <div style={{ marginTop: '8px', padding: '8px 12px', background: 'var(--code-bg)', borderLeft: '3px solid var(--accent)', borderRadius: '4px', fontSize: '0.85rem', color: 'var(--text-h)' }}>
 <strong>Syllabus Note:</strong> {item.syllabusNotes}
 </div>
 )}
 </div>

 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' }}>
 <span style={{ fontSize: '0.8rem', padding: '3px 8px', borderRadius: '12px', background: status === 'Completed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: status === 'Completed' ? '#34d399' : '#fbbf24', fontWeight: 600 }}>
 {status}
 </span>
 <button
 type="button"
 onClick={() => handleRemoveItem(b.bookMasterId)}
 style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer', padding: '2px 4px' }}
 >
 Remove
 </button>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 )}



 {/* COLLABORATIVE & SHARED LIST SPECIFIC VIEW */}
 {selectedSet.setType === 'SHARED_LIST' && (
 <div>
 <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', color: 'var(--text-h)' }}> Group Discussion & Chapter Notes</h3>
 
 <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '20px' }}>
 <form onSubmit={handleAddComment} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
 <textarea
 required
 rows="2"
 value={newComment.commentText}
 onChange={e => setNewComment({ ...newComment, commentText: e.target.value })}
 placeholder="Post a chapter note or discussion point for study group members..."
 style={{ width: '100%', boxSizing: 'border-box', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--social-bg)', color: 'var(--text-h)', fontFamily: 'inherit', fontSize: '0.85rem', outline: 'none' }}
 />
 <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
 <button type="submit" style={{ padding: '6px 14px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
 Post Comment
 </button>
 </div>
 </form>

 <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
 {(!selectedSet.comments || selectedSet.comments.length === 0) ? (
 <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', textAlign: 'center', padding: '10px' }}>
 No comments yet. Start the conversation!
 </div>
 ) : (
 selectedSet.comments.map(c => (
 <div key={c.id} style={{ padding: '10px 12px', background: 'var(--social-bg)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.85rem' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
 <span style={{ fontWeight: 600, color: 'var(--text-h)' }}>{c.authorName} <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 400 }}>({c.authorRole})</span></span>
 <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
 </div>
 <div style={{ color: 'var(--text)' }}>{c.commentText}</div>
 </div>
 ))
 )}
 </div>
 </div>
 </div>
 )}

 </div>
 )}

 {/* ----------------- SECTION 4: GENERAL COLLECTIONS GRID VIEW ----------------- */}
 {(!selectedSet || activeTab === 'CUSTOM_TAG' || activeTab === 'PSYCHOGRAPHIC_PRESET') && (
 <div className="collections-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
 {filteredSets.length === 0 ? (
 <div className="empty-state-mini" style={{ gridColumn: '1 / -1', padding: '3rem', background: 'var(--surface-color)', borderRadius: '12px', textAlign: 'center', border: '1px dashed var(--border-color)' }}>
 No collections found in this category. Click <strong>"+ Create Collection"</strong> above to make your first folder!
 </div>
 ) : (
 filteredSets.map(set => {
 const itemCount = set.items ? set.items.length : 0;
 const completion = getSyllabusCompletion(set);

 return (
 <div 
 key={set.id} 
 className="collection-card animate-fade-in" 
 style={{ 
 padding: '1.5rem', 
 background: 'var(--social-bg)', 
 borderRadius: '12px', 
 boxShadow: '0 4px 6px rgba(0,0,0,0.05)', 
 border: '1px solid var(--border)',
 display: 'flex',
 flexDirection: 'column',
 justify: 'space-between',
 transition: 'transform 0.2s, border-color 0.2s'
 }}
 >
 <div>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
 <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-h)', fontSize: '1.15rem' }}>
 <span>{set.icon}</span> {set.name}
 </h3>
 <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'var(--code-bg)', color: 'var(--accent)', fontWeight: 600 }}>
 {set.setType}
 </span>
 </div>

 <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', margin: '0 0 1rem 0', minHeight: '2.5rem', lineHeight: '1.5' }}>
 {set.description || "No description provided."}
 </p>

 {set.setType === 'COURSE' && (
 <div style={{ marginBottom: '1rem' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-light)', marginBottom: '4px' }}>
 <span>Syllabus Completion</span>
 <span><strong>{completion}%</strong> ({itemCount} Texts)</span>
 </div>
 <div className="progress-bar-container" style={{ height: '6px' }}>
 <div className="progress-bar-fill" style={{ width: `${completion}%` }}></div>
 </div>
 </div>
 )}
 </div>

 <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
 <button
 type="button"
 onClick={() => setSelectedSet(set)}
 style={{ flex: 1, padding: '0.55rem 1rem', borderRadius: '6px', border: 'none', background: 'var(--accent)', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
 >
 Open Collection
 </button>
 {set.shareCode && (
 <button
 type="button"
 onClick={(e) => openShareModal(set, e)}
 style={{ padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', cursor: 'pointer', fontSize: '0.85rem' }}
 title="Share Collection & Copy Link"
 >
 
 </button>
 )}
 <button
 type="button"
 onClick={(e) => handleDeleteSet(set, e)}
 style={{ padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', cursor: 'pointer', fontSize: '0.85rem' }}
 title="Delete Collection"
 >
 
 </button>
 </div>
 </div>
 );
 })
 )}
 </div>
 )}

 {/* ----------------- CREATE COLLECTION MODAL ----------------- */}
 {showCreateModal && (
 <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, backdropFilter: 'blur(4px)' }}>
 <div className="manual-book-panel-inner animate-slide-down" style={{ width: '480px', maxWidth: '92%', margin: 0, background: 'var(--social-bg)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
 
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
 <h3 style={{ margin: 0, color: 'var(--text-h)' }}>+ Create New Academic Collection</h3>
 <button type="button" onClick={() => setShowCreateModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '1.1rem', cursor: 'pointer' }}>X</button>
 </div>

 <form onSubmit={handleCreateSet} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
 <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
 <label style={{ fontSize: '0.78rem', color: 'var(--text-h)', fontWeight: 600, textTransform: 'uppercase' }}>Collection Category *</label>
 <select
 value={newSet.setType}
 onChange={e => setNewSet({ ...newSet, setType: e.target.value })}
 style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg)', color: 'var(--text-h)', fontSize: '0.9rem', outline: 'none' }}
 >
 <option value="COURSE"> Course & Curriculum Syllabus</option>
 <option value="PSYCHOGRAPHIC_PRESET"> Psychographic DNA Preset</option>
 <option value="CUSTOM_TAG"> Custom Tags Taxonomy Cluster</option>
 <option value="SHARED_LIST"> Collaborative / Shared Reading List</option>
 </select>
 </div>

 <div style={{ display: 'flex', gap: '10px' }}>
 <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
 <label style={{ fontSize: '0.78rem', color: 'var(--text-h)', fontWeight: 600, textTransform: 'uppercase' }}>NAME *</label>
 <input required type="text" value={newSet.name} onChange={e => setNewSet({ ...newSet, name: e.target.value })} placeholder="e.g. CLT 301: East African Fiction" style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg)', color: 'var(--text-h)', fontSize: '0.9rem', outline: 'none' }} />
 </div>
 <div style={{ width: '70px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
 <label style={{ fontSize: '0.78rem', color: 'var(--text-h)', fontWeight: 600, textTransform: 'uppercase' }}>ICON</label>
 <input required type="text" value={newSet.icon} onChange={e => setNewSet({ ...newSet, icon: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg)', color: 'var(--text-h)', textAlign: 'center', fontSize: '1rem', outline: 'none' }} />
 </div>
 </div>

 {newSet.setType === 'COURSE' && (
 <div style={{ display: 'flex', gap: '10px' }}>
 <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
 <label style={{ fontSize: '0.78rem', color: 'var(--text-h)', fontWeight: 600 }}>COURSE CODE</label>
 <input type="text" value={newSet.courseCode} onChange={e => setNewSet({ ...newSet, courseCode: e.target.value })} placeholder="e.g. CLT 301" style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg)', color: 'var(--text-h)', fontSize: '0.85rem' }} />
 </div>
 <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
 <label style={{ fontSize: '0.78rem', color: 'var(--text-h)', fontWeight: 600 }}>SEMESTER</label>
 <input type="text" value={newSet.semester} onChange={e => setNewSet({ ...newSet, semester: e.target.value })} placeholder="Fall 2026" style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg)', color: 'var(--text-h)', fontSize: '0.85rem' }} />
 </div>
 </div>
 )}

 {newSet.setType === 'CUSTOM_TAG' && (
 <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
 <label style={{ fontSize: '0.78rem', color: 'var(--text-h)', fontWeight: 600 }}>TARGET TAG (#)</label>
 <input type="text" value={newSet.targetTag} onChange={e => setNewSet({ ...newSet, targetTag: e.target.value })} placeholder="#MauMauUprising" style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg)', color: 'var(--text-h)', fontSize: '0.85rem' }} />
 </div>
 )}

 <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
 <label style={{ fontSize: '0.78rem', color: 'var(--text-h)', fontWeight: 600, textTransform: 'uppercase' }}>DESCRIPTION</label>
 <textarea rows="3" value={newSet.description} onChange={e => setNewSet({ ...newSet, description: e.target.value })} placeholder="Describe the purpose or study goals of this set..." style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg)', color: 'var(--text-h)', fontSize: '0.85rem', outline: 'none' }} />
 </div>

 <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
 <button type="button" onClick={() => setShowCreateModal(false)} style={{ padding: '8px 14px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
 <button type="submit" style={{ padding: '8px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Create Collection</button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* ----------------- ADD BOOK ITEM TO SET MODAL ----------------- */}
 {showAddItemModal && selectedSet && (
 <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, backdropFilter: 'blur(4px)' }}>
 <div className="manual-book-panel-inner animate-slide-down" style={{ width: '440px', maxWidth: '92%', margin: 0, background: 'var(--social-bg)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
 
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
 <h3 style={{ margin: 0, color: 'var(--text-h)' }}>+ Add Book to {selectedSet.name}</h3>
 <button type="button" onClick={() => setShowAddItemModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '1.1rem', cursor: 'pointer' }}>X</button>
 </div>

 <form onSubmit={handleAddItemToSet} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
 <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
 <label style={{ fontSize: '0.78rem', color: 'var(--text-h)', fontWeight: 600 }}>SELECT BOOK FROM CATALOG *</label>
 <select
 required
 value={newItem.bookMasterId}
 onChange={e => setNewItem({ ...newItem, bookMasterId: e.target.value })}
 style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg)', color: 'var(--text-h)', fontSize: '0.85rem', outline: 'none' }}
 >
 <option value="">-- Choose a Title --</option>
 {books.map(b => (
 <option key={b.bookMasterId} value={b.bookMasterId}>
 {b.editions && b.editions.length > 0 ? b.editions[0].title : `Book #${b.bookMasterId}`} ({b.originalAuthor})
 </option>
 ))}
 </select>
 </div>

 <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
 <label style={{ fontSize: '0.78rem', color: 'var(--text-h)', fontWeight: 600 }}>TEXT REQUIREMENT TYPE</label>
 <select
 value={newItem.itemType}
 onChange={e => setNewItem({ ...newItem, itemType: e.target.value })}
 style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg)', color: 'var(--text-h)', fontSize: '0.85rem' }}
 >
 <option value="REQUIRED"> Required Core Syllabus Reading</option>
 <option value="SUPPLEMENTARY"> Supplementary Reference Text</option>
 <option value="PAIRED_ORIGINAL"> Original Language Edition</option>
 <option value="PAIRED_TRANSLATION"> Translation / Companion Track</option>
 </select>
 </div>

 <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
 <label style={{ fontSize: '0.78rem', color: 'var(--text-h)', fontWeight: 600 }}>SYLLABUS & EXAM PREP NOTES</label>
 <textarea
 rows="3"
 value={newItem.syllabusNotes}
 onChange={e => setNewItem({ ...newItem, syllabusNotes: e.target.value })}
 placeholder="e.g. Focus on Chapter 3 & 7 for term paper on social stratification..."
 style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg)', color: 'var(--text-h)', fontSize: '0.85rem' }}
 />
 </div>

 <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
 <button type="button" onClick={() => setShowAddItemModal(false)} style={{ padding: '8px 14px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
 <button type="submit" style={{ padding: '8px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Add Book</button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* ----------------- JOIN / IMPORT VIA SHARE CODE MODAL ----------------- */}
 {showJoinModal && (
 <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, backdropFilter: 'blur(4px)' }}>
 <div className="manual-book-panel-inner animate-slide-down" style={{ width: '480px', maxWidth: '92%', margin: 0, background: 'var(--social-bg)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
 
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
 <h3 style={{ margin: 0, color: 'var(--text-h)' }}> Join / Import Shared Collection</h3>
 <button type="button" onClick={() => setShowJoinModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '1.1rem', cursor: 'pointer' }}>X</button>
 </div>

 <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: 0, marginBottom: '16px' }}>
 Enter a Share Code provided by an instructor, study group lead, or peer (e.g., <code>SHARE-COMPLIT-GROUP1</code> or <code>SHARE-CLT301-A79</code>).
 </p>

 <form onSubmit={handleLookupShareCode} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
 <input
 required
 type="text"
 value={inputShareCode}
 onChange={e => setInputShareCode(e.target.value)}
 placeholder="Paste Share Code..."
 style={{ flex: 1, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg)', color: 'var(--text-h)', fontSize: '0.9rem', outline: 'none', fontFamily: 'var(--mono)' }}
 />
 <button type="submit" style={{ padding: '10px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
 Verify Code
 </button>
 </form>

 {joinError && (
 <div className="error-message" style={{ fontSize: '0.85rem', marginBottom: '16px' }}>
 {joinError}
 </div>
 )}

 {sharedPreviewSet && (
 <div className="animate-fade-in" style={{ padding: '16px', background: 'var(--bg)', border: '1px solid var(--accent)', borderRadius: '8px', marginBottom: '16px' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
 <span style={{ fontSize: '1.4rem' }}>{sharedPreviewSet.icon}</span>
 <h4 style={{ margin: 0, color: 'var(--text-h)' }}>{sharedPreviewSet.name}</h4>
 <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'var(--accent-bg)', color: 'var(--accent)', borderRadius: '4px', fontWeight: 600 }}>
 {sharedPreviewSet.setType}
 </span>
 </div>
 <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', margin: '0 0 10px 0' }}>
 {sharedPreviewSet.description || "No description provided."}
 </p>
 <div style={{ fontSize: '0.8rem', color: 'var(--text-h)', marginBottom: '12px' }}>
 Includes <strong>{sharedPreviewSet.items ? sharedPreviewSet.items.length : 0} books</strong> & syllabus study notes
 </div>

 <button
 type="button"
 onClick={() => handleImportSharedSet(sharedPreviewSet)}
 style={{ width: '100%', padding: '10px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
 >
 Import & Clone to My Workspace
 </button>
 </div>
 )}

 <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
 <button type="button" onClick={() => setShowJoinModal(false)} style={{ padding: '8px 14px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>Close</button>
 </div>

 </div>
 </div>
 )}

 {/* ----------------- SHARE COLLECTION DIALOG MODAL ----------------- */}
 {showShareModal && shareModalSet && (
 <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3500, backdropFilter: 'blur(4px)' }}>
 <div className="manual-book-panel-inner animate-slide-down" style={{ width: '480px', maxWidth: '92%', margin: 0, background: 'var(--social-bg)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
 
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
 <span style={{ fontSize: '1.4rem' }}>{shareModalSet.icon}</span>
 <h3 style={{ margin: 0, color: 'var(--text-h)' }}>Share Collection</h3>
 </div>
 <button type="button" onClick={() => setShowShareModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '1.1rem', cursor: 'pointer' }}>X</button>
 </div>

 <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: 0, marginBottom: '16px' }}>
 Share <strong>"{shareModalSet.name}"</strong> with study group members, instructors, or peers.
 </p>

 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
 <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
 <label style={{ fontSize: '0.78rem', color: 'var(--text-h)', fontWeight: 600 }}>SHAREABLE WEB LINK</label>
 <div style={{ display: 'flex', gap: '8px' }}>
 <input
 readOnly
 type="text"
 value={`${window.location.origin}/?share=${encodeURIComponent(shareModalSet.shareCode)}`}
 style={{ flex: 1, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg)', color: 'var(--text-h)', fontSize: '0.82rem', fontFamily: 'var(--mono)' }}
 />
 <button
 type="button"
 onClick={(e) => copyShareCode(shareModalSet.shareCode, e)}
 style={{ padding: '8px 14px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}
 >
 Copy Link
 </button>
 </div>
 </div>

 <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
 <label style={{ fontSize: '0.78rem', color: 'var(--text-h)', fontWeight: 600 }}>SHARE CODE (FOR MANUAL JOINING)</label>
 <div style={{ display: 'flex', gap: '8px' }}>
 <input
 readOnly
 type="text"
 value={shareModalSet.shareCode}
 style={{ flex: 1, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg)', color: 'var(--text-h)', fontSize: '0.88rem', fontWeight: 600, fontFamily: 'var(--mono)', letterSpacing: '0.5px' }}
 />
 <button
 type="button"
 onClick={(e) => copyShareCode(shareModalSet.shareCode, e)}
 style={{ padding: '8px 14px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-h)', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}
 >
 Copy Code
 </button>
 </div>
 </div>
 </div>

 <div style={{ background: 'var(--bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '16px' }}>
 Anyone with this code can paste it into <strong> Join via Share Code</strong> to preview and clone this collection into their own workspace.
 </div>

 <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
 <button type="button" onClick={() => setShowShareModal(false)} style={{ padding: '8px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Done</button>
 </div>

 </div>
 </div>
 )}

 </div>
 );
};

export default Collections;
