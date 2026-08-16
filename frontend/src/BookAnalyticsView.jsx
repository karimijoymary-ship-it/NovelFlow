import React, { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { getApiUrl } from './apiConfig';

export default function BookAnalyticsView({ book, onBookUpdated }) {
 const [dna, setDna] = useState({
 dnaComplexity: 50,
 dnaRomance: 50,
 dnaDarkness: 50,
 dnaHumor: 50,
 dnaPacing: 50,
 dnaWorldBuild: 50
 });

 const [customThemeScores, setCustomThemeScores] = useState({});
 const [customTags, setCustomTags] = useState("");
 const [newThemeName, setNewThemeName] = useState("");
 const [newThemeScore, setNewThemeScore] = useState(70);

 const [isSaving, setIsSaving] = useState(false);
 const [message, setMessage] = useState(null);

 useEffect(() => {
 if (book) {
 setDna({
 dnaComplexity: book.dnaComplexity ?? 50,
 dnaRomance: book.dnaRomance ?? 50,
 dnaDarkness: book.dnaDarkness ?? 50,
 dnaHumor: book.dnaHumor ?? 50,
 dnaPacing: book.dnaPacing ?? 50,
 dnaWorldBuild: book.dnaWorldBuild ?? 50
 });

 setCustomTags(book.customTags || "");

 // Parse custom theme scores
 if (book.customThemeScores) {
 try {
 const parsed = JSON.parse(book.customThemeScores);
 setCustomThemeScores(parsed || {});
 } catch (e) {
 setCustomThemeScores({});
 }
 } else if (book.thematicElements) {
 // Fallback: convert comma separated thematicElements to initial score 70 map
 const initialMap = {};
 book.thematicElements.split(',').forEach(t => {
 const trimmed = t.trim();
 if (trimmed) initialMap[trimmed] = 70;
 });
 setCustomThemeScores(initialMap);
 } else {
 setCustomThemeScores({});
 }
 }
 }, [book]);

 const handleSliderChange = (val, name) => {
 setDna(prev => ({
 ...prev,
 [name]: val
 }));
 };

 const handleCustomThemeScoreChange = (themeName, val) => {
 setCustomThemeScores(prev => ({
 ...prev,
 [themeName]: val
 }));
 };

 const handleAddCustomTheme = (themeNameInput, scoreInput = 70) => {
 const trimmed = (themeNameInput || newThemeName).trim();
 if (!trimmed) return;

 setCustomThemeScores(prev => ({
 ...prev,
 [trimmed]: scoreInput
 }));

 setNewThemeName("");
 setNewThemeScore(70);
 };

 const handleRemoveCustomTheme = (themeName) => {
 setCustomThemeScores(prev => {
 const updated = { ...prev };
 delete updated[themeName];
 return updated;
 });
 };

 const handleSave = (e) => {
 e.preventDefault();
 setIsSaving(true);

 const thematicElementsList = Object.keys(customThemeScores).join(', ');
 const serializedScores = JSON.stringify(customThemeScores);

 fetch(getApiUrl(`/api/books/${book.bookMasterId}/dna`), {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 ...dna,
 customTags,
 thematicElements: thematicElementsList,
 customThemeScores: serializedScores
 })
 })
 .then(res => res.json())
 .then(updatedBook => {
 setMessage('DNA Breakdown & Theme Sliders saved successfully!');
 setIsSaving(false);
 if (onBookUpdated) onBookUpdated(updatedBook);
 setTimeout(() => setMessage(null), 3000);
 })
 .catch(err => {
 console.error(err);
 setIsSaving(false);
 });
 };

 if (!book) return null;

 const parseTags = (tagStr) => {
 if (!tagStr) return [];
 return tagStr
 .split(',')
 .map(t => t.trim())
 .filter(t => t.length > 0)
 .map(t => t.startsWith('#') ? t : `#${t}`);
 };

 const currentTagList = parseTags(customTags);
 const customThemeEntries = Object.entries(customThemeScores);

 const toggleQuickTag = (tagLabel) => {
 const rawTag = tagLabel.replace('#', '');
 const existing = customTags.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0);
 if (existing.includes(rawTag.toLowerCase())) {
 const updated = customTags
 .split(',')
 .map(t => t.trim())
 .filter(t => t.toLowerCase() !== rawTag.toLowerCase())
 .join(', ');
 setCustomTags(updated);
 } else {
 const updated = customTags.trim() 
 ? `${customTags.trim()}, ${rawTag}` 
 : rawTag;
 setCustomTags(updated);
 }
 };

 // Base 6 metrics
 const baseChartData = [
 { subject: 'Complexity', A: dna.dnaComplexity, fullMark: 100, formKey: 'dnaComplexity', isCustom: false },
 { subject: 'Romance', A: dna.dnaRomance, fullMark: 100, formKey: 'dnaRomance', isCustom: false },
 { subject: 'Darkness', A: dna.dnaDarkness, fullMark: 100, formKey: 'dnaDarkness', isCustom: false },
 { subject: 'Humor', A: dna.dnaHumor, fullMark: 100, formKey: 'dnaHumor', isCustom: false },
 { subject: 'Pacing', A: dna.dnaPacing, fullMark: 100, formKey: 'dnaPacing', isCustom: false },
 { subject: 'World-build', A: dna.dnaWorldBuild, fullMark: 100, formKey: 'dnaWorldBuild', isCustom: false },
 ];

 // Custom themes plotted directly on the Radar Chart
 const customChartData = customThemeEntries.map(([themeName, score]) => ({
 subject: themeName,
 A: score,
 fullMark: 100,
 formKey: null,
 isCustom: true
 }));

 const chartData = [...baseChartData, ...customChartData];

 const SUGGESTED_TAGS = ['#grimdark', '#high-fantasy', '#unreliable-narrator', '#political-satire', '#cyberpunk', '#historical-fiction', '#dystopian'];
 const SUGGESTED_THEMES = ['Existential Isolation', 'Fate vs Free Will', 'Power & Corruption', 'Identity & Alterity', 'Ecological Crisis', 'Colonial Hegemony', 'Moral Ambiguity'];

 return (
 <div className="analytics-container animate-fade-in" style={{ padding: '0 2rem 2rem' }}>

 {message && <div className="success-message">{message}</div>}

 {/* ACADEMIC PROVENANCE & METHODOLOGY TRANSPARENCY CARD */}
 <div style={{ padding: '12px 16px', background: 'var(--social-bg)', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '1.25rem' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-h)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
 Academic Psychographic DNA Methodology
 </span>
 <span style={{ fontSize: '0.75rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
 Human Reviewed + Quantized Vectoring
 </span>
 </div>
 <p style={{ margin: '6px 0 0 0', fontSize: '0.82rem', color: 'var(--text-light)', lineHeight: 1.4 }}>
 Narrative DNA vectors (Complexity, Darkness, Pacing, Worldbuilding, Romance, Humor) are derived from text structural parsing, structural tension metrics, and student/faculty peer review.
 </p>
 </div>

 {/* NARRATIVE DNA METRICS OVERVIEW CARD */}
 <div style={{ background: 'var(--social-bg)', borderRadius: '12px', border: '1px solid var(--border)', padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
 <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
 <h3 style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem', color: 'var(--text-h)', margin: 0 }}>
 Narrative DNA Overview ({chartData.length} Dimensions Plotted)
 </h3>
 <div style={{ display: 'flex', gap: '6px' }}>
 <span style={{ fontSize: '0.78rem', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
 {customThemeEntries.length} Active Theme Sliders
 </span>
 <span style={{ fontSize: '0.78rem', background: 'var(--accent-bg)', color: 'var(--accent)', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
 {currentTagList.length} Active Tags
 </span>
 </div>
 </div>

 {/* RADAR CHART FEATURING BASE METRICS + CUSTOM THEMES */}
 <div style={{ width: '100%', height: 350, maxWidth: '480px' }}>
 <ResponsiveContainer>
 <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
 <PolarGrid stroke="var(--border)" />
 <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text)', fontSize: 12 }} />
 <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
 <Radar name="Book DNA" dataKey="A" stroke="#8b4513" fill="#8b4513" fillOpacity={0.2} strokeWidth={2.5} />
 </RadarChart>
 </ResponsiveContainer>
 </div>

 {/* DNA CORE THEMES VECTOR DISPLAY */}
 <div style={{ width: '100%', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed var(--border)' }}>
 <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#c084fc', fontWeight: 600, marginBottom: '8px' }}>
 Active Custom Theme Sliders in DNA Chart
 </div>
 {customThemeEntries.length === 0 ? (
 <div style={{ fontSize: '0.82rem', color: 'var(--text-light)', fontStyle: 'italic', background: 'var(--bg)', padding: '8px 12px', borderRadius: '6px' }}>
 No custom theme sliders added yet. Use <strong>"Add Custom Theme Slider"</strong> below to add sliders for themes like <em>Existential Isolation</em> or <em>Power & Corruption</em>!
 </div>
 ) : (
 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
 {customThemeEntries.map(([themeName, score]) => (
 <span
 key={themeName}
 style={{
 background: 'rgba(168, 85, 247, 0.15)',
 border: '1px solid rgba(168, 85, 247, 0.4)',
 color: '#c084fc',
 padding: '4px 10px',
 borderRadius: '16px',
 fontSize: '0.82rem',
 fontWeight: 600,
 display: 'inline-flex',
 alignItems: 'center',
 gap: '6px'
 }}
 >
 <span> {themeName}: <strong>{score}</strong></span>
 <span 
 onClick={() => handleRemoveCustomTheme(themeName)}
 style={{ fontSize: '0.75rem', opacity: 0.7, cursor: 'pointer' }}
 title="Remove theme slider"
 >
 X
 </span>
 </span>
 ))}
 </div>
 )}
 </div>

 {/* DNA CUSTOM TAGS METRICS DISPLAY */}
 <div style={{ width: '100%', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--border)' }}>
 <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-light)', fontWeight: 600, marginBottom: '8px' }}>
  DNA Custom Tags Vector
 </div>
 {currentTagList.length === 0 ? (
 <div style={{ fontSize: '0.82rem', color: 'var(--text-light)', fontStyle: 'italic', background: 'var(--bg)', padding: '8px 12px', borderRadius: '6px' }}>
 No custom tags added yet.
 </div>
 ) : (
 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
 {currentTagList.map((tag, idx) => (
 <span
 key={idx}
 onClick={() => toggleQuickTag(tag)}
 style={{
 background: 'var(--accent-bg)',
 border: '1px solid var(--accent-border)',
 color: 'var(--accent)',
 padding: '4px 10px',
 borderRadius: '16px',
 fontSize: '0.82rem',
 fontWeight: 600,
 cursor: 'pointer',
 display: 'inline-flex',
 alignItems: 'center',
 gap: '4px'
 }}
 title="Click to remove tag"
 >
 <span>{tag}</span>
 <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>X</span>
 </span>
 ))}
 </div>
 )}
 </div>

 </div>

 {/* DNA BREAKDOWN & THEMATIC MOTIFS SLIDERS */}
 <div style={{ background: 'var(--social-bg)', borderRadius: '12px', border: '1px solid var(--border)', padding: '1.5rem', marginBottom: '1.5rem' }}>
 <h3 style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem', color: 'var(--text-h)', marginBottom: '1.5rem', textAlign: 'left' }}>
 DNA Breakdown & Thematic Motifs
 </h3>

 <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

 {/* BASE 6 SLIDERS */}
 {baseChartData.map(item => (
 <div key={item.subject} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 40px', alignItems: 'center', gap: '1rem' }}>
 <label style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{item.subject}</label>
 <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
 <input
 type="range"
 min="0" max="100"
 value={item.A}
 onChange={(e) => handleSliderChange(parseInt(e.target.value, 10), item.formKey)}
 style={{ width: '100%', cursor: 'pointer', appearance: 'none', background: 'transparent' }}
 className="dna-range"
 />
 </div>
 <span style={{ fontSize: '0.9rem', color: 'var(--text-h)', textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 600 }}>{item.A}</span>
 </div>
 ))}

 {/* USER-ADDED CUSTOM THEME SLIDERS */}
 {customThemeEntries.length > 0 && (
 <div style={{ paddingTop: '1rem', borderTop: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
 <div style={{ fontSize: '0.8rem', color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
 Custom Theme Sliders (User Added)
 </div>
 {customThemeEntries.map(([themeName, score]) => (
 <div key={themeName} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 40px 30px', alignItems: 'center', gap: '0.75rem' }}>
 <label style={{ fontSize: '0.88rem', color: '#c084fc', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
 <span></span> {themeName}
 </label>
 <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
 <input
 type="range"
 min="0" max="100"
 value={score}
 onChange={(e) => handleCustomThemeScoreChange(themeName, parseInt(e.target.value, 10))}
 style={{ width: '100%', cursor: 'pointer', appearance: 'none', background: 'transparent' }}
 className="dna-range theme-range"
 />
 </div>
 <span style={{ fontSize: '0.9rem', color: '#c084fc', textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 700 }}>{score}</span>
 <button
 type="button"
 onClick={() => handleRemoveCustomTheme(themeName)}
 style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.9rem', cursor: 'pointer', padding: 0 }}
 title="Delete Theme Slider"
 >
 
 </button>
 </div>
 ))}
 </div>
 )}

 {/* + ADD CUSTOM THEME SLIDER FORM */}
 <div style={{ background: 'var(--bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', marginTop: '0.5rem' }}>
 <label style={{ display: 'block', fontSize: '0.85rem', color: '#c084fc', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.5px', fontWeight: 600 }}>
 + Add Theme Slider to DNA Breakdown
 </label>

 <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 120px', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
 <input
 type="text"
 value={newThemeName}
 onChange={e => setNewThemeName(e.target.value)}
 placeholder="e.g. Existential Isolation, Fate vs Free Will"
 style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--social-bg)', color: 'var(--text-h)', fontSize: '0.85rem', outline: 'none' }}
 />
 <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
 <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Level:</span>
 <input
 type="number"
 min="0"
 max="100"
 value={newThemeScore}
 onChange={e => setNewThemeScore(Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)))}
 style={{ width: '55px', padding: '6px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--social-bg)', color: 'var(--text-h)', fontSize: '0.85rem', fontFamily: 'var(--mono)', textAlign: 'center' }}
 />
 </div>
 <button
 type="button"
 onClick={() => handleAddCustomTheme(newThemeName, newThemeScore)}
 style={{ padding: '8px 12px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}
 >
 + Add Slider
 </button>
 </div>

 {/* QUICK ADD SUGGESTED THEME BUTTONS */}
 <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
 <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Quick Add Theme Slider:</span>
 {SUGGESTED_THEMES.map(t => {
 const isAlreadyAdded = customThemeScores.hasOwnProperty(t);
 return (
 <button
 key={t}
 type="button"
 onClick={() => {
 if (isAlreadyAdded) {
 handleRemoveCustomTheme(t);
 } else {
 handleAddCustomTheme(t, 75);
 }
 }}
 style={{
 padding: '3px 8px',
 borderRadius: '12px',
 border: isAlreadyAdded ? '1px solid #a855f7' : '1px solid var(--border)',
 background: isAlreadyAdded ? 'rgba(168, 85, 247, 0.25)' : 'var(--social-bg)',
 color: isAlreadyAdded ? '#c084fc' : 'var(--text)',
 fontSize: '0.75rem',
 cursor: 'pointer',
 fontWeight: isAlreadyAdded ? 600 : 400
 }}
 >
 {isAlreadyAdded ? ' ' : '+ '} {t}
 </button>
 );
 })}
 </div>
 </div>

 {/* CUSTOM TAGS INPUT */}
 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', paddingTop: '1rem', borderTop: '1px dashed var(--border)' }}>
 <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-h)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>Custom Tags</label>
 <input
 type="text"
 value={customTags}
 onChange={e => setCustomTags(e.target.value)}
 placeholder="e.g. grimdark, high-fantasy, unreliable-narrator"
 style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', outline: 'none', marginBottom: '8px' }}
 />
 
 <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
 <span style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>Quick Add Tag:</span>
 {SUGGESTED_TAGS.map(t => {
 const raw = t.replace('#', '');
 const isActive = customTags.toLowerCase().includes(raw.toLowerCase());
 return (
 <button
 key={t}
 type="button"
 onClick={() => toggleQuickTag(t)}
 style={{
 padding: '3px 8px',
 borderRadius: '12px',
 border: isActive ? '1px solid var(--accent)' : '1px solid var(--border)',
 background: isActive ? 'var(--accent)' : 'var(--bg)',
 color: isActive ? '#fff' : 'var(--text)',
 fontSize: '0.75rem',
 cursor: 'pointer'
 }}
 >
 {isActive ? ' ' : '+ '}{t}
 </button>
 );
 })}
 </div>
 </div>

 <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
 <button type="submit" className="btn-primary" disabled={isSaving}>
 {isSaving ? 'Saving...' : 'Save Book Analytics'}
 </button>
 </div>
 </form>
 </div>

 <style>{`
 .dna-range::-webkit-slider-thumb {
 -webkit-appearance: none;
 height: 16px;
 width: 16px;
 border-radius: 50%;
 background: #8b4513;
 cursor: pointer;
 margin-top: -6px;
 }
 .theme-range::-webkit-slider-thumb {
 background: #a855f7 !important;
 }
 .dna-range::-webkit-slider-runnable-track {
 width: 100%;
 height: 4px;
 cursor: pointer;
 background: var(--border);
 border-radius: 2px;
 }
 `}</style>

 </div>
 );
}
