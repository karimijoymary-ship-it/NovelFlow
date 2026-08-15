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
  const [latencyData, setLatencyData] = useState([]);
  const [offlineCounts, setOfflineCounts] = useState({ telemetry: 0, tags: 0 });

  useEffect(() => {
    if (activeTab === 'community') {
      fetchUsers();
    }
    if (activeTab === 'catalog') {
      fetchUnverified();
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
             Platform Governance & Infrastructure Monitoring
           </div>
         </div>
      </header>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
         <button 
           onClick={() => setActiveTab('catalog')}
           style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', background: activeTab === 'catalog' ? 'var(--primary-color)' : 'var(--social-bg)', color: activeTab === 'catalog' ? '#fff' : 'var(--text)' }}
         >
           Catalog Governance
         </button>
         <button 
           onClick={() => setActiveTab('community')}
           style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', background: activeTab === 'community' ? 'var(--primary-color)' : 'var(--social-bg)', color: activeTab === 'community' ? '#fff' : 'var(--text)' }}
         >
           Community Management
         </button>
         <button 
           onClick={() => setActiveTab('infrastructure')}
           style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', background: activeTab === 'infrastructure' ? 'var(--primary-color)' : 'var(--social-bg)', color: activeTab === 'infrastructure' ? '#fff' : 'var(--text)' }}
         >
           Infrastructure Telemetry
         </button>
      </div>

      {activeTab === 'catalog' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div style={{ background: 'var(--social-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
               <h3 style={{ marginBottom: '1rem' }}>Regional API Fallback Sync</h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                   <div style={{ background: 'var(--bg)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #4CAF50' }}>
                       <strong>East African Fiction Core</strong>
                       <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', margin: '0.5rem 0' }}>Endpoint: classpath:handmade_fallback.json</p>
                       <span style={{ fontSize: '0.8rem', background: '#4CAF50', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>Active & Parsing</span>
                   </div>
                   <div style={{ background: 'var(--bg)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #FFC107' }}>
                       <strong>Manual Book Verification Queue</strong>
                       <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', margin: '0.5rem 0' }}>{unverifiedBooks.length} items pending moderation</p>
                       
                       {unverifiedBooks.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem', marginBottom: '1rem', maxHeight: '150px', overflowY: 'auto' }}>
                              {unverifiedBooks.map(b => (
                                  <div key={b.bookMasterId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--social-bg)', padding: '0.5rem', borderRadius: '4px' }}>
                                      <span style={{ fontSize: '0.8rem' }}><strong>{b.editions && b.editions.length > 0 ? b.editions[0].title : 'Unknown'}</strong> by {b.originalAuthor}</span>
                                      <button onClick={() => verifyBook(b.bookMasterId)} style={{ padding: '0.2rem 0.5rem', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Approve</button>
                                  </div>
                              ))}
                          </div>
                       )}
                   </div>
               </div>
            </div>
            <div style={{ background: 'var(--social-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
               <h3 style={{ marginBottom: '1rem' }}>Character Web Integrity</h3>
               <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '1rem' }}>Scanning graph linkages for isolation leaks...</p>
               <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                   <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg)', borderRadius: '6px' }}><span>Orphaned Nodes Detected</span> <strong style={{ color: '#F44336' }}>3</strong></li>
                   <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg)', borderRadius: '6px' }}><span>Dangling Relationships</span> <strong>0</strong></li>
                   <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg)', borderRadius: '6px' }}><span>Cyclic Generation Errors</span> <strong>0</strong></li>
               </ul>
            </div>
        </div>
      )}

      {activeTab === 'community' && (
        <div style={{ background: 'var(--social-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
           <h3 style={{ marginBottom: '1rem' }}>Role Allocations & Governance</h3>
           {loadingUsers ? <p>Loading directory...</p> : (
               <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                   <thead>
                       <tr style={{ borderBottom: '1px solid var(--border)' }}>
                           <th style={{ padding: '1rem 0.5rem', color: 'var(--text-light)' }}>User ID</th>
                           <th style={{ padding: '1rem 0.5rem', color: 'var(--text-light)' }}>Name / Email</th>
                           <th style={{ padding: '1rem 0.5rem', color: 'var(--text-light)' }}>Current Role</th>
                           <th style={{ padding: '1rem 0.5rem', color: 'var(--text-light)' }}>Actions</th>
                       </tr>
                   </thead>
                   <tbody>
                       {users.map(u => (
                           <tr key={u.userId} style={{ borderBottom: '1px solid var(--border)', background: u.role === 'admin' ? 'var(--bg)' : 'transparent' }}>
                               <td style={{ padding: '1rem 0.5rem', fontFamily: 'var(--mono)', fontSize: '0.8rem' }}>{u.userId.split('-')[0]}</td>
                               <td style={{ padding: '1rem 0.5rem' }}>
                                   <strong>{u.fullName}</strong><br/>
                                   <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{u.email}</span>
                               </td>
                               <td style={{ padding: '1rem 0.5rem' }}>
                                   <span style={{ 
                                       padding: '0.25rem 0.5rem', 
                                       borderRadius: '4px', 
                                       fontSize: '0.8rem',
                                       background: u.role === 'admin' ? '#F44336' : u.role === 'contributor' ? '#4CAF50' : '#2196F3',
                                       color: 'white'
                                    }}>
                                       {u.role ? u.role.toUpperCase() : 'USER'}
                                   </span>
                               </td>
                               <td style={{ padding: '1rem 0.5rem', display: 'flex', gap: '0.5rem' }}>
                                   {u.role !== 'admin' && (
                                       <>
                                         {u.role === 'reader' && (
                                             <button 
                                                onClick={() => promoteUser(u.userId, 'contributor')}
                                                style={{ padding: '0.4rem 0.8rem', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                                             >
                                                Promote to Contributor
                                             </button>
                                         )}
                                         {u.role === 'contributor' && (
                                             <button 
                                                onClick={() => promoteUser(u.userId, 'reader')}
                                                style={{ padding: '0.4rem 0.8rem', background: '#FF9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                                             >
                                                Demote to Reader
                                             </button>
                                         )}
                                       </>
                                   )}
                               </td>
                           </tr>
                       ))}
                   </tbody>
               </table>
           )}
        </div>
      )}

      {activeTab === 'infrastructure' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
            
            <div style={{ background: 'var(--social-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
               <h3 style={{ marginBottom: '1rem' }}>External API Gateway Latency (ms)</h3>
               <div style={{ width: '100%', height: 250 }}>
                   <ResponsiveContainer>
                       <LineChart data={latencyData}>
                           <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                           <XAxis dataKey="time" stroke="var(--text-light)" />
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
