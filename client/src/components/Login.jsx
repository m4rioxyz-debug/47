import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import './Login.css';

export default function Login({ onJoin }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Check auto-login on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('base47_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.name) onJoin(parsed.name, 'General', parsed.password);
      } catch (e) {}
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Display name is required');
    
    localStorage.setItem('base47_session', JSON.stringify({ name: name.trim(), password }));
    
    // Hardcode room 'General'
    onJoin(name.trim(), 'General', password);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="icon-wrapper">
            <MessageSquare size={32} color="var(--text-primary)" />
          </div>
          <h2>Welcome to Base 47</h2>
          <p>We're so excited to see you here!</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>DISPLAY NAME <span className="required">*</span></label>
            <input 
              type="text" 
              className="input-field" 
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={32}
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <label>PASSWORD <span className="optional">(Optional)</span></label>
            <input 
              type="password" 
              className="input-field" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Keep it blank for guest"
              maxLength={32}
            />
          </div>

          {error && <div className="error-text">{error}</div>}

          <button type="submit" className="btn submit-btn">Enter App</button>
        </form>
      </div>
    </div>
  );
}
