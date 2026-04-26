import React, { useState, useEffect } from 'react';
import '../styles/ViewFloorPage.css';

export default function ViewFloorPage({ user }) {
  const [floorData, setFloorData] = useState(null);
  const [cctvCameras, setCctvCameras] = useState([]);
  const [selectedCctv, setSelectedCctv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFloorData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('authToken');
        
        // Get user's actual floor ID from backend
        let floorId = user?.assignedFloorId;
        
        // If not in props, fetch from API
        if (!floorId) {
          const userRes = await fetch('http://localhost:5000/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (userRes.ok) {
            const userData = await userRes.json();
            floorId = userData.user?.assignedFloorId;
          }
        }

        if (!floorId) {
          setError('No floor assigned to this user');
          setLoading(false);
          return;
        }
        
        // Fetch floor data
        const floorRes = await fetch(`http://localhost:5000/api/floors/${floorId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (floorRes.ok) {
          const floorPayload = await floorRes.json();
          const floor = floorPayload.floor || floorPayload.data || floorPayload;
          setFloorData(floor);
        } else {
          setError('Failed to load floor data');
        }

        // Fetch CCTVs for this floor
        const cctvRes = await fetch(`http://localhost:5000/api/cctvs/floor/${floorId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (cctvRes.ok) {
          const cctvData = await cctvRes.json();
          const cctvs = cctvData.cctvs || [];
          setCctvCameras(cctvs);
          if (cctvs.length > 0) {
            setSelectedCctv(cctvs[0]);
          }
        } else {
          setCctvCameras([]);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching floor data:', error);
        setError('Error loading floor data: ' + error.message);
        setLoading(false);
      }
    };

    fetchFloorData();
  }, [user]);

  if (loading) {
    return (
      <div className="view-floor-loading">
        <div className="loading-spinner">⏳ Loading floor data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="view-floor-loading error-state">
        <div className="error-message">❌ {error}</div>
      </div>
    );
  }

  if (!floorData) {
    return (
      <div className="view-floor-loading error-state">
        <div className="error-message">❌ No floor data available</div>
      </div>
    );
  }

  return (
    <div className="view-floor-page">
      <div className="fm-page-header">
        <h2>Floor Monitoring</h2>
        <p>View assigned CCTV cameras and live floor coverage</p>
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
              <span className={`info-value status-${(floorData.status || 'active').toLowerCase()}`}>
                {(floorData.status || 'active').toUpperCase()}
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

      <div className="assigned-camera-views-section">
        <h3>Assigned Camera Views</h3>
        {cctvCameras.length === 0 ? (
          <div className="no-camera-message">
            No CCTV cameras are assigned to this floor yet.
          </div>
        ) : (
          <div className="camera-views-grid">
            {cctvCameras.map(camera => (
              <div
                key={camera.id}
                className={`camera-view-tile ${selectedCctv?.id === camera.id ? 'active' : ''}`}
                onClick={() => setSelectedCctv(camera)}
              >
                <div className="camera-view-header">
                  <h4>{camera.name}</h4>
                  <span className={`camera-status status-${(camera.status || 'active').toLowerCase()}`}>
                    {camera.status || 'active'}
                  </span>
                </div>
                <div className="camera-view-feed">
                  <span>📹 {camera.location}</span>
                </div>
                <div className="camera-view-meta">
                  <span>IP: {camera.ipAddress || 'N/A'}</span>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedCctv(camera); }}>
                    Open Main View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
