import React from 'react';
import '../styles/OwnerManagerProfile.css';

export default function OwnerManagerProfile({ user }) {
  const getUserRole = () => {
    return user?.role === 'owner' ? 'Owner' : 'Manager';
  };

  return (
    <div className="om-profile-container">
      <div className="profile-header">
        <h2>👤 My Profile</h2>
      </div>

      {/* Horizontal Profile Card */}
      <div className="profile-card-horizontal">
        <div className="profile-left">
          <div className="profile-avatar-large">
            {user?.role === 'owner' ? '👑' : '📊'}
          </div>
          <div className="profile-name-section">
            <h2>{user?.name}</h2>
            <p className="role-badge">{getUserRole()}</p>
          </div>
        </div>

        <div className="profile-divider-vertical"></div>

        <div className="profile-right">
          <div className="profile-detail-row">
            <div className="detail-col">
              <span className="detail-label">Employee ID</span>
              <span className="detail-value">#{user?.id}</span>
            </div>
            <div className="detail-col">
              <span className="detail-label">Department</span>
              <span className="detail-value">{user?.department}</span>
            </div>
            <div className="detail-col">
              <span className="detail-label">Email</span>
              <span className="detail-value">{user?.email}</span>
            </div>
            <div className="detail-col">
              <span className="detail-label">Status</span>
              <span className="detail-value status-active">🟢 Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Work Information Section */}
      <div className="work-info-section">
        <h3>Role Information</h3>
        
        <div className="info-grid">
          <div className="info-box">
            <span className="info-icon">📍</span>
            <div className="info-content">
              <p className="info-label">Department</p>
              <p className="info-value">{user?.department}</p>
            </div>
          </div>

          <div className="info-box">
            <span className="info-icon">👥</span>
            <div className="info-content">
              <p className="info-label">Role</p>
              <p className="info-value">{getUserRole()}</p>
            </div>
          </div>

          <div className="info-box">
            <span className="info-icon">📅</span>
            <div className="info-content">
              <p className="info-label">Member Since</p>
              <p className="info-value">2024</p>
            </div>
          </div>

          <div className="info-box">
            <span className="info-icon">🌐</span>
            <div className="info-content">
              <p className="info-label">Status</p>
              <p className="info-value">🟢 Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="profile-actions">
        <button className="action-button primary">
          ✎ Edit Profile
        </button>
        <button className="action-button secondary">
          🔐 Change Password
        </button>
      </div>
    </div>
  );
}
