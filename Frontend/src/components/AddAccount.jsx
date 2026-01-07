import React, { useState } from 'react';
import '../styles/AddAccount.css';

const AddAccount = () => {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    phone: '',
    status: 'active'
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
    if (!formData.role) newErrors.role = 'Role is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!validateEmail(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm password';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';

    if (Object.keys(newErrors).length === 0) {
      setMessage('✅ Account created successfully!');
      setTimeout(() => {
        setFormData({
          name: '',
          role: '',
          email: '',
          password: '',
          confirmPassword: '',
          department: '',
          phone: '',
          status: 'active'
        });
        setMessage('');
      }, 2000);
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div className="add-account-container">
      <div className="form-wrapper">
        <h2>Create New Account</h2>
        <p className="form-subtitle">Set up a new user account for the system</p>

        {message && <div className="success-message">{message}</div>}

        <form onSubmit={handleSubmit} className="account-form">
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
          </div>

          <div className="form-row">
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
                <option value="admin">Administrator</option>
                <option value="manager">Manager</option>
                <option value="floor_manager">Floor Manager</option>
                <option value="supervisor">Supervisor</option>
                <option value="worker">Worker</option>
              </select>
              {errors.role && <span className="error-text">{errors.role}</span>}
            </div>

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
                <option value="admin">Administration</option>
              </select>
              {errors.department && <span className="error-text">{errors.department}</span>}
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
                  placeholder="Create a password"
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

            <div className="form-group">
              <label htmlFor="status">Account Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn-submit">
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddAccount;
