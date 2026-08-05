import React, { useState, useEffect } from 'react';

export default function CharacterWebMatrix({ bookId, synopsis }) {
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hoveredNodeId, setHoveredNodeId] = useState(null);

    // Form states
    const [sourceId, setSourceId] = useState('');
    const [targetId, setTargetId] = useState('');
    const [relType, setRelType] = useState('Ally');
    const [submitting, setSubmitting] = useState(false);
    const [formMessage, setFormMessage] = useState(null);

    const [newCharName, setNewCharName] = useState('');
    const [newCharArchetype, setNewCharArchetype] = useState('Supporting');
    const [deleteCharId, setDeleteCharId] = useState('');

    const fetchNetwork = () => {
        setLoading(true);
        setError(null);
        fetch(`/api/books/${bookId}/network`)
            .then(res => {
                if (!res.ok) throw new Error("Failed to load character network.");
                return res.json();
            })
            .then(data => {
                setGraphData(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    };

    useEffect(() => {
        if (bookId) {
            fetchNetwork();
            setSourceId('');
            setTargetId('');
            setFormMessage(null);
        }
    }, [bookId]);

    const handleRelationshipSubmit = (e) => {
        e.preventDefault();
        if (!sourceId || !targetId) {
            setFormMessage("Please select both source and target characters.");
            return;
        }
        if (sourceId === targetId) {
            setFormMessage("Cannot create a relationship with the same character.");
            return;
        }
        setSubmitting(true);
        setFormMessage(null);

        fetch(`/api/books/${bookId}/relationships`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sourceCharacterId: sourceId,
                targetCharacterId: targetId,
                relationshipType: relType
            })
        })
            .then(res => {
                if (!res.ok) throw new Error("Failed to save relationship.");
                return res.text();
            })
            .then(() => {
                setSubmitting(false);
                setFormMessage(`Relationship successfully updated!`);
                fetchNetwork(); // Refresh graph
                setTimeout(() => setFormMessage(null), 3000);
            })
            .catch(err => {
                setSubmitting(false);
                setFormMessage(`Error: ${err.message}`);
            });
    };

    const handleCharacterAdd = (e) => {
        e.preventDefault();
        const trimmed = newCharName.trim();
        if (!trimmed) {
            setFormMessage("Please specify a character name.");
            return;
        }
        setSubmitting(true);
        setFormMessage(null);

        fetch(`/api/books/${bookId}/characters`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                characterName: trimmed,
                thematicArchetype: newCharArchetype
            })
        })
            .then(res => {
                if (!res.ok) throw new Error("Failed to add character.");
                return res.json();
            })
            .then(() => {
                setSubmitting(false);
                setNewCharName('');
                setNewCharArchetype('Supporting');
                setFormMessage(`Character "${trimmed}" successfully added!`);
                fetchNetwork(); // Refresh graph
                setTimeout(() => setFormMessage(null), 3000);
            })
            .catch(err => {
                setSubmitting(false);
                setFormMessage(`Error: ${err.message}`);
            });
    };

    const handleCharacterDelete = (e) => {
        e.preventDefault();
        if (!deleteCharId) {
            setFormMessage("Please select a character to delete.");
            return;
        }

        const targetChar = nodes.find(n => n.characterId === deleteCharId);
        const displayName = targetChar ? targetChar.characterName : 'Character';

        if (!window.confirm(`Are you sure you want to delete "${displayName}"? This will also delete all of their relationships.`)) {
            return;
        }

        setSubmitting(true);
        setFormMessage(null);

        fetch(`/api/books/${bookId}/characters/${deleteCharId}`, {
            method: 'DELETE'
        })
            .then(res => {
                if (!res.ok) throw new Error("Failed to delete character.");
                return res.json();
            })
            .then(() => {
                setSubmitting(false);
                setDeleteCharId('');
                setFormMessage(`Character "${displayName}" and relationships deleted!`);
                fetchNetwork(); // Refresh graph
                setTimeout(() => setFormMessage(null), 3000);
            })
            .catch(err => {
                setSubmitting(false);
                setFormMessage(`Error: ${err.message}`);
            });
    };

    const { nodes, links } = graphData;

    // Premium Color Palette
    const COLORS = [
        '#3b82f6', // blue
        '#10b981', // emerald
        '#8b5cf6', // violet
        '#f59e0b', // amber
        '#ec4899', // pink
        '#06b6d4', // cyan
        '#f43f5e', // rose
        '#14b8a6', // teal
    ];

    // Select the central node: Protagonist or highest degree
    let centerNode = null;
    if (nodes && nodes.length > 0) {
        centerNode = nodes.find(n => n.thematicArchetype && n.thematicArchetype.toLowerCase().includes('protagonist'));
        if (!centerNode) {
            let maxLinks = -1;
            nodes.forEach(n => {
                const count = links.filter(l => l.sourceCharacter.characterId === n.characterId || l.targetCharacter.characterId === n.characterId).length;
                if (count > maxLinks) {
                    maxLinks = count;
                    centerNode = n;
                }
            });
        }
        if (!centerNode) centerNode = nodes[0];
    }

    const width = 600;
    const height = 450;
    const cx = width / 2;
    const cy = height / 2;
    const radius = 150;

    const nodePositions = {};
    const nodeColors = {};

    if (nodes && nodes.length > 0) {
        // Center node
        nodePositions[centerNode.characterId] = { x: cx, y: cy };
        nodeColors[centerNode.characterId] = COLORS[0];

        // Surrounding circular nodes
        const surrounding = nodes.filter(n => n.characterId !== centerNode.characterId);
        surrounding.forEach((node, index) => {
            const angle = (index * 2 * Math.PI) / surrounding.length;
            nodePositions[node.characterId] = {
                x: cx + radius * Math.cos(angle),
                y: cy + radius * Math.sin(angle)
            };
            nodeColors[node.characterId] = COLORS[(index + 1) % COLORS.length];
        });
    }

    // Render connection lines
    const linkElements = links.map((link) => {
        const sourcePos = nodePositions[link.sourceCharacter.characterId];
        const targetPos = nodePositions[link.targetCharacter.characterId];

        if (!sourcePos || !targetPos) return null;

        const isHighlighted = hoveredNodeId === link.sourceCharacter.characterId ||
            hoveredNodeId === link.targetCharacter.characterId;
        const isDimmed = hoveredNodeId && !isHighlighted;

        const midX = (sourcePos.x + targetPos.x) / 2;
        const midY = (sourcePos.y + targetPos.y) / 2;

        return (
            <g key={link.relationshipId}>
                <line
                    x1={sourcePos.x}
                    y1={sourcePos.y}
                    x2={targetPos.x}
                    y2={targetPos.y}
                    className="link-line"
                    style={{
                        stroke: isHighlighted ? 'var(--accent)' : 'var(--border)',
                        strokeWidth: isHighlighted ? '3.5' : '1.5',
                        strokeDasharray: link.relationshipType === 'Adversary' ? '5,5' : 'none',
                        opacity: isDimmed ? 0.15 : isHighlighted ? 1.0 : 0.6,
                        transition: 'all 0.3s ease'
                    }}
                />
                {isHighlighted && (
                    <g transform={`translate(${midX}, ${midY})`}>
                        <rect
                            x="-40"
                            y="-9"
                            width="80"
                            height="18"
                            rx="4"
                            fill="var(--code-bg)"
                            stroke="var(--accent-border)"
                            strokeWidth="1"
                        />
                        <text
                            textAnchor="middle"
                            y="4"
                            fontSize="9px"
                            fontWeight="bold"
                            fill="var(--text-h)"
                        >
                            {link.relationshipType}
                        </text>
                    </g>
                )}
            </g>
        );
    });

    // Render nodes
    const nodeElements = nodes.map((node) => {
        const pos = nodePositions[node.characterId];
        if (!pos) return null;

        const color = nodeColors[node.characterId];
        const isCenter = node.characterId === centerNode.characterId;

        const isHighlighted = hoveredNodeId === node.characterId;
        const isConnected = hoveredNodeId && links.some(l =>
            (l.sourceCharacter.characterId === hoveredNodeId && l.targetCharacter.characterId === node.characterId) ||
            (l.targetCharacter.characterId === hoveredNodeId && l.sourceCharacter.characterId === node.characterId)
        );
        const isDimmed = hoveredNodeId && !isHighlighted && !isConnected;

        // Truncate name to first word to fit in circle
        const displayName = node.characterName.split(' ')[0];

        return (
            <g
                key={node.characterId}
                transform={`translate(${pos.x}, ${pos.y})`}
                onMouseEnter={() => setHoveredNodeId(node.characterId)}
                onMouseLeave={() => setHoveredNodeId(null)}
                style={{ cursor: 'pointer', transition: 'all 0.3s ease', opacity: isDimmed ? 0.35 : 1.0 }}
            >
                {/* Glow ring */}
                {isHighlighted && (
                    <circle
                        r="30"
                        fill="none"
                        stroke={color}
                        strokeWidth="1.5"
                        style={{ opacity: 0.4 }}
                    />
                )}
                {/* Solid Node Circle */}
                <circle
                    r={isCenter ? 26 : 22}
                    fill="var(--bg)"
                    stroke={color}
                    strokeWidth={isCenter ? 3.5 : 2.5}
                />
                {/* Name */}
                <text
                    textAnchor="middle"
                    y="4"
                    fill={color}
                    fontSize={isCenter ? "12px" : "11px"}
                    fontWeight="bold"
                    style={{ pointerEvents: 'none' }}
                >
                    {displayName}
                </text>
                {/* Archetype label below node */}
                <text
                    textAnchor="middle"
                    y="36"
                    fill="var(--text)"
                    fontSize="10px"
                    fontWeight="500"
                    style={{ opacity: 0.8, pointerEvents: 'none' }}
                >
                    {node.thematicArchetype || 'Secondary'}
                </text>
            </g>
        );
    });

    if (loading && nodes.length === 0) {
        return <div className="loading-container"><div className="spinner"></div></div>;
    }

    if (error) {
        return <div className="error-message">Error loading network map: {error}</div>;
    }

    return (
        <div className="network-map-layout">
            {/* Left Graph Panel */}
            <div className="graph-card">
                <h3>Character Network Map</h3>
                {synopsis && (
                    <div style={{ marginBottom: '1.5rem', background: 'var(--bg)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--accent)' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-h)' }}>Book Synopsis</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text)', margin: 0, fontStyle: 'italic', lineHeight: '1.5' }}>
                            "{synopsis}"
                        </p>
                    </div>
                )}
                {nodes.length === 0 ? (
                    <div className="empty-state">
                        <p>No characters cataloged for this book yet.</p>
                    </div>
                ) : (
                    <div className="svg-container">
                        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
                            {linkElements}
                            {nodeElements}
                        </svg>
                    </div>
                )}
            </div>

            {/* Right Form Panel */}
            <div className="relationship-form-card">
                <h3>Manage Relationships</h3>
                <form onSubmit={handleRelationshipSubmit}>
                    <div className="form-group">
                        <label htmlFor="source-select">Source Character</label>
                        <select
                            id="source-select"
                            value={sourceId}
                            onChange={(e) => setSourceId(e.target.value)}
                            required
                        >
                            <option value="">Select character...</option>
                            {nodes.map(n => (
                                <option key={n.characterId} value={n.characterId}>{n.characterName}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="target-select">Target Character</label>
                        <select
                            id="target-select"
                            value={targetId}
                            onChange={(e) => setTargetId(e.target.value)}
                            required
                        >
                            <option value="">Select character...</option>
                            {nodes.map(n => (
                                <option key={n.characterId} value={n.characterId}>{n.characterName}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="relationship-select">Relationship Type</label>
                        <select
                            id="relationship-select"
                            value={relType}
                            onChange={(e) => setRelType(e.target.value)}
                            required
                        >
                            <option value="Ally">Ally</option>
                            <option value="Adversary">Adversary</option>
                            <option value="Love Interest">Love Interest</option>
                            <option value="Mentor">Mentor</option>
                            <option value="Companion">Companion</option>
                            <option value="Family">Family</option>
                            <option value="None">None (Delete Connection)</option>
                        </select>
                    </div>

                    <button type="submit" className="btn-submit-rel" disabled={submitting}>
                        {submitting ? 'Updating...' : 'Apply Relationship'}
                    </button>
                </form>

                {formMessage && (
                    <div className={`status-banner ${formMessage.startsWith('Error') ? 'error' : 'success'}`}>
                        {formMessage}
                    </div>
                )}
            </div>

            {/* Right Form Panel: Manage Characters */}
            <div className="relationship-form-card">
                <h3>Manage Characters</h3>

                {/* Form to Add a Character */}
                <form onSubmit={handleCharacterAdd} style={{ marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
                    <h4 style={{ fontSize: '13px', margin: '0 0 10px 0', color: 'var(--text-h)', fontWeight: '600' }}>Add Character</h4>
                    <div className="form-group">
                        <label htmlFor="char-name-input">Name</label>
                        <input
                            type="text"
                            id="char-name-input"
                            value={newCharName}
                            onChange={(e) => setNewCharName(e.target.value)}
                            placeholder="Character name..."
                            required
                            style={{
                                padding: '10px 14px',
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                                background: 'var(--bg)',
                                color: 'var(--text-h)',
                                fontFamily: 'var(--sans)',
                                fontSize: '14px',
                                outline: 'none'
                            }}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="char-archetype-select">Thematic Archetype</label>
                        <select
                            id="char-archetype-select"
                            value={newCharArchetype}
                            onChange={(e) => setNewCharArchetype(e.target.value)}
                            required
                        >
                            <option value="Supporting">Supporting</option>
                            <option value="Protagonist">Protagonist</option>
                            <option value="Antagonist">Antagonist</option>
                            <option value="Mentor">Mentor</option>
                            <option value="Love Interest">Love Interest</option>
                            <option value="Companion">Companion</option>
                            <option value="Family">Family</option>
                        </select>
                    </div>
                    <button type="submit" className="btn-submit-rel" disabled={submitting}>
                        {submitting ? 'Adding...' : 'Add Character'}
                    </button>
                </form>

                {/* Form to Delete a Character */}
                <form onSubmit={handleCharacterDelete}>
                    <h4 style={{ fontSize: '13px', margin: '0 0 10px 0', color: 'var(--text-h)', fontWeight: '600' }}>Delete Character</h4>
                    <div className="form-group">
                        <label htmlFor="char-delete-select">Select Character</label>
                        <select
                            id="char-delete-select"
                            value={deleteCharId}
                            onChange={(e) => setDeleteCharId(e.target.value)}
                            required
                        >
                            <option value="">Select character to delete...</option>
                            {nodes.map(n => (
                                <option key={n.characterId} value={n.characterId}>
                                    {n.characterName} {n.source === 'NLP' ? '(NLP)' : '(User)'}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="btn-submit-rel"
                        disabled={submitting}
                        style={{ background: 'var(--error, #f43f5e)', color: 'white' }}
                    >
                        {submitting ? 'Deleting...' : 'Delete Character'}
                    </button>
                </form>
            </div>
        </div>
    );
}