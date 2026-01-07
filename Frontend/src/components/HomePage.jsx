import React, { useRef } from 'react';
import '../styles/HomePage.css';
import logo from '../assets/logo.jpeg';

const HomePage = ({ onNavigateToLogin }) => {
  const featuresRef = useRef(null);

  const handleLearnMore = () => {
    if (featuresRef.current) {
      featuresRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-header">
            <img src={logo} alt="MotionMatrix Logo" className="hero-logo" />
            <h1 className="hero-title">MotionMatrix</h1>
          </div>
          <p className="hero-subtitle">Revolutionizing Garment Factory Efficiency</p>
          <p className="hero-description">
            Automate activity tracking and real-time performance monitoring for smart factory operations
          </p>
          <div className="hero-buttons">
            <button className="btn btn-primary" onClick={onNavigateToLogin}>Get Started</button>
            <button className="btn btn-secondary" onClick={handleLearnMore}>Learn More</button>
          </div>
        </div>
        <div className="hero-image">
          <div className="hero-graphic">
            <img src={logo} alt="MotionMatrix Logo" className="logo-image" />
          </div>
        </div>
      </section>

      {/* Features Overview Section */}
      <section className="features-overview" ref={featuresRef}>
        <h2>Core Capabilities</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">👤</div>
            <h3>Face Recognition</h3>
            <p>Intelligent worker identification and authentication</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">✋</div>
            <h3>Hand Activity Detection</h3>
            <p>Real-time monitoring of worker hand movements</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⏱️</div>
            <h3>Time Tracking</h3>
            <p>Measure active and idle time accurately</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Profile Management</h3>
            <p>Create and manage worker profiles easily</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Analytics & Reports</h3>
            <p>Generate comprehensive performance reports</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔔</div>
            <h3>Smart Notifications</h3>
            <p>Real-time alerts for worker inactivity</p>
          </div>
        </div>
      </section>

      {/* Exciting Features Section */}
      <section className="exciting-features">
        <h2>Advanced Features</h2>
        <div className="features-list">
          <div className="feature-item">
            <h3>📢 Real-Time Notifications</h3>
            <p>Get instant alerts when workers become inactive, ensuring maximum productivity and quick intervention</p>
          </div>
          <div className="feature-item">
            <h3>⏳ Overtime Management</h3>
            <p>Automatically track and manage overtime hours with detailed logging and compliance reporting</p>
          </div>
          <div className="feature-item">
            <h3>🔄 Worker Replacement System</h3>
            <p>Reserve backup workers instantly with intelligent messaging when replacements are needed</p>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="value-section">
        <h2>Why Choose MotionMatrix?</h2>
        <div className="value-grid">
          <div className="value-item">
            <h4>Eliminate Manual Records</h4>
            <p>Automated tracking removes human error and tedious paperwork</p>
          </div>
          <div className="value-item">
            <h4>Real-Time Insights</h4>
            <p>Access instant data about worker performance and factory efficiency</p>
          </div>
          <div className="value-item">
            <h4>Boost Productivity</h4>
            <p>Identify bottlenecks and optimize workflows with actionable analytics</p>
          </div>
          <div className="value-item">
            <h4>Easy Integration</h4>
            <p>Seamlessly integrate with existing factory management systems</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="homepage-footer">
        <p>&copy; 2026 MotionMatrix. Revolutionizing Factory Operations.</p>
      </footer>
    </div>
  );
};

export default HomePage;
