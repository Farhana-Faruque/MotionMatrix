import React, { useState, useEffect, useRef } from 'react';
import '../styles/FloorManagerChatBox.css';
import { 
  getMessagesBetween, 
  sendMessage,
  getAvailableChatUsers
} from '../db';

export default function FloorManagerChatBox({ user }) {
  const [conversationUsers, setConversationUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Get available users based on floor manager role
    const otherUsers = getAvailableChatUsers(user);
    setConversationUsers(otherUsers);
    if (otherUsers.length > 0) {
      setSelectedUser(otherUsers[0]);
    }
  }, [user.id]);

  useEffect(() => {
    if (selectedUser) {
      const msgs = getMessagesBetween(user.id, selectedUser.id);
      setMessages(msgs);
    }
  }, [selectedUser, user.id]);

  // Auto-refresh messages every 2 seconds to sync messages from Workers Profile
  useEffect(() => {
    if (selectedUser) {
      const interval = setInterval(() => {
        const msgs = getMessagesBetween(user.id, selectedUser.id);
        setMessages(msgs);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [selectedUser, user.id]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectUser = (selectedUser) => {
    setSelectedUser(selectedUser);
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedUser) {
      sendMessage(user.id, selectedUser.id, newMessage);
      const msgs = getMessagesBetween(user.id, selectedUser.id);
      setMessages(msgs);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'worker':
        return '👤';
      case 'floor_manager':
        return '👷';
      case 'admin':
        return '👨‍💼';
      case 'manager':
        return '📊';
      default:
        return '👤';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'worker':
        return '#10B981';
      case 'floor_manager':
        return '#D97706';
      case 'admin':
        return '#1B4332';
      case 'manager':
        return '#8B5CF6';
      default:
        return '#999';
    }
  };

  return (
    <div className="fm-chatbox-page">
      <div className="fm-page-header">
        <h2>Communication Hub</h2>
        <p>Connect with workers and team members</p>
      </div>

      <div className="fm-chat-container">
        {/* Users Sidebar */}
        <aside className="fm-users-sidebar">
          <h3>Conversations</h3>
          <div className="fm-users-list">
            {conversationUsers.map(convUser => (
              <button
                key={convUser.id}
                className={`fm-user-item ${selectedUser?.id === convUser.id ? 'active' : ''}`}
                onClick={() => handleSelectUser(convUser)}
                style={{
                  borderLeftColor: selectedUser?.id === convUser.id ? getRoleColor(convUser.role) : '#D8E2DC'
                }}
              >
                <span className="fm-user-icon">{getRoleIcon(convUser.role)}</span>
                <div className="fm-user-info">
                  <p className="fm-user-name">{convUser.name}</p>
                  <p className="fm-user-role">{convUser.role}</p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Chat Area */}
        <div className="fm-chat-area">
          {selectedUser && (
            <>
              {/* Chat Header */}
              <div className="fm-chat-header">
                <span className="fm-header-icon">{getRoleIcon(selectedUser.role)}</span>
                <div className="fm-header-info">
                  <h3>{selectedUser.name}</h3>
                  <p>{selectedUser.role} • {selectedUser.department}</p>
                </div>
              </div>

              {/* Messages Area */}
              <div className="fm-messages">
                {messages.length === 0 ? (
                  <div className="fm-empty-chat">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`fm-message ${msg.fromId === user.id ? 'sent' : 'received'}`}
                    >
                      <span className="fm-message-icon">
                        {msg.fromId === user.id ? '👷' : getRoleIcon(selectedUser.role)}
                      </span>
                      <div className="fm-message-content">
                        <p className="fm-message-sender">{msg.fromName}</p>
                        <div className="fm-message-bubble">
                          {msg.content}
                        </div>
                        <span className="fm-message-time">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="fm-input-area">
                <textarea
                  className="fm-input-field"
                  placeholder="Type a message... (Shift+Enter for new line)"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <button 
                  className="fm-send-btn"
                  onClick={handleSendMessage}
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
