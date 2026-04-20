import React, { useState } from 'react';
import { addFloor, getAllFloors, deleteFloor, updateFloor } from '../db';
import '../styles/CreateFloor.css';

const CreateFloor = ({ onSelectFloor }) => {
  const [floors, setFloors] = useState(getAllFloors());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    level: '',
    area: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'level' || name === 'area' ? parseInt(value) || '' : value
    }));
  };

  const handleAddFloor = (e) => {
    e.preventDefault();
    if (formData.name && formData.level !== '' && formData.area !== '') {
      const newFloor = addFloor({
        name: formData.name,
        level: formData.level,
        area: formData.area,
        status: 'active'
      });
      setFloors([...floors, newFloor]);
      setFormData({ name: '', level: '', area: '' });
      setShowForm(false);
    }
  };

  const handleEditFloor = (floor) => {
    setEditingId(floor.id);
    setFormData({
      name: floor.name,
      level: floor.level,
      area: floor.area
    });
    setShowForm(true);
  };

  const handleUpdateFloor = (e) => {
    e.preventDefault();
    if (formData.name && formData.level !== '' && formData.area !== '') {
      updateFloor(editingId, {
        name: formData.name,
        level: formData.level,
        area: formData.area
      });
      setFloors(floors.map(f => 
        f.id === editingId 
          ? { ...f, name: formData.name, level: formData.level, area: formData.area }
          : f
      ));
      setFormData({ name: '', level: '', area: '' });
      setEditingId(null);
      setShowForm(false);
    }
  };

  const handleDeleteFloor = (id) => {
    deleteFloor(id);
    setFloors(floors.filter(f => f.id !== id));
  };

  const handleCancel = () => {
    setFormData({ name: '', level: '', area: '' });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="create-floor-container">
      <div className="floor-header">
        <h2>Manage Floors</h2>
        <button 
          className="btn-add-floor"
          onClick={() => setShowForm(true)}
        >
          ➕ Add New Floor
        </button>
      </div>

      {/* Add/Edit Floor Form */}
      {showForm && (
        <div className="floor-form-wrapper">
          <div className="floor-form">
            <h3>{editingId ? 'Edit Floor' : 'Create New Floor'}</h3>
            <form onSubmit={editingId ? handleUpdateFloor : handleAddFloor}>
              <div className="form-group">
                <label>Floor Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Ground Floor, First Floor"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Floor Level *</label>
                  <input
                    type="number"
                    name="level"
                    value={formData.level}
                    onChange={handleInputChange}
                    placeholder="e.g., 0, 1, 2"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Area (sq. meters) *</label>
                  <input
                    type="number"
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    placeholder="e.g., 5000"
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  {editingId ? 'Update Floor' : 'Create Floor'}
                </button>
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floors List */}
      <div className="floors-list">
        <h3>All Floors ({floors.length})</h3>
        
        {floors.length === 0 ? (
          <div className="no-floors-message">
            <p>No floors created yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="floors-grid">
            {floors.map(floor => (
              <div key={floor.id} className="floor-card">
                <div className="floor-card-header">
                  <div className="floor-info">
                    <h4>{floor.name}</h4>
                    <p className="floor-level">Level {floor.level}</p>
                  </div>
                  <span className={`status-badge ${floor.status}`}>
                    {floor.status.charAt(0).toUpperCase() + floor.status.slice(1)}
                  </span>
                </div>

                <div className="floor-card-body">
                  <div className="floor-detail">
                    <span className="label">Area:</span>
                    <span className="value">{floor.area} sq.m</span>
                  </div>
                  <div className="floor-detail">
                    <span className="label">CCTVs Assigned:</span>
                    <span className="value badge-info">{floor.cctvs ? floor.cctvs.length : 0}</span>
                  </div>
                </div>

                <div className="floor-card-footer">
                  <button 
                    className="btn-assign-cctv"
                    onClick={() => onSelectFloor && onSelectFloor(floor.id)}
                  >
                    🎥 Assign CCTV
                  </button>
                  <button 
                    className="btn-edit"
                    onClick={() => handleEditFloor(floor)}
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    className="btn-delete"
                    onClick={() => handleDeleteFloor(floor.id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateFloor;
