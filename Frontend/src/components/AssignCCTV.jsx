import React, { useState } from 'react';
import { getAllFloors, getAllCCTVs, assignCCTVToFloor, unassignCCTVFromFloor, getCCTVsByFloor, addCCTV } from '../db';
import '../styles/AssignCCTV.css';

const AssignCCTV = ({ selectedFloorId }) => {
  const [floors, setFloors] = useState(getAllFloors());
  const [cctvs, setCCTVs] = useState(getAllCCTVs());
  const [selectedFloor, setSelectedFloor] = useState(selectedFloorId || (floors.length > 0 ? floors[0].id : null));
  const [showAddCCTVForm, setShowAddCCTVForm] = useState(false);
  const [cctvFormData, setCCTVFormData] = useState({
    name: '',
    location: '',
    ipAddress: ''
  });

  const currentFloor = floors.find(f => f.id === selectedFloor);
  const floorCCTVs = selectedFloor ? getCCTVsByFloor(selectedFloor) : [];
  const availableCCTVs = cctvs.filter(c => !c.floorId || c.floorId !== selectedFloor);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCCTVFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddCCTV = (e) => {
    e.preventDefault();
    if (cctvFormData.name && cctvFormData.location && cctvFormData.ipAddress) {
      const newCCTV = addCCTV({
        ...cctvFormData,
        status: 'active',
        floorId: selectedFloor
      });
      setCCTVs([...cctvs, newCCTV]);
      setCCTVFormData({ name: '', location: '', ipAddress: '' });
      setShowAddCCTVForm(false);
    }
  };

  const handleAssignCCTV = (cctvId) => {
    if (assignCCTVToFloor(cctvId, selectedFloor)) {
      setCCTVs(cctvs.map(c => 
        c.id === cctvId ? { ...c, floorId: selectedFloor } : c
      ));
      setFloors(floors.map(f => 
        f.id === selectedFloor 
          ? { ...f, cctvs: [...(f.cctvs || []), cctvId] }
          : f
      ));
    }
  };

  const handleUnassignCCTV = (cctvId) => {
    if (unassignCCTVFromFloor(cctvId, selectedFloor)) {
      setCCTVs(cctvs.map(c => 
        c.id === cctvId ? { ...c, floorId: null } : c
      ));
      setFloors(floors.map(f => 
        f.id === selectedFloor 
          ? { ...f, cctvs: (f.cctvs || []).filter(id => id !== cctvId) }
          : f
      ));
    }
  };

  return (
    <div className="assign-cctv-container">
      <div className="assign-header">
        <h2>Assign CCTVs to Floors</h2>
        <button 
          className="btn-add-cctv"
          onClick={() => setShowAddCCTVForm(true)}
        >
          ➕ Add New CCTV
        </button>
      </div>

      {/* Floor Selection */}
      <div className="floor-selector">
        <label>Select Floor:</label>
        <select 
          value={selectedFloor || ''} 
          onChange={(e) => setSelectedFloor(parseInt(e.target.value))}
        >
          {floors.map(floor => (
            <option key={floor.id} value={floor.id}>
              {floor.name} (Level {floor.level}) - {floor.cctvs?.length || 0} CCTVs
            </option>
          ))}
        </select>
      </div>

      {/* Add CCTV Form */}
      {showAddCCTVForm && (
        <div className="cctv-form-wrapper">
          <div className="cctv-form">
            <h3>Add New CCTV Camera</h3>
            <form onSubmit={handleAddCCTV}>
              <div className="form-group">
                <label>CCTV Name *</label>
                <input
                  type="text"
                  name="name"
                  value={cctvFormData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., CCTV-006"
                  required
                />
              </div>

              <div className="form-group">
                <label>Location *</label>
                <input
                  type="text"
                  name="location"
                  value={cctvFormData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., Entrance, Production Area"
                  required
                />
              </div>

              <div className="form-group">
                <label>IP Address *</label>
                <input
                  type="text"
                  name="ipAddress"
                  value={cctvFormData.ipAddress}
                  onChange={handleInputChange}
                  placeholder="e.g., 192.168.1.20"
                  required
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  Add CCTV
                </button>
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => setShowAddCCTVForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Current Floor Info */}
      {currentFloor && (
        <div className="current-floor-info">
          <h3>Floor Details: {currentFloor.name}</h3>
          <div className="floor-stats">
            <div className="stat">
              <span className="stat-label">Level:</span>
              <span className="stat-value">{currentFloor.level}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Area:</span>
              <span className="stat-value">{currentFloor.area} sq.m</span>
            </div>
            <div className="stat">
              <span className="stat-label">Assigned CCTVs:</span>
              <span className="stat-value badge">{floorCCTVs.length}</span>
            </div>
          </div>
        </div>
      )}

      <div className="cctv-assignment-grid">
        {/* Assigned CCTVs */}
        <div className="assigned-section">
          <h4>Assigned CCTVs ({floorCCTVs.length})</h4>
          {floorCCTVs.length === 0 ? (
            <div className="empty-state">
              <p>No CCTVs assigned to this floor yet.</p>
            </div>
          ) : (
            <div className="cctv-list">
              {floorCCTVs.map(cctv => (
                <div key={cctv.id} className="cctv-item assigned">
                  <div className="cctv-info">
                    <h5>{cctv.name}</h5>
                    <p className="cctv-location">📍 {cctv.location}</p>
                    <p className="cctv-ip">🌐 {cctv.ipAddress}</p>
                    <span className={`cctv-status ${cctv.status}`}>
                      ● {cctv.status}
                    </span>
                  </div>
                  <button 
                    className="btn-remove"
                    onClick={() => handleUnassignCCTV(cctv.id)}
                    title="Unassign this CCTV"
                  >
                    ➖ Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available CCTVs */}
        <div className="available-section">
          <h4>Available CCTVs ({availableCCTVs.length})</h4>
          {availableCCTVs.length === 0 ? (
            <div className="empty-state">
              <p>All CCTVs are assigned. Add more or unassign from other floors.</p>
            </div>
          ) : (
            <div className="cctv-list">
              {availableCCTVs.map(cctv => (
                <div key={cctv.id} className="cctv-item available">
                  <div className="cctv-info">
                    <h5>{cctv.name}</h5>
                    <p className="cctv-location">📍 {cctv.location}</p>
                    <p className="cctv-ip">🌐 {cctv.ipAddress}</p>
                    <span className={`cctv-status ${cctv.status}`}>
                      ● {cctv.status}
                    </span>
                  </div>
                  <button 
                    className="btn-assign"
                    onClick={() => handleAssignCCTV(cctv.id)}
                    title="Assign this CCTV"
                  >
                    ➕ Assign
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignCCTV;
