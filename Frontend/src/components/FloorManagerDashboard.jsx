import React, { useState, useEffect } from 'react';
import '../styles/FloorManagerDashboard.css';
import NotificationBar from './NotificationBar';
import FloorManagerProfile from './FloorManagerProfile';
import UnifiedChat from './UnifiedChat';
import ViewFloorPage from './ViewFloorPage';
import OvertimeApprovalPage from './OvertimeApprovalPage';
import ViewProductionRecordPage from './ViewProductionRecordPage';
import WorkersProfilePage from './WorkersProfilePage';

export default function FloorManagerDashboard({ user }) {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [dashboardStats, setDashboardStats] = useState({
    presentWorkers: 0,
    producedToday: 0,
    pendingOvertime: 0,
    qualityRate: 0,
    efficiency: 0,
    loading: true,
    error: ''
  });

  useEffect(() => {
    if (activeSection !== 'dashboard') {
      return;
    }

    const fetchDashboardStats = async () => {
      if (!user?.assignedFloorId) {
        setDashboardStats(prev => ({ ...prev, loading: false, error: 'No floor assigned' }));
        return;
      }

      try {
        setDashboardStats(prev => ({ ...prev, loading: true, error: '' }));
        const token = localStorage.getItem('authToken');
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        const today = new Date();
        const todayStart = new Date(today);
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);

        const [attendanceRes, overtimeRes, productionRes] = await Promise.all([
          fetch(`http://localhost:5000/api/users/attendance/floor/${user.assignedFloorId}/summary`, { headers }),
          fetch(`http://localhost:5000/api/overtime/floor-manager/requests`, { headers }),
          fetch(`http://localhost:5000/api/production-records/report/date-range?startDate=${todayStart.toISOString()}&endDate=${todayEnd.toISOString()}&floorId=${user.assignedFloorId}`, { headers })
        ]);

        let presentWorkers = 0;
        let totalHours = 0;
        if (attendanceRes.ok) {
          const attendanceData = await attendanceRes.json();
          presentWorkers = attendanceData.totals?.present || 0;
          totalHours = attendanceData.totals?.totalHours || 0;
        }

        let pendingOvertime = 0;
        if (overtimeRes.ok) {
          const overtimeData = await overtimeRes.json();
          const requests = overtimeData.overtimeRequests || [];
          pendingOvertime = requests.filter(request => request.status === 'pending').length;
        }

        let producedToday = 0;
        let qualityRate = 0;
        let efficiency = 0;
        if (productionRes.ok) {
          const productionData = await productionRes.json();
          producedToday = productionData.summary?.totalProduced || 0;
          qualityRate = productionData.summary?.avgQualityRate || 0;
          efficiency = productionData.summary?.overallEfficiency || 0;
        }

        setDashboardStats({
          presentWorkers,
          producedToday,
          pendingOvertime,
          qualityRate,
          efficiency,
          totalHours,
          loading: false,
          error: ''
        });
      } catch (error) {
        console.error('Error fetching floor manager dashboard stats:', error);
        setDashboardStats(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load live dashboard metrics'
        }));
      }
    };

    fetchDashboardStats();
  }, [activeSection, user?.assignedFloorId]);

  return (
    <div className="floor-manager-dashboard">
      {/* Layout Container */}
      <div className="fm-layout-container">
        {/* Sidebar */}
        <aside className="fm-sidebar">
        <div className="fm-sidebar-header">
          <h2>Floor Manager</h2>
          <p className="fm-subtitle">{user?.department}</p>
        </div>
        <nav className="fm-sidebar-menu">
          <button
            className={`fm-menu-item ${activeSection === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveSection('dashboard')}
          >
            📊 Dashboard
          </button>
          <button
            className={`fm-menu-item ${activeSection === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveSection('profile')}
          >
            👤 My Profile
          </button>
          <button
            className={`fm-menu-item ${activeSection === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveSection('chat')}
          >
            💬 Chat
          </button>
          <button
            className={`fm-menu-item ${activeSection === 'floor' ? 'active' : ''}`}
            onClick={() => setActiveSection('floor')}
          >
            🏭 View Floor
          </button>
          <button
            className={`fm-menu-item ${activeSection === 'overtime' ? 'active' : ''}`}
            onClick={() => setActiveSection('overtime')}
          >
            ⏰ Overtime Approval
          </button>
          <button
            className={`fm-menu-item ${activeSection === 'production' ? 'active' : ''}`}
            onClick={() => setActiveSection('production')}
          >
            📈 Production Records
          </button>
          <button
            className={`fm-menu-item ${activeSection === 'workers' ? 'active' : ''}`}
            onClick={() => setActiveSection('workers')}
          >
            👥 Workers Profile
          </button>
          <button
            className="fm-menu-item fm-logout-btn"
            onClick={() => window.location.href = '/'}
          >
            🚪 Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="fm-main-content">
        {/* Dashboard Overview */}
        {activeSection === 'dashboard' && (
          <div className="fm-dashboard-overview">
            <div className="fm-page-header">
              <div>
                <h2>Floor Manager Dashboard</h2>
                <p>Welcome, {user?.name}</p>
              </div>
              <NotificationBar 
                floorManagerId={user?.id}
                unreadCount={unreadNotifications}
                onNotificationUpdate={setUnreadNotifications}
              />
            </div>
            
            <div className="fm-stats-grid">
              <div className="fm-stat-card">
                <div className="fm-stat-icon">👷</div>
                <div className="fm-stat-info">
                  <h3>Present Workers Today</h3>
                  <p className="fm-stat-value">{dashboardStats.loading ? '...' : dashboardStats.presentWorkers}</p>
                </div>
              </div>
              <div className="fm-stat-card">
                <div className="fm-stat-icon">📦</div>
                <div className="fm-stat-info">
                  <h3>Produced Today</h3>
                  <p className="fm-stat-value">{dashboardStats.loading ? '...' : `${dashboardStats.producedToday} units`}</p>
                </div>
              </div>
              <div className="fm-stat-card">
                <div className="fm-stat-icon">⏰</div>
                <div className="fm-stat-info">
                  <h3>Pending Overtime</h3>
                  <p className="fm-stat-value">{dashboardStats.loading ? '...' : `${dashboardStats.pendingOvertime} requests`}</p>
                </div>
              </div>
              <div className="fm-stat-card">
                <div className="fm-stat-icon">✅</div>
                <div className="fm-stat-info">
                  <h3>Quality / Efficiency</h3>
                  <p className="fm-stat-value">{dashboardStats.loading ? '...' : `${dashboardStats.qualityRate || dashboardStats.efficiency || 0}%`}</p>
                </div>
              </div>
            </div>

            {dashboardStats.error && (
              <div className="fm-dashboard-error">
                {dashboardStats.error}
              </div>
            )}

            <div className="fm-feature-cards">
              <h3>Quick Actions</h3>
              <div className="fm-cards-grid">
                <div className="fm-feature-card">
                  <div className="fm-feature-icon">💬</div>
                  <div className="fm-feature-content">
                    <h4>Chat</h4>
                    <p>Communicate with workers and management about important matters and updates.</p>
                    <button 
                      className="fm-feature-btn"
                      onClick={() => setActiveSection('chat')}
                    >
                      Open Chat
                    </button>
                  </div>
                </div>

                <div className="fm-feature-card">
                  <div className="fm-feature-icon">📈</div>
                  <div className="fm-feature-content">
                    <h4>Production</h4>
                    <p>Track and record daily production metrics, targets, and performance data.</p>
                    <button 
                      className="fm-feature-btn"
                      onClick={() => setActiveSection('production')}
                    >
                      View Records
                    </button>
                  </div>
                </div>

                <div className="fm-feature-card">
                  <div className="fm-feature-icon">⏰</div>
                  <div className="fm-feature-content">
                    <h4>Overtime</h4>
                    <p>Review and approve worker overtime requests with proper documentation.</p>
                    <button 
                      className="fm-feature-btn"
                      onClick={() => setActiveSection('overtime')}
                    >
                      Manage Overtime
                    </button>
                  </div>
                </div>

                <div className="fm-feature-card">
                  <div className="fm-feature-icon">👥</div>
                  <div className="fm-feature-content">
                    <h4>Workers</h4>
                    <p>Manage and monitor worker information and performance profiles.</p>
                    <button 
                      className="fm-feature-btn"
                      onClick={() => setActiveSection('workers')}
                    >
                      View Workers
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Page */}
        {activeSection === 'profile' && (
          <div className="fm-page-wrapper">
            <div className="fm-page-header">
              <h2>My Profile</h2>
              <NotificationBar 
                floorManagerId={user?.id}
                unreadCount={unreadNotifications}
                onNotificationUpdate={setUnreadNotifications}
              />
            </div>
            <FloorManagerProfile user={user} currentUser={user} />
          </div>
        )}

        {/* Chat Page */}
        {activeSection === 'chat' && (
          <div className="fm-page-wrapper">
            <div className="fm-page-header">
              <h2>Chat with Team</h2>
              <NotificationBar 
                floorManagerId={user?.id}
                unreadCount={unreadNotifications}
                onNotificationUpdate={setUnreadNotifications}
              />
            </div>
            <UnifiedChat user={user} />
          </div>
        )}

        {/* View Floor Page */}
        {activeSection === 'floor' && (
          <div className="fm-page-wrapper">
            <div className="fm-page-header">
              <h2>Floor Monitoring</h2>
              <NotificationBar 
                floorManagerId={user?.id}
                unreadCount={unreadNotifications}
                onNotificationUpdate={setUnreadNotifications}
              />
            </div>
            <ViewFloorPage user={user} />
          </div>
        )}

        {/* Overtime Approval Page */}
        {activeSection === 'overtime' && (
          <div className="fm-page-wrapper">
            <div className="fm-page-header">
              <h2>Overtime Requests</h2>
              <NotificationBar 
                floorManagerId={user?.id}
                unreadCount={unreadNotifications}
                onNotificationUpdate={setUnreadNotifications}
              />
            </div>
            <OvertimeApprovalPage floorManagerId={user?.id} />
          </div>
        )}

        {/* Production Records Page */}
        {activeSection === 'production' && (
          <div className="fm-page-wrapper">
            <div className="fm-page-header">
              <h2>Production Records</h2>
              <NotificationBar 
                floorManagerId={user?.id}
                unreadCount={unreadNotifications}
                onNotificationUpdate={setUnreadNotifications}
              />
            </div>
            <ViewProductionRecordPage user={user} floorManagerId={user?.id} department={user?.department} />
          </div>
        )}

        {/* Workers Profile Page */}
        {activeSection === 'workers' && (
          <div className="fm-page-wrapper">
            <div className="fm-page-header">
              <h2>Workers Profile</h2>
              <NotificationBar 
                floorManagerId={user?.id}
                unreadCount={unreadNotifications}
                onNotificationUpdate={setUnreadNotifications}
              />
            </div>
            <WorkersProfilePage 
              department={user?.department} 
              user={user}
              onNavigateToChat={() => setActiveSection('chat')}
            />
          </div>
        )}
      </main>
      </div>
    </div>
  );
}
