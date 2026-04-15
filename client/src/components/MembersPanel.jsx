import React, { useState } from 'react';
import { ShieldAlert, UserX } from 'lucide-react';
import './MembersPanel.css';

export default function MembersPanel({ users, currentUser, speakingPeers, socket }) {
  const [selectedUser, setSelectedUser] = useState(null);

  const onlineUsers = users.filter(u => u.user !== currentUser && !u.voiceRoom);
  const voiceUsers = users.filter(u => u.user !== currentUser && u.voiceRoom);
  const myData = users.find(u => u.user === currentUser) || {};
  const isAdmin = myData.role === 'admin';

  const handleUserClick = (u) => {
    if (isAdmin && u.user !== currentUser) {
      // Toggle selected user for admin menu
      setSelectedUser(prev => prev === u.user ? null : u.user);
    }
  };

  const setRole = (targetUser, newRole) => {
    socket.emit('set_role', { targetUser, newRole });
    setSelectedUser(null);
  };

  const kickUser = (targetUser) => {
    socket.emit('kick_user', targetUser);
    setSelectedUser(null);
  };

  const renderUser = (u, isLocal = false) => {
    const isSpeaking = speakingPeers.has(u.user) || (isLocal && speakingPeers.has('local'));
    const isMenuOpen = selectedUser === u.user;

    return (
      <div key={u.user} className="member-wrapper">
        <div 
          className={`member-item ${isSpeaking ? 'speaking' : ''} ${isLocal ? 'highlight-local' : ''}`}
          onClick={() => handleUserClick(u)}
        >
          <div className="member-avatar">
            {u.avatar ? <img src={u.avatar} alt="Avatar" className="avatar-img" /> : u.user.charAt(0).toUpperCase()}
            <div className="status-dot"></div>
          </div>
          <div className="member-info">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className="member-name">{u.user} {isLocal && '(You)'}</span>
              {u.role && u.role !== 'member' && (
                 <span className={`role-badge ${u.role}`} style={{ marginLeft: 6 }}>{u.role}</span>
              )}
            </div>
            {u.voiceRoom && <span className="member-voice-status">🎤 {u.voiceRoom}</span>}
          </div>
        </div>

        {isMenuOpen && (
          <div className="admin-menu">
            <div className="admin-menu-header">Manage {u.user}</div>
            <div className="admin-menu-actions">
              {u.role !== 'admin' && <button onClick={() => setRole(u.user, 'admin')}><ShieldAlert size={14}/> Make Admin</button>}
              {u.role !== 'mod' && <button onClick={() => setRole(u.user, 'mod')}><ShieldAlert size={14}/> Make Mod</button>}
              {u.role !== 'member' && <button onClick={() => setRole(u.user, 'member')}><ShieldAlert size={14}/> Make Member</button>}
              <div className="admin-divider"></div>
              <button className="danger" onClick={() => kickUser(u.user)}><UserX size={14}/> Kick User</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="members-panel">
      <div className="members-header">
        <h3>Members — {users.length}</h3>
      </div>
      <div className="members-list">
        <div className="members-category">YOU</div>
        {myData.user ? renderUser(myData, true) : null}

        {voiceUsers.length > 0 && (
          <>
            <div className="members-category">IN VOICE CHANNELS — {voiceUsers.length}</div>
            {voiceUsers.map(u => renderUser(u, false))}
          </>
        )}

        {onlineUsers.length > 0 && (
          <>
            <div className="members-category">ONLINE — {onlineUsers.length}</div>
            {onlineUsers.map(u => renderUser(u, false))}
          </>
        )}
      </div>
    </div>
  );
}
