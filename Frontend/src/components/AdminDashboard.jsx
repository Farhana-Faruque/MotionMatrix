import React, { useState, useEffect } from 'react';
import '../styles/AdminDashboard.css';
import AdminProfile from './AdminProfile';
import AddWorker from './AddWorker';
import ChatBot from './ChatBot';
import CreateFloor from './CreateFloor';
import AssignCCTV from './AssignCCTV';

const AdminDashboard = ({ onLogout, adminUser }) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [adminData, setAdminData] = useState(adminUser || {
    name: 'Admin User',
    role: 'Administrator',
    email: 'admin@motionmatrix.com',
    department: 'Administration'
  });

  useEffect(() => {
    if (adminUser) {
      setAdminData(adminUser);
    }
  }, [adminUser]);

  const handleLogout = () => {
    onLogout();
  };

  // Generate initials for avatar
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Dynamic description based on role
  const getDescription = () => {
    switch(adminData.role?.toLowerCase()) {
      case 'admin':
      case 'administrator':
        return 'Manage workers, accounts, floors, CCTV systems, and communicate with all team members';
      default:
        return 'Manage workers, accounts, and communicate with floor managers';
    }
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
            className={`menu-item ${activeSection === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveSection('profile')}
          >
            👤 My Profile
          </button>
          <button
            className={`menu-item ${activeSection === 'addWorker' ? 'active' : ''}`}
            onClick={() => setActiveSection('addWorker')}
          >
            👷 Add Worker / Account
          </button>
          <button
            className={`menu-item ${activeSection === 'createFloor' ? 'active' : ''}`}
            onClick={() => setActiveSection('createFloor')}
          >
            🏢 Create Floor
          </button>
          <button
            className={`menu-item ${activeSection === 'assignCCTV' ? 'active' : ''}`}
            onClick={() => setActiveSection('assignCCTV')}
          >
            🎥 Assign CCTV
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
            <p>{getDescription()}</p>
          </div>
          <div className="user-profile">
            <div className="profile-avatar-dynamic">
              {getInitials(adminData.name)}
            </div>
            <div className="profile-info">
              <p className="profile-email">{adminData.email}</p>
              <p className="profile-role">{adminData.role || 'Administrator'}</p>
            </div>
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

              <div className="feature-cards">
                <h3>Quick Actions</h3>
                <div className="cards-grid">
                  <div className="feature-card">
                    <div className="feature-icon">👷</div>
                    <div className="feature-content">
                      <h4>Add Worker</h4>
                      <p>Add new workers and accounts to the system with proper role and department assignments.</p>
                      <button 
                        className="feature-btn"
                        onClick={() => setActiveSection('addWorker')}
                      >
                        Add Worker
                      </button>
                    </div>
                  </div>

                  <div className="feature-card">
                    <div className="feature-icon">🏢</div>
                    <div className="feature-content">
                      <h4>Create Floor</h4>
                      <p>Set up new floors with proper configurations for production management and monitoring.</p>
                      <button 
                        className="feature-btn"
                        onClick={() => setActiveSection('createFloor')}
                      >
                        Create Floor
                      </button>
                    </div>
                  </div>

                  <div className="feature-card">
                    <div className="feature-icon">🎥</div>
                    <div className="feature-content">
                      <h4>Assign CCTV</h4>
                      <p>Configure and assign CCTV cameras to floors for real-time monitoring and security.</p>
                      <button 
                        className="feature-btn"
                        onClick={() => setActiveSection('assignCCTV')}
                      >
                        Assign CCTV
                      </button>
                    </div>
                  </div>

                  <div className="feature-card">
                    <div className="feature-icon">💬</div>
                    <div className="feature-content">
                      <h4>Send Message</h4>
                      <p>Communicate directly with floor managers and workers for important updates and notifications.</p>
                      <button 
                        className="feature-btn"
                        onClick={() => setActiveSection('chat')}
                      >
                        Send Message
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Profile Page */}
          {activeSection === 'profile' && <AdminProfile user={adminData} />}

          {/* Add Worker */}
          {activeSection === 'addWorker' && <AddWorker />}

          {/* Create Floor */}
          {activeSection === 'createFloor' && (
            <CreateFloor onSelectFloor={(floorId) => setActiveSection('assignCCTV')} />
          )}

          {/* Assign CCTV */}
          {activeSection === 'assignCCTV' && <AssignCCTV />}

          {/* Chat */}
          {activeSection === 'chat' && <ChatBot />}
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
