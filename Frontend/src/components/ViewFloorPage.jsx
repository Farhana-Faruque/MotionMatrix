import React, { useState, useEffect } from 'react';
import '../styles/ViewFloorPage.css';
import { getFloorById, getWorkerActivityByFloor, getCCTVsByFloor, users } from '../db';

export default function ViewFloorPage({ floorManagerId, department }) {
  const [floorData, setFloorData] = useState(null);
  const [workerActivity, setWorkerActivity] = useState([]);
  const [cctvCameras, setCctvCameras] = useState([]);
  const [selectedCctv, setSelectedCctv] = useState(null);

  useEffect(() => {
    // Get the floor manager's floor info (simplified: using floorId 1 or 2 based on department)
    const floorId = department === 'Sewing' ? 1 : department === 'Cutting' ? 2 : 1;
    
    const floor = getFloorById(floorId);
    setFloorData(floor);

    const activity = getWorkerActivityByFloor(floorId);
    setWorkerActivity(activity);

    const cctvs = getCCTVsByFloor(floorId);
    setCctvCameras(cctvs);

    if (cctvs.length > 0) {
      setSelectedCctv(cctvs[0]);
    }
  }, [department]);

  const getWorkerInfo = (workerId) => {
    return users.find(u => u.id === workerId);
  };

  if (!floorData) {
    return <div className="view-floor-loading">Loading floor data...</div>;
  }

  return (
    <div className="view-floor-page">
      <div className="fm-page-header">
        <h2>Floor Monitoring</h2>
        <p>Real-time worker activity and CCTV surveillance</p>
      </div>

      <div className="floor-monitoring-grid">
        {/* Floor Overview */}
        <div className="floor-overview-card">
          <h3>Floor Information</h3>
          <div className="floor-info">
            <div className="info-row">
              <span className="info-label">Floor:</span>
              <span className="info-value">{floorData.name}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Level:</span>
              <span className="info-value">Level {floorData.level}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Area:</span>
              <span className="info-value">{floorData.area} sq ft</span>
            </div>
            <div className="info-row">
              <span className="info-label">Status:</span>
              <span className={`info-value status-${floorData.status}`}>
                {floorData.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* CCTV Cameras */}
        <div className="cctv-cameras-card">
          <h3>CCTV Cameras ({cctvCameras.length})</h3>
          <div className="cameras-list">
            {cctvCameras.map(camera => (
              <button
                key={camera.id}
                className={`camera-item ${selectedCctv?.id === camera.id ? 'active' : ''}`}
                onClick={() => setSelectedCctv(camera)}
              >
                <span className="camera-icon">📹</span>
                <div className="camera-info">
                  <p className="camera-name">{camera.name}</p>
                  <p className="camera-location">{camera.location}</p>
                  <span className={`camera-status status-${camera.status}`}>
                    {camera.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Camera View */}
        {selectedCctv && (
          <div className="camera-view-card">
            <h3>Camera: {selectedCctv.name}</h3>
            <div className="camera-display">
              <div className="camera-feed">
                <div className="camera-placeholder">
                  📹 {selectedCctv.location}
                </div>
                <div className="camera-controls">
                  <button>🔍 Zoom</button>
                  <button>↔️ Pan</button>
                  <button>⬆️ Tilt</button>
                </div>
              </div>
              <div className="camera-details">
                <p><strong>IP Address:</strong> {selectedCctv.ipAddress}</p>
                <p><strong>Status:</strong> 
                  <span className={`status-badge status-${selectedCctv.status}`}>
                    {selectedCctv.status}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Worker Activity */}
      <div className="worker-activity-section">
        <h3>Worker Activity</h3>
        <div className="activity-table-wrapper">
          <table className="activity-table">
            <thead>
              <tr>
                <th>Worker</th>
                <th>Activity</th>
                <th>CCTV Monitor</th>
                <th>Status</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {workerActivity.length === 0 ? (
                <tr>
                  <td colSpan="5" className="no-activity">
                    No active workers on this floor
                  </td>
                </tr>
              ) : (
                workerActivity.map(activity => {
                  const worker = getWorkerInfo(activity.workerId);
                  const camera = cctvCameras.find(c => c.id === activity.cctvId);
                  return (
                    <tr key={activity.id}>
                      <td className="worker-name">
                        <span className="worker-icon">👤</span>
                        {worker?.name || 'Unknown'}
                      </td>
                      <td>{activity.activity}</td>
                      <td>
                        <button 
                          className="cctv-link"
                          onClick={() => setSelectedCctv(camera)}
                        >
                          {camera?.name}
                        </button>
                      </td>
                      <td>
                        <span className={`status-badge status-${activity.status}`}>
                          {activity.status}
                        </span>
                      </td>
                      <td className="timestamp">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
