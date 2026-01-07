import React, { useState } from 'react';
import '../styles/LoginPage.css';
import logo from '../assets/logo.jpeg';
import { authenticateUser } from '../db';

const LoginPage = ({ onBack, onLoginSuccess }) => {
  const [formState, setFormState] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const newErrors = {};
    
    if (!email) newErrors.email = 'Email is required';
    else if (!validateEmail(email)) newErrors.email = 'Invalid email format';
    
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    if (Object.keys(newErrors).length === 0) {
      // Authenticate user from database
      const result = authenticateUser(email, password);
      
      if (result.success) {
        setMessage('✅ Login successful! Redirecting...');
        setTimeout(() => {
          // Pass user data to parent component
          onLoginSuccess(result.user.role, result.user);
        }, 800);
      } else {
        setErrors({ auth: result.error });
      }
    } else {
      setErrors(newErrors);
    }
  };

  const handleRecovery = (e) => {
    e.preventDefault();
    const newErrors = {};
    
    if (!recoveryEmail) newErrors.recoveryEmail = 'Email is required';
    else if (!validateEmail(recoveryEmail)) newErrors.recoveryEmail = 'Invalid email format';

    if (Object.keys(newErrors).length === 0) {
      setMessage('Recovery link sent to your email!');
      setTimeout(() => {
        setFormState('login');
        setRecoveryEmail('');
        setMessage('');
      }, 2000);
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-box" style={{ position: 'relative' }}>
          <h1 className="login-title">MotionMatrix</h1>
          <p className="login-subtitle">Factory Management System</p>

          {message && <div className="message-alert">{message}</div>}
          {errors.auth && <div className="error-alert">{errors.auth}</div>}

          {formState === 'login' && (
            <form className="login-form" onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={errors.email ? 'input-error' : ''}
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

              <button type="submit" className="btn-login">Sign In</button>

              <div className="form-footer">
                <p onClick={() => setFormState('recovery')} className="forgot-password">
                  Forgot your password?
                </p>
              </div>
            </form>
          )}

          {formState === 'recovery' && (
            <form className="recovery-form" onSubmit={handleRecovery}>
              <h2>Password Recovery</h2>
              <p className="recovery-text">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <div className="form-group">
                <label htmlFor="recovery-email">Email Address</label>
                <input
                  id="recovery-email"
                  type="email"
                  placeholder="Enter your registered email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  className={errors.recoveryEmail ? 'input-error' : ''}
                />
                {errors.recoveryEmail && <span className="error-text">{errors.recoveryEmail}</span>}
              </div>

              <button type="submit" className="btn-login">Send Recovery Link</button>

              <div className="form-footer">
                <p onClick={() => setFormState('login')} className="back-to-login">
                  Back to Login
                </p>
              </div>
            </form>
          )}

        </div>

        <div className="button-container-bottom">
          <button className="back-btn" onClick={onBack}>
            <span className="back-icon">←</span>
            <span className="back-text">Back to Home</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
