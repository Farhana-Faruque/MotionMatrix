import React, { useState } from 'react';
import '../styles/AdminDashboard.css';
import AddWorker from './AddWorker';
import ChatBot from './ChatBot';

const AdminDashboard = ({ onLogout, adminUser }) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [adminData, setAdminData] = useState(adminUser || {
    name: 'Admin User',
    role: 'Administrator',
    email: 'admin@motionmatrix.com'
  });

  const handleLogout = () => {
    onLogout();
  };

  return (
    <div className="admin-dashboard">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h3>MotionMatrix</h3>
          <p className="admin-role">{adminData.name}</p>
          <p className="admin-role-type">{adminData.role || 'Administrator'}</p>
        </div>

        <nav className="sidebar-menu">
          <button
            className={`menu-item ${activeSection === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveSection('dashboard')}
          >
            📊 Dashboard
          </button>
          <button
            className={`menu-item ${activeSection === 'addWorker' ? 'active' : ''}`}
            onClick={() => setActiveSection('addWorker')}
          >
            👷 Add Worker / Account
          </button>
          <button
            className={`menu-item ${activeSection === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveSection('chat')}
          >
            💬 Chat
          </button>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          🚪 Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-info">
            <h1>Welcome, {adminData.name}</h1>
            <p>Manage workers, accounts, and communicate with floor managers</p>
          </div>
          <div className="user-profile">
            <img src="https://via.placeholder.com/40" alt="Profile" className="profile-avatar" />
            <span>{adminData.email}</span>
          </div>
        </header>

        {/* Content Area */}
        <section className="content-area">
          {/* Dashboard Overview */}
          {activeSection === 'dashboard' && (
            <div className="dashboard-overview">
              <h2>Dashboard Overview</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">👷</div>
                  <div className="stat-info">
                    <h3>Total Workers</h3>
                    <p className="stat-number">245</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">👤</div>
                  <div className="stat-info">
                    <h3>Active Accounts</h3>
                    <p className="stat-number">89</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">✅</div>
                  <div className="stat-info">
                    <h3>On Duty</h3>
                    <p className="stat-number">187</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">💬</div>
                  <div className="stat-info">
                    <h3>Unread Messages</h3>
                    <p className="stat-number">12</p>
                  </div>
                </div>
              </div>

              <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="action-buttons">
                  <button 
                    className="action-btn"
                    onClick={() => setActiveSection('addWorker')}
                  >
                    Add Worker / Account
                  </button>
                  <button 
                    className="action-btn"
                    onClick={() => setActiveSection('chat')}
                  >
                    Send Message
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Worker */}
          {activeSection === 'addWorker' && <AddWorker />}

          {/* Chat */}
          {activeSection === 'chat' && <ChatBot />}
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
