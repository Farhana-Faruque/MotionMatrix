import React, { useState, useEffect } from 'react';
import '../styles/WorkersProfilePage.css';
import { users, sendMessage, getOvertimeRequestsByWorker, workerActivity } from '../db';

export default function WorkersProfilePage({ department, user, onNavigateToChat }) {
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messageSent, setMessageSent] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [workerHistory, setWorkerHistory] = useState(null);

  useEffect(() => {
    // Get workers from the same department
    const departmentWorkers = users.filter(u => 
      u.role === 'worker' && u.department === department
    );
    setWorkers(departmentWorkers);
    if (departmentWorkers.length > 0) {
      setSelectedWorker(departmentWorkers[0]);
    }
  }, [department]);

  const getWorkerStats = (worker) => {
    return {
      tasksCompleted: Math.floor(Math.random() * 50) + 100,
      accuracy: (Math.random() * 10 + 90).toFixed(1),
      hoursWorked: Math.floor(Math.random() * 50) + 150,
      absences: Math.floor(Math.random() * 5)
    };
  };

  const handleSendMessage = () => {
    setShowMessageModal(true);
    setMessageText('');
    setMessageSent(false);
  };

  const handleSubmitMessage = () => {
    if (!messageText.trim()) {
      alert('Please enter a message');
      return;
    }

    try {
      // Get current floor manager from localStorage
      const floorManagerData = JSON.parse(localStorage.getItem('floorManagerUser')) || user;
      
      if (floorManagerData && selectedWorker) {
        // Send message from floor manager to worker
        sendMessage(floorManagerData.id, selectedWorker.id, messageText.trim());
        setMessageSent(true);
        
        // Reset after 2 seconds and navigate to chat
        setTimeout(() => {
          setShowMessageModal(false);
          setMessageText('');
          setMessageSent(false);
          // Navigate to chat section if callback is provided
          if (onNavigateToChat) {
            onNavigateToChat();
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message');
    }
  };

  const handleViewHistory = () => {
    if (selectedWorker) {
      const overtimeRequests = getOvertimeRequestsByWorker(selectedWorker.id);
      const activities = workerActivity.filter(a => a.workerId === selectedWorker.id);
      
      // Generate performance history data
      const performanceHistory = {
        worker: selectedWorker,
        stats: getWorkerStats(selectedWorker),
        overtimeRequests: overtimeRequests,
        activities: activities,
        performanceData: [
          { month: 'March', accuracy: (Math.random() * 10 + 90).toFixed(1), tasksCompleted: Math.floor(Math.random() * 50) + 100 },
          { month: 'April (Current)', accuracy: (Math.random() * 10 + 90).toFixed(1), tasksCompleted: Math.floor(Math.random() * 50) + 100 }
        ]
      };
      
      setWorkerHistory(performanceHistory);
      setShowHistoryModal(true);
    }
  };

  return (
    <div className="workers-profile-page">
      <div className="fm-page-header">
        <h2>Workers Profile</h2>
        <p>View and manage worker information for {department} department</p>
      </div>

      <div className="workers-profile-container">
        {/* Workers List */}
        <aside className="workers-list-sidebar">
          <h3>Workers ({workers.length})</h3>
          <div className="workers-list">
            {workers.length === 0 ? (
              <div className="no-workers">
                <p>No workers in this department</p>
              </div>
            ) : (
              workers.map(worker => (
                <button
                  key={worker.id}
                  className={`worker-list-item ${selectedWorker?.id === worker.id ? 'active' : ''}`}
                  onClick={() => setSelectedWorker(worker)}
                >
                  <span className="worker-list-icon">👤</span>
                  <div className="worker-list-info">
                    <p className="worker-list-name">{worker.name}</p>
                    <p className="worker-list-email">{worker.email}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Worker Details */}
        <div className="worker-details-area">
          {selectedWorker ? (
            <>
              {/* Profile Card */}
              <div className="worker-profile-card">
                <div className="worker-profile-header">
                  <div className="worker-avatar">👤</div>
                  <div className="worker-basic-info">
                    <h2>{selectedWorker.name}</h2>
                    <p className="worker-role">{selectedWorker.role}</p>
                    <p className="worker-department">🏭 {selectedWorker.department}</p>
                  </div>
                </div>

                <div className="worker-contact-info">
                  <div className="contact-item">
                    <span className="contact-icon">📧</span>
                    <div className="contact-details">
                      <p className="contact-label">Email</p>
                      <p className="contact-value">{selectedWorker.email}</p>
                    </div>
                  </div>
                  <div className="contact-item">
                    <span className="contact-icon">🆔</span>
                    <div className="contact-details">
                      <p className="contact-label">Employee ID</p>
                      <p className="contact-value">{selectedWorker.id}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Stats as Quick Action Cards */}
              <div className="worker-quick-actions">
                <h3>Worker Statistics</h3>
                <div className="quick-actions-grid">
                  <div className="quick-action-card">
                    <div className="quick-action-icon">✅</div>
                    <div className="quick-action-content">
                      <h4>Tasks Completed</h4>
                      <p className="quick-action-value">
                        {getWorkerStats(selectedWorker).tasksCompleted}
                      </p>
                    </div>
                  </div>
                  <div className="quick-action-card">
                    <div className="quick-action-icon">⭐</div>
                    <div className="quick-action-content">
                      <h4>Accuracy Rate</h4>
                      <p className="quick-action-value">
                        {getWorkerStats(selectedWorker).accuracy}%
                      </p>
                    </div>
                  </div>
                  <div className="quick-action-card">
                    <div className="quick-action-icon">⏱️</div>
                    <div className="quick-action-content">
                      <h4>Hours Worked</h4>
                      <p className="quick-action-value">
                        {getWorkerStats(selectedWorker).hoursWorked}h
                      </p>
                    </div>
                  </div>
                  <div className="quick-action-card">
                    <div className="quick-action-icon">📅</div>
                    <div className="quick-action-content">
                      <h4>Absences</h4>
                      <p className="quick-action-value">
                        {getWorkerStats(selectedWorker).absences}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Action Cards */}
              <div className="worker-quick-actions">
                <h3>Quick Actions</h3>
                <div className="quick-cards-grid">
                  <div className="feature-card">
                    <div className="feature-icon">📧</div>
                    <div className="feature-content">
                      <h4>Send Message</h4>
                      <p>Send direct messages to this worker about tasks and updates.</p>
                      <button className="feature-btn" onClick={handleSendMessage}>Send</button>
                    </div>
                  </div>

                  <div className="feature-card">
                    <div className="feature-icon">📊</div>
                    <div className="feature-content">
                      <h4>View History</h4>
                      <p>Check worker's performance history and attendance records.</p>
                      <button className="feature-btn" onClick={handleViewHistory}>View</button>
                    </div>
                  </div>

                  <div className="feature-card">
                    <div className="feature-icon">⚙️</div>
                    <div className="feature-content">
                      <h4>Manage Assignment</h4>
                      <p>Assign tasks and manage worker responsibilities.</p>
                      <button className="feature-btn">Manage</button>
                    </div>
                  </div>

                  <div className="feature-card">
                    <div className="feature-icon">🔴</div>
                    <div className="feature-content">
                      <h4>Report Issue</h4>
                      <p>Report any issues or concerns with this worker.</p>
                      <button className="feature-btn danger">Report</button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="no-worker-selected">
              <p>Select a worker to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Message Modal */}
      {showMessageModal && (
        <div className="modal-overlay" onClick={() => !messageSent && setShowMessageModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {messageSent ? (
              <div className="message-success">
                <div className="success-icon">✓</div>
                <h3>Message Sent!</h3>
                <p>Your message has been sent to {selectedWorker?.name}</p>
              </div>
            ) : (
              <>
                <div className="modal-header">
                  <h3>Send Message to {selectedWorker?.name}</h3>
                  <button className="modal-close" onClick={() => setShowMessageModal(false)}>✕</button>
                </div>
                <div className="modal-body">
                  <textarea
                    className="message-input"
                    placeholder="Type your message here..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    rows={5}
                  />
                </div>
                <div className="modal-footer">
                  <button 
                    className="btn-cancel" 
                    onClick={() => setShowMessageModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn-send" 
                    onClick={handleSubmitMessage}
                  >
                    Send Message
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* View History Modal */}
      {showHistoryModal && workerHistory && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Performance History - {workerHistory.worker.name}</h3>
              <button className="modal-close" onClick={() => setShowHistoryModal(false)}>✕</button>
            </div>
            
            <div className="modal-body history-body">
              {/* Performance Summary */}
              <div className="history-section">
                <h4>📊 Performance Summary</h4>
                <div className="performance-summary">
                  <div className="summary-card">
                    <p className="summary-label">Accuracy Rate</p>
                    <p className="summary-value">{workerHistory.stats.accuracy}%</p>
                  </div>
                  <div className="summary-card">
                    <p className="summary-label">Tasks Completed</p>
                    <p className="summary-value">{workerHistory.stats.tasksCompleted}</p>
                  </div>
                  <div className="summary-card">
                    <p className="summary-label">Hours Worked</p>
                    <p className="summary-value">{workerHistory.stats.hoursWorked}h</p>
                  </div>
                  <div className="summary-card">
                    <p className="summary-label">Absences</p>
                    <p className="summary-value">{workerHistory.stats.absences}</p>
                  </div>
                </div>
              </div>

              {/* Performance Trend */}
              <div className="history-section">
                <h4>📈 Performance Trend</h4>
                <div className="performance-table">
                  <div className="table-header">
                    <div className="table-cell">Period</div>
                    <div className="table-cell">Accuracy</div>
                    <div className="table-cell">Tasks Completed</div>
                  </div>
                  {workerHistory.performanceData.map((data, index) => (
                    <div key={index} className="table-row">
                      <div className="table-cell">{data.month}</div>
                      <div className="table-cell">{data.accuracy}%</div>
                      <div className="table-cell">{data.tasksCompleted}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Overtime Requests */}
              {workerHistory.overtimeRequests.length > 0 && (
                <div className="history-section">
                  <h4>⏰ Overtime Requests</h4>
                  <div className="overtime-list">
                    {workerHistory.overtimeRequests.map(request => (
                      <div key={request.id} className="overtime-item">
                        <div className="overtime-header">
                          <span className="overtime-date">{request.date}</span>
                          <span className={`overtime-status ${request.status}`}>{request.status.toUpperCase()}</span>
                        </div>
                        <p className="overtime-details">{request.hours} hours - {request.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              {workerHistory.activities.length > 0 && (
                <div className="history-section">
                  <h4>📍 Recent Activity</h4>
                  <div className="activity-list">
                    {workerHistory.activities.map(activity => (
                      <div key={activity.id} className="activity-item">
                        <div className="activity-time">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </div>
                        <div className="activity-content">
                          <p className="activity-text">{activity.activity}</p>
                          <p className="activity-status">{activity.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {workerHistory.overtimeRequests.length === 0 && workerHistory.activities.length === 0 && (
                <div className="no-data">
                  <p>No additional history records found</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="btn-cancel" 
                onClick={() => setShowHistoryModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
