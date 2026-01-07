import React, { useState } from 'react';
import '../styles/AddWorker.css';

const AddWorker = () => {
  const [formData, setFormData] = useState({
    name: '',
    workerId: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    department: '',
    phone: '',
    nid: '',
    gender: '',
    joinDate: '',
    position: ''
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.workerId.trim()) newErrors.workerId = 'Worker ID is required';
    if (!formData.role) newErrors.role = 'Role is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!validateEmail(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm password';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.nid.trim()) newErrors.nid = 'NID or ID number is required';
    if (!formData.gender) newErrors.gender = 'Please select gender';
    if (!formData.joinDate) newErrors.joinDate = 'Join date is required';
    if (!formData.position) newErrors.position = 'Position is required';

    if (Object.keys(newErrors).length === 0) {
      setMessage('✅ Worker/Account added successfully!');
      setTimeout(() => {
        setFormData({
          name: '',
          workerId: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: '',
          department: '',
          phone: '',
          nid: '',
          gender: '',
          joinDate: '',
          position: ''
        });
        setMessage('');
      }, 2000);
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div className="add-worker-container">
      <div className="form-wrapper">
        <h2>Add Worker / Account</h2>
        <p className="form-subtitle">Register a new worker and create their account in the system</p>

        {message && <div className="success-message">{message}</div>}

        <form onSubmit={handleSubmit} className="worker-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                name="name"
                placeholder="Enter full name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? 'input-error' : ''}
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="workerId">Worker ID</label>
              <input
                id="workerId"
                type="text"
                name="workerId"
                placeholder="Enter worker ID"
                value={formData.workerId}
                onChange={handleChange}
                className={errors.workerId ? 'input-error' : ''}
              />
              {errors.workerId && <span className="error-text">{errors.workerId}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="department">Department</label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className={errors.department ? 'input-error' : ''}
              >
                <option value="">Select Department</option>
                <option value="cutting">Cutting</option>
                <option value="sewing">Sewing</option>
                <option value="finishing">Finishing</option>
                <option value="quality">Quality Check</option>
                <option value="packaging">Packaging</option>
              </select>
              {errors.department && <span className="error-text">{errors.department}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={errors.role ? 'input-error' : ''}
              >
                <option value="">Select Role</option>
                <option value="worker">Worker</option>
                <option value="supervisor">Supervisor</option>
                <option value="manager">Manager</option>
                <option value="floor_manager">Floor Manager</option>
              </select>
              {errors.role && <span className="error-text">{errors.role}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="Enter email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'input-error' : ''}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                type="tel"
                name="phone"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={handleChange}
                className={errors.phone ? 'input-error' : ''}
              />
              {errors.phone && <span className="error-text">{errors.phone}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Create password (min 6 characters)"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? 'input-error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-input-wrapper">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? 'input-error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nid">NID / ID Number</label>
              <input
                id="nid"
                type="text"
                name="nid"
                placeholder="Enter NID or ID number"
                value={formData.nid}
                onChange={handleChange}
                className={errors.nid ? 'input-error' : ''}
              />
              {errors.nid && <span className="error-text">{errors.nid}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={errors.gender ? 'input-error' : ''}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && <span className="error-text">{errors.gender}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="joinDate">Join Date</label>
              <input
                id="joinDate"
                type="date"
                name="joinDate"
                value={formData.joinDate}
                onChange={handleChange}
                className={errors.joinDate ? 'input-error' : ''}
              />
              {errors.joinDate && <span className="error-text">{errors.joinDate}</span>}
            </div>

            <div className="form-group"></div>
          </div>

          <button type="submit" className="btn-submit">
            Create Worker & Account
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddWorker;
