import React, { useState, useEffect } from 'react';
import '../styles/ViewProductionRecordPage.css';
import { getProductionRecordsByFloor, addProductionRecord, productionRecords } from '../db';

export default function ViewProductionRecordPage({ floorManagerId, department }) {
  const [records, setRecords] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    shift: 'Morning',
    workersCount: '',
    produced: '',
    quality: '',
    notes: ''
  });

  const floorId = department === 'Sewing' ? 1 : department === 'Cutting' ? 2 : 1;
  const floorName = floorId === 1 ? 'Ground Floor' : 'First Floor';

  useEffect(() => {
    const floorRecords = getProductionRecordsByFloor(floorId);
    setRecords(floorRecords);
  }, [floorId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddRecord = (e) => {
    e.preventDefault();
    
    if (!formData.workersCount || !formData.produced || !formData.quality) {
      alert('Please fill in all required fields');
      return;
    }

    const newRecord = addProductionRecord({
      floorId,
      floorName,
      shift: formData.shift,
      workersCount: parseInt(formData.workersCount),
      produced: parseInt(formData.produced),
      quality: parseFloat(formData.quality),
      recordedBy: 'Current Floor Manager',
      notes: formData.notes
    });

    setRecords([newRecord, ...records]);
    setFormData({
      shift: 'Morning',
      workersCount: '',
      produced: '',
      quality: '',
      notes: ''
    });
    setShowAddForm(false);
  };

  const calculateStats = () => {
    if (records.length === 0) return { avgProduction: 0, avgQuality: 0, totalWorkers: 0 };
    
    const totalProduction = records.reduce((sum, r) => sum + r.produced, 0);
    const avgProduction = Math.round(totalProduction / records.length);
    const totalQuality = records.reduce((sum, r) => sum + r.quality, 0);
    const avgQuality = (totalQuality / records.length).toFixed(2);
    const totalWorkers = records.reduce((sum, r) => sum + r.workersCount, 0);

    return { avgProduction, avgQuality, totalWorkers };
  };

  const stats = calculateStats();

  return (
    <div className="production-record-page">
      <div className="fm-page-header">
        <h2>Production Records</h2>
        <p>Track and manage floor production history</p>
      </div>

      {/* Stats Overview */}
      <div className="production-stats-grid">
        <div className="production-stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h4>Average Production</h4>
            <p className="stat-value">{stats.avgProduction} units</p>
          </div>
        </div>
        <div className="production-stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-info">
            <h4>Average Quality</h4>
            <p className="stat-value">{stats.avgQuality}%</p>
          </div>
        </div>
        <div className="production-stat-card">
          <div className="stat-icon">👷</div>
          <div className="stat-info">
            <h4>Total Workers</h4>
            <p className="stat-value">{stats.totalWorkers}</p>
          </div>
        </div>
        <div className="production-stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <h4>Records</h4>
            <p className="stat-value">{records.length}</p>
          </div>
        </div>
      </div>

      {/* Add Production Record Button */}
      <div className="production-action-bar">
        <button 
          className="btn-add-record"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? '❌ Cancel' : '➕ Add Production Record'}
        </button>
      </div>

      {/* Add Production Form */}
      {showAddForm && (
        <div className="add-record-form-wrapper">
          <form className="add-record-form" onSubmit={handleAddRecord}>
            <h3>New Production Record</h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Shift</label>
                <select 
                  name="shift"
                  value={formData.shift}
                  onChange={handleInputChange}
                >
                  <option>Morning</option>
                  <option>Afternoon</option>
                  <option>Evening</option>
                  <option>Night</option>
                </select>
              </div>

              <div className="form-group">
                <label>Workers Count *</label>
                <input 
                  type="number"
                  name="workersCount"
                  value={formData.workersCount}
                  onChange={handleInputChange}
                  placeholder="e.g., 15"
                  required
                />
              </div>

              <div className="form-group">
                <label>Units Produced *</label>
                <input 
                  type="number"
                  name="produced"
                  value={formData.produced}
                  onChange={handleInputChange}
                  placeholder="e.g., 450"
                  required
                />
              </div>

              <div className="form-group">
                <label>Quality Rate (%) *</label>
                <input 
                  type="number"
                  name="quality"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.quality}
                  onChange={handleInputChange}
                  placeholder="e.g., 98.5"
                  required
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label>Notes</label>
              <textarea 
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Add any notes about the production..."
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit">Save Record</button>
              <button 
                type="button" 
                className="btn-cancel"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Production Records List */}
      <div className="production-records-section">
        <h3>Production History</h3>
        {records.length === 0 ? (
          <div className="no-records">
            <p>No production records yet. Add one to get started!</p>
          </div>
        ) : (
          <div className="records-table-wrapper">
            <table className="records-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Shift</th>
                  <th>Workers</th>
                  <th>Produced</th>
                  <th>Quality</th>
                  <th>Recorded By</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {records.map(record => (
                  <tr key={record.id}>
                    <td className="date-cell">{record.date}</td>
                    <td>{record.shift}</td>
                    <td className="center">{record.workersCount}</td>
                    <td className="center">{record.produced} units</td>
                    <td className="center">
                      <span className={`quality-badge ${record.quality >= 98 ? 'excellent' : 'good'}`}>
                        {record.quality}%
                      </span>
                    </td>
                    <td>{record.recordedBy}</td>
                    <td className="notes-cell">{record.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
