import React, { useState, useEffect } from 'react';
import '../styles/OvertimeRequest.css';
import { 
  getFloorManagerByDepartment, 
  submitOvertimeRequest,
  getOvertimeRequestsByWorker 
} from '../db';

export default function OvertimeRequest({ user }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    hours: '',
    reason: ''
  });
  const [requests, setRequests] = useState([]);
  const [floorManager, setFloorManager] = useState(null);

  useEffect(() => {
    // Get floor manager and load overtime requests
    const manager = getFloorManagerByDepartment(user?.department);
    setFloorManager(manager);

    const workerRequests = getOvertimeRequestsByWorker(user?.id);
    setRequests(workerRequests);
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitRequest = () => {
    if (!formData.date || !formData.hours || !formData.reason.trim() || !floorManager) {
      alert('Please fill in all fields');
      return;
    }

    const newRequest = submitOvertimeRequest(
      user?.id,
      floorManager?.id,
      formData.date,
      parseInt(formData.hours),
      formData.reason
    );

    if (newRequest) {
      setRequests([...requests, newRequest]);
      setFormData({ date: '', hours: '', reason: '' });
      setShowForm(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending':
        return '#D97706';
      case 'approved':
        return '#10B981';
      case 'rejected':
        return '#EF4444';
      default:
        return '#1B4332';
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="overtime-request-container">
      <div className="overtime-header">
        <h2>⏰ Overtime Request</h2>
        <button 
          className="btn-request-overtime"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Cancel' : '➕ New Request'}
        </button>
      </div>

      {/* Request Form */}
      {showForm && (
        <div className="overtime-form-wrapper">
          <div className="overtime-form">
            <h3>Submit Overtime Request</h3>

            <div className="manager-assigned">
              <p>📋 Floor Manager: <strong>{floorManager?.name}</strong></p>
              <p className="manager-contact">📧 {floorManager?.email}</p>
            </div>

            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                min={getTodayDate()}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Hours *</label>
                <input
                  type="number"
                  name="hours"
                  value={formData.hours}
                  onChange={handleInputChange}
                  min="1"
                  max="8"
                  placeholder="1-8 hours"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Reason for Overtime *</label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                placeholder="Explain why you need overtime..."
                rows="4"
                required
              />
            </div>

            <div className="form-actions">
              <button 
                className="btn-submit"
                onClick={handleSubmitRequest}
              >
                ✓ Submit Request
              </button>
              <button 
                className="btn-cancel"
                onClick={() => setShowForm(false)}
              >
                ✕ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Requests List */}
      <div className="requests-list">
        <h3>Your Overtime Requests</h3>

        {requests.length === 0 ? (
          <div className="no-requests">
            <p>No overtime requests submitted yet.</p>
          </div>
        ) : (
          <div className="requests-grid">
            {requests.map(request => (
              <div key={request.id} className="request-card">
                <div className="request-header">
                  <div className="request-date">
                    <p className="date-label">Date</p>
                    <p className="date-value">
                      {new Date(request.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div 
                    className="status-badge"
                    style={{ backgroundColor: `${getStatusColor(request.status)}20`, borderLeft: `4px solid ${getStatusColor(request.status)}` }}
                  >
                    <span style={{ color: getStatusColor(request.status), fontWeight: '600' }}>
                      {request.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="request-body">
                  <div className="request-detail">
                    <span className="label">Hours:</span>
                    <span className="value">{request.hours} hours</span>
                  </div>
                  <div className="request-detail">
                    <span className="label">Reason:</span>
                    <span className="value">{request.reason}</span>
                  </div>
                  <div className="request-detail">
                    <span className="label">Submitted:</span>
                    <span className="value">
                      {new Date(request.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="request-footer">
                  <p className="manager-note">
                    📌 Assigned to: <strong>{request.floorManagerName}</strong>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
