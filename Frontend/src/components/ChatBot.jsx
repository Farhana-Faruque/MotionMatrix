import React, { useState } from 'react';
import '../styles/ChatBot.css';

const ChatBot = () => {
  const [conversations, setConversations] = useState([
    {
      id: 1,
      name: 'Ahmed Hassan',
      role: 'Floor Manager - Sewing',
      lastMessage: 'Production on track. 85% complete.',
      timestamp: '10:30 AM',
      unread: 2,
      online: true
    },
    {
      id: 2,
      name: 'Fatima Khan',
      role: 'Floor Manager - Cutting',
      lastMessage: 'Two workers called in sick today',
      timestamp: '09:15 AM',
      unread: 1,
      online: false
    },
    {
      id: 3,
      name: 'Karim Ahmed',
      role: 'Floor Manager - Finishing',
      lastMessage: 'Quality check completed. All OK.',
      timestamp: 'Yesterday',
      unread: 0,
      online: true
    }
  ]);

  const [selectedChat, setSelectedChat] = useState(conversations[0]);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'Ahmed Hassan', message: 'Good morning! Production started on time.', timestamp: '08:00 AM', isOwn: false },
    { id: 2, sender: 'You', message: 'Great! How many units completed so far?', timestamp: '08:15 AM', isOwn: true },
    { id: 3, sender: 'Ahmed Hassan', message: 'We have completed 425 units of the current batch.', timestamp: '08:20 AM', isOwn: false },
    { id: 4, sender: 'Ahmed Hassan', message: 'Production on track. 85% complete.', timestamp: '10:30 AM', isOwn: false }
  ]);

  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const messageObj = {
        id: messages.length + 1,
        sender: 'You',
        message: newMessage,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        isOwn: true
      };
      setMessages([...messages, messageObj]);
      setNewMessage('');
    }
  };

  const handleSelectChat = (conversation) => {
    setSelectedChat(conversation);
    // In a real app, fetch messages for this conversation
  };

  return (
    <div className="chatbot-container">
      <div className="chat-sidebar">
        <div className="chat-header">
          <h3>Messages</h3>
          <button className="new-chat-btn">➕</button>
        </div>

        <div className="search-box">
          <input type="text" placeholder="Search conversations..." />
        </div>

        <div className="conversations-list">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`conversation-item ${selectedChat.id === conversation.id ? 'active' : ''}`}
              onClick={() => handleSelectChat(conversation)}
            >
              <div className="avatar">
                <div className={`avatar-circle ${conversation.online ? 'online' : 'offline'}`}>
                  {conversation.name.charAt(0)}
                </div>
              </div>
              <div className="conversation-info">
                <div className="conversation-header">
                  <h4>{conversation.name}</h4>
                  <span className="timestamp">{conversation.timestamp}</span>
                </div>
                <p className="role">{conversation.role}</p>
                <p className="last-message">{conversation.lastMessage}</p>
              </div>
              {conversation.unread > 0 && (
                <div className="unread-badge">{conversation.unread}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="chat-main">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="chat-header-top">
              <div className="chat-user-info">
                <div className={`status-indicator ${selectedChat.online ? 'online' : 'offline'}`}></div>
                <div>
                  <h3>{selectedChat.name}</h3>
                  <p className="role">{selectedChat.role}</p>
                </div>
              </div>
              <div className="chat-actions">
                <button className="action-btn">📞</button>
                <button className="action-btn">📹</button>
                <button className="action-btn">⋮</button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="messages-area">
              {messages.map((msg) => (
                <div key={msg.id} className={`message ${msg.isOwn ? 'own' : 'other'}`}>
                  <div className="message-content">
                    <p>{msg.message}</p>
                    <span className="message-time">{msg.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <form className="message-input-form" onSubmit={handleSendMessage}>
              <button type="button" className="attachment-btn">📎</button>
              <input
                type="text"
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="message-input"
              />
              <button type="button" className="emoji-btn">😊</button>
              <button type="submit" className="send-btn">📤</button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBot;
