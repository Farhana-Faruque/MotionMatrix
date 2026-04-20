import React, { useState, useEffect } from 'react';
import '../styles/ChatBoxPage.css';
import { 
  getMessagesBetween, 
  sendMessage,
  getAvailableChatUsers
} from '../db';

export default function ChatBoxPage({ user }) {
  const [conversationUsers, setConversationUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    // Get available users based on current user's role
    const otherUsers = getAvailableChatUsers(user);
    setConversationUsers(otherUsers);
    
    // Set first user as default
    if (otherUsers.length > 0) {
      setSelectedUser(otherUsers[0]);
      const conversationMessages = getMessagesBetween(user?.id, otherUsers[0].id);
      setMessages(conversationMessages);
    }
  }, [user]);

  const handleSelectUser = (selectedUser) => {
    setSelectedUser(selectedUser);
    const conversationMessages = getMessagesBetween(user?.id, selectedUser.id);
    setMessages(conversationMessages);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedUser) return;

    const sentMessage = sendMessage(user?.id, selectedUser?.id, newMessage);
    
    if (sentMessage) {
      setMessages([...messages, sentMessage]);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'admin':
        return '#EF4444';
      case 'manager':
      case 'owner':
        return '#1B4332';
      case 'floor_manager':
        return '#D97706';
      case 'worker':
        return '#10B981';
      default:
        return '#999';
    }
  };

  return (
    <div className="chatbox-page-container">
      <div className="chatbox-layout">
        {/* Users List */}
        <aside className="conversation-users">
          <h3>Conversations</h3>
          <div className="users-list">
            {conversationUsers.map(u => (
              <button
                key={u.id}
                className={`user-item ${selectedUser?.id === u.id ? 'active' : ''}`}
                onClick={() => handleSelectUser(u)}
                style={{ borderLeftColor: getRoleColor(u.role) }}
              >
                <div className="user-avatar">
                  {u.role === 'admin' ? '👨‍💼' : 
                   u.role === 'owner' ? '👑' :
                   u.role === 'manager' ? '📊' :
                   u.role === 'floor_manager' ? '👷' : '👤'}
                </div>
                <div className="user-info">
                  <p className="user-name">{u.name}</p>
                  <p className="user-role">{u.role.replace('_', ' ')}</p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Chat Area */}
        <div className="chat-area">
          {selectedUser ? (
            <>
              <div className="chat-header">
                <div className="selected-user-info">
                  <div className="user-avatar-large">
                    {selectedUser.role === 'admin' ? '👨‍💼' : 
                     selectedUser.role === 'owner' ? '👑' :
                     selectedUser.role === 'manager' ? '📊' :
                     selectedUser.role === 'floor_manager' ? '👷' : '👤'}
                  </div>
                  <div>
                    <h2>{selectedUser.name}</h2>
                    <p>{selectedUser.role.replace('_', ' ')} - {selectedUser.department}</p>
                  </div>
                </div>
              </div>

              <div className="chat-messages">
                {messages.length === 0 ? (
                  <div className="no-messages">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div 
                      key={msg.id || index} 
                      className={`message ${msg.fromId === user?.id ? 'sent' : 'received'}`}
                    >
                      <div className="message-avatar">
                        {msg.fromId === user?.id ? 
                          (user.role === 'owner' ? '👑' : '📊') : 
                          (msg.fromId === 1 ? '👨‍💼' : msg.fromId === 13 ? '👑' : '👤')}
                      </div>
                      <div className="message-content">
                        <p className="message-sender">{msg.fromName}</p>
                        <div className="message-bubble">
                          {msg.content}
                        </div>
                        <p className="message-time">
                          {new Date(msg.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="chat-input-area">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message here... (Press Enter to send)"
                  className="chat-input"
                  rows="3"
                />
                <button 
                  onClick={handleSendMessage}
                  className="btn-send-message"
                  disabled={!newMessage.trim()}
                >
                  📤 Send
                </button>
              </div>
            </>
          ) : (
            <div className="no-chat">
              <p>Select a user to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
