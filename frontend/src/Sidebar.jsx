import React from 'react';

function Sidebar({ activeView, onViewChange }) {
  const navItems = [
    {
      category: 'WORKSPACE',
      items: [
        { id: 'Discovery', label: 'Discovery', icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /> },
        { id: 'Character Map', label: 'Character Map', icon: <path d="M16 21v-2a4 4 0 0 0-4-4H5c-1 0-2-1-2-2V5c0-1 1-2 2-2h14c1 0 2 1 2 2v6" /> }
      ]
    },
    {
      category: 'PERSONAL',
      items: [
        { id: 'My Library', label: 'My Library', title: 'Book Level (Status-Based): Update Page Count, Change Reading Status (Reading/DNF), Filter by Completion.', icon: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></> },
        { id: 'Reading Stats', label: 'Reading Stats', icon: <><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></> },
        { id: 'Collections', label: 'Collections', title: 'Folder Level (Theme-Based): Create New Folder, Drag-and-Drop Books, Share Reading List.', icon: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></> },
        { id: 'Saved Pages', label: 'Saved Pages', title: 'Passage / Node Level (Data-Based): View Highlight, Export Quote Citation, Jump Directly to Page Index.', icon: <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /> }
      ]
    }
  ];

  return (
    <nav className="global-sidebar">
      <div className="global-sidebar-header">
        <div className="app-logo">
          <span className="logo-text-bold">Novel</span>
          <span className="logo-text-light">Flow</span>
        </div>
      </div>

      <div className="global-sidebar-nav-groups">
        {navItems.map((group, idx) => (
          <div key={idx} className="nav-group">
            <h4 className="nav-group-title">{group.category}</h4>
            <div className="nav-group-items">
              {group.items.map(item => (
                <button
                  key={item.id}
                  className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                  onClick={() => onViewChange(item.id)}
                  title={item.title || item.label}
                >
                  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {item.icon}
                  </svg>
                  <span className="nav-label">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="global-sidebar-footer">
        <button
          className={`nav-item ${activeView === 'Settings' ? 'active' : ''}`}
          onClick={() => onViewChange('Settings')}
        >
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span className="nav-label">Settings</span>
        </button>
        <div className="sync-status">
          <div className="status-dot"></div>
          <span className="status-label">synced</span>
        </div>
      </div>
    </nav>
  );
}

export default Sidebar;
