import React, { useState, useEffect } from 'react';
import '../styles/WorkerChatBox.css';
import { 
  getFloorManagerByDepartment, 
  getMessagesBetween, 
  sendMessage 
} from '../db';

export default function WorkerChatBox({ user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [floorManager, setFloorManager] = useState(null);

  useEffect(() => {
    // Get the floor manager based on worker's department
    const manager = getFloorManagerByDepartment(user?.department);
    setFloorManager(manager);

    // Load messages between worker and floor manager
    if (manager) {
      const conversationMessages = getMessagesBetween(user?.id, manager?.id);
      setMessages(conversationMessages);
    }
  }, [user]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !floorManager) return;

    // Send message to database
    const sentMessage = sendMessage(user?.id, floorManager?.id, newMessage);
    
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

  if (!floorManager) {
    return (
      <div className="worker-chatbox-container">
        <div className="no-manager">
          <p>No floor manager found for your department.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="worker-chatbox-container">
      <div className="chat-header">
        <h2>💬 Chat with Floor Manager</h2>
        <div className="manager-info">
          <div className="manager-avatar">👨‍💼</div>
          <div className="manager-details">
            <h3>{floorManager?.name}</h3>
            <p>{floorManager?.department}</p>
            <p className="status-online">🟢 Online</p>
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
                {msg.fromId === user?.id ? '👤' : '👨‍💼'}
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
          📤 Send Message
        </button>
      </div>
    </div>
  );
}
