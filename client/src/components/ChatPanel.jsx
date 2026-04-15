import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, Menu, Trash2 } from 'lucide-react';
import { playMessageSound, playJoinSound, showDesktopNotification } from '../utils/audioSystem';
import './ChatPanel.css';

export default function ChatPanel({ socket, user, room, onToggleSidebar }) {
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Socket Event Listeners
    socket.on('message_history', (history) => {
      setMessages(history);
      scrollToBottom();
    });

    socket.on('receive_message', (message) => {
      setMessages((prev) => [...prev, message]);
      if (message.user !== user) {
        playMessageSound();
        if (document.hidden) showDesktopNotification(`New message from ${message.user}`, message.content);
      }
    });

    socket.on('message_deleted', (msgId) => {
      setMessages((prev) => prev.filter(m => m.id !== msgId));
    });

    socket.on('user_kicked', (targetUser) => {
        setMessages((prev) => [...prev, { system: true, content: `${targetUser} was kicked by an admin.` }]);
    });

    socket.on('user_joined', ({ user: joinedUser }) => {
      setMessages((prev) => [...prev, { system: true, content: `${joinedUser} hopped into the room.` }]);
      if (joinedUser !== user) playJoinSound();
    });

    socket.on('user_left', ({ user: leftUser }) => {
      setMessages((prev) => [...prev, { system: true, content: `${leftUser} left the room.` }]);
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(leftUser);
        return newSet;
      });
    });

    socket.on('user_typing', ({ user: typingUser, isTyping }) => {
      if (typingUser === user) return;
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        if (isTyping) newSet.add(typingUser);
        else newSet.delete(typingUser);
        return newSet;
      });
    });

    return () => {
      socket.off('message_history');
      socket.off('receive_message');
      socket.off('user_joined');
      socket.off('user_left');
      socket.off('user_typing');
      socket.off('message_deleted');
      socket.off('user_kicked');
    };
  }, [socket, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e) => {
    setInputVal(e.target.value);

    // Typing indicator logic
    socket.emit('typing', true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', false);
    }, 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    socket.emit('send_message', inputVal.trim());
    setInputVal('');
    socket.emit('typing', false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderTypingIndicator = () => {
    if (typingUsers.size === 0) return null;
    const usersArray = Array.from(typingUsers);
    let text = '';
    if (usersArray.length === 1) text = `${usersArray[0]} is typing...`;
    else if (usersArray.length === 2) text = `${usersArray[0]} and ${usersArray[1]} are typing...`;
    else text = 'Several people are typing...';

    return (
      <div className="typing-indicator">
        <span className="dot"></span>
        <span className="dot"></span>
        <span className="dot"></span>
        <span className="typing-text">{text}</span>
      </div>
    );
  };

  return (
    <div className="chat-panel">
      
      <div className="chat-header">
        <div className="header-left">
          <Menu className="mobile-menu-icon" size={24} onClick={onToggleSidebar} />
          <span className="hash-icon">#</span>
          <h2>{room}</h2>
        </div>
        <div className="header-right">
          <Users size={20} className="icon-btn" />
        </div>
      </div>

      <div className="messages-container">
        {messages.map((msg, index) => {
          if (msg.system) {
            return (
              <div key={index} className="message system-message">
                <span className="system-arrow">➜</span> {msg.content}
              </div>
            );
          }

          // Check if this message is right after another message by the same user
          const prevMsg = messages[index - 1];
          const isConsecutive = prevMsg && !prevMsg.system && prevMsg.user === msg.user;

          return (
            <div key={msg.id || index} className={`message ${isConsecutive ? 'consecutive' : ''}`}>
              {!isConsecutive && (
                <div className="message-avatar">
                  {msg.avatar ? (
                    <img src={msg.avatar} alt="avatar" className="avatar-img" />
                  ) : (
                    msg.user.charAt(0).toUpperCase()
                  )}
                </div>
              )}
              <div className="message-content-wrapper">
                {!isConsecutive && (
                  <div className="message-header">
                    <span className="msg-username">{msg.user}</span>
                    {msg.role && msg.role !== 'member' && (
                      <span className={`role-badge ${msg.role}`}>{msg.role}</span>
                    )}
                    <span className="msg-timestamp">{formatTime(msg.timestamp)}</span>
                  </div>
                )}
                <div className="message-text">
                  {msg.content}
                </div>
              </div>
              <div className="message-actions">
                <Trash2 size={16} className="delete-icon" onClick={() => socket.emit('delete_message', msg.id)} />
              </div>
            </div>
          );
        })}
        {renderTypingIndicator()}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-wrapper">
        <form onSubmit={handleSubmit} className="chat-input-form">
          <input
            type="text"
            placeholder={`Message #${room}`}
            value={inputVal}
            onChange={handleInputChange}
            className="chat-input"
            maxLength={1000}
            autoFocus
          />
          <button type="submit" className="send-btn" disabled={!inputVal.trim()}>
            <Send size={20} />
          </button>
        </form>
      </div>

    </div>
  );
}
