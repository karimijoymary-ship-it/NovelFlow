import React, { useState, useEffect } from 'react';

const HIGHLIGHT_COLORS = [
 { name: 'Yellow', code: '#fef08a', textCode: '#713f12', borderCode: '#fde047' },
 { name: 'Green', code: '#bbf7d0', textCode: '#14532d', borderCode: '#86efac' },
 { name: 'Blue', code: '#bfdbfe', textCode: '#1e3a8a', borderCode: '#93c5fd' },
 { name: 'Pink', code: '#fbcfe8', textCode: '#831843', borderCode: '#f9a8d4' },
 { name: 'Purple', code: '#e9d5ff', textCode: '#581c87', borderCode: '#d8b4fe' }
];

const DEFAULT_SAVED_ITEMS = [
 {
 id: 'save_1',
 category: 'PASSAGE', // PASSAGE, SNAPSHOT, ANNOTATION
 bookTitle: 'The Great Gatsby',
 pageNumber: 'Page 42, Chapter 3',
 quoteText: 'In his blue gardens men and girls came and went like moths among the whisperings and the champagne and the stars.',
 notes: 'Key atmospheric quotation illustrating Jazz Age extravagance and illusion.',
 highlightColor: '#fef08a',
 highlightTextColor: '#713f12',
 screenshotUrl: '',
 createdAt: new Date().toISOString()
 },
 {
 id: 'save_2',
 category: 'SNAPSHOT',
 bookTitle: 'Dune',
 pageNumber: 'Character Relationship Web',
 quoteText: 'Messiah Archetype Matrix: Paul Atreides ↔ Baron Harkonnen (Adversary)',
 notes: 'Graph node breakdown mapped for mid-term comparative literature exam.',
 highlightColor: '#bfdbfe',
 highlightTextColor: '#1e3a8a',
 screenshotUrl: '',
 createdAt: new Date().toISOString()
 },
 {
 id: 'save_3',
 category: 'ANNOTATION',
 bookTitle: 'Nineteen Eighty-Four',
 pageNumber: 'Page 108, Chapter 7',
 quoteText: 'Freedom is the freedom to say that two plus two make four.',
 notes: 'Margin commentary on epistemological totalization and Newspeak control.',
 highlightColor: '#fbcfe8',
 highlightTextColor: '#831843',
 screenshotUrl: '',
 createdAt: new Date().toISOString()
 }
];

const SavedPages = () => {
 const [items, setItems] = useState(() => {
 const saved = localStorage.getItem('novelflow_saved_pages');
 return saved ? JSON.parse(saved) : DEFAULT_SAVED_ITEMS;
 });

 const [activeCategory, setActiveCategory] = useState('ALL'); // ALL, PASSAGE, SNAPSHOT, ANNOTATION
 const [showAddModal, setShowAddModal] = useState(false);
 const [selectedImageModal, setSelectedImageModal] = useState(null);
 const [catalogBooks, setCatalogBooks] = useState([]);

 // Form State
 const [formData, setFormData] = useState({
 category: 'PASSAGE',
 bookTitle: 'The Great Gatsby',
 pageNumber: '',
 quoteText: '',
 notes: '',
 highlightColor: '#fef08a',
 highlightTextColor: '#713f12',
 screenshotUrl: ''
 });

 useEffect(() => {
 localStorage.setItem('novelflow_saved_pages', JSON.stringify(items));
 }, [items]);

 useEffect(() => {
 fetch('/api/books')
 .then(res => res.json())
 .then(data => {
 if (data && data.length > 0) {
 setCatalogBooks(data);
 const firstTitle = data[0].editions && data[0].editions.length > 0 
 ? data[0].editions[0].title 
 : `Book #${data[0].bookMasterId}`;
 setFormData(prev => ({ ...prev, bookTitle: firstTitle }));
 }
 })
 .catch(err => console.error("Failed to fetch catalog books", err));
 }, []);

 const handleImageUpload = (e) => {
 const file = e.target.files[0];
 if (file) {
 const reader = new FileReader();
 reader.onloadend = () => {
 setFormData(prev => ({ ...prev, screenshotUrl: reader.result }));
 };
 reader.readAsDataURL(file);
 }
 };

 const handleAddItem = (e) => {
 e.preventDefault();
 const newItem = {
 id: 'save_' + Date.now(),
 ...formData,
 createdAt: new Date().toISOString()
 };
 setItems([newItem, ...items]);
 setShowAddModal(false);
 // Reset Form
 setFormData({
 category: 'PASSAGE',
 bookTitle: catalogBooks.length > 0 && catalogBooks[0].editions ? catalogBooks[0].editions[0].title : 'The Great Gatsby',
 pageNumber: '',
 quoteText: '',
 notes: '',
 highlightColor: '#fef08a',
 highlightTextColor: '#713f12',
 screenshotUrl: ''
 });
 };

 const handleDeleteItem = (id) => {
 if (window.confirm("Are you sure you want to delete this saved entry?")) {
 setItems(items.filter(item => item.id !== id));
 }
 };

 const filteredItems = items.filter(item => activeCategory === 'ALL' || item.category === activeCategory);

 const getCategoryBadge = (cat) => {
 switch (cat) {
 case 'PASSAGE':
 return { label: ' Bookmarked Passage', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' };
 case 'SNAPSHOT':
 return { label: ' Character Web Snapshot', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' };
 case 'ANNOTATION':
 return { label: ' Personal Study Annotation', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
 default:
 return { label: ' Saved Item', color: 'var(--text-h)', bg: 'var(--code-bg)' };
 }
 };

 return (
 <div className="main-content saved-pages-view animate-fade-in" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
 
 {/* Header */}
 <header className="book-header" style={{ borderBottom: 'none', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 <div className="book-header-left">
 <h1 style={{ margin: 0, fontSize: '2.2rem', color: 'var(--text-h)' }}>Saved Pages & Mentions</h1>
 <div className="author-by" style={{ color: 'var(--text-light)', marginTop: '0.25rem', fontSize: '0.95rem' }}>
 Micro-level bookmarks, text highlights, margin annotations, and visual graph screenshots.
 </div>
 </div>
 <button
 type="button"
 onClick={() => setShowAddModal(true)}
 style={{ padding: '0.75rem 1.4rem', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}
 >
 + Add Highlight & Screenshot
 </button>
 </header>

 {/* 3 Active Categories Overview Bar */}
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
 
 {/* Bookmarked Passages */}
 <div 
 onClick={() => setActiveCategory('PASSAGE')}
 style={{ 
 padding: '1.25rem', 
 background: 'var(--social-bg)', 
 borderRadius: '12px', 
 border: activeCategory === 'PASSAGE' ? '2px solid #3b82f6' : '1px solid var(--border)',
 cursor: 'pointer',
 transition: 'all 0.2s'
 }}
 >
 <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
 <span style={{ fontSize: '1.6rem' }}></span>
 <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-h)' }}>Bookmarked Passages</h3>
 </div>
 <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', margin: '0 0 8px 0' }}>
 Highlighted quotes, key page citations, and color-coded text excerpts.
 </p>
 <div style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 600 }}>
 {items.filter(i => i.category === 'PASSAGE').length} Saved Passages
 </div>
 </div>

 {/* Character Web Snapshots */}
 <div 
 onClick={() => setActiveCategory('SNAPSHOT')}
 style={{ 
 padding: '1.25rem', 
 background: 'var(--social-bg)', 
 borderRadius: '12px', 
 border: activeCategory === 'SNAPSHOT' ? '2px solid #a855f7' : '1px solid var(--border)',
 cursor: 'pointer',
 transition: 'all 0.2s'
 }}
 >
 <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
 <span style={{ fontSize: '1.6rem' }}></span>
 <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-h)' }}>Character Web Snapshots</h3>
 </div>
 <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', margin: '0 0 8px 0' }}>
 Saved relationship matrices and visual node network screenshots.
 </p>
 <div style={{ fontSize: '0.8rem', color: '#a855f7', fontWeight: 600 }}>
 {items.filter(i => i.category === 'SNAPSHOT').length} Saved Snapshots
 </div>
 </div>

 {/* Personal Study Annotations */}
 <div 
 onClick={() => setActiveCategory('ANNOTATION')}
 style={{ 
 padding: '1.25rem', 
 background: 'var(--social-bg)', 
 borderRadius: '12px', 
 border: activeCategory === 'ANNOTATION' ? '2px solid #10b981' : '1px solid var(--border)',
 cursor: 'pointer',
 transition: 'all 0.2s'
 }}
 >
 <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
 <span style={{ fontSize: '1.6rem' }}></span>
 <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-h)' }}>Personal Study Annotations</h3>
 </div>
 <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', margin: '0 0 8px 0' }}>
 Sticky notes, term paper quotes, and page margin comments.
 </p>
 <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>
 {items.filter(i => i.category === 'ANNOTATION').length} Saved Annotations
 </div>
 </div>

 </div>

 {/* Category Filter Pills */}
 <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
 {[
 { id: 'ALL', label: 'All Items' },
 { id: 'PASSAGE', label: ' Bookmarked Passages' },
 { id: 'SNAPSHOT', label: ' Character Snapshots' },
 { id: 'ANNOTATION', label: ' Study Annotations' }
 ].map(cat => (
 <button
 key={cat.id}
 type="button"
 onClick={() => setActiveCategory(cat.id)}
 style={{
 padding: '6px 14px',
 borderRadius: '20px',
 border: activeCategory === cat.id ? '1px solid var(--accent)' : '1px solid var(--border)',
 background: activeCategory === cat.id ? 'var(--accent)' : 'var(--bg)',
 color: activeCategory === cat.id ? '#fff' : 'var(--text-h)',
 cursor: 'pointer',
 fontSize: '0.85rem',
 fontWeight: 500
 }}
 >
 {cat.label}
 </button>
 ))}
 </div>

 {/* Saved Items Feed */}
 <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
 {filteredItems.length === 0 ? (
 <div className="empty-state-mini" style={{ padding: '3rem', textAlign: 'center', background: 'var(--social-bg)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
 No saved items in this category yet. Click <strong>"+ Add Highlight & Screenshot"</strong> above to create your first entry!
 </div>
 ) : (
 filteredItems.map(item => {
 const badge = getCategoryBadge(item.category);
 return (
 <div 
 key={item.id} 
 className="animate-fade-in" 
 style={{ 
 padding: '1.5rem', 
 background: 'var(--social-bg)', 
 border: '1px solid var(--border)', 
 borderRadius: '12px',
 display: 'flex',
 flexDirection: 'column',
 gap: '12px'
 }}
 >
 {/* Header info */}
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
 <span style={{ fontSize: '0.78rem', padding: '3px 10px', borderRadius: '12px', background: badge.bg, color: badge.color, fontWeight: 600 }}>
 {badge.label}
 </span>
 <strong style={{ color: 'var(--text-h)', fontSize: '1rem' }}>{item.bookTitle}</strong>
 {item.pageNumber && (
 <span style={{ fontSize: '0.82rem', background: 'var(--code-bg)', color: 'var(--text-light)', padding: '2px 8px', borderRadius: '4px', fontFamily: 'var(--mono)' }}>
 {item.pageNumber}
 </span>
 )}
 </div>

 <button
 type="button"
 onClick={() => handleDeleteItem(item.id)}
 style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.85rem', cursor: 'pointer' }}
 title="Delete Entry"
 >
  Delete
 </button>
 </div>

 {/* Highlighted Quote / Passage */}
 {item.quoteText && (
 <div 
 style={{ 
 padding: '12px 16px', 
 background: item.highlightColor || '#fef08a', 
 color: item.highlightTextColor || '#713f12', 
 borderRadius: '8px', 
 fontSize: '0.95rem', 
 lineHeight: '1.5',
 fontWeight: 500,
 boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
 }}
 >
 "{item.quoteText}"
 </div>
 )}

 {/* Notes */}
 {item.notes && (
 <div style={{ color: 'var(--text)', fontSize: '0.9rem', lineHeight: '1.5' }}>
 <strong>Note:</strong> {item.notes}
 </div>
 )}

 {/* Screenshot Image Attachment */}
 {item.screenshotUrl && (
 <div style={{ marginTop: '8px' }}>
 <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '6px', fontWeight: 600 }}>
  Attached Screenshot:
 </div>
 <img 
 src={item.screenshotUrl} 
 alt="Saved Page Screenshot" 
 onClick={() => setSelectedImageModal(item.screenshotUrl)}
 style={{ 
 maxHeight: '220px', 
 maxWidth: '100%', 
 objectFit: 'contain', 
 borderRadius: '8px', 
 border: '1px solid var(--border)',
 cursor: 'pointer',
 background: '#000'
 }}
 title="Click to view full screenshot"
 />
 </div>
 )}
 </div>
 );
 })
 )}
 </div>

 {/* ----------------- ADD HIGHLIGHT & SCREENSHOT MODAL ----------------- */}
 {showAddModal && (
 <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, backdropFilter: 'blur(4px)' }}>
 <div className="manual-book-panel-inner animate-slide-down" style={{ width: '520px', maxWidth: '92%', margin: 0, background: 'var(--social-bg)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
 
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
 <h3 style={{ margin: 0, color: 'var(--text-h)' }}>+ Add Highlight & Screenshot</h3>
 <button type="button" onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '1.1rem', cursor: 'pointer' }}>X</button>
 </div>

 <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
 
 <div style={{ display: 'flex', gap: '10px' }}>
 <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
 <label style={{ fontSize: '0.78rem', color: 'var(--text-h)', fontWeight: 600 }}>CATEGORY *</label>
 <select
 value={formData.category}
 onChange={e => setFormData({ ...formData, category: e.target.value })}
 style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg)', color: 'var(--text-h)', fontSize: '0.85rem' }}
 >
 <option value="PASSAGE"> Bookmarked Passage</option>
 <option value="SNAPSHOT"> Character Web Snapshot</option>
 <option value="ANNOTATION"> Personal Study Annotation</option>
 </select>
 </div>

 <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
 <label style={{ fontSize: '0.78rem', color: 'var(--text-h)', fontWeight: 600 }}>BOOK TITLE *</label>
 {catalogBooks.length > 0 ? (
 <select
 value={formData.bookTitle}
 onChange={e => setFormData({ ...formData, bookTitle: e.target.value })}
 style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg)', color: 'var(--text-h)', fontSize: '0.85rem' }}
 >
 {catalogBooks.map(b => {
 const title = b.editions && b.editions.length > 0 ? b.editions[0].title : `Book #${b.bookMasterId}`;
 return <option key={b.bookMasterId} value={title}>{title}</option>;
 })}
 </select>
 ) : (
 <input
 type="text"
 value={formData.bookTitle}
 onChange={e => setFormData({ ...formData, bookTitle: e.target.value })}
 placeholder="e.g. The Great Gatsby"
 style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg)', color: 'var(--text-h)', fontSize: '0.85rem' }}
 />
 )}
 </div>
 </div>

 <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
 <label style={{ fontSize: '0.78rem', color: 'var(--text-h)', fontWeight: 600 }}>PAGE / LOCATION REFERENCE</label>
 <input
 type="text"
 value={formData.pageNumber}
 onChange={e => setFormData({ ...formData, pageNumber: e.target.value })}
 placeholder="e.g. Page 84, Chapter 4"
 style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg)', color: 'var(--text-h)', fontSize: '0.85rem' }}
 />
 </div>

 {/* Text Passage to Highlight */}
 <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
 <label style={{ fontSize: '0.78rem', color: 'var(--text-h)', fontWeight: 600 }}>TEXT PASSAGE / QUOTE TO HIGHLIGHT *</label>
 <textarea
 required
 rows="3"
 value={formData.quoteText}
 onChange={e => setFormData({ ...formData, quoteText: e.target.value })}
 placeholder="Enter or paste passage quote to highlight..."
 style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg)', color: 'var(--text-h)', fontSize: '0.85rem' }}
 />
 </div>

 {/* Highlight Color Marker Selection */}
 <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
 <label style={{ fontSize: '0.78rem', color: 'var(--text-h)', fontWeight: 600 }}>HIGHLIGHT MARKER COLOR</label>
 <div style={{ display: 'flex', gap: '10px' }}>
 {HIGHLIGHT_COLORS.map(c => (
 <button
 key={c.name}
 type="button"
 onClick={() => setFormData({ ...formData, highlightColor: c.code, highlightTextColor: c.textCode })}
 style={{
 flex: 1,
 padding: '6px',
 borderRadius: '6px',
 border: formData.highlightColor === c.code ? '2px solid var(--accent)' : `1px solid ${c.borderCode}`,
 background: c.code,
 color: c.textCode,
 fontWeight: 600,
 fontSize: '0.75rem',
 cursor: 'pointer'
 }}
 >
 {c.name}
 </button>
 ))}
 </div>
 </div>

 {/* Personal Notes */}
 <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
 <label style={{ fontSize: '0.78rem', color: 'var(--text-h)', fontWeight: 600 }}>STUDY NOTES / ANNOTATION</label>
 <textarea
 rows="2"
 value={formData.notes}
 onChange={e => setFormData({ ...formData, notes: e.target.value })}
 placeholder="Add margin commentary or exam notes..."
 style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg)', color: 'var(--text-h)', fontSize: '0.85rem' }}
 />
 </div>

 {/* Screenshot Attachment */}
 <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
 <label style={{ fontSize: '0.78rem', color: 'var(--text-h)', fontWeight: 600 }}>UPLOAD PAGE OR GRAPH SCREENSHOT</label>
 <input
 type="file"
 accept="image/*"
 onChange={handleImageUpload}
 style={{ padding: '6px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.82rem' }}
 />
 {formData.screenshotUrl && (
 <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
 <img src={formData.screenshotUrl} alt="Preview" style={{ height: '40px', borderRadius: '4px', border: '1px solid var(--border)' }} />
 <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}> Image attached</span>
 </div>
 )}
 </div>

 <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
 <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '8px 14px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
 <button type="submit" style={{ padding: '8px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Save Entry</button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* Lightbox Modal for Full Screenshots */}
 {selectedImageModal && (
 <div onClick={() => setSelectedImageModal(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000, cursor: 'pointer' }}>
 <img src={selectedImageModal} alt="Enlarged Screenshot" style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} />
 </div>
 )}

 </div>
 );
};

export default SavedPages;
