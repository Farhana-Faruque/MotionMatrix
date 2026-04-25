import React, { useState, useEffect } from 'react';
import '../styles/CreateFloor.css';

const CreateFloor = ({ onSelectFloor }) => {
  console.log('CreateFloor component mounted');
  const [floors, setFloors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    level: '',
    area: ''
  });

  // Fetch all floors on component mount
  useEffect(() => {
    fetchFloors();
  }, []);

  const fetchFloors = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('http://localhost:5000/api/floors', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFloors(data.floors || []);
      } else {
        const errData = await response.json().catch(() => ({}));
        setErrorMessage(errData.message || 'Failed to fetch floors');
      }
    } catch (error) {
      console.error('Error fetching floors:', error);
      setErrorMessage('Failed to fetch floors');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'level' || name === 'area' ? parseInt(value) || '' : value
    }));
  };

  const handleAddFloor = async (e) => {
    e.preventDefault();
    if (formData.name && formData.level !== '' && formData.area !== '') {
      try {
        setLoading(true);
        setErrorMessage('');
        const token = localStorage.getItem('authToken');
        
        const response = await fetch('http://localhost:5000/api/floors', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: formData.name,
            level: formData.level,
            area: formData.area,
            status: 'active'
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          const createdFloor = data.floor || data.data;
          if (createdFloor) {
            setFloors(prev => [...prev, createdFloor]);
          } else {
            await fetchFloors();
          }
          setFormData({ name: '', level: '', area: '' });
          setShowForm(false);
        } else {
          const errData = await response.json().catch(() => ({}));
          setErrorMessage(errData.message || 'Failed to create floor');
        }
      } catch (error) {
        console.error('Error adding floor:', error);
        setErrorMessage('Failed to create floor');
      } finally {
        setLoading(false);
      }
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

  const handleUpdateFloor = async (e) => {
    e.preventDefault();
    if (formData.name && formData.level !== '' && formData.area !== '') {
      try {
        setLoading(true);
        setErrorMessage('');
        const token = localStorage.getItem('authToken');
        
        const response = await fetch(`http://localhost:5000/api/floors/${editingId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: formData.name,
            level: formData.level,
            area: formData.area
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          const updatedFloor = data.floor;
          setFloors(floors.map(f => (
            f.id === editingId
              ? (updatedFloor || { ...f, name: formData.name, level: formData.level, area: formData.area })
              : f
          )));
          setFormData({ name: '', level: '', area: '' });
          setEditingId(null);
          setShowForm(false);
        } else {
          const errData = await response.json().catch(() => ({}));
          setErrorMessage(errData.message || 'Failed to update floor');
        }
      } catch (error) {
        console.error('Error updating floor:', error);
        setErrorMessage('Failed to update floor');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteFloor = async (id) => {
    try {
      setLoading(true);
      setErrorMessage('');
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`http://localhost:5000/api/floors/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setFloors(floors.filter(f => f.id !== id));
      } else {
        const errData = await response.json().catch(() => ({}));
        setErrorMessage(errData.message || 'Failed to delete floor');
      }
    } catch (error) {
      console.error('Error deleting floor:', error);
      setErrorMessage('Failed to delete floor');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', level: '', area: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const getFloorStatus = (floor) => floor.status || 'active';

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

      {errorMessage && (
        <div className="error-message">{errorMessage}</div>
      )}

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
                  <span className={`status-badge ${getFloorStatus(floor)}`}>
                    {getFloorStatus(floor).charAt(0).toUpperCase() + getFloorStatus(floor).slice(1)}
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
