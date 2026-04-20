import React, { useState, useEffect } from 'react';
import '../styles/OvertimeApprovalPage.css';
import { getOvertimeRequestsByFloorManager, updateOvertimeStatus, overtimeRequests } from '../db';

export default function OvertimeApprovalPage({ floorManagerId }) {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const floorManagerRequests = getOvertimeRequestsByFloorManager(floorManagerId);
    setRequests(floorManagerRequests);
  }, [floorManagerId]);

  const handleApprove = (requestId) => {
    updateOvertimeStatus(requestId, 'approved');
    setRequests(requests.map(r => 
      r.id === requestId ? { ...r, status: 'approved' } : r
    ));
  };

  const handleReject = (requestId) => {
    updateOvertimeStatus(requestId, 'rejected');
    setRequests(requests.map(r => 
      r.id === requestId ? { ...r, status: 'rejected' } : r
    ));
  };

  const handleRemove = (requestId) => {
    // Remove the request from the list
    const index = overtimeRequests.findIndex(r => r.id === requestId);
    if (index > -1) {
      overtimeRequests.splice(index, 1);
    }
    setRequests(requests.filter(r => r.id !== requestId));
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const rejectedRequests = requests.filter(r => r.status === 'rejected');

  const OvertimeRequestRow = ({ request, status }) => (
    <div className="overtime-request-card">
      <div className="request-header">
        <h4>{request.workerName}</h4>
        <span className={`request-status status-${status}`}>{status.toUpperCase()}</span>
      </div>
      <div className="request-details">
        <div className="detail-item">
          <span className="label">Date:</span>
          <span className="value">{request.date}</span>
        </div>
        <div className="detail-item">
          <span className="label">Hours:</span>
          <span className="value">{request.hours} hours</span>
        </div>
        <div className="detail-item">
          <span className="label">Reason:</span>
          <span className="value">{request.reason}</span>
        </div>
        <div className="detail-item">
          <span className="label">Submitted:</span>
          <span className="value">
            {new Date(request.submittedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
      
      {status === 'pending' && (
        <div className="request-actions">
          <button 
            className="btn-approve"
            onClick={() => handleApprove(request.id)}
          >
            ✓ Approve
          </button>
          <button 
            className="btn-reject"
            onClick={() => handleReject(request.id)}
          >
            ✗ Reject
          </button>
        </div>
      )}
      
      {(status === 'approved' || status === 'rejected') && (
        <div className="request-actions">
          <button 
            className="btn-remove"
            onClick={() => handleRemove(request.id)}
          >
            🗑️ Remove
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="overtime-approval-page">
      <div className="fm-page-header">
        <h2>Overtime Approval Management</h2>
        <p>Review and manage worker overtime requests</p>
      </div>

      {/* Pending Requests */}
      <section className="overtime-section">
        <h3>⏳ Pending Requests ({pendingRequests.length})</h3>
        <div className="requests-container">
          {pendingRequests.length === 0 ? (
            <div className="no-requests">
              <p>No pending overtime requests</p>
            </div>
          ) : (
            pendingRequests.map(request => (
              <OvertimeRequestRow 
                key={request.id} 
                request={request} 
                status="pending"
              />
            ))
          )}
        </div>
      </section>

      {/* Approved Requests */}
      <section className="overtime-section">
        <h3>✅ Approved ({approvedRequests.length})</h3>
        <div className="requests-container">
          {approvedRequests.length === 0 ? (
            <div className="no-requests">
              <p>No approved requests</p>
            </div>
          ) : (
            approvedRequests.map(request => (
              <OvertimeRequestRow 
                key={request.id} 
                request={request} 
                status="approved"
              />
            ))
          )}
        </div>
      </section>

      {/* Rejected Requests */}
      <section className="overtime-section">
        <h3>❌ Rejected ({rejectedRequests.length})</h3>
        <div className="requests-container">
          {rejectedRequests.length === 0 ? (
            <div className="no-requests">
              <p>No rejected requests</p>
            </div>
          ) : (
            rejectedRequests.map(request => (
              <OvertimeRequestRow 
                key={request.id} 
                request={request} 
                status="rejected"
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
